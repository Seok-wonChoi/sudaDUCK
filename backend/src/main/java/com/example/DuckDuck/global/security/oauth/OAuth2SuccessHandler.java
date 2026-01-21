package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.domain.user.service.RedisService;
import com.example.DuckDuck.global.security.jwt.JwtProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final RedisService redisService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Long userId = (Long) oAuth2User.getAttributes().get("id"); // 카카오 ID

        // 1. 현재 시간 타임스탬프 생성
        String loginAt = LocalDateTime.now().toString();

        // 2. Redis에 타임스탬프 저장 (기존 기기의 시간은 덮어씌워짐)
        // 토큰 만료시간과 동일하게 TTL 설정 (예: 1시간 = 3600000ms)
        redisService.saveLoginTimestamp(userId, loginAt, 3600000);

        // 3. JWT 생성 (loginAt 포함)
        String token = jwtProvider.createToken(userId, loginAt);

        // 4. HttpOnly 쿠키 생성
        ResponseCookie cookie = ResponseCookie.from("access_token", token)
                .httpOnly(true)
                .secure(true) // HTTPS 필수
                .path("/")
                .maxAge(3600)
                .sameSite("Strict") // CSRF 방지
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 5. 프론트엔드 메인 페이지로 리다이렉트
//        response.sendRedirect("http://localhost:3000/main");
    }
}
