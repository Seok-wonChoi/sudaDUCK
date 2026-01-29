package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.Cookie; // ★ 이거 꼭 있어야 합니다!
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
        // ★ [수정됨] 쿠키 확인 후 -> URL 및 토큰 전달 방식 결정
        // =================================================================
        
        boolean isLocal = false;
        String targetUrl;

        // 1. 요청에 'client_env=local' 쿠키가 있는지 확인
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("client_env".equals(cookie.getName()) && "local".equals(cookie.getValue())) {
                    isLocal = true; // 로컬임이 확인됨
                    
                    // 확인한 쿠키는 삭제 (청소)
                    cookie.setMaxAge(0);
                    cookie.setPath("/");
                    response.addCookie(cookie);
                    break;
                }
            }
        }

        // 2. 로컬 vs 배포 분기 처리 (기존 로직 유지)
        if (isLocal) {
            // [Local] localhost로 이동 + URL 쿼리 파라미터로 토큰 전달
            targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/oauth2/redirect")
                    .queryParam("accessToken", accessToken)
                    .queryParam("refreshToken", refreshToken)
                    .build().toUriString();
        } else {
            // [Prod/Dev] 배포 주소로 이동 + 쿠키로 토큰 전달
            targetUrl = "https://i14e104.p.ssafy.io/dev/oauth2/redirect";
            CookieUtil.addCookie(response, "accessToken", accessToken, 60, false);
        }
        // =================================================================

        // RT:{email} 저장 (중복 로그인 기준)
        redisTemplate.opsForValue().set(
                "RT:" + email,
                refreshToken,
                Duration.ofDays(14)
        );
        // HttpOnly 쿠키 (RefreshToken)
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