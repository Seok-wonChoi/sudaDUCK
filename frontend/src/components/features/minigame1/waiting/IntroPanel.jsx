import styles from './IntroPanel.module.css';
import duckImg from '@/assets/images/duck_minigame.png';

export default function IntroPanel() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <img src={duckImg} alt="duck" className={styles.duck} />
        </div>
        
        <h2 className={styles.title}>빈칸 채우기 미니게임</h2>
        
        <div className={styles.content}>
          <p className={styles.description}>
            오늘 나눈 대화 내용을 복습해볼까요?<br />
            <strong>문장의 빈칸에 알맞은 영어 단어</strong>를 입력하세요!
          </p>

          <div className={styles.instructionList}>
            <div className={styles.instructionItem}>
              <div className={styles.bullet}>1</div>
              <p>한글 문장을 보고 영어 빈칸에 들어갈 단어를 유추하세요.</p>
            </div>
            <div className={styles.instructionItem}>
              <div className={styles.bullet}>2</div>
              <p>정답을 입력하고 <strong>Enter</strong>를 누르면 다음 빈칸으로 넘어갑니다.</p>
            </div>
            <div className={styles.instructionItem}>
              <div className={styles.bullet}>3</div>
              <p>모든 빈칸을 채우면 다음 문제로 넘어갑니다.</p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className={styles.loadingText}>잠시 후 게임이 시작됩니다...</p>
        </div>
      </div>
    </div>
  );
}
