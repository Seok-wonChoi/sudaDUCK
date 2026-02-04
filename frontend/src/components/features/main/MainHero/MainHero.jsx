import styles from "./MainHero.module.css";

export default function MainHero() {
  return (
    <div className={styles.Wrap}>
      <h1 className={styles.Title}>오늘은 어떻게 공부할까요?</h1>
      <p className={styles.Subtitle}>친구들과 수다 떨면서 영어 실력을 키워보세요 🎯</p>
    </div>
  );
}
