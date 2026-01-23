import styles from './CountdownOverlay.module.css';
import duckImg from '@/assets/images/duck.png';

export default function CountdownOverlay({
  count = 3,
  title = '준비되셨나요?',
  subtitle = '알맞은 단어로 빈칸을 채우세요!'
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.speechBubble}>
          <p className={styles.title}>{title}</p>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.countCircle}>
          <span className={styles.countNumber}>{count}</span>
        </div>

        <img src={duckImg} alt="Duck" className={styles.duck} />
      </div>
    </div>
  );
}
