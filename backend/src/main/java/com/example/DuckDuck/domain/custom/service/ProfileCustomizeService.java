package com.example.DuckDuck.domain.custom.service;

import com.example.DuckDuck.domain.custom.dto.request.EquipAiDuckbotRequest;
import com.example.DuckDuck.domain.custom.dto.request.EquipAvatarRequest;
import com.example.DuckDuck.domain.custom.dto.request.EquipDuckRequest;
import com.example.DuckDuck.domain.custom.dto.response.EquipAiDuckbotResponse;
import com.example.DuckDuck.domain.custom.dto.response.EquipDuckResponse;
import com.example.DuckDuck.domain.custom.dto.response.MyProfileCustomResponse;
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
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.DuckDuck.domain.custom.dto.response.EquipAvatarResponse;
import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProfileCustomizeService {

    private final MemberRepository memberRepository;
    private final ProfileRepository profileRepository;

    private final CustomItemRepository customItemRepository;
    private final MemberCustomItemRepository memberCustomItemRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String DEFAULT_DUCK_JSON =
            "{\"v\":1,\"style\":\"BASIC_1\",\"color\":\"WHITE\",\"accessory\":\"NONE\"}";

    private static final String DEFAULT_AVATAR_JSON =
            "{\"v\":1,\"bgStyle\":\"BASIC_WHITE\",\"effect\":\"NONE\"}";

    private static final String DEFAULT_AI_DUCKBOT_JSON =
            "{\"v\":1,\"model\":\"MODEL_1\"}";

    // ===================== 오리 장착 =====================
    @Transactional
    public EquipDuckResponse equipDuck(String email, EquipDuckRequest request) {
        if (request == null ||
                (isBlank(request.getStyle())
                        && isBlank(request.getColor())
                        && isBlank(request.getAccessory()))) {

            throw new IllegalArgumentException(
                    "style, color, accessory 중 하나는 필수입니다."
            );
        }

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));
        Long userId = member.getId();

        Profile profile = ensureProfile(member);

        ObjectNode node = readOrDefaultObjectNode(profile.getDuckCustomJson(), DEFAULT_DUCK_JSON);

        // 기존 유저 대비: style 기본 보장
        if (!node.has("style")) node.put("style", "BASIC_1");

        if (!isBlank(request.getStyle())) {
            validateCanEquip(userId, CustomCategory.DUCK_STYLE, request.getStyle());
            node.put("style", request.getStyle().trim());
        }
        if (!isBlank(request.getColor())) {
            validateCanEquip(userId, CustomCategory.DUCK_COLOR, request.getColor());
            node.put("color", request.getColor().trim());
        }
        if (!isBlank(request.getAccessory())) {
            validateCanEquip(userId, CustomCategory.DUCK_ACCESSORY, request.getAccessory());
            node.put("accessory", request.getAccessory().trim());
        }
        if (!node.has("v")) node.put("v", 1);

        profile.setDuckCustomJson(write(node));
        profile.setUpdatedAt(LocalDateTime.now());

        Profile saved = profileRepository.save(profile);

        return EquipDuckResponse.builder()
                .message("오리 커스터마이징 장착 완료")
                .duckCustomJson(saved.getDuckCustomJson())
                .build();
    }

    // ===================== 아바타(닉네임) 장착 =====================
    @Transactional
    public EquipAvatarResponse equipAvatar(String email, EquipAvatarRequest request) {
        if (request == null || (isBlank(request.getBgStyle()) && isBlank(request.getEffect()))) {
            throw new IllegalArgumentException("bgStyle 또는 effect 중 하나는 필수입니다.");
        }

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));
        Long userId = member.getId();

        Profile profile = ensureProfile(member);

        if (isBlank(profile.getAvatarCustomJson())) {
            profile.setAvatarCustomJson(DEFAULT_AVATAR_JSON);
        }

        ObjectNode node = readOrDefaultObjectNode(profile.getAvatarCustomJson(), DEFAULT_AVATAR_JSON);

        if (!isBlank(request.getBgStyle())) {
            validateCanEquip(userId, CustomCategory.AVATAR_BG, request.getBgStyle());
            node.put("bgStyle", request.getBgStyle().trim());
        }
        if (!isBlank(request.getEffect())) {
            validateCanEquip(userId, CustomCategory.AVATAR_EFFECT, request.getEffect());
            node.put("effect", request.getEffect().trim());
        }
        if (!node.has("v")) node.put("v", 1);

        profile.setAvatarCustomJson(write(node));
        profile.setUpdatedAt(LocalDateTime.now());

        Profile saved = profileRepository.save(profile);

        return EquipAvatarResponse.builder()
                .message("아바타 커스터마이징 장착 완료")
                .avatarCustomJson(saved.getAvatarCustomJson())
                .build();
    }


    // ===================== ai 오리 장착 =====================
    @Transactional
    public EquipAiDuckbotResponse equipAiDuckbot(String email, EquipAiDuckbotRequest request) {

        if (request == null || isBlank(request.getModel())) {
            throw new IllegalArgumentException("model은 필수입니다.");
        }

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));

        Long userId = member.getId();

        Profile profile = ensureProfile(member);

        if (isBlank(profile.getAiDuckbotCustomJson())) {
            profile.setAiDuckbotCustomJson(DEFAULT_AI_DUCKBOT_JSON);
        }

        ObjectNode node = readOrDefaultObjectNode(
                profile.getAiDuckbotCustomJson(),
                DEFAULT_AI_DUCKBOT_JSON
        );

        // 구매 여부 검증 (기본 무료 포함)
        validateCanEquip(userId, CustomCategory.AI_DUCKBOT_MODEL, request.getModel());

        node.put("model", request.getModel().trim());
        if (!node.has("v")) node.put("v", 1);

        profile.setAiDuckbotCustomJson(write(node));
        profile.setUpdatedAt(LocalDateTime.now());

        Profile saved = profileRepository.save(profile);

        return EquipAiDuckbotResponse.builder()
                .message("AI 오리봇 변경 완료")
                .aiDuckbotCustomJson(saved.getAiDuckbotCustomJson())
                .build();
    }

    // ===================== 공통 유틸 =====================

    /** profile 없으면 생성 + duck 기본값 보장 */
    private Profile ensureProfile(Member member) {
        Profile profile = profileRepository.findById(member.getId()).orElse(null);

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
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        } else {
            if (isBlank(profile.getDuckCustomJson())) {
                profile.setDuckCustomJson(DEFAULT_DUCK_JSON);
            }
            if (isBlank(profile.getAvatarCustomJson())) {
                profile.setAvatarCustomJson(DEFAULT_AVATAR_JSON);
            }
            if (isBlank(profile.getAiDuckbotCustomJson())) {
                profile.setAiDuckbotCustomJson(DEFAULT_AI_DUCKBOT_JSON);
            }
        }

        return profile;
    }


    private void validateCanEquip(Long userId, CustomCategory category, String itemKey) {
        String key = itemKey.trim();

        CustomItem item = customItemRepository
                .findByCategoryAndItemKeyAndIsActiveTrue(category, key)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 아이템입니다. category=" + category + ", key=" + key));

        // 기본무료 or price=0이면 OK
        if (Boolean.TRUE.equals(item.getIsDefaultFree()) || (item.getPrice() != null && item.getPrice() == 0)) {
            return;
        }

        // 소유 검사
        Set<Long> owned = memberCustomItemRepository.findOwnedItemIdsByUserIdAndCategory(userId, category);
        if (!owned.contains(item.getItemId())) {
            throw new SecurityException("구매하지 않은 아이템입니다. key=" + key);
        }
    }

    private ObjectNode readOrDefaultObjectNode(String json, String defaultJson) {
        try {
            String source = (json == null || json.isBlank()) ? defaultJson : json;
            JsonNode node = objectMapper.readTree(source);
            if (node instanceof ObjectNode obj) return obj;
            return (ObjectNode) objectMapper.readTree(defaultJson);
        } catch (Exception e) {
            try {
                return (ObjectNode) objectMapper.readTree(defaultJson);
            } catch (Exception ex) {
                throw new IllegalStateException("기본 JSON 파싱 실패");
            }
        }
    }

    private String write(ObjectNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            throw new IllegalArgumentException("JSON 직렬화 실패");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }


    @Transactional(readOnly = true)
    public MyProfileCustomResponse getMyProfileCustom(String email) {

        // 1) member 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));
        Long userId = member.getId();

        // 2) profile 조회
        Profile profile = profileRepository.findById(userId)
                .orElseGet(() -> ensureProfile(member));

        return MyProfileCustomResponse.builder()
                .nickname(member.getNickname())
                .coins(profile.getCoins() == null ? 0 : profile.getCoins())
                .duckCustomJson(profile.getDuckCustomJson())
                .avatarCustomJson(profile.getAvatarCustomJson())
                .aiDuckbotCustomJson(profile.getAiDuckbotCustomJson())
                .build();
    }

}