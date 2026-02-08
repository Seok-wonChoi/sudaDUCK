import styles from './ReviewPanel.module.css';
import ReviewCard from './ReviewCard';

export default function ReviewPanel({ 
  questions = [],
  onBack
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.topActions}>
        <button className={styles.backButton} onClick={onBack}>
          &larr; ê²°ê³¼ë¡??Œì•„ê°€ê¸?
        </button>
      </div>
      
      <div className={styles.header}>
        <h2 className={styles.title}>?„ì²´ ë¬¸ì œ ë¦¬ë·°</h2>
        <p className={styles.subtitle}>?€ë¦?ë¶€ë¶„ê³¼ ?•ë‹µ???•ì¸?´ë³´?¸ìš”</p>
      </div>

      <div className={styles.cardList}>
        {questions.map((question, idx) => (
          <ReviewCard
            key={idx}
            questionNumber={idx + 1}
            korean={question.koreanSentence}
            blanks={question.blanks}
            englishParts={question.englishParts}
          />
        ))}
      </div>
    </div>
  );
}
