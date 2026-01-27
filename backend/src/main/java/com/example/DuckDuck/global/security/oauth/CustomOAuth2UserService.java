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

//        String name = (String) kakaoAccount.get("name");
        String name = "test";
        String nickname = (String) profileMap.get("nickname");
        String profileImageUrl = (String) profileMap.get("profile_image_url");

        // 3. 유저 정보 저장 또는 업데이트 (Upsert)
        saveOrUpdateUser(kakaoId, email, name,nickname, profileImageUrl);

        return oAuth2User;
    }

    private void saveOrUpdateUser(Long kakaoId, String email, String name, String nickname, String imageUrl) {
        //기존 회원 확인
        Optional<Member> memberOptional = memberRepository.findById(kakaoId);

        if (memberOptional.isPresent()){
            //기존 회원이면 정보 업데이트
            Member member = memberOptional.get();
            member.setName(name);
            member.setNickname(nickname);
            member.setProfileImageUrl(imageUrl);
            member.setUpdatedAt(LocalDateTime.now());

            if(member.getProfile() != null){
                member.getProfile().setLastLoginAt(LocalDateTime.now());
            }
        } else {
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
                    .lastLoginAt(LocalDateTime.now())
                    .build();

            newMember.setProfile(newProfile);
            memberRepository.save(newMember);
        }
    }
}
