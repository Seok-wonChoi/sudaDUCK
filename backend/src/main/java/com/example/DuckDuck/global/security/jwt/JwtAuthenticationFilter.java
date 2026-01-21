package com.example.DuckDuck.global.security.jwt;

import com.example.DuckDuck.domain.user.service.RedisService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final RedisService redisService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 쿠키에서 JWT 추출
        String token = resolveToken(request);

        // 2. 토큰 유효성 및 타임스탬프 검증
        if (token != null && jwtProvider.validateToken(token)) {
            Long userId = Long.parseLong(jwtProvider.getUserId(token));
            String tokenLoginAt = jwtProvider.getLoginAt(token); // 토큰에 박힌 시간

            // Redis에서 최신 로그인 시간 조회
            String latestLoginAt = redisService.getLoginTimestamp(userId);

            // 3. [핵심] 토큰 시간과 Redis 시간이 일치하는지 비교
            if (tokenLoginAt.equals(latestLoginAt)) {
                // 일치하면 인증 객체 생성 및 컨텍스트 저항
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // 일치하지 않으면 (다른 기기에서 로그인됨) 인증 처리 안 함 -> 401 에러 유도
                System.out.println("중복 로그인 발생: 구형 토큰 차단");
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("access_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
