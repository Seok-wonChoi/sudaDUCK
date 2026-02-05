import { useState, useEffect } from "react";
import styles from "./MyPage.module.css";
import AppHeader from "@/components/layout/AppHeader/AppHeader";
import { getMyScripts, updateAvatarCustom, updateDuckCustom, getMyProfileCustom, purchaseItem, updateNickname, updateAiDuckBot, getCustomItems, getMypageSummary} from "@/api/mypage";
import { logout } from "@/api/auth";
import { useNavigate } from "react-router-dom";
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
import { toggleScriptLike } from "@/api/shadowing.js";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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

export default function MyPage() {
  const navigate = useNavigate();
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

  // localStorage에서 닉네임 읽어오기 (초기 렌더링 플래시 방지)
  const getInitialNickname = () => {
    try {
      const savedNickname = localStorage.getItem('userNickname');
      return savedNickname || "영어 마스터";
    } catch (e) {
      console.error("localStorage 닉네임 읽기 실패:", e);
      return "영어 마스터";
    }
  };

  const [nickname, setNickname] = useState(getInitialNickname());
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

  // 통계 데이터
  const [totalPlaytime, setTotalPlaytime] = useState(0); // 총 플레이 타임 (초)
  const [consecutiveDays, setConsecutiveDays] = useState(0); // 연속 학습 일수
  const [sentenceCount, setSentenceCount] = useState(0); // 저장된 문장 개수

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

        if (profileData.nickname) {
          setNickname(profileData.nickname);
          // localStorage에 닉네임 저장 (다른 페이지에서 사용)
          localStorage.setItem('userNickname', profileData.nickname);
          window.dispatchEvent(new Event('nicknameUpdated'));
        }
        if (profileData.coins !== undefined) setCoins(profileData.coins);
        if (profileData.totalTime !== undefined) setTotalPlaytime(profileData.totalTime);
        if (profileData.attendanceDays !== undefined) setConsecutiveDays(profileData.attendanceDays);

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
        
        //4. 요약 정보 조회
        const summaryData = await getMypageSummary();
        if (summaryData.attendanceDays !== undefined) setConsecutiveDays(summaryData.attendanceDays);
        if (summaryData.sentenceCount !== undefined) setSentenceCount(summaryData.sentenceCount);

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
        console.log("[MyPage] API 응답 전체 데이터:", data);
        console.log("[MyPage] API 응답 타입:", typeof data, Array.isArray(data));

        // 백엔드 응답을 컴포넌트 형식으로 변환
        const formattedSentences = Array.isArray(data) ? data.map((item, index) => {
          console.log(`[MyPage] 문장 ${index} 원본 데이터:`, item);
          console.log(`[MyPage] topic 필드:`, item.topic, item.scriptTopic, item.script?.topic);
          console.log(`[MyPage] participants 필드:`, item.participants, item.participantNames, item.script?.participants);
          console.log(`[MyPage] blank_script 필드:`, item.blank_script, item.blankScript);

          // topic 필드 확인 (여러 가능성 고려)
          const topic = item.topic || item.scriptTopic || item.script?.topic || '';

          // participants 필드 확인 (여러 가능성 고려)
          let participants = [];
          if (Array.isArray(item.participants)) {
            participants = item.participants;
          } else if (Array.isArray(item.participantNames)) {
            participants = item.participantNames;
          } else if (Array.isArray(item.script?.participants)) {
            participants = item.script.participants;
          }

          // blank_script 필드 확인 및 파싱
          const blankScript = item.blank_script || item.blankScript || '';
          let blankWords = [];
          if (blankScript) {
            // [단어] 형식의 빈칸 추출
            const matches = blankScript.match(/\[([^\]]+)\]/g);
            if (matches) {
              blankWords = matches.map(match => match.slice(1, -1));
            }
          }

          const formatted = {
            id: item.sentenceId || item.id || item.scriptId,
            english: item.englishSentence || item.english || '',
            korean: item.koreanSentence || item.korean || '',
            topic: topic,
            score: item.score,
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '',
            bookmarked: true,
            speakerName: item.speakerName,
            participants: participants,
            blankScript: blankScript,
            blankWords: blankWords,
            ttsUrl: item.ttsUrl ? `${BACKEND_URL}${item.ttsUrl}` : ''
          };

          console.log(`[MyPage] 문장 ${index} 포맷 결과:`, formatted);
          return formatted;
        }) : [];

        console.log("[MyPage] 최종 포맷된 문장 목록:", formattedSentences);
        setSentences(formattedSentences);
      } catch (error) {
        console.error("스크립트 조회 실패:", error);
        // 실패 시 빈 배열로 설정
        setSentences([]);
      }
    };
    fetchMyScripts();
  }, []);


  const stats = [
    { value: "✨", label: "수다DUCK과 함께 한 문장 연습!" },
    { value: consecutiveDays, label: "연속 학습", unit: "일" },
    { value: sentenceCount, label: "저장된 문장", unit: "개" },
  ];

  const handleSentenceClick = (sentence) => {
    console.log("[MyPage] 선택된 문장:", sentence);
    console.log("[MyPage] 주제:", sentence.topic);
    console.log("[MyPage] 참여자:", sentence.participants);
    setSelectedSentence(sentence);
  };

  const handleDeleteSentence = async (sentenceId) => {

    if (window.confirm("이 문장을 저장 목록에서 삭제하시겠습니까?")) {
    try {
      // roomId와 turnNo 없이 호출해도 백엔드에서 알아서 삭제 처리함
      await toggleScriptLike(sentenceId, null, null); 
      
      setSentences((prev) => prev.filter((s) => s.id !== sentenceId));
      setSentenceCount(prev => Math.max(0, prev - 1));
      alert("삭제되었습니다.");
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  }
  };

  const handleSaveNicknameStyle = async ({ nickname: newNickname, background, effect }) => {
    try {
      // 닉네임 변경
      if (newNickname && newNickname !== nickname) {
        console.log('닉네임 변경 시도:', newNickname);
        const response = await updateNickname({ nickname: newNickname });
        console.log('닉네임 변경 응답:', response);
        if (response?.nickname) {
          setNickname(response.nickname);
          // localStorage에 닉네임 저장 (다른 페이지에서 사용)
          localStorage.setItem('userNickname', response.nickname);
          window.dispatchEvent(new Event('nicknameUpdated'));
        }
      }

      // 스타일 변경
      console.log('스타일 변경 시도:', { bgStyle: background, effect });
      const styleResponse = await updateAvatarCustom({ bgStyle: background, effect });
      console.log('스타일 변경 응답:', styleResponse);

      // 응답 파싱 및 state 업데이트
      if (styleResponse?.avatarCustomJson) {
        const avatarCustom = JSON.parse(styleResponse.avatarCustomJson);
        setNicknameStyle({
          background: avatarCustom.bgStyle || background,
          effect: avatarCustom.effect || effect
        });
      } else {
        setNicknameStyle({ background, effect });
      }

      console.log('저장 완료');
    } catch (error) {
      console.error("저장 실패:", error);
      const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
      alert(`저장 실패: ${errorMsg}`);
    }
  };

  const handleSaveDuckStyle = async ({ profileId, color, accessory }) => {
    try {
      await updateDuckCustom({ style: profileId, color, accessory });

      // State 업데이트
      if (profileId) setDuckProfileId(profileId);
      setDuckStyle({ color, accessory });

      // localStorage 저장 (AppHeader 연동)
      localStorage.setItem('userProfile', JSON.stringify({
        profileId: profileId || duckProfileId,
        color, accessory
      }));
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      console.error("저장 실패:", error);
      const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
      alert(`오리 커스터마이징 저장 실패: ${errorMsg}`);
    }
  };

  const handleSaveDuckBot = async (id) => {
    try {
      await updateAiDuckBot({ model: id });
      setDuckBotId(id);
    } catch (error) {
      console.error('저장 실패:', error);
      const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
      alert(`AI 오리봇 변경 실패: ${errorMsg}`);
    }
  };

  const handleLogout = () => {
    try {
      logout(); 
      navigate("/", { replace: true }); 
    } catch (error) {
      console.error("로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다.");
    }
  };

  const handlePurchase = async (itemType, itemKey, cost) => {
    if (coins < cost) {
      alert('코인이 부족합니다!');
      return false;
    }

    const numericItemId = itemKeyToIdMap[itemKey];
    if (!numericItemId) {
      alert('아이템 정보를 찾을 수 없습니다.');
      return false;
    }

    try {
      const response = await purchaseItem(numericItemId);
      if (response.remainingCoins !== undefined) setCoins(response.remainingCoins);

      // itemType별 unlock 처리
      const unlockMap = {
        profile: setUnlockedProfiles,
        color: setUnlockedColors,
        accessory: setUnlockedAccessories,
        duckBot: setUnlockedDuckBots,
        background: setUnlockedBackgrounds,
        effect: setUnlockedEffects
      };
      unlockMap[itemType]?.((prev) => [...prev, itemKey]);

      return true;
    } catch (error) {
      console.error('구매 실패:', error);
      const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
      alert(`아이템 구매 실패: ${errorMsg}`);
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
