package com.example.DuckDuck.domain.user.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TestSignupRequest {
    private Long userId; // 테스트용으로 사용할 ID (카카오 ID 대용)
    private String email;
    private String name;
    private String nickname;
}
