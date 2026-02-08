package com.example.DuckDuck.global.security.jwt;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenValidityInMilliseconds;
    private final long refreshTokenValidityInMilliseconds;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration-period}") long accessTokenValidityInMilliseconds,
            @Value("${jwt.refresh-token-expiration-period}") long refreshTokenValidityInMilliseconds){

        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenValidityInMilliseconds = accessTokenValidityInMilliseconds;
        this.refreshTokenValidityInMilliseconds = refreshTokenValidityInMilliseconds;
    }

    //Access Token 생성
    public String createAccessToken(Long userId, String email) {
        return createToken(userId, email, accessTokenValidityInMilliseconds);
    }

    // Refresh Token 생성
    public String createRefreshToken(Long userId, String email) {
        return createToken(userId, email, refreshTokenValidityInMilliseconds);
    }

    private String createToken(Long userId, String email, long validity) {
        Date now = new Date();
        Date validityDate = new Date(now.getTime() + validity);

        return Jwts.builder()
                .subject(email) // 식별자
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(validityDate)
                .signWith(key) // 알고리즘 자동 선택 (HS256 등)
                .compact();
    }
    // 토큰에서 이메일 추출
    public String getEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();

    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Long getUserId(String token){
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("userId", Long.class);
    }
}
