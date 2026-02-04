import styles from './LoadingOverlay.module.css';
import duckProfile3 from '@/assets/images/duck_profile3.png';

export default function LoadingOverlay({
  title = '대화가 종료되었습니다!',
  subtitle = '쉐도잉 연습을 위해 이동 중입니다...',
  image = duckProfile3
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.speechBubble}>
          <p className={styles.title}>{title}</p>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <img src={image} alt="Background Duck" className={styles.duck} />
    </div>
  );
}