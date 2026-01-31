package com.example.DuckDuck.domain.game.service;

import com.example.DuckDuck.domain.game.dto.response.MySentenceResponse;
import com.example.DuckDuck.domain.game.entity.Sentence;
import com.example.DuckDuck.domain.game.repository.ScriptRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScriptService {

    private final StringRedisTemplate redisTemplate;
    private final ScriptRepository scriptRepository;
    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;

    //스크립트 좋아요 + 취소
    @Transactional
    public Map<String, Object> likeSentence(Long userId, Long roomId, int turnNo, String scriptId){

        //좋아요 누른 유저 객체 조회
        Member member = memberRepository.findById(userId)
                .orElseThrow(()-> new RuntimeException("존재하지 않는 사용자입니다."));

        String sentenceId = member.getId() + "_" + scriptId;
        Optional<Sentence> existingSentence = scriptRepository.findById(sentenceId);

        //이미 있다면 좋아요 취소
        if(existingSentence.isPresent()){
            scriptRepository.delete(existingSentence.get());
            return Map.of("message", "좋아요가 취소되었습니다.", "isLiked", false);
        }
        String redisKey = String.format("room:%d:turn:%d:script:%s", roomId, turnNo, scriptId);
        Map<Object, Object> data = redisTemplate.opsForHash().entries(redisKey);

        if(data.isEmpty()){
            throw new RuntimeException("해당 스크립트가 존재하지 않거나 이미 만료되었습니다.");
        }

        String speakerId = (String) data.get("speaker_id");
        String realSpeakerName = (String) redisTemplate.opsForHash().get("room:" + roomId + ":member", speakerId);

        if(realSpeakerName == null){
            realSpeakerName = (String) data.getOrDefault("speaker_name","Unknown");
        }

        LocalDateTime createdAt = LocalDateTime.parse((String) data.get("created_at"));

        //참여자 리스트 json 전처리
        String rawParticipants = (String) data.get("participants");
        String cleanParticipants = "";
        if (rawParticipants != null){
            cleanParticipants = rawParticipants.trim().replace("\u0000", "");
        }


        //MySql Entity로 변환
        Sentence sentence = Sentence.builder()
                .sentenceId(sentenceId)
                .user(member)
                .speakerName(realSpeakerName)
                .englishSentence((String) data.get("english"))
                .koreanSentence((String) data.get("korean"))
                .score(Integer.parseInt((String)data.get("score")))
                .topic((String) data.get("topic"))
                .participantList(cleanParticipants)
                .createdAt(createdAt)
                .build();

        scriptRepository.save(sentence);
        return Map.of("message", "나의 문장장에 저장되었습니다.", "isLiked", true);
    }

    //스크립트 조회
    @Transactional(readOnly = true)
    public List<MySentenceResponse> getMySentences(String email){
        List<Sentence> sentences = scriptRepository.findAllByUserEmailOrderByCreatedAtDesc(email);

        return sentences.stream().map( s-> {
            List<String> participantList;
            try{
                String jsonStr = s.getParticipantList(); // 1. DB에서 꺼낸 원본 문자열 확인
                log.info("DB 원본 데이터: [{}]", jsonStr);

                if (jsonStr == null || jsonStr.isBlank()) {
                    participantList = List.of();
                } else {
                    participantList = objectMapper.readValue(jsonStr, new TypeReference<List<String>>() {});
                }
            } catch(Exception e){
                // 2. 정확히 어떤 에러인지 로그에 찍기
                log.error("JSON 파싱 에러! 데이터: {}, 원인: {}", s.getParticipantList(), e.getMessage());
                participantList = List.of();
            }
            return MySentenceResponse.builder()
                    .sentenceId(s.getSentenceId())
                    .englishSentence(s.getEnglishSentence())
                    .koreanSentence(s.getKoreanSentence())
                    .score(s.getScore())
                    .topic(s.getTopic())
                    .speakerName(s.getSpeakerName())
                    .participants(participantList)
                    .createdAt(s.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }
}
