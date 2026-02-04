import { useEffect, useState } from 'react';
import styles from './WaitingPanel.module.css';

export default function WaitingPanel({ 
  message = '다른 참가자를 기다리는 중...',
  correctCount = 0,
  totalQuestions = 4,
  submittedCount = 1,
  totalParticipants = 1
}) {
  const [dots, setDots] = useState('');

  // 점 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 2 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h2 className={styles.title}>제출 완료!</h2>
        
        <div className={styles.scoreSection}>
          <div className={styles.scoreBig}>
            {correctCount} / {totalQuestions}
          </div>
          <div className={styles.scoreLabel}>
            정답률 {Math.round((correctCount / totalQuestions) * 100)}%
          </div>
        </div>

        <div className={styles.message}>
          {message}
        </div>

        <div className={styles.waiting}>
          다른 참가자를 기다리는 중{dots}
        </div>

        {/* 제출 현황 표시 */}
        <div className={styles.submissionStatus}>
          <div className={styles.statusBar}>
            <div 
              className={styles.statusFill}
              style={{ 
                width: `${(submittedCount / totalParticipants) * 100}%` 
              }}
            />
          </div>
          <div className={styles.statusText}>
            {submittedCount} / {totalParticipants}명 제출 완료
          </div>
        </div>
      </div>
    </div>
  );
}
