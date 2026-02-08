package com.example.DuckDuck.global.security.ws;

import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // STOMP 메시지가 아니면 그대로 통과
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if (command == null) return message;

        //  1) CONNECT에서 인증(Principal) 세팅
        if (StompCommand.CONNECT.equals(command)) {
            String accessToken = resolveTokenFromAuthorization(accessor);

            // 쿠키도 같이 허용하고 싶으면 아래 한 줄 추가 가능
             if (accessToken == null) accessToken = resolveTokenFromCookie(accessor);

            if (accessToken == null) {
                // CONNECT 자체를 막아버리면 프론트에서 바로 실패를 감지 가능
                throw new IllegalArgumentException("WebSocket Authorization(Bearer) 토큰이 없습니다.");
            }

            if (!jwtTokenProvider.validateToken(accessToken)) {
                throw new IllegalArgumentException("WebSocket 토큰이 유효하지 않습니다.");
            }

            String email = jwtTokenProvider.getEmail(accessToken);

            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            Collections.emptyList()
                    );

            // WebSocket 세션 Principal 세팅 (이후 principal.getName() = email)
            accessor.setUser(authentication);

            return message;
        }

        // CONNECT 이후 메시지(SEND/SUBSCRIBE)에도 인증 강제
        // 이미 CONNECT에서 setUser 되었으면 여기서 통과함
        if (StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command)) {
            if (accessor.getUser() == null) {
                throw new IllegalArgumentException("인증되지 않은 WebSocket 요청입니다.");
            }
        }

        return message;
    }

    /**
     * STOMP CONNECT 헤더에서 Authorization: Bearer <token> 추출
     */
    private String resolveTokenFromAuthorization(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || authHeader.isBlank()) return null;

        // 소문자로 오는 경우도 방어
        if (authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        if (authHeader.startsWith("bearer ")) {
            return authHeader.substring(7).trim();
        }
        return null;
    }

    /**
     * (선택) 쿠키 기반도 동시에 허용하고 싶을 때 사용
     * - 프론트가 쿠키 방식/헤더 방식 혼재 가능할 때 안전장치
     */
    @SuppressWarnings("unused")
    private String resolveTokenFromCookie(StompHeaderAccessor accessor) {
        String cookieHeader = accessor.getFirstNativeHeader("cookie");
        return extractCookie(cookieHeader, "access_token");
    }

    private String extractCookie(String cookieHeader, String name) {
        if (cookieHeader == null) return null;

        for (String part : cookieHeader.split(";")) {
            String[] kv = part.trim().split("=", 2);
            if (kv.length == 2 && kv[0].equals(name)) {
                return kv[1];
            }
        }
        return null;
    }
}
