package org.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    // RestTemplate을 스프링 컨테이너에 등록합니다.
    // 이제 GptService에서 이 Bean을 주입받을 수 있게 됩니다.
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}