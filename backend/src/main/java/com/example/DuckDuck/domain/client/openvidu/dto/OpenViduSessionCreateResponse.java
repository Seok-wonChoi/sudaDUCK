package com.example.DuckDuck.domain.client.openvidu.dto;

public class OpenViduSessionCreateResponse {

    // OpenVidu가 반환하는 값 중 일부(필요하면 확장)
    private String id;

    public OpenViduSessionCreateResponse() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
