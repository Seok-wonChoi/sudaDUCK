import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./UnexpectedQuestMatchModeModal.module.css";

export default function UnexpectedQuestMatchModeModal({ open, duckSrc, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const firstBtnRef = useRef(null);

  const question = useMemo(
    () => "I couldn't agree with you more on that point.",
    []
  );

  const options = useMemo(
    () => [
      { id: "a", text: "그 부분에 완전 공감해요." },
      { id: "b", text: "그 부분은 잘 모르겠어요." },
      { id: "c", text: "그 부분은 동의하기 어려워요." },
      { id: "d", text: "그 얘기는 넘어가죠." },
    ],
    []
  );

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
      firstBtnRef.current?.focus?.();
    }, 60);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  if (!open) return null;

  const handleChoose = (optId) => {
    setSelected(optId);
    onSubmit?.({ choice: optId });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && selected) {
      e.preventDefault();
      onSubmit?.({ choice: selected });
    }
  };

  return (
    <div className={styles.Backdrop} role="dialog" aria-modal="true" onKeyDown={onKeyDown}>
      <div className={styles.Stage}>
        <div className={styles.Card}>
          <div className={styles.CardTop}>
            <div className={styles.CardTitle}>돌발 퀘스트 - 매칭 모드</div>
            <div className={styles.CardSub}>퍼블리싱 단계: 아무 항목이나 선택해도 진행됩니다.</div>
          </div>

          <div className={styles.QuestionBox}>
            <div className={styles.QuestionLabel}>영어 문장</div>
            <div className={styles.QuestionText}>{question}</div>
          </div>

          <div className={styles.Instruction}>
            <div className={styles.Badge}>매칭</div>
            <div className={styles.InstructionText}>
              위 문장과 의미/뉘앙스가 가장 가까운 표현을 골라주세요.
            </div>
          </div>

          <div className={styles.Options} role="list">
            {options.map((opt, idx) => (
              <button
                key={opt.id}
                type="button"
                ref={idx === 0 ? firstBtnRef : null}
                className={`${styles.OptionBtn} ${
                  selected === opt.id ? styles.OptionBtnSelected : ""
                }`}
                onClick={() => handleChoose(opt.id)}
                onFocus={() => setSelected(opt.id)}
                role="listitem"
              >
                <span className={styles.OptionDot} aria-hidden="true" />
                <span className={styles.OptionText}>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {duckSrc ? <img className={styles.Duck} src={duckSrc} alt="돌발 퀘스트 오리" /> : null}
      </div>
    </div>
  );
}
