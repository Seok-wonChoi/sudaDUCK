package com.example.DuckDuck.domain.game.service;

import com.example.DuckDuck.domain.game.dto.response.ReviewQuestionResponse;
import com.example.DuckDuck.domain.game.dto.request.ReviewSubmitRequest;
import com.example.DuckDuck.domain.game.dto.response.ReviewRankingResponse;
import com.example.DuckDuck.domain.game.dto.response.ReviewSubmitResponse;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MiniGameService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MemberRepository memberRepository;

    public List<ReviewQuestionResponse> getReviewQuestions(Long userId, Long roomId){

        String userReviewKey = "room:"+roomId+":review:user"+userId+":questions";

        //이미 이 유저를 위해 생성된 문제가 있는지 확인
        List<Object> savedKeys = redisTemplate.opsForList().range(userReviewKey, 0, -1);

        if (savedKeys != null && !savedKeys.isEmpty()){
            return fetchQuestionsByKeys(savedKeys);
        }

        //저장된 문제가 없다면 새로 뽑기 -> 모든 turn의 모든 script키를 가져옴
        String pattern = "room:" + roomId + ":turn:*:script:*";
        Set<String> allScriptKeys = redisTemplate.keys(pattern);

        if(allScriptKeys == null || allScriptKeys.isEmpty()){
            return Collections.emptyList();
        }

        //리스트 섞어서 랜덤 4개 추출
        List<String> shuffledKeys = new ArrayList<>(allScriptKeys);
        Collections.shuffle(shuffledKeys);
        List<String> selectedKeys = shuffledKeys.stream()
                .limit(4)
                .toList();

        //추출된 키를 유저 전용 키에 저장
        redisTemplate.opsForList().rightPushAll(userReviewKey, selectedKeys.toArray());
        //1시간 뒤 만료
        redisTemplate.expire(userReviewKey, Duration.ofMinutes(10));

        return fetchQuestionsByKeys(new ArrayList<>(selectedKeys));
    }

    //키 리스트를 받아 실제 데이터(hash)를 조회하는 공통 메서드
    private List<ReviewQuestionResponse> fetchQuestionsByKeys(List<Object> keys){
        List<ReviewQuestionResponse> questions = new ArrayList<>();

        for(Object keyObj : keys){
            String key = (String) keyObj;
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);

            if (!data.isEmpty()){
                questions.add(ReviewQuestionResponse.builder()
                        .scriptId(key.substring(key.lastIndexOf(":") + 1))
                        .korean((String) data.get("korean"))
                        .english((String) data.get("english"))
                        .blank_script((String) data.get("blank_script"))
                        .build());
            }
        }
        return questions;
    }

    public ReviewSubmitResponse submitReviewAnswers(Long userId, Long roomId, ReviewSubmitRequest request) {
        int correctCount = 0;
        int totalQuestions = request.getAnswers().size();

        // 1. 이미 유저에게 배정된 문제 키 리스트를 가져옴 (List 구조)
        String userReviewKey = "room:" + roomId + ":review:user" + userId + ":questions";
        List<Object> assignedKeys = redisTemplate.opsForList().range(userReviewKey, 0, -1);

        if (assignedKeys == null || assignedKeys.isEmpty()) {
            throw new RuntimeException("진행 중인 복습 게임 정보가 없습니다.");
        }

        // 2. 제출된 각 답변 채점
        for (ReviewSubmitRequest.AnswerItem item : request.getAnswers()) {
            // 배정된 키들 중 scriptId가 포함된 키를 찾음
            String targetKey = assignedKeys.stream()
                    .map(Object::toString)
                    .filter(key -> key.endsWith(":" + item.getScriptId()))
                    .findFirst()
                    .orElse(null);

            if (targetKey != null) {
                String blankScript = (String) redisTemplate.opsForHash().get(targetKey, "blank_script");

                if (blankScript != null && item.getUserAnswer() != null) {
                    List<String> correctWords = extractWordsInBrackets(blankScript);

                    // 정교한 비교를 위해 마침표 제거 및 소문자 변환 로직 추가
                    List<String> userWords = Arrays.stream(item.getUserAnswer().split("[,\\.]"))
                            .map(word -> word.replaceAll("[^a-zA-Z]", "").toLowerCase().trim())
                            .filter(word -> !word.isEmpty())
                            .collect(Collectors.toList());

                    if (correctWords.equals(userWords)) {
                        correctCount++;
                    }
                }
            }
        }

        // 3. 점수 저장
        String scoreKey = "room:" + roomId + ":review:scores";
        redisTemplate.opsForHash().put(scoreKey, userId.toString(), String.valueOf(correctCount));

        return ReviewSubmitResponse.builder()
                .correctCount(correctCount)
                .totalQuestions(totalQuestions)
                .message(getFeedbackMessage(correctCount))
                .build();
    }

    public List<ReviewRankingResponse> getReviewRanking(Long userId, Long roomId) {
        // 1. Redis에서 복습 게임 점수 데이터 조회 (userId -> score)
        String scoreKey = "room:" + roomId + ":review:scores";
        Map<Object, Object> scores = redisTemplate.opsForHash().entries(scoreKey);

        if (scores.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. 점수가 있는 유저 ID 리스트 추출 (Long 타입 변환)
        List<Long> userIds = scores.keySet().stream()
                .map(id -> Long.parseLong(id.toString()))
                .collect(Collectors.toList());

        // 3. DB에서 해당 유저들의 닉네임과 프로필 이미지 한 번에 조회
        List<Member> participants = memberRepository.findAllById(userIds);

        // 4. 조회를 위해 Map으로 변환 (Key: userId, Value: Member 객체)
        Map<Long, Member> memberMap = participants.stream()
                .collect(Collectors.toMap(Member::getId, member -> member));

        // 5. 점수 데이터와 멤버 정보 결합
        List<ReviewRankingResponse> ranking = new ArrayList<>();
        for (Map.Entry<Object, Object> entry : scores.entrySet()) {
            Long entryUserId = Long.parseLong(entry.getKey().toString());
            int score = Integer.parseInt(entry.getValue().toString());

            Member m = memberMap.get(entryUserId);

            ranking.add(ReviewRankingResponse.builder()
                    .nickname(m != null ? m.getNickname() : "알 수 없음")
                    .profileImageUrl(m != null ? m.getProfileImageUrl() : null)
                    .score(score)
                    .isMe(entryUserId.equals(userId))
                    .build());
        }

        // 6. 점수 높은 순(내림차순)으로 정렬
        return ranking.stream()
                .sorted(Comparator.comparing(ReviewRankingResponse::getScore).reversed())
                .collect(Collectors.toList());
    }

    private List<String> extractWordsInBrackets(String text) {
        List<String> words = new ArrayList<>();
        Pattern pattern = Pattern.compile("\\[(.*?)\\]");
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            // [ wonder ] -> wonder (알파벳만 추출, 공백/특수문자 제거)
            String word = matcher.group(1)
                    .replaceAll("[^a-zA-Z]", "") // 알파벳 아닌 것 제거
                    .toLowerCase()
                    .trim();

            if (!word.isEmpty()) {
                words.add(word);
            }
        }
        return words;
    }

    // 점수에 따른 간단한 피드백 메시지 생성
    private String getFeedbackMessage(int score) {
        if (score == 4) return "완벽해요! 모든 문제를 맞췄습니다.";
        if (score >= 2) return "훌륭합니다! 복습 효과가 좋네요.";
        return "조금 더 연습해볼까요? 화이팅!";
    }

    //redis 정보 삭제
    public void clearReviewData(Long roomId) {
        // 1. 유저별 문제 리스트 삭제 (room:roomId:review:user:*)
        String userQuestionsPattern = "room:" + roomId + ":review:user*";
        Set<String> questionKeys = redisTemplate.keys(userQuestionsPattern);
        if (questionKeys != null && !questionKeys.isEmpty()) {
            redisTemplate.delete(questionKeys);
        }

        // 2. 복습 게임 점수 데이터 삭제 (room:roomId:review:scores)
        String scoreKey = "room:" + roomId + ":review:scores";
        redisTemplate.delete(scoreKey);

        // 3. 게임이 완전히 끝났다면 스크립트 데이터도 삭제
        List<String> patterns = Arrays.asList(
                "room:" + roomId + ":turn:*",  // 개별 스크립트 (단수)
                "room:" + roomId + ":scripts"// 스크립트 묶음 (복수, 혹시 모를 대비)
        );
        for (String pattern : patterns) {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        }
    }
}
