package com.example.DuckDuck.domain.custom.service;

import com.example.DuckDuck.domain.custom.dto.request.UpdateNicknameRequest;
import com.example.DuckDuck.domain.custom.dto.response.UpdateNicknameResponse;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NicknameService {

    private final MemberRepository memberRepository;

    @Transactional
    public UpdateNicknameResponse updateNickname(String email, UpdateNicknameRequest request) {
        if (request == null || isBlank(request.getNickname())) {
            throw new IllegalArgumentException("nickname은 필수입니다.");
        }

        String nickname = request.getNickname().trim();

        // 길이 제한 (원하는 정책으로 조정)
        if (nickname.length() < 2 || nickname.length() > 20) {
            throw new IllegalArgumentException("nickname은 2~20자여야 합니다.");
        }

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));

        // ✅ Member 엔티티에 setNickname / setUpdatedAt 가 있어야 함
        member.setNickname(nickname);

        // updatedAt 필드가 있는 경우에만 (없으면 이 줄 삭제)
        try {
            member.setUpdatedAt(LocalDateTime.now());
        } catch (Exception ignored) {
            // Member에 updatedAt setter가 없으면 무시
        }

        Member saved = memberRepository.save(member);

        return UpdateNicknameResponse.builder()
                .message("닉네임 수정 완료")
                .nickname(saved.getNickname())
                .build();
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
