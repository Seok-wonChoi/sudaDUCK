import styles from './KoreanSentence.module.css';

export default function KoreanSentence({ sentence = '' }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>?œêµ­??/div>
      <div className={styles.card}>
        <p className={styles.text}>{sentence}</p>
      </div>
    </div>
  );
}
