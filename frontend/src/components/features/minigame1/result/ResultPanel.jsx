import RankingList from './RankingList';

export default function ResultPanel({
  rankings = [],
  currentUserId,
  onReview,
  onComplete
}) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <h2 className="text-xl font-bold text-gray-900 text-center m-0">게임 결과</h2>
      <RankingList rankings={rankings} currentUserId={currentUserId} />
      <div className="flex gap-3">
        <button
          className="flex-1 h-12 border border-gray-200 rounded-xl bg-white
            text-gray-700 text-sm font-bold cursor-pointer hover:bg-gray-50"
          onClick={onReview}
        >
          전체 리뷰 보기
        </button>
        <button
          className="flex-1 h-12 border-none rounded-xl bg-indigo-600
            text-white text-sm font-bold cursor-pointer hover:bg-indigo-700"
          onClick={onComplete}
        >
          완료
        </button>
      </div>
    </div>
  );
}
