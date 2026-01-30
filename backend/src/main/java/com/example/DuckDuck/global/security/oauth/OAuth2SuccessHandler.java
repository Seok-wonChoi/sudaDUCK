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
        // ★ [여기가 문제였습니다!] 논리를 완전히 뒤집습니다.
        // =================================================================
        
        // 기본값(default)을 "로컬(Local)"로 잡습니다.
        // 왜냐? 로컬은 도메인 문제로 쿠키를 못 보내니까, "아무것도 안 가져오면 로컬놈이다"라고 간주하는 겁니다.
        String baseUrl = "http://localhost:5173/oauth2/redirect"; 

        // 1. 요청에 'client_env=production' (배포용) 쿠키가 있는지 확인
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                // 배포 환경에서 심은 쿠키가 발견되면?
                if ("client_env".equals(cookie.getName()) && "production".equals(cookie.getValue())) {
                    // "아! 너 배포환경에서 왔구나!" -> 주소를 Dev로 변경
                    baseUrl = "https://i14e104.p.ssafy.io/dev/oauth2/redirect";
                    
                    // 확인한 쿠키는 삭제 (청소)
                    cookie.setMaxAge(0);
                    cookie.setPath("/");
                    response.addCookie(cookie);
                    break;
                }
            }
        }

        // 2. 결정된 주소(baseUrl)로 토큰 싣고 발사
        String targetUrl = UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        // =================================================================

        // RT:{email} 저장 (Redis)
        redisTemplate.opsForValue().set("RT:" + email, refreshToken, Duration.ofDays(14));
        
        // HttpOnly 쿠키 (RefreshToken)
        CookieUtil.addCookie(response, "refreshToken", refreshToken, 60 * 60 * 24 * 14, true);

        // 리다이렉트 실행
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}