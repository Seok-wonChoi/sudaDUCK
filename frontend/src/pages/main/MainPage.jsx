import { useState, useEffect } from "react";
import styles from "./MainPage.module.css";
import { useNavigate, useLocation } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import MainHero from "@/components/features/main/MainHero/MainHero";
import ModeSelectSection from "@/components/features/main/ModeSelectSection/ModeSelectSection";
import TipBanner from "@/components/common/TipBanner/TipBanner";
import StatsSection from "@/components/features/main/StatsSection/StatsSection";
import { getMyProfileCustom, getMypageSummary } from "@/api/mypage";

export default function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [summary, setSummary] = useState({
    attendanceDays: 0,
    sentenceCount: 0,
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 토스트 메시지 표시
  useEffect(() => {
    if (location.state?.toastMessage) {
      setToastMessage(location.state.toastMessage);
      setToastVisible(true);

      // 3초 후 자동으로 사라짐
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 3000);

      // location state 정리
      navigate(location.pathname, { replace: true, state: {} });

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);


  // 로그인 후 사용자 프로필 로드 (닉네임 등)
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileData = await getMyProfileCustom();
        if (profileData.nickname) {
          localStorage.setItem('userNickname', profileData.nickname);
          window.dispatchEvent(new Event('nicknameUpdated'));
        }

        const summaryData = await getMypageSummary();
        if (summaryData?.attendanceDays !== undefined) {
          setConsecutiveDays(summaryData.attendanceDays);
        }
        if (summaryData?.sentenceCount !== undefined) {
          setSentenceCount(summaryData.sentenceCount);
        }
      } catch (error) {
        console.error("프로필 로드 실패:", error);
      }
    };

    // accessToken이 있으면 프로필 로드
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUserProfile();
    }
  }, []);

  const handlePractice = () => {
    navigate("/practice");
  };

  const handleTogether = () => {
    navigate("/together");
  };

  return (
    <div className={styles.Page}>
      {/* 토스트 메시지 (화면 상단) */}
      {toastVisible && (
        <div className={styles.Toast}>
          {toastMessage}
        </div>
      )}

      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Top}>
          <MainHero />
          <ModeSelectSection
            onClickPractice={handlePractice}
            onClickTogether={handleTogether}
          />
        </div>

        <div className={styles.Bottom}>
          <TipBanner text="Tip: 연습 모드로 워밍업 후 함께 하기 모드에 도전해보세요!" />
          <StatsSection
            stats={[
              { value: "🔥", label: "오늘도 열심히 해볼까요?" },
              { value: `${summary.attendanceDays}일`, label: "연속 학습" },
              { value: `${summary.sentenceCount}개`, label: "저장된 문장" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
