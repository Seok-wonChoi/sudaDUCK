package com.example.DuckDuck.domain.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate redisTemplate;

    // Redis에 저장할 키의 접두사 (중복 방지)
    private static final String LOGIN_PREFIX = "login_at:";

    /**
     * 유저의 최신 로그인 타임스탬프 저장
     * @param userId 유저 고유 ID
     * @param timestamp 로그인 시점의 문자열 (LocalDateTime.now().toString())
     * @param durationMs 토큰의 유효 기간 (예: 3600000ms = 1시간)
     */
    public void saveLoginTimestamp(Long userId, String timestamp, long durationMs) {
        redisTemplate.opsForValue().set(
                LOGIN_PREFIX + userId,
                timestamp,
                durationMs,
                TimeUnit.MILLISECONDS
        );
    }

    /**
     * 유저의 최신 로그인 타임스탬프 조회
     */
    public String getLoginTimestamp(Long userId) {
        return redisTemplate.opsForValue().get(LOGIN_PREFIX + userId);
    }

    /**
     * 로그아웃 혹은 강제 종료 시 데이터 삭제
     */
    public void deleteLoginTimestamp(Long userId) {
        redisTemplate.delete(LOGIN_PREFIX + userId);
    }
}
