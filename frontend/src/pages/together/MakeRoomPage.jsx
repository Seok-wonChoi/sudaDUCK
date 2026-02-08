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

  // ë°?ë§Œë“¤ê¸?ê¶Œí•œ ì²´í¬
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
        alert("ë°?ë§Œë“¤ê¸?ê¶Œí•œ???†ìŠµ?ˆë‹¤.");
        navigate("/together", { replace: true });
      }
    } catch (e) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const hotTopics = useMemo(
    () => [
      "ì²??„ë¥´ë°”ì´??ì¶”ì–µ",
      "ìµœì•…???°ì´??,
      "?˜ë§Œ??ì·¨ë??í™œ",
      "?™ì°½?œì ˆ ?´ì•¼ê¸?,
      "?¬í–‰ ê²½í—˜??,
      "ì¢‹ì•„?˜ëŠ” ?Œì‹",
    ],
    [],
  );

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [turn, setTurn] = useState(3);
  const [timeLimit, setTimeLimit] = useState(40);
  const [loading, setLoading] = useState(false);
  const [isLoadingAiRecommend, setIsLoadingAiRecommend] = useState(false);

  // ëª¨ë‹¬ ?íƒœ
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
        // ë¬´ì‹œ
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
      console.error("AI ì£¼ì œ ì¶”ì²œ API ?¸ì¶œ ?¤íŒ¨:", e);
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
      alert("ë°??œëª©???…ë ¥?´ì£¼?¸ìš”.");
      return;
    }
    if (!topic.trim()) {
      alert("?˜ë‹¤ ì£¼ì œë¥??…ë ¥?˜ê±°??? íƒ?´ì£¼?¸ìš”.");
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
        console.error("ë°?ì°¸ê? ?¤íŒ¨:", joinError);
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
      const errorMessage = e.response?.data?.message || e.message || "ë°??ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.";
      if (errorMessage.includes("ë°??œëª©") && errorMessage.includes("ë¶€?ì ˆ")) {
        setModalTitle("? ï¸ ì£¼ì˜");
        setModalMessage("ë¶€?ì ˆ??ë°??œëª© ?¤ì‹œ ?ì„±?´ì£¼?¸ìš”");
        setModalOpen(true);
      } else if (errorMessage.includes("ì£¼ì œ") && errorMessage.includes("ë¶€?ì ˆ")) {
        setModalTitle("? ï¸ ì£¼ì˜");
        setModalMessage("ë¶€?ì ˆ??ë°?ì£¼ì œ?…ë‹ˆ??");
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
            aria-label="?¤ë¡œ ê°€ê¸?
            disabled={loading}
            data-click-sound="false"
          >
            &lt;
          </button>

          <h1 className={styles.Title}>ë°?ë§Œë“¤ê¸?/h1>
          <p className={styles.Subtitle}>
            ì¹œêµ¬?¤ê³¼ ?¨ê»˜???˜ë‹¤ë°©ì„ ë§Œë“¤?´ë³´?¸ìš” ?®
          </p>

          <div className={styles.Content}>
            <section className={styles.FormCard} aria-label="ë°?ë§Œë“¤ê¸???>
              <div className={styles.Field}>
                <div className={styles.LabelRow}>
                  <span className={styles.Label}>ë°??œëª©</span>
                  <span className={styles.Required}>*</span>
                </div>
                <input
                  className={styles.Input}
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="?? ì¹œêµ¬?¤ê³¼ ?˜ë‹¤?€??
                  disabled={loading}
                />
                <div className={styles.Counter}>{titleCount}/30</div>
              </div>

              <div className={styles.Field}>
                <div className={styles.LabelRow}>
                  <span className={styles.Label}>?˜ë‹¤ ì£¼ì œ</span>
                  <span className={styles.Required}>*</span>
                </div>
                <div className={styles.TopicInputRow}>
                  <input
                    className={styles.Input}
                    value={topic}
                    onChange={handleTopicChange}
                    placeholder="ì§ì ‘ ?…ë ¥?˜ê±°???„ë˜?ì„œ ? íƒ?˜ì„¸??
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
                        ì¶”ì²œ ì¤?..
                      </span>
                    ) : (
                      "AI ì¶”ì²œ"
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.Field}>
                <div className={styles.LabelRow}>
                  <span className={styles.Label}>????/span>
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
                        <span className={styles.TurnIcon} aria-hidden="true">??/span>
                        <span className={styles.TurnText}>{n}??/span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.Field}>
                <div className={styles.LabelRow}>
                  <span className={styles.Label}>?´ë‹¹ ?œí•œ?œê°„ (ì´?</span>
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
                  <span className={styles.StepValue}>{timeLimit}ì´?/span>
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
                {loading ? "?ì„± ì¤?.." : "ë°?ë§Œë“¤ê¸?}
              </button>
            </section>
          </div>
        </main>
      </div>

      <ConfirmModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        confirmText="?•ì¸"
        onConfirm={() => setModalOpen(false)}
        onClose={() => setModalOpen(false)}
        cancelText=""
        small={true}
      />
    </div>
  );
}
