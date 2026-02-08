import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./JoinRoomPage.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";

import duckImg from "@/assets/images/duck.png";
import { joinRoom } from "@/api/rooms";
import lightButtonSound from "@/assets/sounds/light_button.wav";
import typeSound from "@/assets/sounds/type.wav";
import { useSoundContext } from "@/context/SoundContext";

const CODE_LEN = 6;
const ROOM_INFO_KEY = "together_room_info";
const MAX_PARTICIPANTS = 4;

function normalizeCode(raw) {
  return (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LEN);
}

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const { getEffectiveVolume, isMuted } = useSoundContext();

  const [codeArr, setCodeArr] = useState(() => Array(CODE_LEN).fill(""));
  const inputsRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const code = useMemo(() => codeArr.join(""), [codeArr]);
  const isComplete = codeArr.every((c) => c.length === 1);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  }, []);

  const playTypeSound = () => {
    if (isMuted) return;
    try {
      const audio = new Audio(typeSound);
      audio.volume = getEffectiveVolume(0.25);
      audio.play().catch(() => {});
    } catch (e) {
      // ë¬´ì‹œ
    }
  };

  useEffect(() => {
    inputsRef.current?.[0]?.focus?.();
  }, []);

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

  const focusAt = (idx) => {
    const el = inputsRef.current?.[idx];
    if (el) el.focus();
  };

  const setAt = (idx, value) => {
    setCodeArr((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleChange = (idx, e) => {
    const v = normalizeCode(e.target.value);

    if (!v) {
      setAt(idx, "");
      return;
    }

    if (v.length > 1) {
      const chars = v.split("");
      setCodeArr(() => {
        const next = Array(CODE_LEN).fill("");
        for (let i = 0; i < CODE_LEN; i += 1) next[i] = chars[i] ? chars[i] : "";
        return next;
      });
      focusAt(Math.min(v.length, CODE_LEN - 1));
      return;
    }

    playTypeSound();
    setAt(idx, v);
    if (idx < CODE_LEN - 1) focusAt(idx + 1);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (codeArr[idx]) {
        setAt(idx, "");
      } else if (idx > 0) {
        setAt(idx - 1, "");
        focusAt(idx - 1);
      }
      return;
    }

    if (e.key === "ArrowLeft" && idx > 0) focusAt(idx - 1);
    if (e.key === "ArrowRight" && idx < CODE_LEN - 1) focusAt(idx + 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = normalizeCode(e.clipboardData.getData("text"));
    if (!pasted) return;

    playTypeSound();

    const chars = pasted.split("");
    setCodeArr(() => {
      const next = Array(CODE_LEN).fill("");
      for (let i = 0; i < CODE_LEN; i += 1) next[i] = chars[i] ? chars[i] : "";
      return next;
    });

    focusAt(Math.min(pasted.length, CODE_LEN - 1));
  };

  const handleSubmit = async () => {
    if (!isComplete || loading) return;

    const roomCode = code.trim().toUpperCase();
    if (roomCode.length !== CODE_LEN) return;

    setLoading(true);
    try {
      const res = await joinRoom({ roomCode });

      const roomInfo = {
        isHost: false,
        maxCount: MAX_PARTICIPANTS,
        roomId: res.roomId,
        joinCode: res.roomCode,
        readyStatus: res.readyStatus,
        alreadyJoined: res.alreadyJoined,
        openviduSessionId: res.openviduSessionId,
        roomTitle: "-",
        topic: "-",
        turnCount: "-",
        timeLimit: "-",
      };

      sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(roomInfo));
      navigate("/together/waiting", { state: roomInfo });
    } catch (e) {
      const errorMsg = e?.response?.data?.message || e?.message || "";
      if (errorMsg.includes("?¸ì›") || errorMsg.includes("ê°€??)) {
        showToast("?¸ì›??ê°€??ì°?ë°©ì…?ˆë‹¤.");
      } else if (errorMsg.includes("ì¡´ì¬?˜ì? ??)) {
        showToast("ì¡´ì¬?˜ì? ?ŠëŠ” ë°©ì…?ˆë‹¤.");
      } else if (errorMsg) {
        showToast(errorMsg);
      } else {
        showToast("ë°?ì°¸ê????¤íŒ¨?ˆìŠµ?ˆë‹¤.");
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

          <h1 className={styles.Title}>ì°¸ì—¬ ì½”ë“œë¥??…ë ¥?˜ì„¸??</h1>
          <p className={styles.Subtitle}>ì¹œêµ¬?ê²Œ ë°›ì? 6?ë¦¬ ì½”ë“œë¥??…ë ¥?´ì£¼?¸ìš”.</p>

          <section className={styles.FormCard} aria-label="ì°¸ì—¬ ì½”ë“œ ?…ë ¥">
            <div className={styles.InputRow} onPaste={handlePaste}>
              {codeArr.map((v, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  className={styles.CodeInput}
                  value={v}
                  onChange={(e) => handleChange(idx, e)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={1}
                  aria-label={`ì½”ë“œ ${idx + 1}ë²ˆì§¸ ?ë¦¬`}
                  disabled={loading}
                />
              ))}
            </div>

            <button
              type="button"
              className={`${styles.JoinButton} ${
                isComplete ? styles.JoinButtonActive : ""
              }`}
              onClick={handleSubmit}
              disabled={!isComplete || loading}
            >
              {loading ? "?…ì¥ ì¤?.." : "ì°¸ì—¬?˜ê¸°"}
            </button>
          </section>

          <div className={styles.DuckWrap}>
            <img className={styles.DuckImg} src={duckImg} alt="?¤ë¦¬" />
            <div className={styles.DuckText}>ì¹œêµ¬?¤ì´ ê¸°ë‹¤ë¦¬ê³  ?ˆì–´??</div>
          </div>
        </main>

        {toastMessage ? <div className={styles.Toast}>{toastMessage}</div> : null}
      </div>
    </div>
  );
}
