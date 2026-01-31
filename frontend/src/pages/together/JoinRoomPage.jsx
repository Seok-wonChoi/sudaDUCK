import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./JoinRoomPage.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import TipBanner from "@/components/common/TipBanner/TipBanner";

import duckImg from "@/assets/images/duck.png";
import { joinRoom } from "@/api/rooms";

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

  useEffect(() => {
    inputsRef.current?.[0]?.focus?.();
  }, []);

  const handleBack = () => {
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
      console.log("[JoinRoom] 방 참가 시도:", roomCode);

      // POST /api/v1/rooms/join
      const res = await joinRoom({ roomCode });

      console.log("[JoinRoom] 방 참가 성공:", res);

      const roomInfo = {
        isHost: false,
        maxCount: MAX_PARTICIPANTS,

        roomId: res.roomId,
        joinCode: res.roomCode,
        readyStatus: res.readyStatus,
        alreadyJoined: res.alreadyJoined,

        roomTitle: "-",
        topic: "-",
        turnCount: "-",
      };

      sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(roomInfo));
      navigate("/together/waiting", { state: roomInfo });
    } catch (e) {
      console.error("[JoinRoom] 방 참가 실패:", e);

      // 에러 메시지에서 인원 초과 여부 확인
      const errorMsg = e?.response?.data?.message || e?.message || "";

      if (
        errorMsg.includes("인원") ||
        errorMsg.includes("가득") ||
        errorMsg.includes("full") ||
        errorMsg.includes("maximum") ||
        e?.response?.status === 400
      ) {
        showToast("인원이 가득 찬 방입니다.");
      } else if (errorMsg.includes("존재하지 않") || errorMsg.includes("not found")) {
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

          <div className={styles.TipWrap}>
            <TipBanner text="Tip: 코드를 복사해서 붙여넣기 할 수 있어요!" />
          </div>

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
