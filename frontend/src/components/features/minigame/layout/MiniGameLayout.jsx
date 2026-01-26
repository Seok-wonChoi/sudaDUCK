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
  userName = 'user'
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader userName={userName} />

      <main className="flex-1 flex flex-col">
        {showGameHeader && (
          <>
            <GameHeader title={title} timer={timer} />
            <ProgressBar current={progress} total={totalProgress} />
          </>
        )}

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      <footer className="mt-auto">
        <ParticipantList participants={participants} />
      </footer>
    </div>
  );
}
