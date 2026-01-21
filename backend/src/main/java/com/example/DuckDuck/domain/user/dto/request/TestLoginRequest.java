package com.example.DuckDuck.domain.user.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TestLoginRequest {
    private Long userId;
    private String email;
}
