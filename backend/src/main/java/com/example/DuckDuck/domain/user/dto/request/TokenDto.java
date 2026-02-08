package com.example.DuckDuck.domain.user.dto.request;

public record TokenDto (
    String accessToken,
    String refreshToken
) {}
