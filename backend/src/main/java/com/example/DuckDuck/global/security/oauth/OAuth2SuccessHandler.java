package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

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

        // =================================================================
        // ★ [최종 전략] 배포 환경(쿠키 있음) vs 로컬(쿠키 없음) 판별
        // =================================================================
        
        boolean isProd = false;

        // 1. 요청에 'client_env=production' 쿠키가 있는지 확인
        // (로컬에서는 이 쿠키가 서버로 안 넘어오므로, 이 쿠키가 있다는 건 배포 환경이라는 뜻)
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("client_env".equals(cookie.getName()) && "production".equals(cookie.getValue())) {
                    isProd = true;
                    
                    // 확인한 쿠키는 삭제 (청소)
                    cookie.setMaxAge(0);
                    cookie.setPath("/");
                    response.addCookie(cookie);
                    break;
                }
            }
        }

        // 2. 목적지(Base URL) 설정
        String baseUrl;
        if (isProd) {
            // [배포 환경] 쿠키가 발견됨 -> Dev 서버 리다이렉트 주소
            baseUrl = "https://i14e104.p.ssafy.io/dev/oauth2/redirect"; 
        } else {
            // [로컬 환경] 쿠키가 없음 -> Localhost 리다이렉트 주소
            baseUrl = "http://localhost:5173/oauth2/redirect"; 
        }

        // 3. [통일] 로컬이든 배포든 "무조건" URL 뒤에 토큰을 붙여서 보냄
        String targetUrl = UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        // =================================================================

        // RT:{email} 저장 (Redis)
        redisTemplate.opsForValue().set(
                "RT:" + email,
                refreshToken,
                Duration.ofDays(14)
        );
        
        // HttpOnly 쿠키 (RefreshToken) - 보안 백업용
        CookieUtil.addCookie(
                response,
                "refreshToken",
                refreshToken,
                60 * 60 * 24 * 14,
                true
        );

        // 리다이렉트 실행
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}