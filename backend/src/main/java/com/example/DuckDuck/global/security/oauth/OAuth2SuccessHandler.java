package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    // ✅ 운영 서버 주소로 완전 하드코딩 (프론트엔드 리다이렉트 경로)
    private final String redirectUrl = "https://i14e104.p.ssafy.io/oauth2/redirect";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        
        log.info("========== [PROD] OAuth2SuccessHandler 실행 ==========");

        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttribute("kakao_account");
            String email = (String) kakaoAccount.get("email");
            Long userId = (Long) oAuth2User.getAttribute("id");

            String accessToken = jwtTokenProvider.createAccessToken(userId, email);
            String refreshToken = jwtTokenProvider.createRefreshToken(refreshToken);

            // ✅ 운영 주소 기반으로 타겟 URL 생성
            String targetUrl = UriComponentsBuilder.fromUriString(redirectUrl)
                    .queryParam("accessToken", accessToken)
                    .queryParam("refreshToken", refreshToken)
                    .build().toUriString();

            log.info("[PROD] 최종 이동 주소: {}", targetUrl);

            // Redis 및 쿠키 설정
            redisTemplate.opsForValue().set("RT:" + email, refreshToken, Duration.ofDays(14));
            CookieUtil.addCookie(response, "refreshToken", refreshToken, 60 * 60 * 24 * 14, true);

            // 리다이렉트 실행
            getRedirectStrategy().sendRedirect(request, response, targetUrl);

        } catch (Exception e) {
            log.error("[PROD ERROR] OAuth2SuccessHandler 실패: ", e);
            // 에러 발생 시에도 운영 로그인 페이지로 이동
            response.sendRedirect("https://i14e104.p.ssafy.io/login?error=handler_failed");
        }
    }
}