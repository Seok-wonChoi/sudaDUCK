package com.example.DuckDuck.domain.custom.service;

import com.example.DuckDuck.domain.custom.dto.response.PurchaseResponse;
import com.example.DuckDuck.domain.custom.entity.CustomItem;
import com.example.DuckDuck.domain.custom.entity.MemberCustomItem;
import com.example.DuckDuck.domain.custom.repository.CustomItemRepository;
import com.example.DuckDuck.domain.custom.repository.MemberCustomItemRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.entity.Profile;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.example.DuckDuck.domain.user.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CustomPurchaseService {

    private final MemberRepository memberRepository;
    private final ProfileRepository profileRepository;

    private final CustomItemRepository customItemRepository;
    private final MemberCustomItemRepository memberCustomItemRepository;

    @Transactional
    public PurchaseResponse purchase(String email, Long itemId) {
        // 1) member 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));
        Long userId = member.getId();

        // 2) item 조회 (활성 아이템만)
        CustomItem item = customItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 itemId=" + itemId));

        if (item.getIsActive() == null || !item.getIsActive()) {
            throw new IllegalArgumentException("비활성화된 아이템입니다. itemId=" + itemId);
        }

        // 3) 무료(가격 0) 또는 기본무료는 구매 불필요 (정책 선택)
        Integer price = (item.getPrice() == null) ? 0 : item.getPrice();
        if (price == 0 || Boolean.TRUE.equals(item.getIsDefaultFree())) {
            throw new IllegalArgumentException("무료 아이템은 구매할 수 없습니다. itemId=" + itemId);
        }

        // 4) 이미 소유중인지 체크
        if (memberCustomItemRepository.existsByUser_IdAndItem_ItemId(userId, itemId)) {
            throw new IllegalArgumentException("이미 구매한 아이템입니다. itemId=" + itemId);
        }

        // 5) profile 조회 + 코인 확인
        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필이 없습니다. userId=" + userId));

        int coins = (profile.getCoins() == null) ? 0 : profile.getCoins();
        if (coins < price) {
            throw new IllegalArgumentException("코인이 부족합니다. coins=" + coins + ", price=" + price);
        }

        // 6) 코인 차감
        profile.setCoins(coins - price);
        profile.setUpdatedAt(LocalDateTime.now());
        profileRepository.save(profile);

        // 7) 구매 기록 저장
        MemberCustomItem owned = MemberCustomItem.builder()
                .user(member)
                .item(item)
                .purchasedAt(LocalDateTime.now())
                .build();

        memberCustomItemRepository.save(owned);

        return PurchaseResponse.builder()
                .message("구매 완료")
                .itemId(itemId)
                .remainingCoins(profile.getCoins())
                .build();
    }
}
