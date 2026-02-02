import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MakeRoomPage.module.css";
import { createSession } from "@/api/openVidu"; // 👈 오픈비듀
import AppHeader from "@/components/layout/AppHeader/AppHeader";
import TipBanner from "@/components/common/TipBanner/TipBanner";

import { createRoom, getTopics, joinRoom } from "@/api/rooms";

const ROOM_INFO_KEY = "together_room_info";

export default function MakeRoomPage() {
  const navigate = useNavigate();

  const hotTopics = useMemo(
    () => [
      "첫 아르바이트 추억",
      "최악의 데이트",
      "나만의 취미생활",
      "학창시절 이야기",
      "여행 경험담",
      "좋아하는 음식",
    ],
    []
  );

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [turn, setTurn] = useState(3);
  const [loading, setLoading] = useState(false);

  const titleCount = title.length;

  const handleBack = () => {
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

  const handlePickTopic = (t) => {
    setTopic(t);
  };

  const handleAiRecommend = async () => {
    try {
      const data = await getTopics();
      const topics = data.topics || [];
      if (topics.length > 0) {
        // 서버에서 받은 주제 중 랜덤으로 하나 선택
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        setTopic(randomTopic);
      }
    } catch (e) {
      console.error("AI 주제 추천 API 호출 실패:", e);
      // API 실패 시 로컬 hotTopics에서 선택 (fallback)
      if (hotTopics.length > 0) {
        const next = hotTopics[Math.floor(Math.random() * hotTopics.length)];
        setTopic(next);
      }
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
      //오픈비듀 관련 세션 생성
      const ovSessionId = await createSession(); 
      console.log("1. 오픈비두 세션 확보:", ovSessionId);





      // 1. 방 생성: POST /api/v1/rooms
      const res = await createRoom({
        title: title.trim(),
        topic: topic.trim(),
        turnCnt: turn,
        openviduSessionId: ovSessionId // 👈 백엔드 DTO에 추가한 필드 오픈비듀 세션이올시다!핳핳
      });

      // 2. 방 참가: POST /api/v1/rooms/join (방장도 명시적으로 참가해야 함)
      try {
        await joinRoom({ roomCode: res.roomCode });
        console.log("방 생성 후 자동 참가 성공");
      } catch (joinError) {
        console.error("방 참가 실패:", joinError);
        // 참가 실패해도 방 생성은 성공했으므로 계속 진행
      }

      // WaitingRoomPage에서 쓰는 형태로 맞춤
      const roomInfo = {
        isHost: true,
        maxCount: 4,

        roomId: res.roomId,
        hostUserId: res.hostUserId,
        createdAt: res.createdAt,

        roomTitle: res.title,
        topic: res.topic,
        turnCount: res.turnCnt,

        joinCode: res.roomCode,
        inviteCode: res.roomCode, // joinCode와 inviteCode 모두 설정

        // ★ [중요] 세션 ID를 꼭 저장해서 대기실로 가져가야 함!
        openviduSessionId: ovSessionId
      };

      sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(roomInfo));
      navigate("/together/waiting", { state: roomInfo });
    } catch (e) {
      alert(e.message || "방 생성에 실패했습니다.");
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
          >
            &lt;
          </button>

          <h1 className={styles.Title}>방 만들기</h1>
          <p className={styles.Subtitle}>친구들과 함께할 수다방을 만들어보세요</p>

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
                  disabled={loading}
                >
                  AI 추천
                </button>
              </div>

              <div className={styles.HotRow}>
                <span className={styles.HotDot} aria-hidden="true" />
                <span className={styles.HotText}>인기 주제</span>
              </div>

              <div className={styles.TopicRow}>
                {hotTopics.map((t) => {
                  const active = topic === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.TopicChip} ${
                        active ? styles.TopicChipActive : ""
                      }`}
                      onClick={() => handlePickTopic(t)}
                      disabled={loading}
                    >
                      {t}
                    </button>
                  );
                })}
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
                      className={`${styles.TurnCard} ${
                        active ? styles.TurnCardActive : ""
                      }`}
                      onClick={() => setTurn(n)}
                      disabled={loading}
                    >
                      <span className={styles.TurnIcon} aria-hidden="true">
                        ↻
                      </span>
                      <span className={styles.TurnText}>{n}턴</span>
                    </button>
                  );
                })}
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

          <div className={styles.TipWrap}>
            <TipBanner text="Tip: 방을 만들면 참여 코드가 생성되어 친구들에게 공유할 수 있어요!" />
          </div>
        </main>
      </div>
    </div>
  );
}
