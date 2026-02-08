package com.example.DuckDuck.domain.custom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class PurchaseResponse {
    private String message;
    private Long itemId;
    private Integer remainingCoins;
}
