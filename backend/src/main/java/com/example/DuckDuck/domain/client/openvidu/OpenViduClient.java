package com.example.DuckDuck.domain.client.openvidu;

import com.example.DuckDuck.domain.client.openvidu.dto.OpenViduConnectionCreateResponse;
import com.example.DuckDuck.domain.client.openvidu.dto.OpenViduSessionCreateRequest;
import com.example.DuckDuck.domain.client.openvidu.dto.OpenViduSessionCreateResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class OpenViduClient {

    private final WebClient openViduWebClient;

    public OpenViduClient(WebClient openViduWebClient) {
        this.openViduWebClient = openViduWebClient;
    }

    /**
     * customSessionId로 세션 생성. 이미 존재하면(409) 정상으로 간주.
     */
    public void createSessionIfNotExists(String sessionId) {
        try {
            openViduWebClient.post()
                    .uri("/openvidu/api/sessions")
                    .bodyValue(new OpenViduSessionCreateRequest(sessionId))
                    .retrieve()
                    .bodyToMono(OpenViduSessionCreateResponse.class)
                    .block();
        } catch (WebClientResponseException e) {
            if (e.getStatusCode() == HttpStatus.CONFLICT) {
                // session already exists -> OK
                return;
            }
            throw e;
        }
    }

    /**
     * 세션에 connection 생성 -> token 반환
     */
    public OpenViduConnectionCreateResponse createConnection(String sessionId) {
        return openViduWebClient.post()
                .uri("/openvidu/api/sessions/{sessionId}/connection", sessionId)
                .retrieve()
                .bodyToMono(OpenViduConnectionCreateResponse.class)
                .block();
    }
}
