package org.example.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 브라우저에서 /audio/123.wav로 접속하면
        // 서버 하드디스크의 storage/audio/123.wav 파일을 찾아줌
        registry.addResourceHandler("/audio/**")
                .addResourceLocations("file:storage/audio/");
    }
}