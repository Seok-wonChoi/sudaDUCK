import { useRef, useEffect } from 'react';
import styles from './BlankFillSentence.module.css';

export default function BlankFillSentence({
  parts = [],
  blanks = [],
  currentBlankIndex = 0,
  onBlankChange,
  onBlankSubmit
}) {
  const inputRefs = useRef([]);

  // 현재 빈칸에 자동 포커스
  useEffect(() => {
    if (inputRefs.current[currentBlankIndex]) {
      inputRefs.current[currentBlankIndex].focus();
    }
  }, [currentBlankIndex]);

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onBlankSubmit) {
        onBlankSubmit(idx);
      }
    }
  };

  const handleChange = (e, idx) => {
    if (onBlankChange) {
      onBlankChange(idx, e.target.value);
    }
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
                  className={`${styles.blank} ${styles.blankInput} ${
                    blanks[idx].status === 'correct'
                      ? styles.correct
                      : blanks[idx].status === 'wrong'
                      ? styles.wrong
                      : idx === currentBlankIndex
                      ? styles.active
                      : styles.empty
                  }`}
                  value={blanks[idx].value || ''}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  disabled={blanks[idx].status !== 'empty' || idx !== currentBlankIndex}
                  placeholder={idx === currentBlankIndex ? '' : ''}
                />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
