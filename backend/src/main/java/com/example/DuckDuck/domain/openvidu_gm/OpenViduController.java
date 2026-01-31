package com.example.DuckDuck.domain.openvidu_gm;

import io.openvidu.java.client.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/openvidu")
@CrossOrigin(originPatterns ="*")
public class OpenViduController {

    @Value("${OPENVIDU_URL}")
    private String OPENVIDU_URL;

    @Value("${OPENVIDU_URL}")
    private String OPENVIDU_SECRET;

    private OpenVidu openVidu;

    @PostConstruct
    public void init() {
        this.openVidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
    }

    /**
     * 1. 세션(방) 생성하기
     */
    @PostMapping("/sessions")
    public ResponseEntity<String> initializeSession(@RequestBody(required = false)Map<String, Object> params)
        throws OpenViduJavaClientException, OpenViduHttpException {

        //params가 null일 경우를 대비해 빈 맵을 초기화
        SessionProperties properties = SessionProperties.fromJson(params).build();
        Session session = openVidu.createSession(properties);

        return new ResponseEntity<>(session.getSessionId(), HttpStatus.OK);
    }
    /**
     * 2. 커넥션(토큰) 생성하기 -
     * JWT 토큰을 통해 인증된 사용자 정보(Principal)를 가져옴.
     */
    @PostMapping("/sessions/{sessionId}/connections")
    public ResponseEntity<String> createConnection(@PathVariable("sessionId") String sessionId,
                                                   @RequestBody(required = false) Map<String, Object> params,
                                                   Principal principal)
        throws OpenViduJavaClientException, OpenViduHttpException {

        Session session = openVidu.getActiveSession(sessionId);
        if(session == null){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        String username = (principal != null) ? principal.getName() : "Anonymous";

        //openvidu 연결 정보에 사용자 이름 심어주기
        ConnectionProperties properties = new ConnectionProperties.Builder()
                .data(username)
                .build();

        Connection connection = session.createConnection(properties);

        return new ResponseEntity<>(connection.getToken(), HttpStatus.OK);
    }
}
