import styles from './ResultPanel.module.css';
import RankingList from './RankingList';

export default function ResultPanel({
  rankings = [],
  currentUserId,
  onReview,
  onComplete
}) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>게임 결과</h2>
      <RankingList rankings={rankings} currentUserId={currentUserId} />
      <div className={styles.actions}>
        <button className={styles.reviewBtn} onClick={onReview}>
          전체 리뷰 보기
        </button>
        <button className={styles.completeBtn} onClick={onComplete}>
          완료
        </button>
      </div>
    </div>
  );
}
