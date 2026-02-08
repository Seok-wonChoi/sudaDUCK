import styles from './ResultPanel.module.css';
import RankingList from './RankingList';

export default function ResultPanel({ 
  rankings = [],
  myProfile = null,
  totalQuestions = 4,
  onShowReview,
  onReturnToRoom,
  onExit
}) {
  // ??�� ?�이?��? ?�위별로 ?�렬 (score ?�림차순)
  const sortedRankings = [...rankings].sort((a, b) => b.score - a.score);

  // 본인 ?�보
  const myRanking = sortedRankings.find(r => r.isMe || r.me); 
  const myRank = sortedRankings.findIndex(r => r.isMe || r.me) + 1;

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h2 className={styles.title}>게임 결과</h2>
        
        {/* 본인 ?�위 ?�보 */}
        {myRanking && (
          <div className={styles.myInfo}>
            <span className={styles.myRankText}>???�위: {myRank}??/span>
            <span className={styles.dot}>·</span>
            <span className={styles.myScoreText}>{myRanking.score}�??�답</span>
          </div>
        )}

        {/* ?�위 목록 */}
        <RankingList 
          rankings={sortedRankings}
          myProfile={myProfile}
          totalQuestions={totalQuestions}
        />

        {/* 버튼 */}
        {/* 버튼 그룹 */}
        <div className={styles.buttonGroup}>
          {/* 1. 복습?�기 (보조 기능) */}
          <button 
            className={`${styles.button} ${styles.reviewButton}`}
            onClick={onShowReview}
          >
            ?�� ?�체 리뷰
          </button>

          {/* 2. ?�기방?�로 ?�아가�?(주요 기능 - 게임�?종료) */}
          <button 
            className={`${styles.button} ${styles.returnButton}`}
            onClick={onReturnToRoom}
          >
            ?�� ?�기방?�로
          </button>

          {/* 3. �??��?�?(?�탈 기능) */}
          <button 
            className={`${styles.button} ${styles.exitButton}`}
            onClick={onExit}
          >
            ?�� �??��?�?
          </button>
        </div>
      </div>
    </div>
  );
}
