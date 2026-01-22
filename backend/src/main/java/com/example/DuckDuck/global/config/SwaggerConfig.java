package com.example.DuckDuck.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI openAPI() {
        // 쿠키 기반 인증을 위한 설정 (Swagger UI에서 인증 상태를 유지하기 위함)
        String cookieAuth = "accessTokenCookie";
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(cookieAuth);
        SecurityScheme securityScheme = new SecurityScheme()
                .name("access_token") // 우리가 사용하는 쿠키 이름
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE);

        return new OpenAPI()
                .info(new Info()
                        .title("DuckDuck API 명세서")
                        .description("카카오 소셜 로그인 및 쿠키 기반 인증을 사용하는 API")
                        .version("v1.0.0"))
                .addSecurityItem(securityRequirement)
                .components(new Components().addSecuritySchemes(cookieAuth, securityScheme));
    }
}
