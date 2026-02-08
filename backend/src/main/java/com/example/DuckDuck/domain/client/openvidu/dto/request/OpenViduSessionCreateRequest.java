package com.example.DuckDuck.domain.client.openvidu.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OpenViduSessionCreateRequest {

    @JsonProperty("customSessionId")
    private String customSessionId;

    public OpenViduSessionCreateRequest() {}

    public OpenViduSessionCreateRequest(String customSessionId) {
        this.customSessionId = customSessionId;
    }

    public String getCustomSessionId() {
        return customSessionId;
    }

    public void setCustomSessionId(String customSessionId) {
        this.customSessionId = customSessionId;
    }
}
