import styles from "./PracticeHero.module.css";

export default function PracticeHero() {
  return (
    <div className={styles.Wrap}>
      <h1 className={styles.Title}>연습 하기</h1>
      <p className={styles.Subtitle}>어떤 모드로 연습할까요?</p>
    </div>
  );
}
