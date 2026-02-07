import { useRef, useEffect } from 'react';
import styles from './BlankFillSentence.module.css';

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
};

const scrollToInput = (inputElement) => {
  if (!inputElement) return;
  setTimeout(() => {
    const rect = inputElement.getBoundingClientRect();
    if (rect.bottom > window.innerHeight * 0.6) {
      window.scrollBy({ top: rect.top - (window.innerHeight * 0.3), behavior: 'smooth' });
    }
  }, 300);
};

export default function BlankFillSentence({
  parts = [],
  blanks = [],
  currentBlankIndex = 0,
  onBlankChange,
  onBlankSubmit,
  onBlankClick
}) {
  const inputRefs = useRef([]);
  const mobile = useRef(isMobile());

  useEffect(() => {
    if (inputRefs.current[currentBlankIndex]) {
      const inputElement = inputRefs.current[currentBlankIndex];
      inputElement.focus();
      if (mobile.current) scrollToInput(inputElement);
    }
  }, [currentBlankIndex]);

  // 글자 수에 따른 동적 너비 계산 (최소 4ch, 최대 20ch)
  const getInputWidth = (idx) => {
    const answerLen = blanks[idx]?.answer?.length || 0;
    const valueLen = (blanks[idx]?.value || "").length;
    const maxLen = Math.max(answerLen, valueLen, 4);
    // 너비를 기존 대비 약 2배로 확대
    return `${maxLen * 2.5 + 4}ch`;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <span className={styles.labelBlue}>English</span>
        <span className={styles.labelGray}> - 빈칸 채우기</span>
      </div>
      <div className={styles.card}>
        <div className={styles.sentence}>
          {parts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < blanks.length && (
                <input
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  className={`${styles.blank} ${idx === currentBlankIndex ? styles.active : styles.filled}`}
                  style={{ width: getInputWidth(idx) }}
                  value={blanks[idx].value || ''}
                  onChange={(e) => onBlankChange?.(idx, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onBlankSubmit?.(idx)}
                  onClick={() => onBlankClick?.(idx)}
                  autoComplete="off"
                  spellCheck="false"
                />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}