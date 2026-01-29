package com.example.DuckDuck.domain.custom.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EquipAvatarRequest {
    // 둘 중 하나만 보내도 됨 (부분 변경)
    private String bgStyle; // 예: "BASIC_WHITE"
    private String effect;  // 예: "NONE"
}