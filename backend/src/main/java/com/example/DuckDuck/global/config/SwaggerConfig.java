package com.example.DuckDuck.global.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server; // ★ 에러 3번 해결 (Server 클래스)
import org.springframework.beans.factory.annotation.Value; // ★ 추가됨
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List; // ★ 에러 1번 해결 (List 인터페이스)

@Configuration
public class SwaggerConfig {

    // ★ 에러 2번 해결: YAML에서 값을 읽어올 변수를 선언해야 합니다!
    @Value("${custom.api-prefix}")
    private String apiPrefix;

    @Bean
    public OpenAPI openAPI() {
        String cookieAuth = "accessTokenCookie";
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(cookieAuth);
        SecurityScheme securityScheme = new SecurityScheme()
                .name("access_token")
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE);

        return new OpenAPI()
                // 이제 apiPrefix와 Server, List를 모두 사용할 수 있습니다.
                .servers(List.of(new Server().url(apiPrefix).description("DuckDuck Server")))
                .info(new Info()
                        .title("DuckDuck API 명세서")
                        .description("카카오 소셜 로그인 및 쿠키 기반 인증을 사용하는 API")
                        .version("v1.0.0"))
                .addSecurityItem(securityRequirement)
                .components(new Components().addSecuritySchemes(cookieAuth, securityScheme));
    }
}