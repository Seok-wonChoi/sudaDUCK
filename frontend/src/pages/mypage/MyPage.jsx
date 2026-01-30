import { useState, useEffect } from "react";
import styles from "./MyPage.module.css";
import AppHeader from "@/components/layout/AppHeader/AppHeader";
import { getMyScripts, updateAvatarCustom, updateDuckCustom, getMyProfileCustom, purchaseItem, updateNickname, updateAiDuckBot } from "@/api/mypage";
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

  const [nickname, setNickname] = useState("영어 마스터");
  const [nicknameStyle, setNicknameStyle] = useState({
    background: "gradient",
    effect: null,
  });
  const [duckProfileId, setDuckProfileId] = useState("profile1");
  const [duckStyle, setDuckStyle] = useState({
    color: "white",
    accessory: null,
  });
  const [duckBotId, setDuckBotId] = useState("cyan");

  // 코인 시스템
  const [coins, setCoins] = useState(200); // 초기 코인 (테스트용 200코인)
  const [unlockedProfiles, setUnlockedProfiles] = useState(["profile1"]); // 기본 프로필 (profile1)
  const [unlockedColors, setUnlockedColors] = useState(["white"]); // 기본 색상 (흰색)
  const [unlockedAccessories, setUnlockedAccessories] = useState([null]); // 기본 악세사리 없음
  const [unlockedDuckBots, setUnlockedDuckBots] = useState(["cyan"]); // 기본 오리봇
  const [unlockedBackgrounds, setUnlockedBackgrounds] = useState(["default"]); // 기본 배경 (기본)
  const [unlockedEffects, setUnlockedEffects] = useState([null]); // 기본 효과 (없음)

  // 사용자 프로필 정보 조회
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await getMyProfileCustom();
        // 백엔드에서 받은 데이터로 상태 업데이트
        if (data.nickname) setNickname(data.nickname);
        if (data.nicknameStyle) setNicknameStyle(data.nicknameStyle);
        if (data.duckProfile) {
          setDuckProfileId(data.duckProfile.profileId);
          setDuckStyle({
            color: data.duckProfile.color,
            accessory: data.duckProfile.accessory,
          });
        }
        if (data.duckBotId) setDuckBotId(data.duckBotId);
        if (data.coins !== undefined) setCoins(data.coins);
        if (data.unlockedItems) {
          setUnlockedProfiles(data.unlockedItems.profiles || ["profile1"]);
          setUnlockedColors(data.unlockedItems.colors || ["white"]);
          setUnlockedAccessories(data.unlockedItems.accessories || [null]);
          setUnlockedDuckBots(data.unlockedItems.duckBots || ["cyan"]);
          setUnlockedBackgrounds(data.unlockedItems.backgrounds || ["default"]);
          setUnlockedEffects(data.unlockedItems.effects || [null]);
        }
      } catch (error) {
        console.error("프로필 정보 조회 실패:", error);
        // 실패 시 기본값 사용 (이미 초기 state로 설정됨)
      }
    };
    fetchProfileData();
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

  const handleSaveNicknameStyle = async ({ nickname: newNickname, ...style }) => {
    try {
      // 닉네임 변경 API 호출
      if (newNickname && newNickname !== nickname) {
        await updateNickname({ nickname: newNickname });
      }

      // 닉네임 스타일(배경, 효과) 변경 API 호출
      await updateAvatarCustom(style);

      // 성공 시 로컬 state 업데이트
      if (newNickname) setNickname(newNickname);
      setNicknameStyle(style);
    } catch (error) {
      console.error("닉네임 커스터마이징 저장 실패:", error);
      alert("닉네임 저장에 실패했습니다.");
    }
  };

  const handleSaveDuckStyle = async ({ profileId, ...style }) => {
    try {
      // API 호출
      await updateDuckCustom({
        profileId,
        ...style,
      });

      // 성공 시 로컬 state 업데이트
      if (profileId) setDuckProfileId(profileId);
      setDuckStyle(style);

      // localStorage에 프로필 정보 저장 (AppHeader 연동)
      const profileInfo = {
        profileId: profileId || duckProfileId,
        color: style.color || duckStyle.color,
        accessory: style.accessory !== undefined ? style.accessory : duckStyle.accessory,
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
      // AI 오리봇 변경 API 호출
      await updateAiDuckBot({ duckBotId: id });

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
  const handlePurchase = async (itemType, itemId, cost) => {
    if (coins < cost) {
      alert('코인이 부족합니다!');
      return false;
    }

    try {
      // API 호출
      await purchaseItem(itemId, {
        itemType,
        cost
      });

      // 성공 시 로컬 state 업데이트
      setCoins((prev) => prev - cost);

      if (itemType === 'profile') {
        setUnlockedProfiles((prev) => [...prev, itemId]);
      } else if (itemType === 'color') {
        setUnlockedColors((prev) => [...prev, itemId]);
      } else if (itemType === 'accessory') {
        setUnlockedAccessories((prev) => [...prev, itemId]);
      } else if (itemType === 'duckBot') {
        setUnlockedDuckBots((prev) => [...prev, itemId]);
      } else if (itemType === 'background') {
        setUnlockedBackgrounds((prev) => [...prev, itemId]);
      } else if (itemType === 'effect') {
        setUnlockedEffects((prev) => [...prev, itemId]);
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
