package com.example.DuckDuck.domain.user.controller;

import com.example.DuckDuck.domain.user.dto.request.TestLoginRequest;
import com.example.DuckDuck.domain.user.dto.request.TestSignupRequest;
import com.example.DuckDuck.domain.user.dto.request.TokenDto;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.entity.Profile;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.example.DuckDuck.domain.user.service.AuthService;
import com.example.DuckDuck.global.security.jwt.CookieUtil;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Tag(name = "Auth", description = "인증 관련 API (카카오/테스트 로그인)")
@RestController
@RequestMapping("api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthService authService;

    @Operation(summary = "내 정보 조회", description = "쿠키의 토큰을 확인하여 내 정보를 반환합니다.")
    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo(Authentication authentication){
        if (authentication == null){
            return ResponseEntity.status(401).body("인증되지 않은 사용자입니다.");
        }
        return ResponseEntity.ok("현재 로그인 유저: " + authentication.getPrincipal());
    }

    @Operation(summary = "테스트 로그인", description = "특정 유저로 강제 로그인하여 쿠키를 발급받습니다.")
    @PostMapping("/test-login")
    public ResponseEntity<TokenDto> testLogin(@RequestBody TestLoginRequest request,
                                            HttpServletResponse response){

        TokenDto tokens = authService.login(request.getUserId(), request.getEmail());

        CookieUtil.addCookie(
                response,
                "accessToken",
                tokens.accessToken(),
                3600, // 1시간
                false
        );

        CookieUtil.addCookie(
                response,
                "refreshToken",
                tokens.refreshToken(),
                60 * 60 * 24 * 14,
                true
        );

        return ResponseEntity.ok(tokens);
    }



    @Operation(summary = "로그아웃", description = "액세스 및 리프레시 토큰 쿠키를 삭제합니다.")
    @PostMapping("/logout")
    public ResponseEntity<String> logout(Authentication authentication,HttpServletResponse response){

        if (authentication != null){
            authService.logout(authentication.getName());
        }
        //수명이 0인 쿠키를 생성하여 기존 쿠키를 덮어씌움
        CookieUtil.addCookie(response, "access_token",null,0, false);
        CookieUtil.addCookie(response, "refresh_token", null, 0, true);

        return ResponseEntity.ok("로그아웃 성공! 쿠키가 삭제되었습니다.");
    }

    @Operation(summary = "토큰 재발급", description = "리프레시 토큰을 확인하여 새 액세스 토큰을 발급합니다.")
    @PostMapping("/refresh")
    public ResponseEntity<TokenDto> refresh(HttpServletRequest request, HttpServletResponse response) {
        // 1. 쿠키에서 리프레시 토큰 추출
        String refreshToken = CookieUtil.getCookie(request, "refresh_token")
                .map(Cookie::getValue)
                .orElse(null);

        // 2. access token 재발급
        try {
            String newAccessToken = authService.refresh(refreshToken);
            return ResponseEntity.ok(new TokenDto(newAccessToken, null));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

    }


    @Operation(summary = "테스트 회원가입", description = "테스트용 멤버와 프로필을 동시에 생성합니다.")
    @Transactional // 두 엔티티를 저장하므로 트랜잭션 보장 필수
    @PostMapping("/test-signup")
    public ResponseEntity<String> testSignup(@RequestBody TestSignupRequest request) {

        authService.testSignup(request);
        return ResponseEntity.ok("테스트 회원가입 완료! ID: " + request.getUserId());
    }
}

