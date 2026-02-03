package com.example.DuckDuck.domain.game.service;

import com.example.DuckDuck.domain.game.dto.response.ScriptResponse;
import com.example.DuckDuck.domain.game.dto.response.SessionResultResponse;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    public List<ScriptResponse> getScriptsByTurn(Long userId, Long roomId, Integer turnNo) {

        // 해당 방의 맴버 정보를 먼저 가져옴
        String memberKey = "room:" + roomId + ":member";
        Map<Object, Object> memberMap = redisTemplate.opsForHash().entries(memberKey);

        String pattern = "room:" + roomId + ":turn:" + turnNo + ":script:*";
        Set<String> keys = redisTemplate.keys(pattern);

        if (keys == null || keys.isEmpty()) {
            return Collections.emptyList();
        }

        List<ScriptResponse> responses = new ArrayList<>();

        for (String key : keys) {
            // key에서 scriptId 추출
            String scriptId = key.substring(key.lastIndexOf(":") + 1);

            // Hash 구조이므로 entries()를 사용하여 Map으로 가져옴
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);

            if (!entries.isEmpty()) {
                String speakerId = entries.get("speaker_id").toString();

                //memberMap에서 해당 이름 찾기
                String speakerName = (String) memberMap.getOrDefault(speakerId, "Unknown");

                responses.add(ScriptResponse.builder()
                        // Redis CLI 결과에 맞게 필드 매핑 (String으로 변환 후 처리)
                        .order_no(Integer.parseInt(entries.get("order_no").toString()))
                        .scriptId(scriptId)
                        .speakerName(speakerName)
                        .english((String) entries.get("english"))
                        .korean((String) entries.get("korean"))
                        .blank_script((String) entries.get("blank_script"))
                        .tts_url((String) entries.get("tts_url"))
                        .build());
            }
        }

        return responses.stream()
                .sorted(Comparator.comparing(ScriptResponse::getOrder_no))
                .collect(Collectors.toList());

    }

    //세션 별 report 화면 결과 내용 조회
    public List<SessionResultResponse> getSessionResults(Long roomId, Integer turnNo, Long userId) {

        // 1. 방 멤버 정보 가져오기 (이름 매핑용)
        String memberKey = String.format("room:%d:member", roomId);
        Map<Object, Object> memberMap = redisTemplate.opsForHash().entries(memberKey);

        // 2. 해당 세션의 스크립트 키들 검색 (ZSet 사용)
        String indexKey = String.format("room:%d:turn:%d:scripts", roomId, turnNo);

        // [수정 포인트] Set<String>이 아니라 Set<Object>로 받음 (RedisTemplate 타입 문제 해결)
        Set<Object> scriptIds = redisTemplate.opsForZSet().range(indexKey, 0, -1);

        if (scriptIds == null || scriptIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<SessionResultResponse> results = new ArrayList<>();

        // [수정 포인트] Object로 루프를 돌면서 내부에서 String으로 변환
        for (Object idObj : scriptIds) {
            String scriptId = idObj.toString(); // 여기서 변환

            // 3. 스크립트 상세 내용 가져오기
            String detailKey = String.format("room:%d:turn:%d:script:%s", roomId, turnNo, scriptId);
            Map<Object, Object> data = redisTemplate.opsForHash().entries(detailKey);

            // 4. 점수 정보(별도 Hash) 가져오기
            String userScoreKey = detailKey + ":scores";
            Map<Object, Object> scoreMap = redisTemplate.opsForHash().entries(userScoreKey);

            if (!data.isEmpty()) {
                // (A) 평균 점수 계산
                double avgScore = 0.0;
                if (!scoreMap.isEmpty()) {
                    double totalSum = scoreMap.values().stream()
                            .mapToDouble(this::parseDouble) // 안전한 파싱 헬퍼 사용
                            .sum();
                    avgScore = totalSum / scoreMap.size();
                }

                // (B) 내 점수 찾기 (내 점수가 없으면 0.0)
                double myScore = 0.0;
                String userIdStr = String.valueOf(userId);
                if (scoreMap.containsKey(userIdStr)) {
                    myScore = parseDouble(scoreMap.get(userIdStr));
                }

                // (C) 발화자 이름 찾기
                String speakId = String.valueOf(data.getOrDefault("speaker_id", ""));
                String speakerName = (String) memberMap.getOrDefault(speakId, "Unknown");

                // (D) 결과 리스트 추가 (NPE 방지 적용)
                results.add(SessionResultResponse.builder()
                        .order_no(parseInteger(data.get("order_no")))
                        .scriptId(scriptId) // 프론트 북마크용 필수 ID
                        .speakerName(speakerName)
                        .english((String) data.getOrDefault("english", ""))
                        .korean((String) data.getOrDefault("korean", ""))
                        .blank_script((String) data.getOrDefault("blank_script", ""))
                        .score(myScore) // '내 점수' 반환
                        .averageScore(Math.round(avgScore * 10.0) / 10.0)
                        .build());
            }
        }

        // 5. 순서대로 정렬하여 반환
        return results.stream()
                .sorted(Comparator.comparing(SessionResultResponse::getOrder_no))
                .collect(Collectors.toList());
    }

// ==========================================
// [필수 추가] NPE 및 형변환 에러 방지용 헬퍼 메서드
// ==========================================

    private Integer parseInteger(Object value) {
        if (value == null) return 0;
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private Double parseDouble(Object value) {
        if (value == null) return 0.0;
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
