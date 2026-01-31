import { useState, useEffect } from 'react';
import styles from './SentenceCard.module.css';

export default function SentenceCard({
  speaker = '나',
  currentSentence = 1,
  totalSentences = 3,
  korean = '나는 카페에서 아르바이트를 했는데, 정말 힘들었어요.',
  english = 'I worked at a coffee shop, and it was really tough.',
  blankWords = [],
  score = null,
  isActive = false,
  cardState = 'idle',
  countdown = 3,
  recordingTime = 0, // 녹음 시간 (초)
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

    // TODO: API 호출하여 서버에 북마크 저장
    console.log('북마크 토글:', sentenceId, newBookmarkedState);
  };

  // 영어 문장을 빈칸 처리하는 함수
  const getDisplayEnglish = () => {
    // 빈칸 단어가 없으면 전체 문장 표시
    if (blankWords.length === 0) {
      return <>{english}</>;
    }

    // AI가 읽어줄 때는 전체 문장 표시
    if (cardState === 'ai_playing') {
      return <>{english}</>;
    }

    // 녹음 시작 전(idle이면서 isActive인 경우)에는 전체 문장 표시
    if (cardState === 'idle' && isActive) {
      return <>{english}</>;
    }

    // 턴 종료 리포트(!isActive)에서는 빈칸을 [ ] 안에 표시
    if (!isActive) {
      let parts = [english];
      blankWords.forEach((word) => {
        const newParts = [];
        parts.forEach((part) => {
          if (typeof part === 'string') {
            // 대소문자 구분 없이 단어 찾기
            const regex = new RegExp(`\\b(${word})\\b`, 'gi');
            const splits = part.split(regex);

            splits.forEach((split, idx) => {
              if (split.toLowerCase() === word.toLowerCase()) {
                // [ ] 안에 단어 표시
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

    // 녹음 대기 중, 녹음 중, 녹음 완료 시에는 빈칸 처리 (공백으로)
    let parts = [english];
    blankWords.forEach((word) => {
      const newParts = [];
      parts.forEach((part) => {
        if (typeof part === 'string') {
          // 대소문자 구분 없이 단어 찾기
          const regex = new RegExp(`\\b(${word})\\b`, 'gi');
          const splits = part.split(regex);

          splits.forEach((split, idx) => {
            if (split.toLowerCase() === word.toLowerCase()) {
              // 빈칸으로 처리
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
        // 녹음 시간 포맷: 00:03
        const formatTime = (seconds) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        };

        return (
          <div className={styles.recordingActive}>
            <div className={styles.recordingCircle}>
              <span className={styles.countdownNumber}>{formatTime(recordingTime)}</span>
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
          <div className={styles.speakerIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10ZM10 12C7.33 12 2 13.34 2 16V18H18V16C18 13.34 12.67 12 10 12Z" fill="white"/>
            </svg>
          </div>
          <span className={styles.speakerName}>{speaker}</span>
        </div>
        <div className={styles.headerRight}>
          {/* 턴 종료 리포트(idle)에서만 점수 표시 */}
          {score !== null && cardState === 'idle' && (
            <span className={styles.score}>
              개인 점수: <strong className={styles.scoreValue}>{score}점</strong> / 평균 78점
            </span>
          )}
          <span className={styles.progress}>{currentSentence} / {totalSentences}</span>
          {/* 턴 종료 리포트(idle)에서만 저장하기 버튼 표시 */}
          {score !== null && cardState === 'idle' && (
            <button
              className={`${styles.bookmarkButton} ${isBookmarked ? styles.bookmarked : ''}`}
              onClick={handleBookmark}
              aria-label={isBookmarked ? "저장 해제" : "저장하기"}
              title={isBookmarked ? "저장 해제" : "저장하기"}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 3H5C4.20435 3 3.44129 3.31607 2.87868 3.87868C2.31607 4.44129 2 5.20435 2 6V21L12 16.5L22 21V6C22 5.20435 21.6839 4.44129 21.1213 3.87868C20.5587 3.31607 19.7956 3 19 3Z"
                  stroke={isBookmarked ? "#2b7fff" : "#9CA3AF"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={isBookmarked ? "#2b7fff" : "none"}
                />
              </svg>
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
