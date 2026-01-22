package com.example.DuckDuck.global.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        //헤더에서 토큰 추출
        String accessToken = CookieUtil.getCookie(request, "access_token")
                .map(Cookie::getValue)
                .orElse(null);

        String refreshToken = CookieUtil.getCookie(request, "refresh_token")
                .map(Cookie::getValue)
                .orElse(null);

        //토큰 유효성 검사
        if (accessToken != null && jwtTokenProvider.validateToken(accessToken)){
            String email = jwtTokenProvider.getEmail(accessToken);

            //다중 로그인 방지 핵심
            //Redis에 저장된 해당 유저의 최신 리프레시 토큰 가져옴
            String saveRefreshToken = redisTemplate.opsForValue().get("RT:"+email);

            //클라이언트의 리프레시 토큰과 redis의 토큰이 다르면 다른 기기에서 로그인한 것
            if (saveRefreshToken != null && !saveRefreshToken.equals(refreshToken)){
                //인증 거부 및 쿠키 삭제 처리 기능
                SecurityContextHolder.clearContext();

                CookieUtil.addCookie(response, "access_token", null, 0);
                CookieUtil.addCookie(response, "refresh_token", null, 0);

                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "다른 기기에서 로그인되어 로그아웃되었습니다.");
                return;
            }
            //인증 객체 생성
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(email, null, java.util.Collections.emptyList());

            //SecurityContext에 인증 정보 저장
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        filterChain.doFilter(request,response);
    }

    private String resolveToken(HttpServletRequest request){
        String bearerToken = request.getHeader("Authorization");
        if(bearerToken != null && bearerToken.startsWith("Bearer ")){
            return bearerToken.substring(7);
        }
        return null;
    }
}
