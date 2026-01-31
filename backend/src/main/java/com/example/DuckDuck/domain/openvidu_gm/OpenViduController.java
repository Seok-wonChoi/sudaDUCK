package com.example.DuckDuck.domain.openvidu_gm;

import io.openvidu.java.client.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.Principal;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/openvidu")
@CrossOrigin(originPatterns ="*")
public class OpenViduController {

    @Value("${OPENVIDU_URL}")
    private String OPENVIDU_URL;

    @Value("${OPENVIDU_SECRET}")
    private String OPENVIDU_SECRET;

    private OpenVidu openVidu;

    @PostConstruct
    public void init() {
        // 1. SSL 인증서 무시 설정 (개발용)
        // 브라우저에서는 "고급->이동"으로 뚫리지만 Java는 이게 없으면 에러가 납니다.
        TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() { return null; }
                    public void checkClientTrusted(X509Certificate[] certs, String authType) { }
                    public void checkServerTrusted(X509Certificate[] certs, String authType) { }
                }
        };

        try {
            SSLContext sc = SSLContext.getInstance("TLS");
            sc.init(null, trustAllCerts, new SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

            // 호스트네임 검증도 무시 (IP주소랑 도메인 달라도 통과)
            HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> true);
        } catch (Exception e) {
            System.err.println("SSL 설정 실패: " + e.getMessage());
        }

        // ★ 이 3줄을 추가해서 콘솔을 확인하세요! ★
        System.out.println("=========================================");
        System.out.println("🔥 현재 적용된 OpenVidu URL: " + OPENVIDU_URL);
        System.out.println("🔥 현재 적용된 Secret: " + OPENVIDU_SECRET);
        System.out.println("=========================================");


        // 2. OpenVidu 객체 생성
        this.openVidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

        System.out.println("✅ OpenVidu 연결 준비 완료: " + OPENVIDU_URL);
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
