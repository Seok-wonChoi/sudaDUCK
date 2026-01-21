package com.example.DuckDuck.domain.user.controller;

import com.example.DuckDuck.domain.user.dto.request.TestLoginRequest;
import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo(Authentication authentication){
        if (authentication == null){
            return ResponseEntity.status(401).body("인증되지 않은 사용자입니다.");
        }
        return ResponseEntity.ok("현재 로그인 유저: " + authentication.getPrincipal());
    }

    @PostMapping("/test-login")
    public ResponseEntity<String> testLogin(@RequestBody TestLoginRequest request,
                                            HttpServletResponse response){
        // 특정 유저 id로 우리 서버 전용 jwt 생성
        String accessToken = jwtTokenProvider.createAccessToken(request.getUserId(), request.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(request.getUserId(), request.getEmail());

        //HttpOnly 쿠키 생성
        CookieUtil.addCookie(response, "access_token", accessToken, 3600);
        return ResponseEntity.ok("테스트 로그인 성공! (유저 ID: " + request.getUserId() + ", 이메일: " + request.getEmail() + ") " +
                "이제 Postman에서 다른 API를 호출하면 자동으로 인증됩니다.");
    }

//    @Operation(summary = "로그아웃", description = "액세스 및 리프레시 토큰 쿠키를 삭제합니다.")
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletResponse response){
        //수명이 0인 쿠키를 생성하여 기존 쿠키를 덮어씌움
        CookieUtil.addCookie(response, "access_token",null,0);
        CookieUtil.addCookie(response, "refresh_token", null, 0);

        return ResponseEntity.ok("로그아웃 성공! 쿠키가 삭제되었습니다.");
    }

//    @Operation(summary = "토큰 재발급", description = "리프레시 토큰을 확인하여 새 액세스 토큰을 발급합니다.")
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        // 1. 쿠키에서 리프레시 토큰 추출
        String refreshToken = CookieUtil.getCookie(request, "refresh_token")
                .map(Cookie::getValue)
                .orElse(null);

        // 2. 토큰 유효성 검증
        if (refreshToken != null && jwtTokenProvider.validateToken(refreshToken)) {
            String email = jwtTokenProvider.getEmail(refreshToken);

            // (선택 사항) DB의 리프레시 토큰과 일치하는지 확인하는 로직 추가 필요

            // 3. 새 액세스 토큰 생성 및 쿠키 발급
            Long userId = 1L; // 실제로는 DB에서 조회해와야 함
            String newAccessToken = jwtTokenProvider.createAccessToken(userId, email);
            CookieUtil.addCookie(response, "access_token", newAccessToken, 3600);

            return ResponseEntity.ok("토큰이 갱신되었습니다.");
        }

        return ResponseEntity.status(401).body("리프레시 토큰이 유효하지 않습니다. 다시 로그인해주세요.");
    }
}

