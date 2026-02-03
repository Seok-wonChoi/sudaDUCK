import { useEffect, useState } from "react";
import styles from "./MainPage.module.css";
import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import MainHero from "@/components/features/main/MainHero/MainHero";
import ModeSelectSection from "@/components/features/main/ModeSelectSection/ModeSelectSection";
import TipBanner from "@/components/common/TipBanner/TipBanner";
import StatsSection from "@/components/features/main/StatsSection/StatsSection";
import { getMyProfileCustom, getMypageSummary } from "@/api/mypage";

export default function MainPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    attendanceDays: 0,
    sentenceCount: 0,
  });

  // 로그인 후 사용자 프로필 및 요약 정보 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // 프로필 정보 로드
        const profileData = await getMyProfileCustom();
        if (profileData.nickname) {
          localStorage.setItem('userNickname', profileData.nickname);
          window.dispatchEvent(new Event('nicknameUpdated'));
        }

        // 요약 정보 로드
        const summaryData = await getMypageSummary();
        setSummary({
          attendanceDays: summaryData.attendanceDays || 0,
          sentenceCount: summaryData.sentenceCount || 0,
        });
      } catch (error) {
        console.error("사용자 데이터 로드 실패:", error);
      }
    };

    // accessToken이 있으면 데이터 로드
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUserData();
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
              { value: "0시간", label: "총 플레이 타임" },
              { value: `${summary.attendanceDays}일`, label: "연속 학습" },
              { value: `${summary.sentenceCount}개`, label: "저장된 문장" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
