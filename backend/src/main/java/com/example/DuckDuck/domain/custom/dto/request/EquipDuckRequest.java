package com.example.DuckDuck.domain.custom.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EquipDuckRequest {
    // 셋 중 하나만 보내도 됨 (부분 변경)
    private String style;      // profile1~profile4
    private String color;      // white/yellow/blue/...
    private String accessory;  // none/hat/...
}