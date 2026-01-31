import AppHeader from '@/components/layout/AppHeader/AppHeader';
import ScriptHeader from '../common/ScriptHeader';
import TurnTabs from '../common/TurnTabs';
import SentenceCard from '../common/SentenceCard';
import styles from './RecordingLayout.module.css';

export default function RecordingLayout({
  currentTurn,
  sentenceCards = [],
  activeCardState = 'idle',
  countdown = 3,
  recordingTime = 0,
  bottomContent,
  onBookmarkToggle = null,
}) {
  return (
    <div className={styles.recordingLayout}>
      <AppHeader />

      <main className={styles.content}>
        <ScriptHeader />
        <TurnTabs currentTurn={currentTurn} />

        <div className={styles.cardsList}>
          {sentenceCards
            .filter((card) => card.isActive)
            .map((card) => (
              <SentenceCard
                key={card.id}
                sentenceId={card.id}
                speaker={card.speaker}
                currentSentence={card.currentSentence}
                totalSentences={card.totalSentences}
                korean={card.korean}
                english={card.english}
                blankWords={card.blankWords}
                score={card.score}
                isActive={card.isActive}
                cardState={activeCardState}
                countdown={countdown}
                recordingTime={recordingTime}
                initialBookmarked={card.isBookmarked}
                onBookmarkToggle={onBookmarkToggle}
              />
            ))}
        </div>
      </main>

      <div className={styles.bottomSection}>{bottomContent}</div>
    </div>
  );
}
