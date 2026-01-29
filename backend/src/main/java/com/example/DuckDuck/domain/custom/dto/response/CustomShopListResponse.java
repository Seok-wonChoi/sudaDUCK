package com.example.DuckDuck.domain.custom.dto.response;

import lombok.*;

import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class CustomShopListResponse {
    private String category;
    private Integer coins;
    private List<CustomItemResponse> items;
}
