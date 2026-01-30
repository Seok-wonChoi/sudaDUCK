package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
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
        // ★ [수정됨] 세션(Session) 확인 로직
        // =================================================================
        
        HttpSession session = request.getSession();
        // AuthController에서 저장해둔 값 꺼내기
        String clientEnv = (String) session.getAttribute("client_env");
        
        // 사용한 세션 값은 지워줌 (청소)
        session.removeAttribute("client_env");

        String baseUrl;
        
        // 세션에 "local"이라고 적혀있으면 로컬로 리다이렉트
        if ("local".equals(clientEnv)) {
            baseUrl = "http://localhost:5173/oauth2/redirect";
        } else {
            // 없거나 그 외의 값이면 무조건 배포 서버로 (안전빵)
            baseUrl = "https://i14e104.p.ssafy.io/dev/oauth2/redirect";
        }

        // 2. URL 파라미터로 토큰 실어서 보냄 (로컬/배포 통일)
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

        // 최종 리다이렉트 실행
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}