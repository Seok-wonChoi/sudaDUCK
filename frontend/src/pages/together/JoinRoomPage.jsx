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

// [시연 전용] 방 입장이 허용된 사용자 ID 목록
const ALLOWED_USER_IDS = [
  "4709112633",
  "4719057912",
  "4719307718",
  "4719309052",
  "4720718435",
  "4720876392"
];

// 토큰에서 사용자 ID 추출하는 헬퍼 함수
function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);
    return (
      payload.memberId ??
      payload.userId ??
      payload.id ??
      payload.user_id ??
      payload.sub ??
      null
    );
  } catch {
    return null;
  }
}

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
      // 무시
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
        // 무시
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

    // [시연 전용] 방 입장 권한 체크
    const myId = getUserIdFromToken();
    const isAllowed = myId && ALLOWED_USER_IDS.includes(String(myId));

    if (!isAllowed) {
      showToast("지금은 시연 중이라 방 참가를 제한하고 있습니다.");
      return;
    }

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
      if (errorMsg.includes("인원") || errorMsg.includes("가득")) {
        showToast("인원이 가득 찬 방입니다.");
      } else if (errorMsg.includes("존재하지 않")) {
        showToast("존재하지 않는 방입니다.");
      } else if (errorMsg) {
        showToast(errorMsg);
      } else {
        showToast("방 참가에 실패했습니다.");
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

          <h1 className={styles.Title}>참여 코드를 입력하세요.</h1>
          <p className={styles.Subtitle}>친구에게 받은 6자리 코드를 입력해주세요.</p>

          <section className={styles.FormCard} aria-label="참여 코드 입력">
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
                  aria-label={`코드 ${idx + 1}번째 자리`}
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
              {loading ? "입장 중..." : "참여하기"}
            </button>
          </section>

          <div className={styles.DuckWrap}>
            <img className={styles.DuckImg} src={duckImg} alt="오리" />
            <div className={styles.DuckText}>친구들이 기다리고 있어요!</div>
          </div>
        </main>

        {toastMessage ? <div className={styles.Toast}>{toastMessage}</div> : null}
      </div>
    </div>
  );
}