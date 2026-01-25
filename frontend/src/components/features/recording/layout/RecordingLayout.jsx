import AppHeader from '@/components/layout/AppHeader/AppHeader';
import ScriptHeader from '../common/ScriptHeader';
import TurnTabs from '../common/TurnTabs';
import SentenceCard from '../common/SentenceCard';
import styles from './RecordingLayout.module.css';

export default function RecordingLayout({
  currentTurn,
  currentSentence,
  bottomContent,
  cardProps = {}
}) {
  return (
    <div className={styles.recordingLayout}>
      <AppHeader />

      <main className={styles.content}>
        <ScriptHeader />
        <TurnTabs currentTurn={currentTurn} />
        <SentenceCard 
          currentSentence={currentSentence} 
          totalSentences={3}
          {...cardProps}
        />
      </main>

      <div className={styles.bottomSection}>{bottomContent}</div>
    </div>
  );
}
