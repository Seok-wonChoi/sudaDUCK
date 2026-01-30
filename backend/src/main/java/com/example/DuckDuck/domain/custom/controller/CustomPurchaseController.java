package com.example.DuckDuck.domain.custom.controller;

import com.example.DuckDuck.domain.custom.dto.response.PurchaseResponse;
import com.example.DuckDuck.domain.custom.service.CustomPurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Custom Shop", description = "커스터마이징 상점 구매 API")
@RestController
@RequestMapping("/api/v1/shop")
@RequiredArgsConstructor
public class CustomPurchaseController {

    private final CustomPurchaseService customPurchaseService;

    @Operation(summary = "커스텀 아이템 구매", description = "코인으로 아이템을 구매하고 소유 목록에 등록합니다.")
    @PostMapping("/custom-items/{itemId}/purchase")
    public ResponseEntity<PurchaseResponse> purchase(@PathVariable Long itemId,
                                                     Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        return ResponseEntity.ok(customPurchaseService.purchase(email, itemId));
    }
}
