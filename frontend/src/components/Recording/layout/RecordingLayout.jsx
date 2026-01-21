import Header from '@/components/Recording/common/Header';
import ScriptHeader from '@/components/Recording/common/ScriptHeader';
import TurnTabs from '@/components/Recording/common/TurnTabs';
import SentenceCard from '@/components/Recording/common/SentenceCard';
import styles from './RecordingLayout.module.css';

export default function RecordingLayout({
  currentTurn,
  currentSentence,
  bottomContent,
  cardProps = {}
}) {
  return (
    <div className={styles.recordingLayout}>
      <Header />

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
