package com.example.DuckDuck.domain.custom.controller;

import com.example.DuckDuck.domain.custom.dto.request.UpdateNicknameRequest;
import com.example.DuckDuck.domain.custom.dto.response.UpdateNicknameResponse;
import com.example.DuckDuck.domain.custom.service.NicknameService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Profile Customize", description = "닉네임 수정 API")
@RestController
@RequestMapping("/api/v1/me/profile")
@RequiredArgsConstructor
public class NicknameController {

    private final NicknameService nicknameService;

    @Operation(
            summary = "닉네임 수정",
            description = "현재 로그인한 사용자의 닉네임을 수정합니다. (Member.nickname 업데이트)"
    )
    @PatchMapping("/nickname")
    public ResponseEntity<UpdateNicknameResponse> updateNickname(
            @RequestBody UpdateNicknameRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        return ResponseEntity.ok(nicknameService.updateNickname(email, request));
    }
}
