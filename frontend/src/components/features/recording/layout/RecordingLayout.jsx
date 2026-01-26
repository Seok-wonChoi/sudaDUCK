import AppHeader from '@/components/layout/AppHeader/AppHeader';
import ScriptHeader from '../common/ScriptHeader';
import TurnTabs from '../common/TurnTabs';
import SentenceCard from '../common/SentenceCard';

export default function RecordingLayout({
  currentTurn,
  currentSentence,
  bottomContent,
  cardProps = {}
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <AppHeader />

      <main className="flex-1 p-5 sm:p-6 md:py-10 md:px-6 max-w-[960px] mx-auto w-full">
        <ScriptHeader />
        <TurnTabs currentTurn={currentTurn} />
        <SentenceCard
          currentSentence={currentSentence}
          totalSentences={3}
          {...cardProps}
        />
      </main>

      <div className="p-4 sm:p-5 md:py-6 md:px-8 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {bottomContent}
      </div>
    </div>
  );
}
