import styles from './ResultPanel.module.css';
import duckExcellent from '@/assets/images/duck_excellent.png';
import duckBad from '@/assets/images/duck_bad.png';

const getGradeInfo = (score, total) => {
  const ratio = score / total;
  if (ratio >= 0.8) return { grade: 'Great', message: '정말 잘했어요!', color: '#22c55e', duckImg: duckExcellent, bgColor: '#dcfce7' };
  if (ratio >= 0.5) return { grade: 'Good', message: '잘했어요!', color: '#3b82f6', duckImg: duckExcellent, bgColor: '#dcfce7' };
  return { grade: 'Bad', message: '다음에 더 노력해봐요!', color: '#ef4444', duckImg: duckBad, bgColor: '#fce7e7' };
};

export default function ResultPanel({
  score = 0,
  total = 10,
  onRetry,
  onComplete
}) {
  const { grade, message, color, duckImg, bgColor } = getGradeInfo(score, total);

  return (
    <div className={styles.panel} style={{ background: bgColor }}>
      <div className={styles.content}>
        <div className={styles.badge}>당신의 결과</div>
        <h2 className={styles.grade} style={{ color }}>{grade}</h2>
        <p className={styles.message}>{message}</p>
        <p className={styles.stats}>{score} / {total} 문장 읽음</p>

        <div className={styles.buttons}>
          <button className={styles.retryBtn} onClick={onRetry}>
            다시 하기
          </button>
          <button className={styles.completeBtn} onClick={onComplete}>
            완료
          </button>
        </div>
      </div>

      <img src={duckImg} alt="Duck" className={styles.duck} />
    </div>
  );
}
