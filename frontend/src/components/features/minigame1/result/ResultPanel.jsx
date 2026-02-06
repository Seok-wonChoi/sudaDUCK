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
  // 랭킹 데이터를 순위별로 정렬 (score 내림차순)
  const sortedRankings = [...rankings].sort((a, b) => b.score - a.score);

  // 본인 정보
  const myRanking = sortedRankings.find(r => r.isMe || r.me); 
  const myRank = sortedRankings.findIndex(r => r.isMe || r.me) + 1;

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
        {/* 버튼 그룹 */}
        <div className={styles.buttonGroup}>
          {/* 1. 복습하기 (보조 기능) */}
          <button 
            className={`${styles.button} ${styles.reviewButton}`}
            onClick={onShowReview}
          >
            📝 전체 리뷰
          </button>

          {/* 2. 대기방으로 돌아가기 (주요 기능 - 게임만 종료) */}
          <button 
            className={`${styles.button} ${styles.returnButton}`}
            onClick={onReturnToRoom}
          >
            🏠 대기방으로
          </button>

          {/* 3. 방 나가기 (이탈 기능) */}
          <button 
            className={`${styles.button} ${styles.exitButton}`}
            onClick={onExit}
          >
            🚪 방 나가기
          </button>
        </div>
      </div>
    </div>
  );
}
