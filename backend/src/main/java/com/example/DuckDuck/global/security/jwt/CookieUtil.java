package com.example.DuckDuck.global.security.jwt;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;

import java.util.Optional;

public class CookieUtil {

    public static void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        // ResponseCookie를 사용하면 sameSite 메서드를 바로 쓸 수 있습니다.
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .path("/")
                .httpOnly(true)    // JavaScript 접근 방지
                .secure(true)      // SameSite("None") 설정 시 필수 (HTTPS 필요)
                .sameSite("None")  // Cross-Site 간 쿠키 전송 허용
                .maxAge(maxAge)
                .build();

        // 기존 addCookie 대신 헤더에 직접 추가합니다.
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return Optional.of(cookie);
                }
            }
        }
        return Optional.empty();
    }
}