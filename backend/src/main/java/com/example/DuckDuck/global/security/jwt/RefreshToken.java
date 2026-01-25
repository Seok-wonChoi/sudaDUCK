package com.example.DuckDuck.global.security.jwt;


import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

@RedisHash(value="refreshToken")
@Getter
public class RefreshToken {

    @Id
    private String email;

    private String refreshToken;

    @TimeToLive
    private Long expiration;  //초 단위로 저장

    public RefreshToken(String email, String refreshToken, Long expiration){
        this.email = email;
        this.refreshToken = refreshToken;
        this.expiration = expiration;
    }

}
