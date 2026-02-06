import { useRef, useEffect } from 'react';
import styles from './BlankFillSentence.module.css';

// 모바일 여부 감지
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
};

// 부드러운 스크롤로 input을 화면에 보이게 조정
const scrollToInput = (inputElement) => {
  if (!inputElement) return;

  setTimeout(() => {
    const rect = inputElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // input이 화면 하단에 너무 가까우면 스크롤
    if (rect.bottom > viewportHeight * 0.6) {
      const scrollOffset = rect.top - (viewportHeight * 0.3); // 화면의 30% 위치로
      
      window.scrollBy({
        top: scrollOffset,
        behavior: 'smooth'
      });
    }
  }, 300); // 키보드가 올라오는 시간 대기
};

export default function BlankFillSentence({
  parts = [],
  blanks = [],
  currentBlankIndex = 0,
  onBlankChange,
  onBlankSubmit,
  onBlankClick  // 추가
}) {
  const inputRefs = useRef([]);
  const mobile = useRef(isMobile());

  // 현재 빈칸에 자동 포커스
  useEffect(() => {
    if (inputRefs.current[currentBlankIndex]) {
      const inputElement = inputRefs.current[currentBlankIndex];
      inputElement.focus();
      
      // 모바일에서만 스크롤 조정
      if (mobile.current) {
        scrollToInput(inputElement);
      }
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

  // 빈칸 클릭 핸들러 - 마우스로 클릭 시 해당 빈칸으로 포커스 이동
  const handleBlankClick = (idx) => {
    // 부모 컴포넌트에 인덱스 변경 알림
    if (onBlankClick) {
      onBlankClick(idx);
    }
    
    if (inputRefs.current[idx]) {
      const inputElement = inputRefs.current[idx];
      inputElement.focus();
      
      // 모바일에서만 스크롤 조정
      if (mobile.current) {
        scrollToInput(inputElement);
      }
    }
  };

  // 포커스 이벤트 핸들러
  const handleFocus = (idx) => {
    // 모바일에서 포커스 시 스크롤 조정
    if (mobile.current && inputRefs.current[idx]) {
      scrollToInput(inputRefs.current[idx]);
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
                      : blanks[idx].status === 'filled'
                      ? styles.filled
                      : idx === currentBlankIndex
                      ? styles.active
                      : styles.empty
                  }`}
                  style={{
                    width: blanks[idx].answer
                      ? `${blanks[idx].answer.length * 1.5 + 2}ch`
                      : '7ch'
                  }}
                  value={blanks[idx].value || ''}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onClick={() => handleBlankClick(idx)}
                  onFocus={() => handleFocus(idx)}
                  placeholder=""
                  autoComplete="off"
                  spellCheck="false"
                  // 모바일에서 키보드 타입 최적화
                  inputMode="text"
                  enterKeyHint="next"
                />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
