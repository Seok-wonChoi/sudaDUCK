import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MakeRoomPage.module.css";

import AppHeader from "@/components/Layout/AppHeader/AppHeader";
import TipBanner from "@/components/common/TipBanner/TipBanner";

function createInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

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

  const handleAiRecommend = () => {
    if (hotTopics.length === 0) return;
    const next = hotTopics[Math.floor(Math.random() * hotTopics.length)];
    setTopic(next);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("방 제목을 입력해주세요.");
      return;
    }
    if (!topic.trim()) {
      alert("수다 주제를 입력하거나 선택해주세요.");
      return;
    }

    const payload = {
      roomTitle: title.trim(),
      roomTopic: topic.trim(),
      turnCount: turn,
      inviteCode: createInviteCode(),
    };

    sessionStorage.setItem("roomCreateResult", JSON.stringify(payload));
    navigate("/together/created", { state: payload });
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
          >
            <span className={styles.BackIcon} aria-hidden="true">
              &lt;
            </span>
            <span className={styles.BackText}>뒤로가기</span>
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
                />
                <button
                  type="button"
                  className={styles.AiButton}
                  onClick={handleAiRecommend}
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
                      className={`${styles.TopicChip} ${active ? styles.TopicChipActive : ""}`}
                      onClick={() => handlePickTopic(t)}
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
                      className={`${styles.TurnCard} ${active ? styles.TurnCardActive : ""}`}
                      onClick={() => setTurn(n)}
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

            <button type="button" className={styles.PrimaryButton} onClick={handleSubmit}>
              방 만들기
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
