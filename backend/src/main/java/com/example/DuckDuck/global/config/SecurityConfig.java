package com.example.DuckDuck.global.config;

import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import com.example.DuckDuck.global.security.jwt.JwtAuthenticationFilter;
import com.example.DuckDuck.global.security.oauth.CustomOAuth2UserService;
import com.example.DuckDuck.global.security.oauth.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception{
        http
                //CSRF 및 Form Login 비활성화
                //cors설정
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                //Stateless 설정
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                //요청 권한 설정
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll() //swagger 관련 주소 모두 허용
                        .requestMatchers(
                                "/api/v1/auth/**", "/oauth2/**", "/login/**").permitAll() // 로그인 관련은 모두 허용
                        .anyRequest().authenticated() // 그 외 나머지는 인증 필요
                )

                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )

                //jwt 필터 추가
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class);



        return http.build();
    }
    //cors설정을 위한 bean
    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용할 프론트엔드 도메인 (주의: 쿠키 사용 시 "*"는 절대 안 됨)
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));

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
