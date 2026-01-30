package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 로그용 추가
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

@Slf4j // 로그 라이브러리 사용
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;

    // yml에서 못 읽어올 경우를 대비해 기본값(운영주소) 세팅
    @Value("${custom.oauth2.redirect-url:https://i14e104.p.ssafy.io/oauth2/redirect}")
    private String redirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        
        // 1. 진입 로그 (이게 안 찍히면 핸들러 오기도 전에 터진 것)
        System.out.println("========== [DEBUG] OAuth2SuccessHandler 진입 완료 ==========");
        log.info("[DEBUG] Authentication User: {}", authentication.getName());

        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            Map<String, Object> kakaoAccount = (Map<String, Object>) oAuth2User.getAttribute("kakao_account");
            String email = (String) kakaoAccount.get("email");
            Long userId = (Long) oAuth2User.getAttribute("id");

            System.out.println("========== [DEBUG] 사용자 정보 획득: " + email + " ==========");

            String accessToken = jwtTokenProvider.createAccessToken(userId, email);
            String refreshToken = jwtTokenProvider.createRefreshToken(userId, email);

            // 2. 리다이렉트 주소 확인 로그
            System.out.println("========== [DEBUG] 설정된 redirectUrl: " + redirectUrl + " ==========");

            String targetUrl = UriComponentsBuilder.fromUriString(redirectUrl)
                    .queryParam("accessToken", accessToken)
                    .queryParam("refreshToken", refreshToken)
                    .build().toUriString();

            System.out.println("========== [DEBUG] 최종 이동할 targetUrl: " + targetUrl + " ==========");

            // Redis 저장 및 쿠키 로직
            redisTemplate.opsForValue().set("RT:" + email, refreshToken, Duration.ofDays(14));
            CookieUtil.addCookie(response, "refreshToken", refreshToken, 60 * 60 * 24 * 14, true);

            System.out.println("========== [DEBUG] 리다이렉트 실행 직전 ==========");
            
            getRedirectStrategy().sendRedirect(request, response, targetUrl);

        } catch (Exception e) {
            System.out.println("========== [ERROR] 핸들러 내부에서 에러 발생! ==========");
            e.printStackTrace(); // 에러 원인 출력
            log.error("OAuth2SuccessHandler Error: ", e);
            response.sendRedirect("https://i14e104.p.ssafy.io/login?error=handler_failed");
        }
    }
}