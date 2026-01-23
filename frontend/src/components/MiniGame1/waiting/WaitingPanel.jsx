import styles from './WaitingPanel.module.css';

export default function WaitingPanel({
  message = '다른 플레이어를 기다리는 중...',
  subMessage = '잠시만 기다려주세요'
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.spinner}>
        <svg className={styles.spinnerIcon} viewBox="0 0 50 50">
          <circle
            className={styles.spinnerCircle}
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
          />
        </svg>
      </div>
      <p className={styles.message}>{message}</p>
      <p className={styles.subMessage}>{subMessage}</p>
    </div>
  );
}
