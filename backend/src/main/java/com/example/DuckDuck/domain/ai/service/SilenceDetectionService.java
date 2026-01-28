package com.example.DuckDuck.domain.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * 정적 감지 대화 추천 서비스
 * 
 * 프론트에서 정적(침묵) 감지 시 대화 주제를 추천하는 기능
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SilenceDetectionService {

    private final AiContextService contextService;
    private final GptService gptService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 정적 감지 시 대화 추천 생성
     * 
     * @param roomId 방 ID
     * @param turn 현재 턴
     * @return 추천 대화 질문 (영어만)
     * @throws IllegalArgumentException 방이 존재하지 않을 때
     */
    public ConversationSuggestion generateSuggestion(Long roomId, Integer turn) {
        log.info("정적 감지 - 대화 추천 생성 시작: roomId={}, turn={}", roomId, turn);

        // 1. 컨텍스트 수집 (방 없으면 여기서 예외 발생)
        AiContextService.ConversationContext context = contextService.buildContext(roomId, turn);

        // 2. 프롬프트 생성
        String prompt = buildPrompt(context);

        // 3. GPT 호출
        String gptResponse = gptService.callGptForJson(prompt);

        // 4. 응답 파싱
        Map<String, Object> parsed = gptService.parseJsonResponse(gptResponse);

        ConversationSuggestion suggestion = ConversationSuggestion.builder()
                .roomId(roomId)
                .turn(turn)
                .question((String) parsed.get("question"))
                .build();

        log.info("대화 추천 생성 완료: {}", suggestion.getQuestion());

        // 5. WebSocket으로 전송 (선택)
        sendSuggestionViaWebSocket(roomId, suggestion);

        return suggestion;
    }

    // ============================================
    // 프롬프트 빌더
    // ============================================

    /**
     * GPT 프롬프트 생성
     * 
     * 대화 내용 유무에 따라 다른 프롬프트 사용
     */
    private String buildPrompt(AiContextService.ConversationContext context) {
        
        if (context.isHasConversation()) {
            // 대화 맥락 기반 추천
            return buildContextBasedPrompt(context);
        } else {
            // 주제 기반 추천
            return buildTopicBasedPrompt(context);
        }
    }

    /**
     * 대화 맥락 기반 프롬프트
     * 
     * 이미 나눈 대화를 분석해서 자연스러운 후속 질문 생성
     */
    private String buildContextBasedPrompt(AiContextService.ConversationContext context) {
        return String.format("""
                You are an English conversation coach helping students practice speaking.
                
                Topic: %s
                Current Turn: %d
                
                Previous Conversation:
                %s
                
                The conversation has paused. Suggest a natural follow-up question to restart the conversation.
                
                Requirements:
                - The question should relate to the previous conversation
                - Make it open-ended and easy to answer
                - Appropriate difficulty for English learners
                - Encourage natural conversation flow
                - Keep it 1-2 sentences
                
                Return JSON only:
                {
                  "question": "English question"
                }
                """,
                context.getTopic(),
                context.getTurn(),
                context.getFormattedConversation()
        );
    }

    /**
     * 주제 기반 프롬프트
     * 
     * 대화가 없을 때 주제를 기반으로 시작 질문 생성
     */
    private String buildTopicBasedPrompt(AiContextService.ConversationContext context) {
        return String.format("""
                You are an English conversation coach helping students practice speaking.
                
                Topic: %s
                
                There is no conversation yet. Suggest an engaging starter question about this topic.
                
                Requirements:
                - Make it interesting and relatable
                - Easy to answer for beginners
                - Open-ended to encourage conversation
                - Natural and friendly tone
                - Keep it 1-2 sentences
                
                Return JSON only:
                {
                  "question": "English question"
                }
                """,
                context.getTopic()
        );
    }

    // ============================================
    // WebSocket 전송
    // ============================================

    /**
     * WebSocket으로 추천 질문 전송
     */
    private void sendSuggestionViaWebSocket(Long roomId, ConversationSuggestion suggestion) {
        try {
            Map<String, Object> message = Map.of(
                    "type", "CONVERSATION_SUGGESTION",
                    "question", suggestion.getQuestion()
            );

            messagingTemplate.convertAndSend(
                    "/topic/room/" + roomId + "/suggestion",
                    message
            );

            log.info("대화 추천 WebSocket 전송 완료: roomId={}", roomId);

        } catch (Exception e) {
            log.error("WebSocket 전송 실패: roomId={}", roomId, e);
        }
    }

    // ============================================
    // DTO (단순화)
    // ============================================

    /**
     * 대화 추천 결과 (영어 질문만)
     */
    @lombok.Data
    @lombok.Builder
    public static class ConversationSuggestion {
        private Long roomId;
        private Integer turn;
        
        /** 영어 질문 */
        private String question;
    }
}
