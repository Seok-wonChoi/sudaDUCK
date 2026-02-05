import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ScriptHeader from "../common/ScriptHeader";
import TurnTabs from "../common/TurnTabs";
import SentenceCard from "../common/SentenceCard";
import styles from "./RecordingLayout.module.css";

export default function RecordingLayout({
  currentTurn,
  sentenceCards = [],
  activeCardState = "idle",
  countdown = 3,
  recordingTime = 0,
  recordingCountdown = 10, // 녹음 카운트다운
  bottomContent,
  onBookmarkToggle = null,
  onStop = null,
  showBlanks = true,
  onToggleBlanks = null,
  totalTurns = 3,
  isAllDone = false,
  onTurnClick = null,
  selectedTurnForReport = null,
  // 로고 클릭 나가기 관련 props
  logoExitMessage,
  onLogoExit,
}) {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppHeader logoExitMessage={logoExitMessage} onLogoExit={onLogoExit} />

        <main className={styles.content}>
          <ScriptHeader showBlanks={showBlanks} onToggleBlanks={onToggleBlanks} />
          <TurnTabs
            currentTurn={currentTurn}
            totalTurns={totalTurns}
            isAllDone={isAllDone}
            onTurnClick={onTurnClick}
            selectedTurnForReport={selectedTurnForReport}
          />

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
                  averageScore={card.averageScore}
                  isActive={card.isActive}
                  cardState={activeCardState}
                  countdown={countdown}
                  recordingTime={recordingTime}
                  recordingCountdown={recordingCountdown}
                  initialBookmarked={card.isBookmarked}
                  onBookmarkToggle={onBookmarkToggle}
                  onStop={onStop}
                  showBlanks={showBlanks}
                  onToggleBlanks={onToggleBlanks}
                />
              ))}
          </div>
        </main>

        <div className={styles.bottomSection}>{bottomContent}</div>
      </div>
    </div>
  );
}
