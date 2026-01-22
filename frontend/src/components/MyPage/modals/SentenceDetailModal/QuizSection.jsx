import { useState } from "react";
import styles from "./QuizSection.module.css";

export default function QuizSection({
  isOpen,
  onToggle,
  question,
  answer,
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleCheck = () => {
    const normalized = userAnswer.trim().toLowerCase();
    const correctAnswer = answer?.toLowerCase() || "";
    setIsCorrect(normalized === correctAnswer);
    setShowResult(true);
  };

  const handleRetry = () => {
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
  };

  return (
    <div className={styles.Container}>
      <div className={styles.Header}>
        <span className={styles.Title}>빈칸 퀴즈</span>
        <button
          type="button"
          className={styles.ToggleButton}
          onClick={onToggle}
        >
          {isOpen ? "퀴즈 닫기" : "퀴즈 풀기"}
        </button>
      </div>

      {isOpen && question && (
        <div className={styles.QuizBox}>
          <div className={styles.QuizLabel}>빈칸을 채워보세요</div>
          <div className={styles.Question}>{question}</div>

          <input
            type="text"
            className={styles.Input}
            placeholder="빈칸에 들어갈 단어들을 입력하세요"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={showResult}
          />

          {showResult && (
            <div className={`${styles.Result} ${isCorrect ? styles.Correct : styles.Wrong}`}>
              {isCorrect ? "정답입니다! 🎉" : `오답입니다. 정답: ${answer}`}
            </div>
          )}

          <div className={styles.Actions}>
            <button
              type="button"
              className={styles.CheckButton}
              onClick={handleCheck}
              disabled={showResult || !userAnswer.trim()}
            >
              ✓ 정답 확인
            </button>
            <button
              type="button"
              className={styles.RetryButton}
              onClick={handleRetry}
            >
              ↻ 다시하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
