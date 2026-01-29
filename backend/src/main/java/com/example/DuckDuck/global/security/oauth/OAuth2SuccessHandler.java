package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 로그 확인용
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    // ★ 1. yml에서 설정한 주소를 자동으로 가져옵니다.
    @Value("${custom.oauth2.redirect-url}")
    private String redirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttribute("kakao_account");
        String email = (String) kakaoAccount.get("email");
        Long userId = (Long) oAuth2User.getAttribute("id");

        // 1. 토큰 생성
        String accessToken = jwtTokenProvider.createAccessToken(userId, email);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId, email);

        // ★ 2. 환경 구분 로직 (하드코딩 제거)
        // redirectUrl에 "localhost"가 포함되어 있으면 로컬 환경으로 간주합니다.
        // (또는 Environment 빈을 주입받아 activeProfile을 확인하는 방법도 있지만 이게 가장 직관적입니다)
        boolean isLocal = redirectUrl.contains("localhost");

        log.info("OAuth2 Login Success. Target URL: {}, Environment: {}", redirectUrl, isLocal ? "Local" : "Server");

        String targetUrl;

        if (isLocal) {
            // 로컬 개발 시: 쿼리 파라미터로 전달
            targetUrl = UriComponentsBuilder.fromUriString(redirectUrl)
                    .queryParam("accessToken", accessToken)
                    .queryParam("refreshToken", refreshToken)
                    .build().toUriString();
        } else {
            // 배포 환경 시: 쿠키에 담고, 주소는 yml에 적힌 대로 이동
            targetUrl = redirectUrl;
            CookieUtil.addCookie(response, "accessToken", accessToken, 60, false);
        }

        // RT:{email} 저장
        redisTemplate.opsForValue().set(
                "RT:" + email,
                refreshToken,
                Duration.ofDays(14)
        );
        
        // Refresh Token은 항상 HttpOnly 쿠키로 (보안)
        CookieUtil.addCookie(
                response,
                "refreshToken",
                refreshToken,
                60 * 60 * 24 * 14,
                true
        );

        getRedirectStrategy().sendRedirect(
                request,
                response,
                targetUrl
        );
    }
}