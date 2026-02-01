import styles from './QuestionPanel.module.css';
import QuestionInfo from './QuestionInfo';
import KoreanSentence from './KoreanSentence';
import BlankFillSentence from './BlankFillSentence';

export default function QuestionPanel({
  current = 1,
  total = 8,
  score = 0,
  koreanSentence = '',
  englishParts = [],
  blanks = [],
  currentBlankIndex = 0,
  onBlankChange,
  onBlankSubmit
}) {
  return (
    <div className={styles.panel}>
      <QuestionInfo current={current} total={total} score={score} />
      <KoreanSentence sentence={koreanSentence} />
      <BlankFillSentence
        parts={englishParts}
        blanks={blanks}
        currentBlankIndex={currentBlankIndex}
        onBlankChange={onBlankChange}
        onBlankSubmit={onBlankSubmit}
      />
    </div>
  );
}
