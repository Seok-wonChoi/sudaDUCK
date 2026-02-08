package com.example.DuckDuck.domain.custom.controller;

import com.example.DuckDuck.domain.custom.dto.request.EquipAiDuckbotRequest;
import com.example.DuckDuck.domain.custom.dto.request.EquipAvatarRequest;
import com.example.DuckDuck.domain.custom.dto.request.EquipDuckRequest;
import com.example.DuckDuck.domain.custom.dto.response.EquipAiDuckbotResponse;
import com.example.DuckDuck.domain.custom.dto.response.EquipAvatarResponse;
import com.example.DuckDuck.domain.custom.dto.response.EquipDuckResponse;
import com.example.DuckDuck.domain.custom.dto.response.MyProfileCustomResponse;
import com.example.DuckDuck.domain.custom.service.ProfileCustomizeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Profile Customize", description = "프로필 커스터마이징 장착 API")
@RestController
@RequestMapping("/api/v1/me/profile/custom")
@RequiredArgsConstructor
public class ProfileCustomizeController {

    private final ProfileCustomizeService profileCustomizeService;

    @Operation(summary = "오리 커스터마이징 장착", description = "오리 색상/악세사리를 장착합니다. (기본무료 또는 구매한 아이템만 가능)")
    @PatchMapping("/duck")
    public ResponseEntity<EquipDuckResponse> equipDuck(@RequestBody EquipDuckRequest request,
                                                       Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        return ResponseEntity.ok(profileCustomizeService.equipDuck(email, request));
    }

    @Operation(summary = "아바타 커스터마이징 장착", description = "닉네임 배경/효과를 장착합니다. (기본무료 또는 구매한 아이템만 가능)")
    @PatchMapping("/avatar")
    public ResponseEntity<EquipAvatarResponse> equipAvatar(
            @RequestBody EquipAvatarRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(profileCustomizeService.equipAvatar(email, request));
    }

    @Operation(
            summary = "내 프로필 커스터마이징 조회",
            description = "현재 로그인한 사용자의 코인, 오리/아바타 커스터마이징 장착 상태를 조회합니다."
    )
    @GetMapping
    public ResponseEntity<MyProfileCustomResponse> getMyProfileCustom(
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        return ResponseEntity.ok(profileCustomizeService.getMyProfileCustom(email));
    }

    @Operation(
            summary = "AI 오리봇 장착",
            description = "AI 오리봇 모델을 변경합니다. 기본 무료 또는 구매한 모델만 장착 가능합니다."
    )
    @PatchMapping("/ai-duckbot")
    public ResponseEntity<EquipAiDuckbotResponse> equipAiDuckbot(
            @RequestBody EquipAiDuckbotRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        return ResponseEntity.ok(profileCustomizeService.equipAiDuckbot(email, request));
    }
}
