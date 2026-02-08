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
      { id: "a", text: "ê·?ë¶€ë¶„ì— ?„ì „ ê³µê°?´ìš”." },
      { id: "b", text: "ê·?ë¶€ë¶„ì? ??ëª¨ë¥´ê² ì–´??" },
      { id: "c", text: "ê·?ë¶€ë¶„ì? ?™ì˜?˜ê¸° ?´ë ¤?Œìš”." },
      { id: "d", text: "ê·??˜ê¸°???˜ì–´ê°€ì£?" },
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
            <div className={styles.CardTitle}>?Œë°œ ?˜ìŠ¤??- ë§¤ì¹­ ëª¨ë“œ</div>
            <div className={styles.CardSub}>?¼ë¸”ë¦¬ì‹± ?¨ê³„: ?„ë¬´ ??ª©?´ë‚˜ ? íƒ?´ë„ ì§„í–‰?©ë‹ˆ??</div>
          </div>

          <div className={styles.QuestionBox}>
            <div className={styles.QuestionLabel}>?ì–´ ë¬¸ì¥</div>
            <div className={styles.QuestionText}>{question}</div>
          </div>

          <div className={styles.Instruction}>
            <div className={styles.Badge}>ë§¤ì¹­</div>
            <div className={styles.InstructionText}>
              ??ë¬¸ì¥ê³??˜ë?/?˜ì•™?¤ê? ê°€??ê°€ê¹Œìš´ ?œí˜„??ê³¨ë¼ì£¼ì„¸??
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

        {duckSrc ? <img className={styles.Duck} src={duckSrc} alt="?Œë°œ ?˜ìŠ¤???¤ë¦¬" /> : null}
      </div>
    </div>
  );
}
