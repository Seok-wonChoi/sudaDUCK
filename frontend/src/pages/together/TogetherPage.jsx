import styles from "./TogetherPage.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ActionCard from "@/components/common/ActionCard/ActionCard";
import StatsSection from "@/components/features/main/StatsSection/StatsSection";
import TipBanner from "@/components/common/TipBanner/TipBanner";
import { getMypageSummary } from "@/api/mypage";
import { useSoundContext } from "@/context/SoundContext";

import makeRoomIcon from "@/assets/icons/make_room2.png";
import joinRoomIcon from "@/assets/icons/join_room2.png";
import lightButtonSound from "@/assets/sounds/light_button.wav";

export default function TogetherPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getEffectiveVolume, isMuted } = useSoundContext();

  // ë°?ë§Œë“¤ê¸?ê¶Œí•œ???ˆëŠ” ?¹ì • ?¬ìš©??ID ë¦¬ìŠ¤??
  const ALLOWED_USER_IDS = useMemo(() => [
    4719057912,
    4719307718,
    4719309052,
    4720876392
  ], []);

  // ?„ì¬ ? ì?ê°€ ë°?ë§Œë“¤ê¸?ê¶Œí•œ???ˆëŠ”ì§€ ?•ì¸
  const canMakeRoom = useMemo(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      return ALLOWED_USER_IDS.includes(Number(decoded.userId));
    } catch (e) {
      return false;
    }
  }, [ALLOWED_USER_IDS]);

  // ??MainPage?ì„œ ?˜ê²¨ì¤€ summary ?ˆìœ¼ë©?ê·¸ê±¸ ì´ˆê¸°ê°’ìœ¼ë¡??¬ìš©
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

  // ?µê³„ ?°ì´??ë¡œë“œ (ìµœì‹ ??
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
        console.error("?µê³„ ?°ì´??ë¡œë“œ ?¤íŒ¨:", error);
      }
    };

    loadSummary();

    return () => {
      alive = false;
    };
  }, []);

  // location state?ì„œ ? ìŠ¤??ë©”ì‹œì§€ ?•ì¸
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
    if (!isMuted) {
      try {
        const audio = new Audio(lightButtonSound);
        audio.volume = getEffectiveVolume(0.1);
        audio.play().catch(() => {});
      } catch (e) {
        // ?¬ìš´???¬ìƒ ?¤íŒ¨ ë¬´ì‹œ
      }
    }
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
            aria-label="?¤ë¡œ ê°€ê¸?
            data-click-sound="false"
          >
            &lt;
          </button>

          <h1 className={styles.Title}>?¨ê»˜ ?˜ê¸°</h1>
          <p className={styles.Subtitle}>
            ?ˆë¡œ??ë°©ì„ ë§Œë“¤ê±°ë‚˜ ì¹œêµ¬??ë°©ì— ì°¸ì—¬?´ë³´?¸ìš” ?®
          </p>

          <section className={styles.CardRow} aria-label="?¨ê»˜?˜ê¸° ë©”ë‰´">
            {canMakeRoom && (
              <ActionCard
                title="ë°?ë§Œë“¤ê¸?
                description="?ˆë¡œ??ë°©ì„ ë§Œë“¤ê³?ì¹œêµ¬?¤ì„ ì´ˆë??˜ì„¸??"
                iconSrc={makeRoomIcon}
                iconAlt="ë°?ë§Œë“¤ê¸?
                onClick={handleMakeRoom}
                variant="make"
              />
            )}
            <ActionCard
              title="ì°¸ì—¬?˜ê¸°"
              description="ì¹œêµ¬ê°€ ê³µìœ ??ì°¸ì—¬ ì½”ë“œë¡?ë°©ì— ?…ì¥?˜ì„¸??"
              iconSrc={joinRoomIcon}
              iconAlt="ì°¸ì—¬?˜ê¸°"
              onClick={handleJoinRoom}
            />
          </section>
        </main>

        <section className={styles.Bottom} aria-label="?µê³„">
          <TipBanner text="Tip: ë°©ì„ ë§Œë“¤ê±°ë‚˜ ì°¸ì—¬?´ì„œ ?¨ê»˜ ?˜ê¸° ëª¨ë“œë¥??œì‘?´ë³´?¸ìš”!" />
          <StatsSection
            stats={[
              { value: "?”¥", label: "?¤ëŠ˜???´ì‹¬???´ë³¼ê¹Œìš”?" },
              { value: `${summary.attendanceDays}??, label: "?°ì† ?™ìŠµ" },
              { value: `${summary.sentenceCount}ê°?, label: "?€?¥ëœ ë¬¸ì¥" },
            ]}
          />
        </section>

        {toastMessage ? <div className={styles.Toast}>{toastMessage}</div> : null}
      </div>
    </div>
  );
}
