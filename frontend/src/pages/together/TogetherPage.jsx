import styles from "./TogetherPage.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ActionCard from "@/components/common/ActionCard/ActionCard";
import StatsSection from "@/components/features/main/StatsSection/StatsSection";
import TipBanner from "@/components/common/TipBanner/TipBanner";
import { getMypageSummary } from "@/api/mypage";

import makeRoomIcon from "@/assets/icons/make_room2.png";
import joinRoomIcon from "@/assets/icons/join_room2.png";

export default function TogetherPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ MainPage에서 넘겨준 summary 있으면 그걸 초기값으로 사용
  const state = location.state ?? {};
  const initialSummary = state.summary;

  const [toastMessage, setToastMessage] = useState("");
  const [summary, setSummary] = useState(() =>
    initialSummary ?? { attendanceDays: 0, sentenceCount: 0 }
  );

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  }, []);

  // 통계 데이터 로드 (최신화)
  useEffect(() => {
    let alive = true;

    const loadSummary = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const summaryData = await getMypageSummary();
        if (!alive) return;

        if (summaryData) {
          setSummary({
            attendanceDays: summaryData.attendanceDays ?? 0,
            sentenceCount: summaryData.sentenceCount ?? 0,
          });
        }
      } catch (error) {
        console.error("통계 데이터 로드 실패:", error);
      }
    };

    loadSummary();

    return () => {
      alive = false;
    };
  }, []);

  // location state에서 토스트 메시지 확인
  useEffect(() => {
    if (state.toastMessage) {
      showToast(state.toastMessage);

      navigate(location.pathname, {
        replace: true,
        state: { ...state, toastMessage: undefined },
      });
    }
  }, [state.toastMessage, navigate, location.pathname, showToast]);

  const handleBack = () => {
    navigate("/main", { state: { summary } });
  };
  const handleMakeRoom = () => navigate("/together/make");
  const handleJoinRoom = () => navigate("/together/join");

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <main className={styles.Top}>
          <button
            className={styles.BackButton}
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            &lt;
          </button>

          <h1 className={styles.Title}>함께 하기</h1>
          <p className={styles.Subtitle}>
            새로운 방을 만들거나 친구의 방에 참여해보세요 🎮
          </p>

          <section className={styles.CardRow} aria-label="함께하기 메뉴">
            <ActionCard
              title="방 만들기"
              description="새로운 방을 만들고 친구들을 초대하세요."
              iconSrc={makeRoomIcon}
              iconAlt="방 만들기"
              onClick={handleMakeRoom}
              variant="make"
            />
            <ActionCard
              title="참여하기"
              description="친구가 공유한 참여 코드로 방에 입장하세요."
              iconSrc={joinRoomIcon}
              iconAlt="참여하기"
              onClick={handleJoinRoom}
            />
          </section>
        </main>

        <section className={styles.Bottom} aria-label="통계">
          <TipBanner text="Tip: 방을 만들거나 참여해서 함께 하기 모드를 시작해보세요!" />
          <StatsSection
            stats={[
              { value: "🔥", label: "오늘도 열심히 해볼까요?" },
              { value: `${summary.attendanceDays}일`, label: "연속 학습" },
              { value: `${summary.sentenceCount}개`, label: "저장된 문장" },
            ]}
          />
        </section>

        {toastMessage ? <div className={styles.Toast}>{toastMessage}</div> : null}
      </div>
    </div>
  );
}
