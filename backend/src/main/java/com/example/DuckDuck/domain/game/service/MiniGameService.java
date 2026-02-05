package com.example.DuckDuck.domain.game.service;

import com.example.DuckDuck.domain.game.dto.response.ReviewQuestionResponse;
import com.example.DuckDuck.domain.game.dto.request.ReviewSubmitRequest;
import com.example.DuckDuck.domain.game.dto.response.ReviewRankingResponse;
import com.example.DuckDuck.domain.game.dto.response.ReviewSubmitResponse;
import com.example.DuckDuck.domain.room.repository.RoomParticipantsRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.example.DuckDuck.domain.user.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MiniGameService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MemberRepository memberRepository;
    private final ProfileRepository profileRepository;
    private final RoomParticipantsRepository roomParticipantsRepository;

    // ========== 수정 : 방 단위 문제 생성 + 유효한 문제만 필터링 ==========
    public List<ReviewQuestionResponse> getReviewQuestions(Long userId, Long roomId){

        // 변경: 유저별 키 → 방 단위 키
        String roomQuestionsKey = "room:" + roomId + ":review:questions";

        //이미 방에 생성된 문제가 있는지 확인 (모든 참가자가 같은 문제)
        List<Object> savedKeys = redisTemplate.opsForList().range(roomQuestionsKey, 0, -1);

        if (savedKeys != null && !savedKeys.isEmpty()){
            return fetchQuestionsByKeys(savedKeys);
        }

        //저장된 문제가 없다면 새로 뽑기 -> 모든 turn의 모든 script키를 가져옴
        String pattern = "room:" + roomId + ":turn:*:script:*";
        Set<String> allScriptKeys = redisTemplate.keys(pattern);

        if(allScriptKeys == null || allScriptKeys.isEmpty()){
            return Collections.emptyList();
        }

        // 변경: 먼저 유효한 문제만 필터링 후 4개 선택
        List<ReviewQuestionResponse> allValidQuestions = new ArrayList<>();

        for (String key : allScriptKeys) {
            if (key.endsWith(":scores")) {
                continue;
            }

            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);

            // 빈 데이터 필터링
            if (data.isEmpty() ||
                    data.get("korean") == null ||
                    data.get("english") == null ||
                    data.get("blank_script") == null) {
                continue;
            }

            String blankScript = (String) data.get("blank_script");

            // 빈칸이 없는 문제 제외
            if (!blankScript.contains("[") || !blankScript.contains("]")) {
                continue;
            }

            allValidQuestions.add(ReviewQuestionResponse.builder()
                    .scriptId(key.substring(key.lastIndexOf(":") + 1))
                    .korean((String) data.get("korean"))
                    .english((String) data.get("english"))
                    .blank_script(blankScript)
                    .build());
        }

        if (allValidQuestions.isEmpty()) {
            return Collections.emptyList();
        }

        // 유효한 문제 중에서 랜덤 4개 선택
        Collections.shuffle(allValidQuestions);
        int selectCount = Math.min(4, allValidQuestions.size());
        List<ReviewQuestionResponse> selectedQuestions = allValidQuestions.subList(0, selectCount);

        // 선택된 문제의 키를 방 단위로 저장
        List<String> selectedKeys = selectedQuestions.stream()
                .map(q -> {
                    for (String key : allScriptKeys) {
                        if (key.endsWith(":" + q.getScriptId())) {
                            return key;
                        }
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        //추출된 키를 방 단위 키에 저장
        redisTemplate.opsForList().rightPushAll(roomQuestionsKey, selectedKeys.toArray());
        //10분 뒤 만료
        redisTemplate.expire(roomQuestionsKey, Duration.ofMinutes(10));

        return selectedQuestions;
    }
    // ========== 수정 끝 ==========

    //키 리스트를 받아 실제 데이터(hash)를 조회하는 공통 메서드
    private List<ReviewQuestionResponse> fetchQuestionsByKeys(List<Object> keys){
        List<ReviewQuestionResponse> questions = new ArrayList<>();

        for(Object keyObj : keys){
            String key = (String) keyObj;

            // "scores" 키 필터링 추가
            if (key.endsWith(":scores")) {
                continue;
            }
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);

            // 빈 데이터 필터링
            if (data.isEmpty() ||
                    data.get("korean") == null ||
                    data.get("english") == null ||
                    data.get("blank_script") == null) {
                continue;
            }

            questions.add(ReviewQuestionResponse.builder()
                    .scriptId(key.substring(key.lastIndexOf(":") + 1))
                    .korean((String) data.get("korean"))
                    .english((String) data.get("english"))
                    .blank_script((String) data.get("blank_script"))
                    .build());

        }
        return questions;
    }

    public ReviewSubmitResponse submitReviewAnswers(Long userId, Long roomId, ReviewSubmitRequest request) {
        int correctCount = 0;
        int totalQuestions = request.getAnswers().size();

        // 1. 변경: 방 단위 문제 키 리스트를 가져옴
        String roomQuestionsKey = "room:" + roomId + ":review:questions";
        List<Object> assignedKeys = redisTemplate.opsForList().range(roomQuestionsKey, 0, -1);

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

    // ========== 수정 : 전체 참가자 포함 ==========
    @Transactional
    public List<ReviewRankingResponse> getReviewRanking(Long userId, Long roomId) {
        // 1. Room의 전체 참가자 조회
        List<Member> allParticipants = roomParticipantsRepository.findMembersByRoomId(roomId);

        if (allParticipants.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Redis에서 복습 게임 점수 데이터 조회
        String scoreKey = "room:" + roomId + ":review:scores";
        Map<Object, Object> scores = redisTemplate.opsForHash().entries(scoreKey);

        // 3. ✅ 추가: 제출 완료 플래그 조회
        String submittedKey = "room:" + roomId + ":review:submitted";
        Map<Object, Object> submitted = redisTemplate.opsForHash().entries(submittedKey);

        // 4. 전체 참가자 기준으로 랭킹 생성
        List<ReviewRankingResponse> ranking = new ArrayList<>();

        for (Member member : allParticipants) {
            Long memberId = member.getId();
            String scoreStr = (String) scores.get(memberId.toString());
            String submittedStr = (String) submitted.get(memberId.toString());  // ← 이 줄 추가!

            // ✅ 제출 여부 확인
            boolean hasSubmitted = "true".equals(submittedStr);
            int score = scoreStr != null ? Integer.parseInt(scoreStr) : 0;

            ranking.add(ReviewRankingResponse.builder()
                    .userId(memberId)
                    .nickname(member.getNickname())
                    .profileImageUrl(member.getProfileImageUrl())
                    .score(score)
                    .isMe(memberId.equals(userId))
                    .hasSubmitted(hasSubmitted)  // ← 이 줄도 확인
                    .build());
        }

        // 4. 점수 높은 순(내림차순)으로 정렬
        ranking.sort(Comparator.comparing(ReviewRankingResponse::getScore).reversed());

        // 6. 코인 보상
        String rewardKey = "room:" + roomId + ":reward:completed";
        Boolean alreadyRewarded = redisTemplate.hasKey(rewardKey);

        if (Boolean.FALSE.equals(alreadyRewarded)) {
            rewardCoins(ranking);
            redisTemplate.opsForValue().set(rewardKey, "true", 1, TimeUnit.HOURS);
        }

        return ranking;
    }
    // ========== 수정 끝 ==========

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
        // 1. 방 단위 문제 리스트 삭제 (변경)
        String roomQuestionsKey = "room:" + roomId + ":review:questions";
        redisTemplate.delete(roomQuestionsKey);

        // 2. 복습 게임 점수 데이터 삭제
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

    //코인 지급 처리 메서드
    private void rewardCoins(List<ReviewRankingResponse> ranking) {

        // [조건 1] 참여자가 1명 이하이면 지급 안 함
        if (ranking.size() <= 1) return;

        // [조건 2] 1등 점수 확인 및 0점 제외
        int maxScore = ranking.get(0).getScore();
        if (maxScore <= 0) return;

        // 공동 1등에게 2코인 지급
        ranking.stream()
                .filter(r -> r.getScore() == maxScore)
                .forEach(r -> profileRepository.updateCoins(r.getUserId(), 2));

        // [조건 3] 2등 점수 확인 (1등보다 낮으면서 0보다 큰 점수)
        ranking.stream()
                .map(ReviewRankingResponse::getScore)
                .filter(score -> score < maxScore && score > 0)
                .findFirst()
                .ifPresent(secondScore -> {
                    // 공동 2등에게 1코인 지급
                    ranking.stream()
                            .filter(r -> r.getScore() == secondScore)
                            .forEach(r -> profileRepository.updateCoins(r.getUserId(), 1));
                });
    }

    // 기존 랭킹 리스트 생성 로직 (조회만 수행)
    public List<ReviewRankingResponse> getReviewRankingList(Long userId, Long roomId) {
        String scoreKey = "room:" + roomId + ":review:scores";
        Map<Object, Object> scores = redisTemplate.opsForHash().entries(scoreKey);

        if (scores.isEmpty()) return Collections.emptyList();

        List<Long> userIds = scores.keySet().stream()
                .map(id -> Long.parseLong(id.toString()))
                .collect(Collectors.toList());

        Map<Long, Member> memberMap = memberRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(Member::getId, m -> m));

        return scores.entrySet().stream()
                .map(entry -> {
                    Long entryUserId = Long.parseLong(entry.getKey().toString());
                    Member m = memberMap.get(entryUserId);
                    return ReviewRankingResponse.builder()
                            .userId(entryUserId)
                            .nickname(m != null ? m.getNickname() : "알 수 없음")
                            .profileImageUrl(m != null ? m.getProfileImageUrl() : null)
                            .score(Integer.parseInt(entry.getValue().toString()))
                            .isMe(entryUserId.equals(userId))
                            .build();
                })
                .sorted(Comparator.comparing(ReviewRankingResponse::getScore).reversed())
                .collect(Collectors.toList());
    }

    // 랭킹 리스트 변환 로직
    private List<ReviewRankingResponse> convertToRankingList(Map<Object, Object> scores, Long currentUserId) {
        List<Long> userIds = scores.keySet().stream()
                .map(id -> Long.parseLong(id.toString()))
                .collect(Collectors.toList());

        Map<Long, Member> memberMap = memberRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(Member::getId, m -> m));

        return scores.entrySet().stream()
                .map(entry -> {
                    Long uid = Long.parseLong(entry.getKey().toString());
                    int score = Integer.parseInt(entry.getValue().toString());
                    Member m = memberMap.get(uid);
                    return ReviewRankingResponse.builder()
                            .userId(uid)
                            .nickname(m != null ? m.getNickname() : "(알수없음)")
                            .profileImageUrl(m != null ? m.getProfileImageUrl() : null)
                            .score(score)
                            .isMe(uid.equals(currentUserId))
                            .build();
                })
                .sorted(Comparator.comparing(ReviewRankingResponse::getScore).reversed())
                .collect(Collectors.toList());
    }
}
