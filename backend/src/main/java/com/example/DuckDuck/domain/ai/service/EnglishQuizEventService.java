package com.example.DuckDuck.domain.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 영어 퀴즈 서비스 (최종 단순화 버전)
 * 
 * - DTO 단순화: isCorrect만 사용
 * - GptService 재사용
 * - 의미 기반 평가 (정답과 완전 일치 불필요)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EnglishQuizEventService {

    // 공통 서비스
    private final AiContextService contextService;
    private final GptService gptService;
    
    // WebSocket & Scheduler
    private final SimpMessagingTemplate messagingTemplate;
    private final TaskScheduler taskScheduler;

    // 스케줄 & 데이터 관리
    private final Map<String, ScheduledFuture<?>> quizSchedules = new ConcurrentHashMap<>();
    private final Map<String, QuizData> activeQuizzes = new ConcurrentHashMap<>();
    private final Map<String, List<UserAnswer>> quizAnswers = new ConcurrentHashMap<>();
    private final Map<String, Integer> expectedParticipants = new ConcurrentHashMap<>();

    private static final int TARGET_TURN = 3;
    private static final int MIN_DELAY_SECONDS = 15;
    private static final int MAX_DELAY_SECONDS = 40;

    // ============================================
    // 내부 클래스 (단순화)
    // ============================================
    
    @lombok.Data
    private static class QuizData {
        String quizId;
        String question;
        String expectedAnswer;
        String hint;
    }
    
    @lombok.Data
    private static class UserAnswer {
        Long userId;
        String answer;
        Boolean isCorrect;  // 단순화: isCorrect만 사용
    }

    // ============================================
    // Public 메서드
    // ============================================

    /**
     * 퀴즈 스케줄 등록
     */
    public void scheduleTurnQuiz(Long roomId, Integer turn, Integer participantCount) {
        
        if (turn != TARGET_TURN) {
            log.info("퀴즈 대상 턴 아님 - turn: {} (target: {})", turn, TARGET_TURN);
            return;
        }
        
        String key = roomId + "_" + turn;
        
        // 기존 스케줄 취소
        ScheduledFuture<?> future = quizSchedules.remove(key);
        if (future != null && !future.isDone()) {
            future.cancel(false);
            log.info("기존 퀴즈 스케줄 취소 - key: {}", key);
        }
        
        expectedParticipants.put(key, participantCount);
        quizAnswers.put(key, new ArrayList<>());
        
        int randomSeconds = ThreadLocalRandom.current().nextInt(
                MIN_DELAY_SECONDS, MAX_DELAY_SECONDS + 1);
        
        log.info("퀴즈 스케줄 - roomId: {}, turn: {}, {}초 후", roomId, turn, randomSeconds);
        
        future = taskScheduler.schedule(() -> {
            triggerQuiz(roomId, turn);
        }, Instant.now().plusSeconds(randomSeconds));
        
        quizSchedules.put(key, future);
    }

    /**
     * 답변 제출
     */
    public void submitAnswer(String quizId, Long userId, String answer) {
        
        log.info("답변 제출 - quizId: {}, userId: {}", quizId, userId);
        
        List<UserAnswer> answers = quizAnswers.get(quizId);
        if (answers == null) {
            log.error("퀴즈 없음: {}", quizId);
            return;
        }
        
        UserAnswer ua = new UserAnswer();
        ua.userId = userId;
        ua.answer = answer;
        answers.add(ua);
        
        log.info("답변 저장 - {}/{}", answers.size(), expectedParticipants.get(quizId));
        
        checkAndEvaluate(quizId);
    }

    /**
     * 활성 퀴즈 조회
     */
    public Map<String, Object> getActiveQuiz(Long roomId, Integer turn) {
        QuizData quiz = activeQuizzes.get(roomId + "_" + turn);
        
        if (quiz == null) {
            return null;
        }
        
        return Map.of(
                "quizId", quiz.quizId,
                "question", quiz.question,
                "expectedAnswer", quiz.expectedAnswer,
                "hint", quiz.hint
        );
    }

    /**
     * 수동 정리 메서드 (필요 시 호출)
     */
    public void cleanupQuiz(Long roomId, Integer turn) {
        String key = roomId + "_" + turn;
        
        log.info("퀴즈 정리 시작 - key: {}", key);
        
        ScheduledFuture<?> future = quizSchedules.remove(key);
        if (future != null && !future.isDone()) {
            future.cancel(false);
        }
        
        activeQuizzes.remove(key);
        quizAnswers.remove(key);
        expectedParticipants.remove(key);
        
        log.info("퀴즈 정리 완료 - key: {}", key);
    }

    /**
     * 방 전체 정리 (게임 종료 시)
     */
    public void cleanupRoom(Long roomId) {
        String prefix = roomId + "_";
        
        log.info("방 퀴즈 전체 정리 시작 - roomId: {}", roomId);
        
        quizSchedules.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            if (key.startsWith(prefix)) {
                ScheduledFuture<?> future = entry.getValue();
                if (future != null && !future.isDone()) {
                    future.cancel(false);
                }
                return true;
            }
            return false;
        });
        
        activeQuizzes.keySet().removeIf(key -> key.startsWith(prefix));
        quizAnswers.keySet().removeIf(key -> key.startsWith(prefix));
        expectedParticipants.keySet().removeIf(key -> key.startsWith(prefix));
        
        log.info("방 퀴즈 전체 정리 완료 - roomId: {}", roomId);
    }

    // ============================================
    // Private 메서드
    // ============================================

    private void triggerQuiz(Long roomId, Integer turn) {
        try {
            log.info("🎯 퀴즈 발생 - roomId: {}, turn: {}", roomId, turn);
            
            QuizData quiz = generateQuiz(roomId, turn);
            
            String key = roomId + "_" + turn;
            activeQuizzes.put(key, quiz);
            
            sendQuizViaWebSocket(roomId, quiz);
            
        } catch (Exception e) {
            log.error("퀴즈 생성 실패: roomId={}, turn={}", roomId, turn, e);
        }
    }

    /**
     * 퀴즈 생성 (GptService 활용)
     */
    private QuizData generateQuiz(Long roomId, Integer turn) {
        
        // 1. 컨텍스트 수집
        AiContextService.ConversationContext context = contextService.buildContext(roomId, turn);
        
        // 2. 프롬프트 생성
        String prompt = buildQuizPrompt(context);
        
        // 3. GPT 호출
        String gptResponse = gptService.callGptForJson(prompt);
        
        // 4. 응답 파싱
        try {
            Map<String, Object> parsed = gptService.parseJsonResponse(gptResponse);
            return parseQuizData(roomId, turn, parsed);
        } catch (Exception e) {
            log.error("퀴즈 파싱 실패", e);
            return createFallbackQuiz(roomId, turn, context.getTopic());
        }
    }

    /**
     * 퀴즈 프롬프트 생성
     */
    private String buildQuizPrompt(AiContextService.ConversationContext context) {
        
        if (context.isHasConversation()) {
            // 대화 맥락 기반 퀴즈
            return String.format("""
                    Topic: %s
                    Current Turn: %d
                    
                    Conversation:
                    %s
                    
                    Create an English conversation quiz based on this context.
                    The question should:
                    - Relate to the conversation
                    - Be answerable in 1-2 sentences
                    - Test English speaking ability
                    
                    Return JSON only:
                    {
                      "question": "English question",
                      "expectedAnswer": "Sample answer",
                      "hint": "Korean hint"
                    }
                    """,
                    context.getTopic(),
                    context.getTurn(),
                    context.getFormattedConversation()
            );
        } else {
            // 주제 기반 퀴즈
            return String.format("""
                    Topic: %s
                    
                    Create an English conversation question about this topic.
                    
                    Return JSON only:
                    {
                      "question": "English question",
                      "expectedAnswer": "Sample answer",
                      "hint": "Korean hint"
                    }
                    """,
                    context.getTopic()
            );
        }
    }

    private QuizData parseQuizData(Long roomId, Integer turn, Map<String, Object> parsed) {
        QuizData quiz = new QuizData();
        quiz.quizId = roomId + "_" + turn;
        quiz.question = (String) parsed.get("question");
        quiz.expectedAnswer = (String) parsed.get("expectedAnswer");
        quiz.hint = (String) parsed.get("hint");
        return quiz;
    }

    private QuizData createFallbackQuiz(Long roomId, Integer turn, String topic) {
        QuizData quiz = new QuizData();
        quiz.quizId = roomId + "_" + turn;
        quiz.question = "What do you think about " + topic + "?";
        quiz.expectedAnswer = "I think it's interesting.";
        quiz.hint = "자유롭게 답변하세요";
        return quiz;
    }

    private void checkAndEvaluate(String quizId) {
        
        List<UserAnswer> answers = quizAnswers.get(quizId);
        Integer expected = expectedParticipants.get(quizId);
        
        if (answers == null || expected == null || answers.size() < expected) {
            return;
        }
        
        log.info("🔍 모든 답변 완료 - AI 평가 시작");
        
        QuizData quiz = activeQuizzes.get(quizId);
        if (quiz == null) {
            log.error("퀴즈 없음: {}", quizId);
            return;
        }
        
        // 평가
        for (UserAnswer ua : answers) {
            ua.isCorrect = evaluateAnswer(ua.answer, quiz);
        }
        
        sendResultsViaWebSocket(quizId, quiz, answers);
    }

    /**
     * 답변 평가 (의미 기반 - 정답과 완전 일치 불필요)
     * 
     * @return true if correct, false otherwise
     */
    private Boolean evaluateAnswer(String answer, QuizData quiz) {
        
        String prompt = String.format("""
                Evaluate if this English answer is correct.
                
                Question: %s
                Expected Answer: %s
                Student's Answer: %s
                
                Evaluation Criteria:
                - The answer should convey the SAME MEANING as the expected answer
                - Exact wording is NOT required
                - Grammar mistakes are acceptable if meaning is clear
                - Focus on semantic correctness
                
                Return JSON only:
                {
                  "isCorrect": true
                }
                """,
                quiz.question, quiz.expectedAnswer, answer
        );

        try {
            String gptResponse = gptService.callGptForJson(prompt);
            Map<String, Object> parsed = gptService.parseJsonResponse(gptResponse);
            
            return (Boolean) parsed.get("isCorrect");
            
        } catch (Exception e) {
            log.error("평가 실패", e);
            return false;  // 에러 시 오답 처리
        }
    }

    private void sendQuizViaWebSocket(Long roomId, QuizData quiz) {
        
        Map<String, Object> message = Map.of(
                "type", "QUIZ_START",
                "quiz", Map.of(
                        "quizId", quiz.quizId,
                        "question", quiz.question,
                        "expectedAnswer", quiz.expectedAnswer,
                        "hint", quiz.hint
                )
        );
        
        try {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + roomId + "/quiz",
                    message
            );
            log.info("✅ 퀴즈 WebSocket 전송 완료");
        } catch (Exception e) {
            log.error("WebSocket 전송 실패", e);
        }
    }

    /**
     * 결과 WebSocket 전송 (단순화)
     */
    private void sendResultsViaWebSocket(String quizId, QuizData quiz, List<UserAnswer> answers) {
        
        List<Map<String, Object>> evaluations = new ArrayList<>();
        for (UserAnswer ua : answers) {
            evaluations.add(Map.of(
                    "userId", ua.userId,
                    "answer", ua.answer,
                    "isCorrect", ua.isCorrect
            ));
        }
        
        Map<String, Object> result = Map.of(
                "quizId", quizId,
                "question", quiz.question,
                "expectedAnswer", quiz.expectedAnswer,
                "evaluations", evaluations
        );
        
        String[] parts = quizId.split("_");
        Long roomId = Long.parseLong(parts[0]);
        
        try {
            messagingTemplate.convertAndSend(
                    "/topic/room/" + roomId + "/quiz-result",
                    Map.of("type", "QUIZ_RESULT", "result", result)
            );
            log.info("✅ 결과 WebSocket 전송 완료");
        } catch (Exception e) {
            log.error("WebSocket 전송 실패", e);
        }
        
        // 자동 정리
        quizAnswers.remove(quizId);
        expectedParticipants.remove(quizId);
        activeQuizzes.remove(quizId);
    }
}
