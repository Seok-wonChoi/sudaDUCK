import styles from './ScriptHeader.module.css';

export default function ScriptHeader() {
  return (
    <div className={styles.scriptHeader}>
      <h1 className={styles.title}>대화 스크립트</h1>
      <p className={styles.subtitle}>
        방금 나눈 대화를 영어로 확인하고 따라 말해보세요. 💬
      </p>
    </div>
  );
}