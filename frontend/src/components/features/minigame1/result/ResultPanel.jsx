import styles from './ResultPanel.module.css';
import RankingList from './RankingList';

export default function ResultPanel({ 
  rankings = [],
  myProfile = null,
  totalQuestions = 4,
  onShowReview,
  onExit
}) {
  // 랭킹 데이터를 순위별로 정렬 (score 내림차순)
  const sortedRankings = [...rankings].sort((a, b) => b.score - a.score);

  // 본인 정보
  const myRanking = sortedRankings.find(r => r.me);
  const myRank = sortedRankings.findIndex(r => r.me) + 1;

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h2 className={styles.title}>게임 결과</h2>
        
        {/* 본인 순위 정보 */}
        {myRanking && (
          <div className={styles.myInfo}>
            <span className={styles.myRankText}>내 순위: {myRank}위</span>
            <span className={styles.dot}>·</span>
            <span className={styles.myScoreText}>{myRanking.score}개 정답</span>
          </div>
        )}

        {/* 순위 목록 */}
        <RankingList 
          rankings={sortedRankings}
          myProfile={myProfile}
          totalQuestions={totalQuestions}
        />

        {/* 버튼 */}
        <div className={styles.buttons}>
          <button 
            className={styles.reviewButton}
            onClick={onShowReview}
          >
            전체 리뷰 보기
          </button>
          <button 
            className={styles.exitButton}
            onClick={onExit}
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}
