package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.entity.Profile;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.example.DuckDuck.domain.user.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final MemberRepository memberRepository;

    private static final String DEFAULT_DUCK_JSON =
            "{\"v\":1,\"style\":\"profile1\",\"color\":\"white\",\"accessory\":\"none\"}";

    private static final String DEFAULT_AVATAR_JSON =
            "{\"v\":1,\"bgStyle\":\"default\",\"effect\":\"none\"}";

    private static final String DEFAULT_AI_DUCKBOT_JSON =
            "{\"v\":1,\"model\":\"cyan\"}";

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 카카오로부터 유저 정보를 가져옴
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2. 카카오 데이터 파싱
        Map<String, Object> attributes = oAuth2User.getAttributes();
        Long kakaoId = (Long) attributes.get("id");

        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        Map<String, Object> profileMap = (Map<String, Object>) kakaoAccount.get("profile");

        String email = (String) kakaoAccount.get("email");

        if ( email == null){
            throw new RuntimeException("카카오 이메일 정보를 불러올 수 없습니다.");
        }

        String name = (String) profileMap.get("nickname");
        String nickname = (String) profileMap.get("nickname");
        String profileImageUrl = (String) profileMap.get("profile_image_url");

        // 3. 유저 정보 저장 또는 업데이트 (Upsert)
        saveOrUpdateUser(kakaoId, email, name,nickname, profileImageUrl);

        return oAuth2User;
    }

    private void saveOrUpdateUser(Long kakaoId, String email, String name, String nickname, String imageUrl) {
        Optional<Member> memberOptional = memberRepository.findById(kakaoId);

        if (memberOptional.isPresent()) {
            // ===== 기존 회원 =====
            Member member = memberOptional.get();

            member.setUpdatedAt(LocalDateTime.now());
            member.setProfileImageUrl(imageUrl);

            Profile profile = member.getProfile();

            if (profile == null) {
                profile = Profile.builder()
                        .user(member)
                        .coins(0)
                        .attendanceDays(0)
                        .duckCustomJson(DEFAULT_DUCK_JSON)
                        .avatarCustomJson(DEFAULT_AVATAR_JSON)
                        .aiDuckbotCustomJson(DEFAULT_AI_DUCKBOT_JSON)
                        .lastLoginAt(LocalDateTime.now())
                        .totalTime(0)
                        .build();
                member.setProfile(profile);
            } else {
                if (profile.getDuckCustomJson() == null) {
                    profile.setDuckCustomJson(DEFAULT_DUCK_JSON);
                }
                if (profile.getAvatarCustomJson() == null) {
                    profile.setAvatarCustomJson(DEFAULT_AVATAR_JSON);
                }
                if (profile.getAiDuckbotCustomJson() == null) {
                    profile.setAiDuckbotCustomJson(DEFAULT_AI_DUCKBOT_JSON);
                }
                profile.setLastLoginAt(LocalDateTime.now());
            }

        } else {
            // ===== 신규 카카오 회원 =====
            Member newMember = Member.builder()
                    .id(kakaoId)
                    .email(email)
                    .name(name)
                    .nickname(nickname)
                    .profileImageUrl(imageUrl)
                    .isActive(true)
                    .build();

            Profile newProfile = Profile.builder()
                    .user(newMember)
                    .coins(0)
                    .attendanceDays(0)
                    .duckCustomJson(DEFAULT_DUCK_JSON)
                    .avatarCustomJson(DEFAULT_AVATAR_JSON)
                    .aiDuckbotCustomJson(DEFAULT_AI_DUCKBOT_JSON)
                    .lastLoginAt(LocalDateTime.now())
                    .totalTime(0)
                    .build();

            newMember.setProfile(newProfile);
            memberRepository.save(newMember);
        }
    }
}
