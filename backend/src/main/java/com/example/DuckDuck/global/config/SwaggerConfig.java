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

    // ★ 핵심: 콜론(:)을 붙여서 값이 없을 경우 빈 문자열("")을 기본값으로 쓰게 합니다.
    @Value("${custom.api-prefix:}")
    private String apiPrefix;

    @Bean
    public OpenAPI openAPI() {
        String cookieAuth = "accessTokenCookie";
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(cookieAuth);
        SecurityScheme securityScheme = new SecurityScheme()
                .name("access_token")
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE);

        // ★ 서버 URL 결정 로직
        // apiPrefix가 비어있으면 로컬("/")로, 값이 있으면 해당 값("/dev-api")으로 설정
        String serverUrl = (apiPrefix == null || apiPrefix.isBlank()) ? "/" : apiPrefix;

        return new OpenAPI()
                .servers(List.of(new Server().url(serverUrl).description("DuckDuck Server")))
                .info(new Info()
                        .title("DuckDuck API 명세서")
                        .description("환경별 API 프리픽스를 자동 적용하는 명세서입니다.")
                        .version("v1.0.0"))
                .addSecurityItem(securityRequirement)
                .components(new Components().addSecuritySchemes(cookieAuth, securityScheme));
    }
}