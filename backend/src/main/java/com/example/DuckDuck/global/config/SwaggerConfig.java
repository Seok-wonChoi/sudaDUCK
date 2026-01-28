package com.example.DuckDuck.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${custom.api-prefix:}")
    private String apiPrefix;

    @Bean
    public OpenAPI openAPI() {
        // 1. 보안 스키마 이름 정의
        String jwtAuth = "bearerAuth";
        String cookieAuth = "accessTokenCookie";

        // 2. 보안 요구사항 설정 (헤더와 쿠키 모두 등록)
        SecurityRequirement securityRequirement = new SecurityRequirement()
                .addList(jwtAuth)
                .addList(cookieAuth);

        // 3. 보안 스키마 정의 (Header 기반 JWT Bearer 추가)
        SecurityScheme jwtScheme = new SecurityScheme()
                .name(jwtAuth)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT");

        SecurityScheme cookieScheme = new SecurityScheme()
                .name("accessToken")
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE);

        String serverUrl = (apiPrefix == null || apiPrefix.isBlank()) ? "/" : apiPrefix;

        return new OpenAPI()
                .servers(List.of(new Server().url(serverUrl).description("DuckDuck Server")))
                .info(new Info()
                        .title("DuckDuck API 명세서")
                        .description("JWT 인증이 추가된 숙덕숙덕 API 명세서입니다.")
                        .version("v1.0.0"))
                .addSecurityItem(securityRequirement)
                .components(new Components()
                        .addSecuritySchemes(jwtAuth, jwtScheme)
                        .addSecuritySchemes(cookieAuth, cookieScheme));
    }
}