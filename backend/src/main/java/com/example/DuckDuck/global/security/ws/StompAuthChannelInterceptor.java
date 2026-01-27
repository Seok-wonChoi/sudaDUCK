package com.example.DuckDuck.global.security.ws;

import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
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
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // 브라우저가 WS 핸드셰이크 때 보낸 쿠키
            String cookieHeader = accessor.getFirstNativeHeader("cookie");
            String accessToken = extractCookie(cookieHeader, "access_token");

            if (accessToken != null && jwtTokenProvider.validateToken(accessToken)) {
                String email = jwtTokenProvider.getEmail(accessToken);

                Authentication authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                Collections.emptyList()
                        );

                // WebSocket Principal 세팅
                accessor.setUser(authentication);
            }
        }
        return message;
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
