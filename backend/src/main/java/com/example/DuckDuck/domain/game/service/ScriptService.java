package com.example.DuckDuck.domain.game.service;

import com.example.DuckDuck.domain.game.entity.Sentence;
import com.example.DuckDuck.domain.game.repository.ScriptRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ScriptService {

    private final StringRedisTemplate redisTemplate;
    private final ScriptRepository scriptRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public void likeSentence(String email, Long roomId, int turnNo, String scriptId){

        String redisKey = String.format("room:%d:turn:%d:script:%s", roomId, turnNo, scriptId);
        Map<Object, Object> data = redisTemplate.opsForHash().entries(redisKey);

        if(data.isEmpty()){
            throw new RuntimeException("해당 스크립트가 존재하지 않거나 이미 만료되었습니다.");
        }
        //좋아요 누른 유저 객체 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(()-> new RuntimeException("존재하지 않는 사용자입니다."));

        LocalDateTime createdAt = LocalDateTime.parse((String) data.get("created_at"));

        //MySql Entity로 변환
        Sentence sentence = Sentence.builder()
                .sentenceId(member.getId() + "_" + scriptId)
                .user(member)
                .speakerName((String) data.get("speaker_name"))
                .englishSentence((String) data.get("english"))
                .koreanSentence((String) data.get("korean"))
                .score(Integer.parseInt((String)data.get("score")))
                .topic((String) data.get("topic"))
                .participantList("temp_list")
                .createdAt(createdAt)
                .build();

        scriptRepository.save(sentence);
    }
}
