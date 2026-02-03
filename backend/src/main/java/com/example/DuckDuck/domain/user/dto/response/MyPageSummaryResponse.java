package com.example.DuckDuck.domain.user.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyPageSummaryResponse {
    private final int attendanceDays;
    private final long sentenceCount;
}
