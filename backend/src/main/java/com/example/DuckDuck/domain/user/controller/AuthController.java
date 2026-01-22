package com.example.DuckDuck.domain.user.controller;

import com.example.DuckDuck.domain.user.dto.request.TestLoginRequest;
import com.example.DuckDuck.domain.user.dto.request.TestSignupRequest;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.entity.Profile;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
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
    private final MemberRepository memberRepository;

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
    public ResponseEntity<String> testLogin(@RequestBody TestLoginRequest request,
                                            HttpServletResponse response){

        Member member = memberRepository.findById(request.getUserId())
                .orElseThrow(()-> new RuntimeException("DB에 없는 유저입니다."));

        // 2. 조회된 유저의 이메일과 입력받은 이메일이 일치하는지 검증
        if (!member.getEmail().equals(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("인증 실패: 유저 ID와 이메일 정보가 일치하지 않습니다.");
        }

        // 특정 유저 id로 우리 서버 전용 jwt 생성
        String accessToken = jwtTokenProvider.createAccessToken(request.getUserId(), request.getEmail());
        String refreshToken = jwtTokenProvider.createRefreshToken(request.getUserId(), request.getEmail());

        //HttpOnly 쿠키 생성
        CookieUtil.addCookie(response, "access_token", accessToken, 3600);
        CookieUtil.addCookie(response, "refresh_token", refreshToken, 1209600);

        return ResponseEntity.ok("DB 유저 기반 테스트 로그인 성공! (유저 ID: " + request.getUserId() + ", 이메일: " + request.getEmail() + ") " +
                "이제 Postman에서 다른 API를 호출하면 자동으로 인증됩니다.");
    }



    @Operation(summary = "로그아웃", description = "액세스 및 리프레시 토큰 쿠키를 삭제합니다.")
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletResponse response){
        //수명이 0인 쿠키를 생성하여 기존 쿠키를 덮어씌움
        CookieUtil.addCookie(response, "access_token",null,0);
        CookieUtil.addCookie(response, "refresh_token", null, 0);

        return ResponseEntity.ok("로그아웃 성공! 쿠키가 삭제되었습니다.");
    }

    @Operation(summary = "토큰 재발급", description = "리프레시 토큰을 확인하여 새 액세스 토큰을 발급합니다.")
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


    @Operation(summary = "테스트 회원가입", description = "테스트용 멤버와 프로필을 동시에 생성합니다.")
    @Transactional // 두 엔티티를 저장하므로 트랜잭션 보장 필수
    @PostMapping("/test-signup")
    public ResponseEntity<String> testSignup(@RequestBody TestSignupRequest request) {

        // 1. 이미 존재하는지 확인
        if (memberRepository.existsById(request.getUserId())) {
            return ResponseEntity.badRequest().body("이미 존재하는 ID입니다.");
        }

        // 2. Member 생성
        Member newMember = Member.builder()
                .id(request.getUserId())
                .email(request.getEmail())
                .name(request.getName())
                .nickname(request.getNickname())
                .isActive(true)
                .build();

        // 3. Profile 생성 및 연결
        Profile newProfile = Profile.builder()
                .user(newMember) // Profile -> Member 연결
                .coins(0)
                .attendanceDays(0)
                .lastLoginAt(LocalDateTime.now())
                .build();

        newMember.setProfile(newProfile); // Member -> Profile 연결 (양방향인 경우)

        memberRepository.save(newMember); // Cascade 설정에 따라 Profile도 자동 저장됨

        return ResponseEntity.ok("테스트 회원가입 완료! ID: " + request.getUserId());
    }
}

