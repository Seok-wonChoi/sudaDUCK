import { useState, useEffect } from 'react';
import styles from './SentenceCard.module.css';
import bookmarkerIcon from '@/assets/icons/bookmarker.png';

export default function SentenceCard({
  speaker = '나',
  currentSentence = 1,
  totalSentences = 3,
  korean = '나는 카페에서 아르바이트를 했는데, 정말 힘들었어요.',
  english = 'I worked at a coffee shop, and it was really tough.',
  blankWords = [],
  score = null,
  averageScore = null,
  isActive = false,
  cardState = 'idle',
  countdown = 3,
  recordingTime = 0,
  recordingCountdown = 10,
  sentenceId = null,
  initialBookmarked = false,
  onBookmarkToggle = null,
}) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  useEffect(() => {
    setIsBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  const handleBookmark = () => {
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);

    if (onBookmarkToggle) {
      onBookmarkToggle(sentenceId, newBookmarkedState);
    }

    console.log('북마크 토글:', sentenceId, newBookmarkedState);
  };

  // 점수에 따른 색상 클래스 반환
  const getScoreColorClass = (scoreValue) => {
    if (scoreValue < 40) return styles.scoreRed;
    if (scoreValue < 60) return styles.scoreOrange;
    if (scoreValue < 80) return styles.scoreYellow;
    return styles.scoreGreen;
  };

  const getDisplayEnglish = () => {
    if (blankWords.length === 0) {
      return <>{english}</>;
    }

    // AI가 읽는 중이거나 녹음 대기 중에는 전체 문장 보여주기
    if (cardState === 'ai_playing' || cardState === 'record_timer') {
      return <>{english}</>;
    }

    if (cardState === 'idle' && isActive) {
      return <>{english}</>;
    }

    if (!isActive) {
      let parts = [english];
      blankWords.forEach((word) => {
        const newParts = [];
        parts.forEach((part) => {
          if (typeof part === 'string') {
            const regex = new RegExp(`\\b(${word})\\b`, 'gi');
            const splits = part.split(regex);

            splits.forEach((split, idx) => {
              if (split.toLowerCase() === word.toLowerCase()) {
                newParts.push(
                  <span key={`blank-${word}-${idx}`} className={styles.blankBracket}>
                    [{split}]
                  </span>
                );
              } else if (split) {
                newParts.push(split);
              }
            });
          } else {
            newParts.push(part);
          }
        });
        parts = newParts;
      });

      return <>{parts}</>;
    }

    let parts = [english];
    blankWords.forEach((word) => {
      const newParts = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          const regex = new RegExp(`\\b(${word})\\b`, 'gi');
          const splits = part.split(regex);

          splits.forEach((split, idx) => {
            if (split.toLowerCase() === word.toLowerCase()) {
              newParts.push(
                <span key={`blank-${word}-${idx}`} className={styles.blank}>
                  {'\u00A0'.repeat(split.length)}
                </span>
              );
            } else if (split) {
              newParts.push(split);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return <>{parts}</>;
  };
  
  const getRecordingBoxContent = () => {
    if (!isActive) {
      return null;
    }

    switch (cardState) {
      case 'record_timer':
        return (
          <div className={styles.recordingStatus}>
            <span className={styles.statusText}>녹음 대기 중...</span>
          </div>
        );

      case 'recording':
        const formatCountdown = (seconds) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        return (
          <div className={styles.recordingActive}>
            <div className={styles.recordingCircle}>
              <span className={styles.countdownNumber}>{formatCountdown(recordingCountdown)}</span>
            </div>
          </div>
        );

      case 'record_done':
        return (
          <div className={styles.recordingStatus}>
            <span className={`${styles.statusText} ${styles.statusSuccess}`}>
              녹음이 끝났습니다
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  const showRecordingBox = isActive && (cardState === 'record_timer' || cardState === 'recording' || cardState === 'record_done');

  return (
    <div className={`${styles.sentenceCard} ${isActive ? styles.active : ''}`}>
      <div className={styles.header}>
        <div className={styles.speakerInfo}>
          <span className={styles.speakerName}>{speaker}</span>
        </div>
        <div className={styles.headerRight}>
          {score !== null && cardState === 'idle' && (
            <span className={styles.score}>
              개인 점수: <strong className={`${styles.scoreValue} ${getScoreColorClass(score)}`}>{score}점</strong>
              {averageScore !== null && averageScore !== undefined && (
                <> / 평균 <strong className={getScoreColorClass(averageScore)}>{averageScore}점</strong></>
              )}
            </span>
          )}
          <span className={styles.progress}>{currentSentence} / {totalSentences}</span>
          {score !== null && cardState === 'idle' && (
            <button
              className={`${styles.bookmarkButton} ${isBookmarked ? styles.bookmarked : ''}`}
              onClick={handleBookmark}
              aria-label={isBookmarked ? "저장 해제" : "저장하기"}
              title={isBookmarked ? "저장 해제" : "저장하기"}
            >
              <img
                src={bookmarkerIcon}
                alt="bookmark"
                className={styles.bookmarkIcon}
              />
              <span className={styles.bookmarkText}>
                {isBookmarked ? "저장됨" : "저장하기"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <span className={styles.label}>한국어</span>
          <p className={styles.text}>{korean}</p>
        </div>

        <div className={`${styles.section} ${styles.englishSection}`}>
          <div className={styles.englishHeader}>
            <span className={styles.label}>English</span>
            {isActive && cardState === 'ai_playing' && (
              <span className={styles.aiStatus}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h4l3-6 3 12 3-6h3" stroke="#2B7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                AI 읽는 중...
              </span>
            )}
          </div>
          <p className={styles.text}>{getDisplayEnglish()}</p>
        </div>

        {showRecordingBox && (
          <div className={styles.recordingBox}>
            <span className={styles.label}>내 발음 녹음하기</span>
            <div className={styles.recordingContent}>
              {getRecordingBoxContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
