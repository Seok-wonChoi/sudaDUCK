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
  recordingCountdown = 10, // ?πÏùå Ïπ¥Ïö¥?∏Îã§??
  bottomContent,
  onBookmarkToggle = null,
  onStop = null,
  showBlanks = true,
  isSubmitting = false,
  onToggleBlanks = null,
  totalTurns = 3,
  isAllDone = false,
  onTurnClick = null,
  selectedTurnForReport = null,
  // Î°úÍ≥† ?¥Î¶≠ ?òÍ?Í∏?Í¥Ä??props
  logoExitMessage,
  onLogoExit,
  // ?ÑÎ°ú???¥Î¶≠ Ï∞®Îã®
  disableProfileClick = false,
}) {
  const isRecordingPhase = activeCardState === 'record_timer' || activeCardState === 'recording' || activeCardState === 'record_done';

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <AppHeader logoExitMessage={logoExitMessage} onLogoExit={onLogoExit} disableProfileClick={disableProfileClick} />

        <main className={styles.content}>
          <ScriptHeader />
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
                  isSubmitting={isSubmitting}
                  onToggleBlanks={onToggleBlanks}
                />
              ))}
          </div>

          {/* ?πÏùå Ï°∞Ïûë ?πÏÖò (Ïπ¥Îìú ?ÑÎûò Î∞∞Ïπò) */}
          {isRecordingPhase && (
            <div className={styles.recordingControlSection}>
              {activeCardState === 'record_timer' && (
                <div className={styles.countdownWrapper}>
                  <div className={styles.countdownCircleBig}>
                    <span className={styles.countdownNumberBig}>{Math.max(0, countdown)}</span>
                  </div>
                  <span className={styles.statusTextLarge}>?†Ïãú ???πÏùå???úÏûë?©Îãà??/span>
                  <span className={styles.recordingHintLarge}>?ÅÏñ¥Î°??ΩÏùÑ Ï§ÄÎπ?!! ?éôÔ∏?/span>
                </div>
              )}

              {activeCardState === 'recording' && (
                <div className={styles.recordingColumn}>
                  <div className={styles.recordingActive}>
                    <div className={styles.sideArea}>
                      <div className={styles.switchWrapper}>
                        <span className={styles.switchLabel}>ÎπàÏπ∏</span>
                        <button 
                          type="button" 
                          className={`${styles.iosSwitch} ${showBlanks ? styles.switchOn : ""}`}
                          onClick={onToggleBlanks}
                          disabled={isSubmitting}
                        >
                          <div className={styles.switchHandle} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.centerArea}>
                      <div className={styles.recordingCircle}>
                        <span className={styles.countdownNumber}>{formatCountdown(recordingCountdown)}</span>
                      </div>
                    </div>

                    <div className={styles.sideArea}>
                      {onStop && (
                        <button 
                          className={styles.stopButtonCircle} 
                          onClick={onStop}
                          type="button"
                          disabled={isSubmitting}
                        >
                          <div className={styles.stopActionIconWrap}>
                            {isSubmitting ? (
                              <div className={styles.spinner} />
                            ) : (
                              <div className={styles.stopIcon} />
                            )}
                          </div>
                          <span className={styles.stopText}>
                            {isSubmitting ? '?âÍ? Ï§? : '?ùÎÇ¥Í∏?}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={styles.recordingHintText}>Î¨∏Ïû•??Ï≤úÏ≤ú???êÎ∞ï?êÎ∞ï ?∞Îùº ÎßêÌï¥Î≥¥ÏÑ∏??</p>
                </div>
              )}

              {activeCardState === 'record_done' && (
                <div className={styles.recordingStatus}>
                  {isSubmitting ? (
                    <div className={styles.submittingStatus}>
                      <div className={styles.spinnerBlue} />
                      <span className={styles.statusText}>?âÍ? ?ÑÏÜ° Ï§?..</span>
                    </div>
                  ) : (
                    <div className={styles.statusColumn}>
                      <span className={styles.statusSuccess}>
                        ??Î¨∏Ïû• ?πÏùå ?ÑÎ£å!
                      </span>
                      <span className={styles.nextSentenceHint}>?§Ïùå Î¨∏Ïû•?ºÎ°ú..</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        <div className={styles.bottomSection}>{bottomContent}</div>
      </div>
    </div>
  );
}
