package com.example.DuckDuck.global.config;

import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import com.example.DuckDuck.global.security.jwt.JwtAuthenticationFilter;
import com.example.DuckDuck.global.security.oauth.CustomOAuth2UserService;
import com.example.DuckDuck.global.security.oauth.OAuth2SuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final StringRedisTemplate redisTemplate;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // 모든 요청에 대해 인증 없이 접근 허용
                );
        return http.build();
    }
    //cors설정을 위한 bean
    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용할 프론트엔드 도메인 (주의: 쿠키 사용 시 "*"는 절대 안 됨)
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",          // 로컬 테스트용 (Vue 기본 포트 예시)
                "http://192.168.30.196:5173",       // 확인하신 실제 내 IP 주소
                "http://127.0.0.1:5173",
                "https://i14e104.p.ssafy.io",    // ✅ 추가: HTTPS 도메인
                "http://i14e104.p.ssafy.io"
        ));

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // 허용할 헤더
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));

        // 쿠키 및 자격 증명 허용 (가장 중요!)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",configuration);
        return source;

    }
}
