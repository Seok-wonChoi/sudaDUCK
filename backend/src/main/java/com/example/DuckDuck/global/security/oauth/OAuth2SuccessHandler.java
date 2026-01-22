package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.domain.user.service.RedisService;
import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import com.example.DuckDuck.global.security.jwt.RefreshToken;
import com.example.DuckDuck.global.security.jwt.RefreshTokenRepository;
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
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

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

        // 2. Refresh Token을 Redis에 저장
        refreshTokenRepository.save(new RefreshToken(email, refreshToken, 1209600L)); // 14일

        // 3. 쿠키에 토큰 담기 (만료시간은 초 단위)
        CookieUtil.addCookie(response, "accessToken", accessToken, 3600); // 1시간
        CookieUtil.addCookie(response, "refreshToken", refreshToken, 1209600); // 14일

        // 4. 프론트엔드 메인 페이지로 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, "/api/v1/auth/me");

    }
}
