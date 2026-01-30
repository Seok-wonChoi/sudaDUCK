import { useState, useEffect } from "react";
import styles from "./MyPage.module.css";
import AppHeader from "@/components/layout/AppHeader/AppHeader";
import { getMyScripts, updateAvatarCustom, updateDuckCustom, getMyProfileCustom, purchaseItem, updateNickname, updateAiDuckBot, getCustomItems } from "@/api/mypage";
import { logout } from "@/api/auth";

import ProfileSection from "@/components/features/mypage/ProfileSection/ProfileSection";
import StatsCard from "@/components/features/mypage/StatsCard/StatsCard";
import SentenceList from "@/components/features/mypage/SentenceList/SentenceList";

import SentenceDetailModal from "@/components/features/mypage/modals/SentenceDetailModal/SentenceDetailModal";
import NicknameStyleModal from "@/components/features/mypage/modals/NicknameStyleModal/NicknameStyleModal";
import DuckStyleModal from "@/components/features/mypage/modals/DuckStyleModal/DuckStyleModal";
import DuckBotModal from "@/components/features/mypage/modals/DuckBotModal/DuckBotModal";

import duckBotCyan from "@/assets/images/duck_bot_cyan.png";
import duckBotOrange from "@/assets/images/duck_bot_orange.png";
import duckBotDigital from "@/assets/images/duck_bot_digital.png";
import duckBotMecha from "@/assets/images/duck_bot_mecha.png";

import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

const DUCK_BOT_IMAGES = {
  cyan: duckBotCyan,
  orange: duckBotOrange,
  digital: duckBotDigital,
  mecha: duckBotMecha,
};

const DUCK_PROFILE_IMAGES = {
  profile1: duckProfile1,
  profile2: duckProfile2,
  profile3: duckProfile3,
  profile4: duckProfile4,
};

const MOCK_SENTENCES = [
  {
    id: 1,
    english: "I couldn't agree with you more on that point.",
    korean: "그 점에 대해서 당신 말에 전적으로 동의합니다.",
    topic: "비즈니스 미팅",
    score: 85,
    needsReview: false,
    date: "2026.01.15",
    bookmarked: true,
    participants: ["John", "Sarah", "David"],
    similarExpressions: [
      { english: "I totally agree with you.", korean: "완전히 동의합니다." },
      { english: "You're absolutely right.", korean: "정말 맞는 말씀이에요." },
      { english: "I'm completely on board with that.", korean: "그것에 완전히 찬성합니다." },
      { english: "That's exactly what I think.", korean: "그게 바로 제 생각입니다." },
    ],
    quizQuestion: "I ______ agree ______ you more on that point.",
    quizAnswer: "couldn't with",
  },
  {
    id: 2,
    english: "Would you mind giving me a hand with this project?",
    korean: "이 프로젝트 좀 도와주실 수 있으신가요?",
    topic: "팀 협업",
    score: 45,
    needsReview: true,
    date: "2026.01.14",
    bookmarked: true,
    participants: ["Emma", "Mike"],
    similarExpressions: [
      { english: "Could you help me with this?", korean: "이것 좀 도와주실 수 있나요?" },
      { english: "I could use some assistance.", korean: "도움이 좀 필요합니다." },
    ],
    quizQuestion: "Would you mind ______ me a hand with this project?",
    quizAnswer: "giving",
  },
  {
    id: 3,
    english: "I'm afraid I have to disagree with your assessment.",
    korean: "죄송하지만 당신의 평가에 동의할 수 없습니다.",
    topic: "프로젝트 리뷰",
    score: 92,
    needsReview: false,
    date: "2026.01.13",
    bookmarked: true,
    participants: ["Alex"],
    similarExpressions: [
      { english: "I see it differently.", korean: "저는 다르게 봅니다." },
      { english: "I have a different perspective.", korean: "다른 관점을 가지고 있습니다." },
    ],
    quizQuestion: "I'm afraid I have to ______ with your assessment.",
    quizAnswer: "disagree",
  },
  {
    id: 4,
    english: "Let me get back to you on that as soon as possible.",
    korean: "그 건에 대해 가능한 한 빨리 답변드리겠습니다.",
    topic: "고객 서비스",
    score: 55,
    needsReview: true,
    date: "2026.01.12",
    bookmarked: true,
    participants: ["Customer", "Support"],
    similarExpressions: [
      { english: "I'll follow up with you shortly.", korean: "곧 연락드리겠습니다." },
    ],
    quizQuestion: "Let me get ______ to you on that as soon as possible.",
    quizAnswer: "back",
  },
  {
    id: 5,
    english: "It's been a pleasure working with you all these years.",
    korean: "지난 몇 년간 여러분과 함께 일할 수 있어서 기뻤습니다.",
    topic: "송별회",
    score: 78,
    needsReview: false,
    date: "2026.01.11",
    bookmarked: true,
    participants: ["Team"],
    similarExpressions: [],
    quizQuestion: "It's been a ______ working with you all these years.",
    quizAnswer: "pleasure",
  },
  {
    id: 6,
    english: "I'm looking forward to hearing from you soon.",
    korean: "곧 소식 듣기를 기대하겠습니다.",
    topic: "이메일 작성",
    score: 95,
    needsReview: false,
    date: "2026.01.09",
    bookmarked: true,
    participants: [],
    similarExpressions: [
      { english: "I hope to hear from you soon.", korean: "곧 연락 주시길 바랍니다." },
      { english: "Looking forward to your reply.", korean: "답장 기다리겠습니다." },
    ],
    quizQuestion: "I'm looking ______ to hearing from you soon.",
    quizAnswer: "forward",
  },
];

export default function MyPage() {
  const [sentences, setSentences] = useState([]);
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showDuckModal, setShowDuckModal] = useState(false);
  const [showDuckBotModal, setShowDuckBotModal] = useState(false);

  // localStorage에서 프로필 정보 읽어오기 (초기 렌더링 플래시 방지)
  const getInitialProfile = () => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        return {
          profileId: profile.profileId || "profile1",
          color: profile.color || "white",
          accessory: profile.accessory || "none",
        };
      }
    } catch (e) {
      console.error("localStorage 프로필 읽기 실패:", e);
    }
    return { profileId: "profile1", color: "white", accessory: "none" };
  };

  const initialProfile = getInitialProfile();

  const [nickname, setNickname] = useState("영어 마스터");
  const [nicknameStyle, setNicknameStyle] = useState({
    background: "gradient",
    effect: "none",
  });
  const [duckProfileId, setDuckProfileId] = useState(initialProfile.profileId);
  const [duckStyle, setDuckStyle] = useState({
    color: initialProfile.color,
    accessory: initialProfile.accessory,
  });
  const [duckBotId, setDuckBotId] = useState("cyan");

  // 코인 시스템
  const [coins, setCoins] = useState(200); // 초기 코인 (테스트용 200코인)
  const [unlockedProfiles, setUnlockedProfiles] = useState(["profile1"]); // 기본 프로필 (profile1)
  const [unlockedColors, setUnlockedColors] = useState(["white"]); // 기본 색상 (흰색)
  const [unlockedAccessories, setUnlockedAccessories] = useState(["none"]); // 기본 악세사리 없음
  const [unlockedDuckBots, setUnlockedDuckBots] = useState(["cyan"]); // 기본 오리봇
  const [unlockedBackgrounds, setUnlockedBackgrounds] = useState(["default"]); // 기본 배경 (기본)
  const [unlockedEffects, setUnlockedEffects] = useState(["none"]); // 기본 효과 (없음)

  // itemKey -> itemId 매핑 (아이템 구매용)
  const [itemKeyToIdMap, setItemKeyToIdMap] = useState({});

  // 아이템 목록 로드 및 itemKey -> itemId 매핑 생성
  useEffect(() => {
    const fetchItemsAndProfile = async () => {
      try {
        // 1. 모든 카테고리의 아이템 목록 조회
        const categories = ["DUCK_STYLE", "DUCK_COLOR", "DUCK_ACCESSORY", "AVATAR_BG", "AVATAR_EFFECT", "AI_DUCKBOT_MODEL"];
        const itemsPromises = categories.map(category => getCustomItems(category));
        const itemsResults = await Promise.all(itemsPromises);

        // 2. itemKey -> itemId 매핑 생성 및 unlocked 아이템 추출
        const keyToIdMap = {};
        const ownedProfiles = [];
        const ownedColors = [];
        const ownedAccessories = [];
        const ownedBackgrounds = [];
        const ownedEffects = [];
        const ownedDuckBots = [];

        itemsResults.forEach((result) => {
          if (result && result.items) {
            result.items.forEach((item) => {
              // itemKey -> itemId 매핑
              keyToIdMap[item.itemKey] = item.itemId;

              // owned 아이템 분류
              if (item.owned) {
                switch (result.category) {
                  case "DUCK_STYLE":
                    ownedProfiles.push(item.itemKey);
                    break;
                  case "DUCK_COLOR":
                    ownedColors.push(item.itemKey);
                    break;
                  case "DUCK_ACCESSORY":
                    ownedAccessories.push(item.itemKey);
                    break;
                  case "AVATAR_BG":
                    ownedBackgrounds.push(item.itemKey);
                    break;
                  case "AVATAR_EFFECT":
                    ownedEffects.push(item.itemKey);
                    break;
                  case "AI_DUCKBOT_MODEL":
                    ownedDuckBots.push(item.itemKey);
                    break;
                }
              }
            });
          }
        });

        setItemKeyToIdMap(keyToIdMap);
        setUnlockedProfiles(ownedProfiles.length > 0 ? ownedProfiles : ["profile1"]);
        setUnlockedColors(ownedColors.length > 0 ? ownedColors : ["white"]);
        setUnlockedAccessories(ownedAccessories.length > 0 ? ownedAccessories : ["none"]);
        setUnlockedBackgrounds(ownedBackgrounds.length > 0 ? ownedBackgrounds : ["default"]);
        setUnlockedEffects(ownedEffects.length > 0 ? ownedEffects : ["none"]);
        setUnlockedDuckBots(ownedDuckBots.length > 0 ? ownedDuckBots : ["cyan"]);

        // 3. 프로필 정보 조회
        const profileData = await getMyProfileCustom();

        if (profileData.nickname) setNickname(profileData.nickname);
        if (profileData.coins !== undefined) setCoins(profileData.coins);

        // JSON 문자열 파싱
        if (profileData.duckCustomJson) {
          try {
            const duckCustom = JSON.parse(profileData.duckCustomJson);
            if (duckCustom.style) setDuckProfileId(duckCustom.style);
            setDuckStyle({
              color: duckCustom.color || "white",
              accessory: duckCustom.accessory || "none",
            });
          } catch (e) {
            console.error("duckCustomJson 파싱 실패:", e);
          }
        }

        if (profileData.avatarCustomJson) {
          try {
            const avatarCustom = JSON.parse(profileData.avatarCustomJson);
            setNicknameStyle({
              background: avatarCustom.bgStyle || "default",
              effect: avatarCustom.effect || "none",
            });
          } catch (e) {
            console.error("avatarCustomJson 파싱 실패:", e);
          }
        }

        if (profileData.aiDuckbotCustomJson) {
          try {
            const aiDuckbotCustom = JSON.parse(profileData.aiDuckbotCustomJson);
            if (aiDuckbotCustom.model) setDuckBotId(aiDuckbotCustom.model);
          } catch (e) {
            console.error("aiDuckbotCustomJson 파싱 실패:", e);
          }
        }

      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };
    fetchItemsAndProfile();
  }, []);

  // 저장된 스크립트 조회
  useEffect(() => {
    const fetchMyScripts = async () => {
      try {
        const data = await getMyScripts();
        setSentences(data);
      } catch (error) {
        console.error("스크립트 조회 실패:", error);
        // 실패 시 MOCK 데이터 사용
        setSentences(MOCK_SENTENCES);
      }
    };
    fetchMyScripts();
  }, []);

  const stats = [
    { value: 0, label: "총 플레이 타임", unit: "" },
    { value: 0, label: "연속 학습", unit: "일" },
    { value: sentences.length, label: "저장된 문장", unit: "개" },
  ];

  const handleSentenceClick = (sentence) => {
    setSelectedSentence(sentence);
  };

  const handleDeleteSentence = (id) => {
    if (window.confirm("이 문장을 삭제하시겠습니까?")) {
      setSentences((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSaveNicknameStyle = async ({ nickname: newNickname, background, effect }) => {
    try {
      // 닉네임 변경 API 호출
      if (newNickname && newNickname !== nickname) {
        await updateNickname({ nickname: newNickname });
      }

      // 닉네임 스타일(배경, 효과) 변경 API 호출 - bgStyle 필드 사용
      await updateAvatarCustom({ bgStyle: background, effect });

      // 성공 시 로컬 state 업데이트
      if (newNickname) setNickname(newNickname);
      setNicknameStyle({ background, effect });
    } catch (error) {
      console.error("닉네임 커스터마이징 저장 실패:", error);
      alert("닉네임 저장에 실패했습니다.");
    }
  };

  const handleSaveDuckStyle = async ({ profileId, color, accessory }) => {
    try {
      // API 호출 - style 필드 사용
      await updateDuckCustom({
        style: profileId,
        color,
        accessory,
      });

      // 성공 시 로컬 state 업데이트
      if (profileId) setDuckProfileId(profileId);
      setDuckStyle({ color, accessory });

      // localStorage에 프로필 정보 저장 (AppHeader 연동)
      const profileInfo = {
        profileId: profileId || duckProfileId,
        color: color || duckStyle.color,
        accessory: accessory !== undefined ? accessory : duckStyle.accessory,
      };
      localStorage.setItem('userProfile', JSON.stringify(profileInfo));

      // AppHeader 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      console.error("오리 커스터마이징 저장 실패:", error);
      alert("오리 커스터마이징 저장에 실패했습니다.");
    }
  };

  const handleSaveDuckBot = async (id) => {
    try {
      // AI 오리봇 변경 API 호출 - model 필드 사용
      await updateAiDuckBot({ model: id });

      // 성공 시 로컬 state 업데이트
      setDuckBotId(id);
    } catch (error) {
      console.error('AI 오리봇 변경 실패:', error);
      alert('AI 오리봇 변경에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('accessToken');
      // 로그인 페이지로 이동
      window.location.href = '/login';
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  // 아이템 구매 함수
  const handlePurchase = async (itemType, itemKey, cost) => {
    if (coins < cost) {
      alert('코인이 부족합니다!');
      return false;
    }

    // itemKey를 itemId로 변환
    const numericItemId = itemKeyToIdMap[itemKey];
    if (!numericItemId) {
      console.error('아이템 ID를 찾을 수 없습니다:', itemKey);
      alert('아이템 정보를 찾을 수 없습니다.');
      return false;
    }

    try {
      // API 호출 (숫자 itemId 사용, request body 없음)
      const response = await purchaseItem(numericItemId);

      // 성공 시 로컬 state 업데이트
      if (response.remainingCoins !== undefined) {
        setCoins(response.remainingCoins);
      }

      if (itemType === 'profile') {
        setUnlockedProfiles((prev) => [...prev, itemKey]);
      } else if (itemType === 'color') {
        setUnlockedColors((prev) => [...prev, itemKey]);
      } else if (itemType === 'accessory') {
        setUnlockedAccessories((prev) => [...prev, itemKey]);
      } else if (itemType === 'duckBot') {
        setUnlockedDuckBots((prev) => [...prev, itemKey]);
      } else if (itemType === 'background') {
        setUnlockedBackgrounds((prev) => [...prev, itemKey]);
      } else if (itemType === 'effect') {
        setUnlockedEffects((prev) => [...prev, itemKey]);
      }

      return true;
    } catch (error) {
      console.error('아이템 구매 실패:', error);
      alert('아이템 구매에 실패했습니다.');
      return false;
    }
  };

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="장가은" />

        <main className={styles.Main}>
          <ProfileSection
            profileImage={DUCK_PROFILE_IMAGES[duckProfileId]}
            profileColor={duckStyle.color}
            profileAccessory={duckStyle.accessory}
            nickname={nickname}
            email="example@test.com"
            nicknameStyle={nicknameStyle}
            duckBotImage={DUCK_BOT_IMAGES[duckBotId]}
            coins={coins}
            onEditProfile={() => setShowDuckModal(true)}
            onEditNickname={() => setShowNicknameModal(true)}
            onEditDuckBot={() => setShowDuckBotModal(true)}
            onLogout={handleLogout}
          />

          <StatsCard stats={stats} />

          <SentenceList
            sentences={sentences}
            onItemClick={handleSentenceClick}
            onDelete={handleDeleteSentence}
          />
        </main>
      </div>

      {selectedSentence && (
        <SentenceDetailModal
          sentence={selectedSentence}
          onClose={() => setSelectedSentence(null)}
        />
      )}

      {showNicknameModal && (
        <NicknameStyleModal
          nickname={nickname}
          currentStyle={nicknameStyle}
          coins={coins}
          unlockedBackgrounds={unlockedBackgrounds}
          unlockedEffects={unlockedEffects}
          onPurchase={handlePurchase}
          onSave={handleSaveNicknameStyle}
          onClose={() => setShowNicknameModal(false)}
        />
      )}

      {showDuckModal && (
        <DuckStyleModal
          currentProfileId={duckProfileId}
          currentColor={duckStyle.color}
          currentAccessory={duckStyle.accessory}
          coins={coins}
          unlockedProfiles={unlockedProfiles}
          unlockedColors={unlockedColors}
          unlockedAccessories={unlockedAccessories}
          onPurchase={handlePurchase}
          onSave={handleSaveDuckStyle}
          onClose={() => setShowDuckModal(false)}
        />
      )}

      {showDuckBotModal && (
        <DuckBotModal
          currentDuckId={duckBotId}
          coins={coins}
          unlockedDuckBots={unlockedDuckBots}
          onPurchase={handlePurchase}
          onSave={handleSaveDuckBot}
          onClose={() => setShowDuckBotModal(false)}
        />
      )}
    </div>
  );
}
