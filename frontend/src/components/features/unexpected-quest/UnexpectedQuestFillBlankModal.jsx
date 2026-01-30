import { useEffect, useRef, useState } from "react";
import styles from "./UnexpectedQuestFillBlankModal.module.css";

export default function UnexpectedQuestFillBlankModal({ open, duckSrc, onSubmit }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const t = setTimeout(() => {
      firstRef.current?.focus?.();
    }, 50);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  if (!open) return null;

  const submit = () => {
    onSubmit?.({ a, b });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={styles.Backdrop} role="dialog" aria-modal="true">
      <div className={styles.Stage}>
        <div className={styles.Card}>
          <div className={styles.CardTitle}>돌발 퀘스트!!</div>
          <div className={styles.CardSub}>빈칸을 채워보세요.</div>

          <div className={styles.FormRow}>
            <span className={styles.Word}>The</span>
            <input
              ref={firstRef}
              className={styles.Input}
              value={a}
              onChange={(e) => setA(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder=""
            />
            <span className={styles.Word}>was</span>
            <input
              className={styles.Input}
              value={b}
              onChange={(e) => setB(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder=""
            />
            <span className={styles.Word}>too.</span>
          </div>

          <button type="button" className={styles.SubmitBtn} onClick={submit}>
            입력
          </button>

          <div className={styles.Hint}>퍼블리싱 단계: 아무 단어나 입력하면 진행됩니다.</div>
        </div>

        {duckSrc ? <img className={styles.Duck} src={duckSrc} alt="돌발 퀘스트 오리" /> : null}
      </div>
    </div>
  );
}
