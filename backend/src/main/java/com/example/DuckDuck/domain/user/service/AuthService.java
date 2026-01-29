package com.example.DuckDuck.domain.user.service;

import com.example.DuckDuck.domain.user.dto.request.TestSignupRequest;
import com.example.DuckDuck.domain.user.dto.request.TokenDto;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.entity.Profile;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.example.DuckDuck.domain.user.repository.ProfileRepository;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final StringRedisTemplate redisTemplate;
    private final ProfileRepository profileRepository;

    private static final String DEFAULT_DUCK_JSON =
            "{\"v\":1,\"color\":\"YELLOW\",\"accessory\":\"NONE\"}";

    private static final String DEFAULT_AVATAR_JSON =
            "{\"v\":1,\"bgStyle\":\"BASIC_WHITE\",\"effect\":\"NONE\"}";

    private static final int DEFAULT_COINS = 0;


    @Transactional
    public Member testSignup(TestSignupRequest request){
        if (memberRepository.existsById(request.getUserId())){
            throw new RuntimeException("이미 존재하는 ID입니다.");
        }

        Member newMember = Member.builder()
                .id(request.getUserId())
                .email(request.getEmail())
                .name(request.getName())
                .nickname(request.getName())
                .isActive(true)
                .build();

        memberRepository.save(newMember);

        ensureProfile(newMember.getId());

        return newMember;
    }


    @Transactional
    public TokenDto login(Long userId, String email){
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("DB에 유저가 없습니다."));

        if(!member.getEmail().equals(email)){
            throw new RuntimeException("이메일 정보가 일치하지 않습니다.");
        }

        ensureProfile(member.getId());

        // 1. Access Token 생성
        String accessToken = jwtTokenProvider.createAccessToken(
                member.getId(),
                member.getEmail()
        );

        String refreshToken = jwtTokenProvider.createRefreshToken(
                member.getId(),
                member.getEmail()
        );

        //redis에 Refresh Token 저장
        //만료 시간을 리프레쉬 토큰 수명과 동일하게 설정
        redisTemplate.opsForValue().set(
                "RT:" + email,
                refreshToken,
                Duration.ofDays(14)
        );

        return new TokenDto(accessToken, refreshToken);
    }

    @Transactional
    public void logout(String email){
        redisTemplate.delete("RT:" + email);
    }

    @Transactional
    public String refresh(String refreshToken){
        //토큰 유효성 검증
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)){
            throw new RuntimeException("리프레시 토큰이 유효하지 않습니다.");
        }

        //토큰에서 이메일 추출
        String email = jwtTokenProvider.getEmail(refreshToken);

        //redis에 저장된 토큰과 일치
        String savedRefreshToken = redisTemplate.opsForValue().get("RT:"+ email);
        if (savedRefreshToken == null || !savedRefreshToken.equals(refreshToken)){
            throw new RuntimeException("중복 로그인으로 인해 기존 세션이 만료되었습니다.");
        }

        //새 토큰들 발급
        Member member =memberRepository.findByEmail(email)
                .orElseThrow(()-> new RuntimeException("유저를 찾을 수 없습니다."));

        return jwtTokenProvider.createAccessToken(member.getId(), member.getEmail());

    }

    @Transactional
    public void ensureProfile(Long userId) {
        if (profileRepository.existsById(userId)) return;

        Member memberRef = memberRepository.getReferenceById(userId);

        Profile profile = Profile.builder()
                .user(memberRef)
                .coins(DEFAULT_COINS)
                .attendanceDays(0)
                .duckCustomJson(DEFAULT_DUCK_JSON)
                .avatarCustomJson(DEFAULT_AVATAR_JSON)
                .lastLoginAt(LocalDateTime.now())
                .totalTime(0)
                .build();

        profileRepository.save(profile);
    }
}
