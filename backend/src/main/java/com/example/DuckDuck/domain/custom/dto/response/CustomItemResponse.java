package com.example.DuckDuck.domain.custom.dto.response;

import lombok.*;

@Getter
@AllArgsConstructor
@Builder
public class CustomItemResponse {
    private Long itemId;
    private String itemKey;
    private Integer price;
    private Boolean defaultFree;
    private Boolean owned;
    private Boolean equipped;
}
