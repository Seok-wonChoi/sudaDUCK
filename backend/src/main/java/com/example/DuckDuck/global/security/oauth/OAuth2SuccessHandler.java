package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
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

        boolean isLocalDev = true; // 개발 중엔 true로 설정
        String targetUrl;

        if (isLocalDev) {
            // 로컬 개발 시: localhost로 토큰을 실어서 리다이렉트
            targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/oauth2/redirect")
                    .queryParam("accessToken", accessToken) // 쿠키 대신 URL로 전달하는 것이 확실함
                    .build().toUriString();
        } else {
            // 배포 환경 시: 기존 도메인 유지
            targetUrl = "https://i14e104.p.ssafy.io/dev/oauth2/redirect";
            CookieUtil.addCookie(response, "accessToken", accessToken, 60, false);
        }

        //RT:{email} 저장 (중복 로그인 기준)
        redisTemplate.opsForValue().set(
                "RT:" + email,
                refreshToken,
                Duration.ofDays(14)
        );
        // HttpOnly 쿠키
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
