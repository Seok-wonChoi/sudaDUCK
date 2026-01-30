package com.example.DuckDuck.domain.game.service;

import com.example.DuckDuck.domain.game.dto.response.ReviewQuestionResponse;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.text.Collator;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MiniGameService {

    private final RedisTemplate<String, Object> redisTemplate;

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
                        .blank_scripts((String) data.get("blank_scripts"))
                        .build());
            }
        }
        return questions;
    }
}
