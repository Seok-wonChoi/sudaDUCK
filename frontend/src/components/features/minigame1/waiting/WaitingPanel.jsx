import { useEffect, useState } from 'react';
import styles from './WaitingPanel.module.css';

export default function WaitingPanel({ 
  message = '다른 참가자를 기다리는 중...',
  correctCount = 0,
  totalQuestions = 4,
  onComplete
}) {
  const [dots, setDots] = useState('');

  // 점 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 2 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 5초 후 자동으로 결과 조회
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

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
      </div>
    </div>
  );
}
