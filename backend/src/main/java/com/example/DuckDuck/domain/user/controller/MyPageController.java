package com.example.DuckDuck.domain.user.controller;

import com.example.DuckDuck.domain.user.dto.response.MyPageSummaryResponse;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.example.DuckDuck.domain.user.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/mypage")
public class MyPageController {

    private final ProfileService profileService;
    private final MemberRepository memberRepository;


    @Operation(
            summary = "마이페이지 요약 조회",
            description = "로그인한 사용자의 연속 학습일 수와 저장된 문장 개수를 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "마이페이지 요약 조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "사용자 정보를 찾을 수 없음")
    })
    @GetMapping("/summary")
    public ResponseEntity<MyPageSummaryResponse> getSummary(Authentication authentication) {
        String email = authentication.getName();

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Member not found"));

        MyPageSummaryResponse res = profileService.getMyPageSummary(member.getId(), email);
        return ResponseEntity.ok(res);
    }
}
