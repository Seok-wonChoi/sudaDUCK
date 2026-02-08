import { useState } from "react";
import styles from "./QuizSection.module.css";

export default function QuizSection({
  isOpen,
  onToggle,
  question,
  answer,
  blankScript = '',
  blankWords = [],
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // blankScriptê°€ ?ˆìœ¼ë©??ë™?¼ë¡œ ?´ì¦ˆ ?ì„±
  const displayQuestion = question || blankScript.replace(/\[([^\]]+)\]/g, '______');
  const displayAnswer = answer || (blankWords.length > 0 ? blankWords.join(', ') : '');

  const handleCheck = () => {
    const normalized = userAnswer.trim().toLowerCase();
    const correctAnswer = displayAnswer?.toLowerCase() || "";
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
        <span className={styles.Title}>ë¹ˆì¹¸ ?´ì¦ˆ</span>
        <button
          type="button"
          className={styles.ToggleButton}
          onClick={onToggle}
        >
          {isOpen ? "?´ì¦ˆ ?«ê¸°" : "?´ì¦ˆ ?€ê¸?}
        </button>
      </div>

      {isOpen && (displayQuestion || question) && (
        <div className={styles.QuizBox}>
          <div className={styles.QuizLabel}>ë¹ˆì¹¸??ì±„ì›Œë³´ì„¸??/div>
          <div className={styles.Question}>{displayQuestion}</div>

          <input
            type="text"
            className={styles.Input}
            placeholder="ë¹ˆì¹¸???¤ì–´ê°??¨ì–´?¤ì„ ?…ë ¥?˜ì„¸??(?¬ëŸ¬ ê°œì¸ ê²½ìš° ?¼í‘œë¡?êµ¬ë¶„)"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={showResult}
          />

          {showResult && (
            <div className={`${styles.Result} ${isCorrect ? styles.Correct : styles.Wrong}`}>
              {isCorrect ? "?•ë‹µ?…ë‹ˆ?? ?‰" : `?¤ë‹µ?…ë‹ˆ?? ?•ë‹µ: ${displayAnswer}`}
            </div>
          )}

          <div className={styles.Actions}>
            <button
              type="button"
              className={styles.CheckButton}
              onClick={handleCheck}
              disabled={showResult || !userAnswer.trim()}
            >
              ???•ë‹µ ?•ì¸
            </button>
            <button
              type="button"
              className={styles.RetryButton}
              onClick={handleRetry}
            >
              ???¤ì‹œ?˜ê¸°
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
