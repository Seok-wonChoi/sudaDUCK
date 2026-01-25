import styles from './SentenceCard.module.css';

export default function SentenceCard({
  speaker = '나',
  currentSentence = 1,
  totalSentences = 3,
  korean = '나는 카페에서 아르바이트를 했는데, 정말 힘들었어요.',
  english = 'I worked at a coffee shop, and it was really tough.',
  showRecordingBox = false,
  recordingContent = null,
  isAIPlaying = false
}) {
  return (
    <div className={styles.sentenceCard}>
      <div className={styles.header}>
        <div className={styles.speakerInfo}>
          <div className={styles.speakerIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10ZM10 12C7.33 12 2 13.34 2 16V18H18V16C18 13.34 12.67 12 10 12Z" fill="white"/>
            </svg>
          </div>
          <span className={styles.speakerName}>{speaker}</span>
        </div>
        <span className={styles.progress}>{currentSentence} / {totalSentences}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <span className={styles.label}>한국어</span>
          <p className={styles.text}>{korean}</p>
        </div>

        <div className={`${styles.section} ${styles.englishSection}`}>
          <div className={styles.englishHeader}>
            <span className={styles.label}>English</span>
            {isAIPlaying && (
              <span className={styles.aiStatus}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h4l3-6 3 12 3-6h3" stroke="#2B7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                AI 읽는 중...
              </span>
            )}
          </div>
          <p className={styles.text}>{english}</p>
        </div>

        {showRecordingBox && (
          <div className={styles.recordingBox}>
            <span className={styles.label}>내 발음 녹음하기</span>
            <div className={styles.recordingContent}>
              {recordingContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
