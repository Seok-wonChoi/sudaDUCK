package com.example.DuckDuck.domain.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * 중앙 집중식 정적 감지 서비스
 *
 * 백엔드에서 방의 전체 음성 활동을 추적하고
 * 15초 침묵 시 모든 참가자에게 추천 전송
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SilenceDetectionService {

    private final AiContextService contextService;
    private final GptService gptService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TaskScheduler taskScheduler;
    private final StringRedisTemplate redisTemplate;

    private final Set<String> suggestedTurns = ConcurrentHashMap.newKeySet();

    // 방별 마지막 음성 활동 시간
    private final Map<Long, Long> lastVoiceActivityTime = new ConcurrentHashMap<>();

    // 방별 현재 턴
    private final Map<Long, Integer> currentTurns = new ConcurrentHashMap<>();

    // 방별 정적 체크 스케줄
    private final Map<Long, ScheduledFuture<?>> silenceCheckSchedules = new ConcurrentHashMap<>();

    private static final long SILENCE_THRESHOLD_MS = 10000;

    /**
     * 음성 활동 알림 (프론트에서 호출)
     *
     * 누군가 말할 때마다 호출
     */
    public void reportVoiceActivity(Long roomId, Long userId, Integer turn) {
        long now = System.currentTimeMillis();

        log.info("🎤 [음성 활동] roomId={}, userId={}, turn={}", roomId, userId, turn);

        // 마지막 활동 시간 & 현재 턴 저장
        lastVoiceActivityTime.put(roomId, now);
        currentTurns.put(roomId, turn);

        // 정적 체크 스케줄 시작/리셋
        startSilenceCheck(roomId);
    }

    /**
     * 방 입장 시 또는 턴 변경 시 정적 감지 시작
     */
    public void startMonitoring(Long roomId, Integer turn) {
        log.info("👀 [모니터링 시작] roomId={}, turn={}", roomId, turn);

        // 현재 시간 & 턴으로 초기화
        lastVoiceActivityTime.put(roomId, System.currentTimeMillis());
        currentTurns.put(roomId, turn);

        // 기존 스케줄 취소
        ScheduledFuture<?> oldFuture = silenceCheckSchedules.remove(roomId);
        if (oldFuture != null && !oldFuture.isDone()) {
            oldFuture.cancel(false);
            log.info("🔄 [모니터링] 기존 스케줄 취소 - 새 턴 시작");
        }

        // 정적 체크 시작
        startSilenceCheck(roomId);
    }

    /**
     * 방 퇴장 시 정적 감지 종료
     */
    public void stopMonitoring(Long roomId) {
        log.info("🛑 [모니터링 종료] roomId={}", roomId);

        // 스케줄 취소
        ScheduledFuture<?> future = silenceCheckSchedules.remove(roomId);
        if (future != null && !future.isDone()) {
            future.cancel(false);
        }

        // 데이터 삭제
        lastVoiceActivityTime.remove(roomId);
    }

    /**
     * 정적 체크 스케줄 시작/리셋
     */
    private void startSilenceCheck(Long roomId) {

        // 기존 스케줄 취소
        ScheduledFuture<?> oldFuture = silenceCheckSchedules.remove(roomId);
        if (oldFuture != null && !oldFuture.isDone()) {
            oldFuture.cancel(false);
        }

        // 새 스케줄 시작
        ScheduledFuture<?> future = taskScheduler.schedule(
                () -> checkSilence(roomId),
                Instant.now().plusMillis(SILENCE_THRESHOLD_MS)
        );

        silenceCheckSchedules.put(roomId, future);

        log.debug("⏰ [스케줄 등록] roomId={}, 10초 후 체크", roomId);
    }

    /**
     * 정적 체크
     */
    private void checkSilence(Long roomId) {

        Long lastActivity = lastVoiceActivityTime.get(roomId);
        if (lastActivity == null) {
            log.warn("⚠️  [정적 체크] 활동 기록 없음 - roomId={}", roomId);
            return;
        }

        long now = System.currentTimeMillis();
        long silenceDuration = now - lastActivity;

        log.info("🔍 [정적 체크] roomId={}, 침묵 시간: {}ms", roomId, silenceDuration);

        if (silenceDuration >= SILENCE_THRESHOLD_MS) {
            // 10초 이상 침묵! 추천 생성
            log.info("🔇 [정적 감지!] roomId={}, 추천 생성 시작", roomId);
            generateAndBroadcastSuggestion(roomId);

            // 추천 후에는 모니터링을 다시 시작하지 않음
            // 다음 음성 활동이 있을 때 reportVoiceActivity에서 자동으로 재시작됨
            log.info("✅ [정적 감지] 추천 완료 - 다음 음성 활동 대기 중");

        } else {
            // 아직 10초 안 됨 (누군가 중간에 말함)
            log.debug("⏳ [정적 미감지] roomId={}, 다시 스케줄", roomId);

            // 남은 시간만큼 다시 스케줄
            long remaining = SILENCE_THRESHOLD_MS - silenceDuration;
            ScheduledFuture<?> future = taskScheduler.schedule(
                    () -> checkSilence(roomId),
                    Instant.now().plusMillis(remaining)
            );
            silenceCheckSchedules.put(roomId, future);
        }
    }

    /**
     * 추천 생성 및 전체 브로드캐스트
     */
    private void generateAndBroadcastSuggestion(Long roomId) {
        try {
            // 현재 턴 조회 (Redis나 DB에서 - 여기서는 예시로 1)
            Integer currentTurn = getCurrentTurn(roomId);

            // 턴별 주제 추천 중복 체크
            String turnKey = roomId + "_turn_" + currentTurn;

            if (suggestedTurns.contains(turnKey)) {
                log.info("🔇 [정적 감지] 턴 {}에 이미 주제 추천함 - 스킵", currentTurn);
                return;
            }

            // 컨텍스트 수집
            AiContextService.ConversationContext context =
                    contextService.buildContext(roomId, currentTurn);

            // 프롬프트 생성
            String prompt = buildPrompt(context);

            // GPT 호출
            String gptResponse = gptService.callGptForJson(prompt);
            Map<String, Object> parsed = gptService.parseJsonResponse(gptResponse);

            String koreanQuestion = (String) parsed.get("koreanQuestion");

            log.info("✅ [추천 생성 완료] 한글: {}", koreanQuestion);

            // WebSocket으로 방 전체에 브로드캐스트 (한글만!)
            Map<String, Object> message = Map.of(
                    "type", "CONVERSATION_SUGGESTION",
                    "question", koreanQuestion
            );

            messagingTemplate.convertAndSend(
                    "/topic/room/" + roomId + "/suggestion",
                    message
            );

            suggestedTurns.add(turnKey);

            log.info("📤 [WebSocket 전송] roomId={}, 전체 참가자에게 전송 완료", roomId);

        } catch (Exception e) {
            log.error("❌ [추천 생성 실패] roomId={}, error={}", roomId, e.getMessage(), e);
        }
    }

    /**
     * 현재 턴 조회 (메모리에서)
     */
    private Integer getCurrentTurn(Long roomId) {
        try {
            // 1. Redis에서 현재 턴 조회
            String turnKey = "room:" + roomId + ":current_turn";
            String turnStr = redisTemplate.opsForValue().get(turnKey);

            if (turnStr != null) {
                int turn = Integer.parseInt(turnStr);
                log.info("Redis에서 턴 조회: roomId={}, turn={}", roomId, turn);
                return turn;
            }

            // 2. Redis 없으면 스크립트 기반 추론
            Set<String> keys = redisTemplate.keys("room:" + roomId + ":turn:*:scripts");

            if (keys != null && !keys.isEmpty()) {
                int maxTurn = 1;
                for (String key : keys) {
                    // "room:1:turn:3:scripts" → 3 추출
                    String[] parts = key.split(":");
                    if (parts.length >= 4) {
                        try {
                            int turn = Integer.parseInt(parts[3]);
                            if (!redisTemplate.opsForZSet().range(key, 0, -1).isEmpty()) {
                                maxTurn = Math.max(maxTurn, turn);
                            }
                        } catch (NumberFormatException ignored) {}
                    }
                }
                log.info("스크립트 기반 턴 추론: roomId={}, turn={}", roomId, maxTurn);
                return maxTurn;
            }

            // 3. 메모리 Map 백업
            Integer memoryTurn = currentTurns.get(roomId);
            if (memoryTurn != null) {
                log.warn("메모리에서 턴 조회: roomId={}, turn={}", roomId, memoryTurn);
                return memoryTurn;
            }

            // 4. 기본값
            log.warn("턴 정보 없음 - 기본값 1: roomId={}", roomId);
            return 1;

        } catch (Exception e) {
            log.error("턴 조회 실패: roomId={}, error={}", roomId, e.getMessage());
            return currentTurns.getOrDefault(roomId, 1);
        }
    }

    private String buildPrompt(AiContextService.ConversationContext context) {
        if (context.isHasConversation()) {
            return String.format("""
                            현재까지의 대화:
                            %s
        
                            대화가 잠시 멈췄습니다. 현재까지의 대화를 참고하여 대화를 자연스럽게 이어갈 수 있는 말을 해주세요.
        
                            요구사항:
                            - 현재까지의 대화 맥락과 맞는 적절한 말
                            - 친구에게 물어보듯 자연스럽고 구체적인 말
                            - 추상적이거나 딱딱한 말 금지
                            - 1-2 문장으로 간결하게
        
                            JSON 형식으로만 응답:
                            {
                              "koreanQuestion": "한국어 질문"
                            }
                            ""\",

                    """,
                    context.getFormattedConversation()
            );
        } else {
            return String.format("""
                    당신은 영어 회화 학습을 돕는 친근한 코치입니다.
                    
                    주제: %s
                    
                    아직 대화가 시작되지 않았습니다. 이 주제로 편하게 대화를 시작할 수 있는 질문을 추천해주세요.
                    
                    요구사항:
                    - 친구에게 물어보듯 자연스럽고 구체적인 질문
                    - 추상적이거나 딱딱한 질문 금지
                    - 대답하기 쉽고 재미있게
                    - 1-2 문장으로 간결하게
                    
                    나쁜 예시:
                    - "이 주제에 대해 어떻게 생각하나요?"
                    - "경험이 있으신가요?"
                    
                    좋은 예시:
                    - "요즘 자주 듣는 노래 있어?"
                    - "가장 최근에 본 영화 뭐야?"
                    - "주말에 뭐 할 계획이야?"
                    
                    JSON 형식으로만 응답:
                    {
                      "koreanQuestion": "한국어 질문"
                    }
                    """,
                    context.getTopic()
            );
        }
    }

}
