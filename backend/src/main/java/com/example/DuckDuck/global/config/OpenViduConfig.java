package com.example.DuckDuck.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class OpenViduConfig {

    @Value("${openvidu.url}")
    private String openViduUrl;

    @Value("${openvidu.secret}")
    private String openViduSecret;

    private static final String OPENVIDU_USERNAME = "OPENVIDUAPP";

    @Bean
    public WebClient openViduWebClient() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(10));

        return WebClient.builder()
                .baseUrl(openViduUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .filter(basicAuth(OPENVIDU_USERNAME, openViduSecret))
                .build();
    }

    private ExchangeFilterFunction basicAuth(String username, String password) {
        return ExchangeFilterFunction.ofRequestProcessor(req -> {
            return reactor.core.publisher.Mono.just(
                    org.springframework.web.reactive.function.client.ClientRequest.from(req)
                            .headers(headers -> headers.setBasicAuth(username, password))
                            .build()
            );
        });
    }
}
