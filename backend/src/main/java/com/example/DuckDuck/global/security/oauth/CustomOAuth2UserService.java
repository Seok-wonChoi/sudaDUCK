package com.example.DuckDuck.global.security.oauth;

import com.example.DuckDuck.domain.user.entity.Profile;
import com.example.DuckDuck.domain.user.entity.User;
import com.example.DuckDuck.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

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
        String nickname = (String) profileMap.get("nickname");
        String profileImageUrl = (String) profileMap.get("profile_image_url");

        // 3. 유저 정보 저장 또는 업데이트 (Upsert)
        saveOrUpdateUser(kakaoId, email, nickname, profileImageUrl);

        return oAuth2User;
    }

    private void saveOrUpdateUser(Long kakaoId, String email, String nickname, String imageUrl) {
        userRepository.findById(kakaoId)
                .map(user -> {
                    // 이미 존재하는 유저라면 정보 업데이트
                    user.setNickname(nickname);
                    user.setProfileImageUrl(imageUrl);
                    return user;
                })
                .orElseGet(() -> {
                    // 신규 유저라면 User와 Profile을 함께 생성
                    User newUser = User.builder()
                            .id(kakaoId)
                            .email(email)
                            .nickname(nickname)
                            .profileImageUrl(imageUrl)
                            .isActive(true)
                            .build();

                    Profile newProfile = new Profile();
                    newProfile.setUser(newUser);
                    newProfile.setCreatedAt(LocalDateTime.now());
                    newProfile.setUpdatedAt(LocalDateTime.now());

                    newUser.setProfile(newProfile);
                    return userRepository.save(newUser);
                });
    }
}
