import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./JoinRoomPage.module.css";

import AppHeader from "../../components/Layout/AppHeader/AppHeader";
import TipBanner from "../../components/Main/TipBanner/TipBanner";

import duckImg from "../../assets/images/duck.png";

const CODE_LEN = 6;

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

  const code = useMemo(() => codeArr.join(""), [codeArr]);
  const isComplete = codeArr.every((c) => c.length === 1);

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

  const handleSubmit = () => {
    if (!isComplete) return;
    console.log("참여 코드:", code);
    alert(`참여 코드: ${code}`);
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
                  maxLength={CODE_LEN}
                  aria-label={`코드 ${idx + 1}번째 자리`}
                />
              ))}
            </div>

            <button
              type="button"
              className={`${styles.JoinButton} ${isComplete ? styles.JoinButtonActive : ""}`}
              onClick={handleSubmit}
              disabled={!isComplete}
            >
              참여하기
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
      </div>
    </div>
  );
}
