import styles from './WaitingPanel.module.css';
import duckHappy from '@/assets/images/duck_happy.png';
import duckSad from '@/assets/images/duck_sad.png';

export default function WaitingPanel({ 
  submittedCount = 0, 
  totalParticipants = 1,
  rankings = [] 
}) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <img src={duckHappy} alt="loading" className={styles.duck} />
        </div>
        
        <h2 className={styles.title}>다른 참가자를 기다리고 있어요</h2>

        <div className={styles.participantGrid}>
          {rankings.map((user) => (
            <div 
              key={user.userId} 
              className={`${styles.userBadge} ${user.hasSubmitted ? styles.submitted : styles.waiting}`}
            >
              <div className={styles.statusDot}></div>
              <span className={styles.nickname}>{user.nickname}</span>
              <span className={styles.statusText}>
                {user.hasSubmitted ? '완료' : '풀고 있음...'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}