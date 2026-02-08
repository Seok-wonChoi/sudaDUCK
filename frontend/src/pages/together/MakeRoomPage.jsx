import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import styles from "./MakeRoomPage.module.css";
import { createSession } from "@/api/openVidu";
import AppHeader from "@/components/layout/AppHeader/AppHeader";
import { useSoundContext } from "@/context/SoundContext";
import ConfirmModal from "@/components/common/ConfirmModal/ConfirmModal";

import { createRoom, getTopics, joinRoom } from "@/api/rooms";
import lightButtonSound from "@/assets/sounds/light_button.wav";

const ROOM_INFO_KEY = "together_room_info";

export default function MakeRoomPage() {
  const navigate = useNavigate();
  const { getEffectiveVolume, isMuted } = useSoundContext();

  // 방 만들기 권한 체크
  useEffect(() => {
    const ALLOWED_USER_IDS = [
      4719057912,
      4719307718,
      4719309052,
      4720876392
    ];
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (!ALLOWED_USER_IDS.includes(Number(decoded.userId))) {
        alert("방 만들기 권한이 없습니다.");
        navigate("/together", { replace: true });
      }
    } catch (e) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const hotTopics = useMemo(
    () => [
      "첫 아르바이트 추억",
      "최악의 데이트",
      "나만의 취미생활",
      "학창시절 이야기",
      "여행 경험담",
      "좋아하는 음식",
    ],
    [],
  );

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [turn, setTurn] = useState(3);
  const [timeLimit, setTimeLimit] = useState(40);
  const [loading, setLoading] = useState(false);
  const [isLoadingAiRecommend, setIsLoadingAiRecommend] = useState(false);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const titleCount = title.length;

  const handleBack = () => {
    if (!isMuted) {
      try {
        const audio = new Audio(lightButtonSound);
        audio.volume = getEffectiveVolume(0.1);
        audio.play().catch(() => {});
      } catch (e) {
        // 무시
      }
    }
    if (window.history.length > 1) navigate(-1);
    else navigate("/together");
  };

  const handleTitleChange = (e) => {
    const next = e.target.value.slice(0, 30);
    setTitle(next);
  };

  const handleTopicChange = (e) => {
    setTopic(e.target.value);
  };

  const handleAiRecommend = async () => {
    setIsLoadingAiRecommend(true);
    try {
      const data = await getTopics();
      const topics = data.topics || [];
      if (topics.length > 0) {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        setTopic(randomTopic);
      }
    } catch (e) {
      console.error("AI 주제 추천 API 호출 실패:", e);
      if (hotTopics.length > 0) {
        const next = hotTopics[Math.floor(Math.random() * hotTopics.length)];
        setTopic(next);
      }
    } finally {
      setIsLoadingAiRecommend(false);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!title.trim()) {
      alert("방 제목을 입력해주세요.");
      return;
    }
    if (!topic.trim()) {
      alert("수다 주제를 입력하거나 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const ovSessionId = await createSession();
      const res = await createRoom({
        title: title.trim(),
        topic: topic.trim(),
        turnCnt: turn,
        openviduSessionId: ovSessionId,
      });

      try {
        await joinRoom({ roomCode: res.roomCode });
      } catch (joinError) {
        console.error("방 참가 실패:", joinError);
      }

      const roomInfo = {
        isHost: true,
        maxCount: 4,
        roomId: res.roomId,
        hostUserId: res.hostUserId,
        createdAt: res.createdAt,
        roomTitle: res.title,
        topic: res.topic,
        turnCount: res.turnCnt,
        timeLimit: res.timeLimit || timeLimit,
        joinCode: res.roomCode,
        inviteCode: res.roomCode,
        openviduSessionId: ovSessionId,
      };

      sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(roomInfo));
      navigate("/together/waiting", { state: roomInfo });
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || "방 생성에 실패했습니다.";
      if (errorMessage.includes("방 제목") && errorMessage.includes("부적절")) {
        setModalTitle("⚠️ 주의");
        setModalMessage("부적절한 방 제목 다시 생성해주세요");
        setModalOpen(true);
      } else if (errorMessage.includes("주제") && errorMessage.includes("부적절")) {
        setModalTitle("⚠️ 주의");
        setModalMessage("부적절한 방 주제입니다.");
        setModalOpen(true);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
            disabled={loading}
            data-click-sound="false"
          >
            &lt;
          </button>

          <h1 className={styles.Title}>방 만들기</h1>
          <p className={styles.Subtitle}>
            친구들과 함께할 수다방을 만들어보세요 🎮
          </p>

          <div className={styles.Content}>
            <section className={styles.FormCard} aria-label="방 만들기 폼">
              <div className={styles.Field}>
                <div className={styles.LabelRow}>
                  <span className={styles.Label}>방 제목</span>
                  <span className={styles.Required}>*</span>
                </div>
                <input
                  className={styles.Input}
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="예: 친구들과 수다타임"
                  disabled={loading}
                />
                <div className={styles.Counter}>{titleCount}/30</div>
              </div>

              <div className={styles.Field}>
                <div className={styles.LabelRow}>
                  <span className={styles.Label}>수다 주제</span>
                  <span className={styles.Required}>*</span>
                </div>
                <div className={styles.TopicInputRow}>
                  <input
                    className={styles.Input}
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="직접 입력하거나 아래에서 선택하세요"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.AiButton}
                    onClick={handleAiRecommend}
                    disabled={loading || isLoadingAiRecommend}
                  >
                    {isLoadingAiRecommend ? (
                      <span className={styles.AiButtonContent}>
                        <span className={styles.AiSpinner} />
                        추천 중...
                      </span>
                    ) : (
                      "AI 추천"
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.Field}>
                <div className={styles.LabelRow}>
                  <span className={styles.Label}>턴 수</span>
                </div>
                <div className={styles.TurnRow}>
                  {[3, 4, 5].map((n) => {
                    const active = turn === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`${styles.TurnCard} ${active ? styles.TurnCardActive : ""}`}
                        onClick={() => setTurn(n)}
                        disabled={loading}
                      >
                        <span className={styles.TurnIcon} aria-hidden="true">↻</span>
                        <span className={styles.TurnText}>{n}턴</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.Field}>
                <div className={styles.LabelRow}>
                  <span className={styles.Label}>턴당 제한시간 (초)</span>
                </div>
                <div className={styles.Stepper}>
                  <button
                    className={styles.StepButton}
                    type="button"
                    onClick={() => setTimeLimit(Math.max(15, timeLimit - 5))}
                    disabled={loading || timeLimit <= 15}
                  >
                    -
                  </button>
                  <span className={styles.StepValue}>{timeLimit}초</span>
                  <button
                    className={styles.StepButton}
                    type="button"
                    onClick={() => setTimeLimit(Math.min(60, timeLimit + 5))}
                    disabled={loading || timeLimit >= 60}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className={styles.PrimaryButton}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "생성 중..." : "방 만들기"}
              </button>
            </section>
          </div>
        </main>
      </div>

      <ConfirmModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        confirmText="확인"
        onConfirm={() => setModalOpen(false)}
        onClose={() => setModalOpen(false)}
        cancelText=""
        small={true}
      />
    </div>
  );
}
