import styles from './MiniGameLayout.module.css';
import AppHeader from '@/components/layout/AppHeader/AppHeader';
import GameHeader from '../common/GameHeader';
import ProgressBar from '../common/ProgressBar';

export default function MiniGameLayout({
  children,
  showGameHeader = true,
  title = '빈칸 채우�?,
  timer = '0:00',
  progress = 0,
  totalProgress = 100,
  userName = 'user',
  onExit,
  // 로고 ?�릭 ?��?�?관??props
  logoExitMessage,
  onLogoExit,
  // 리뷰 모드 관??
  isReviewMode = false,
  onComplete,
  // ?�로???�릭 차단
  disableProfileClick = false,
}) {
  return (
    <div className={styles.layout}>
      <AppHeader
        userName={userName}
        logoExitMessage={logoExitMessage}
        onLogoExit={onLogoExit || onExit}
        disableProfileClick={disableProfileClick}
      />

      <main className={styles.main}>
        {showGameHeader && (
          <>
            <GameHeader title={title} timer={timer} />
            <ProgressBar current={progress} total={totalProgress} />
          </>
        )}

        <div className={styles.content}>
          {children}
        </div>
      </main>

      <footer className={styles.footer}>
        {/* 리뷰 모드?????�료 버튼 ?�시 */}
        {isReviewMode && onComplete && (
          <button className={styles.completeButton} onClick={onComplete}>
            ?�료
          </button>
        )}
      </footer>
    </div>
  );
}
