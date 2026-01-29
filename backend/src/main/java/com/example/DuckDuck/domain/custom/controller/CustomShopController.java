package com.example.DuckDuck.domain.custom.controller;

import com.example.DuckDuck.domain.custom.dto.response.CustomShopListResponse;
import com.example.DuckDuck.domain.custom.enums.CustomCategory;
import com.example.DuckDuck.domain.custom.service.CustomShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Custom Shop", description = "프로필 커스터마이징 상점 API")
@RestController
@RequestMapping("/api/v1/shop")
@RequiredArgsConstructor
public class CustomShopController {

    private final CustomShopService customShopService;

    @Operation(
            summary = "커스텀 아이템 목록 조회",
            description = "카테고리별 커스텀 아이템 목록을 조회합니다. 각 아이템의 소유(owned) 및 장착(equipped) 상태를 포함합니다."
    )
    @GetMapping("/custom-items")
    public ResponseEntity<CustomShopListResponse> getCustomItems(
            @Parameter(description = "조회할 카테고리", required = true,
                    example = "DUCK_COLOR")
            @RequestParam CustomCategory category,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String identifier = extractIdentifier(authentication); // email 또는 username(우리 기준 식별자)

        return ResponseEntity.ok(customShopService.getShopItems(identifier, category));
    }

    /**
     * 소셜 로그인/커스텀 JWT 환경에서 principal 형태가 달라도 안전하게 식별자(email 또는 username)를 꺼낸다.
     */
    private String extractIdentifier(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        // 1) UserDetails 기반이면 username 반환
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }

        // 2) principal이 String이면 그대로 사용
        if (principal instanceof String s) {
            return s;
        }

        return String.valueOf(principal);
    }
}
