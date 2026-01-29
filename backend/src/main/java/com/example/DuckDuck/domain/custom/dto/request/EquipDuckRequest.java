package com.example.DuckDuck.domain.custom.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EquipDuckRequest {
    // 둘 중 하나만 보내도 됨 (부분 변경)
    private String color;      // 예: "YELLOW"
    private String accessory;  // 예: "NONE"
}