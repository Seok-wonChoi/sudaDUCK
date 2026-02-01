import styles from './MiniGameLayout.module.css';
import AppHeader from '@/components/layout/AppHeader/AppHeader';
import GameHeader from '../common/GameHeader';
import ProgressBar from '../common/ProgressBar';
import ParticipantList from '../common/ParticipantList';

export default function MiniGameLayout({
  children,
  showGameHeader = true,
  title = '빈칸 채우기',
  timer = '0:00',
  progress = 0,
  totalProgress = 100,
  participants = [],
  userName = 'user',
  // 로고 클릭 나가기 관련 props
  logoExitMessage,
  onLogoExit,
}) {
  return (
    <div className={styles.layout}>
      <AppHeader
        userName={userName}
        logoExitMessage={logoExitMessage}
        onLogoExit={onLogoExit}
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
        <ParticipantList participants={participants} />
      </footer>
    </div>
  );
}
