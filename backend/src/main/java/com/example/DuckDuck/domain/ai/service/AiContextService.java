package com.example.DuckDuck.domain.ai.service;

import com.example.DuckDuck.domain.room.entity.Room;
import com.example.DuckDuck.domain.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * AI 공통 서비스
 * 
 * Redis 대화 컨텍스트 조회를 담당하는 공통 서비스
 * GPT 호출은 기존 GptService 활용
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiContextService {

    private final StringRedisTemplate redisTemplate;
    private final RoomRepository roomRepository;

    // ============================================
    // Redis 대화 컨텍스트 조회
    // ============================================

    /**
     * Redis에서 방의 현재 턴까지의 대화 스크립트 조회
     * 
     * @param roomId 방 ID
     * @param turn 턴 번호
     * @return 대화 스크립트 리스트 (없으면 빈 리스트)
     */
    public List<String> getConversationScripts(Long roomId, Integer turn) {
        try {
            // Redis Key: room:{roomId}:turn:{turn}:scripts
            String key = String.format("room:%d:turn:%d:scripts", roomId, turn);

            Set<String> scripts = redisTemplate.opsForSet().members(key);
            
            if (scripts == null || scripts.isEmpty()) {
                log.warn("대화 스크립트 없음 - roomId: {}, turn: {}", roomId, turn);
                return Collections.emptyList();
            }
            
            log.info("대화 스크립트 조회 완료 - roomId: {}, turn: {}, count: {}", 
                    roomId, turn, scripts.size());
            
            return new ArrayList<>(scripts);
            
        } catch (Exception e) {
            log.error("Redis 조회 실패 - roomId: {}, turn: {}, error: {}", 
                    roomId, turn, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * 현재 턴까지의 모든 대화 스크립트 조회 (전체 컨텍스트)
     * 
     * @param roomId 방 ID
     * @param currentTurn 현재 턴
     * @return 1턴부터 현재 턴까지의 모든 대화 스크립트
     */
    public List<String> getAllConversationScripts(Long roomId, Integer currentTurn) {
        List<String> allScripts = new ArrayList<>();
        
        // 1턴부터 현재 턴까지 순회
        for (int turn = 1; turn <= currentTurn; turn++) {
            List<String> turnScripts = getConversationScripts(roomId, turn);
            allScripts.addAll(turnScripts);
        }
        
        log.info("전체 대화 스크립트 조회 완료 - roomId: {}, turns: 1-{}, total: {}", 
                roomId, currentTurn, allScripts.size());
        
        return allScripts;
    }

    // ============================================
    // Room Topic 조회
    // ============================================

    /**
     * 방의 주제 조회 (DB에서)
     * 
     * @param roomId 방 ID
     * @return 방 주제
     * @throws IllegalArgumentException 방이 존재하지 않을 때
     */
    public String getRoomTopic(Long roomId) {
        return roomRepository.findById(roomId)
                .map(Room::getTopic)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));
    }

    // ============================================
    // 대화 포맷팅
    // ============================================

    /**
     * 대화 스크립트를 읽기 쉬운 형태로 포맷팅
     * 
     * @param scripts 대화 스크립트 리스트
     * @return 포맷팅된 문자열
     * 
     * 예시:
     * [1] 안녕하세요
     * [2] 반갑습니다
     */
    public String formatConversation(List<String> scripts) {
        if (scripts.isEmpty()) {
            return "(대화 없음)";
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < scripts.size(); i++) {
            sb.append(String.format("[%d] %s\n", i + 1, scripts.get(i)));
        }
        return sb.toString().trim();
    }

    // ============================================
    // 컨텍스트 빌더 (편의 메서드)
    // ============================================

    /**
     * AI 프롬프트용 컨텍스트 구성
     * 
     * @param roomId 방 ID
     * @param turn 턴
     * @return 프롬프트에 사용할 컨텍스트 정보
     * @throws IllegalArgumentException 방이 존재하지 않을 때
     */
    public ConversationContext buildContext(Long roomId, Integer turn) {
        List<String> scripts = getAllConversationScripts(roomId, turn);
        String topic = getRoomTopic(roomId);  // 방 없으면 여기서 예외 발생!
        String formattedConversation = formatConversation(scripts);

        return ConversationContext.builder()
                .roomId(roomId)
                .turn(turn)
                .topic(topic)
                .scripts(scripts)
                .formattedConversation(formattedConversation)
                .hasConversation(!scripts.isEmpty())
                .build();
    }

    /**
     * 대화 컨텍스트 정보를 담는 DTO
     */
    @lombok.Data
    @lombok.Builder
    public static class ConversationContext {
        private Long roomId;
        private Integer turn;
        private String topic;
        private List<String> scripts;
        private String formattedConversation;
        private boolean hasConversation;
    }
}
