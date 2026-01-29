package com.example.DuckDuck.domain.custom.service;

import com.example.DuckDuck.domain.custom.dto.response.CustomItemResponse;
import com.example.DuckDuck.domain.custom.dto.response.CustomShopListResponse;
import com.example.DuckDuck.domain.custom.entity.CustomItem;
import com.example.DuckDuck.domain.custom.enums.CustomCategory;
import com.example.DuckDuck.domain.custom.repository.CustomItemRepository;
import com.example.DuckDuck.domain.custom.repository.MemberCustomItemRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.entity.Profile;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.example.DuckDuck.domain.user.repository.ProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomShopService {

    private final CustomItemRepository customItemRepository;
    private final MemberCustomItemRepository memberCustomItemRepository;
    private final MemberRepository memberRepository;
    private final ProfileRepository profileRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public CustomShopListResponse getShopItems(String email, CustomCategory category) {

        // 1) 사용자 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));

        // 2) profile/coins 조회 (없으면 0으로 처리)
        Profile profile = profileRepository.findById(member.getId()).orElse(null);
        Integer coins = (profile != null && profile.getCoins() != null) ? profile.getCoins() : 0;

        // 3) 카탈로그 아이템 조회
        List<CustomItem> items = customItemRepository.findByCategoryAndIsActiveTrueOrderByPriceAscItemIdAsc(category);

        // 4) 유저 소유 아이템 id 집합
        Set<Long> ownedItemIds = memberCustomItemRepository.findOwnedItemIdsByUserIdAndCategory(member.getId(), category);

        // 5) 현재 장착 key 구하기 (profile JSON)
        String equippedKey = extractEquippedKey(profile, category);

        // 6) 응답 매핑
        List<CustomItemResponse> responseItems = new ArrayList<>();
        for (CustomItem item : items) {
            boolean owned = ownedItemIds.contains(item.getItemId());
            boolean equipped = (equippedKey != null && equippedKey.equals(item.getItemKey()));

            responseItems.add(CustomItemResponse.builder()
                    .itemId(item.getItemId())
                    .itemKey(item.getItemKey())
                    .price(item.getPrice())
                    .defaultFree(item.getIsDefaultFree())
                    .owned(owned)
                    .equipped(equipped)
                    .build());
        }

        return CustomShopListResponse.builder()
                .category(category.name())
                .coins(coins)
                .items(responseItems)
                .build();
    }

    /**
     * category에 따라 profile JSON에서 현재 장착된 key를 뽑아온다.
     * - DUCK_COLOR / DUCK_ACCESSORY => profile.duckCustomJson 의 "color"/"accessory"
     * - AVATAR_BG / AVATAR_EFFECT   => profile.avatarCustomJson 의 "bgStyle"/"effect"
     */
    private String extractEquippedKey(Profile profile, CustomCategory category) {
        if (profile == null) return null;

        try {
            if (category == CustomCategory.DUCK_COLOR || category == CustomCategory.DUCK_ACCESSORY) {
                String json = profile.getDuckCustomJson();
                if (json == null || json.isBlank()) return null;

                JsonNode node = objectMapper.readTree(json);
                if (category == CustomCategory.DUCK_COLOR) return getText(node, "color");
                return getText(node, "accessory");
            }

            if (category == CustomCategory.AVATAR_BG || category == CustomCategory.AVATAR_EFFECT) {
                String json = profile.getAvatarCustomJson();
                if (json == null || json.isBlank()) return null;

                JsonNode node = objectMapper.readTree(json);
                if (category == CustomCategory.AVATAR_BG) return getText(node, "bgStyle");
                return getText(node, "effect");
            }

            return null;
        } catch (Exception e) {
            // JSON 깨져있어도 조회 API는 죽지 않게 방어
            return null;
        }
    }

    private String getText(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText(null);
    }
}
