package com.example.DuckDuck.domain.client.openvidu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OpenViduConnectionCreateResponse {

    @JsonProperty("id")
    private String connectionId;

    @JsonProperty("token")
    private String token;

    public OpenViduConnectionCreateResponse() {}

    public String getConnectionId() {
        return connectionId;
    }

    public void setConnectionId(String connectionId) {
        this.connectionId = connectionId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
