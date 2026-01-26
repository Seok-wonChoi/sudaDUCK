import duckImg from '@/assets/images/duck.png';

const getGradeInfo = (score, total) => {
  const ratio = score / total;
  if (ratio >= 0.8) return { grade: 'Great', message: '정말 잘했어요!', color: '#22c55e' };
  if (ratio >= 0.5) return { grade: 'Good', message: '잘했어요!', color: '#3b82f6' };
  return { grade: 'Bad', message: '다음에 더 노력해봐요!', color: '#ef4444' };
};

export default function ResultPanel({
  score = 0,
  total = 10,
  onRetry,
  onComplete
}) {
  const { grade, message, color } = getGradeInfo(score, total);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-8">
        <div className="py-1 px-3 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full inline-block mb-4">
          당신의 결과
        </div>
        <h2 className="text-5xl font-black m-0 mb-2" style={{ color }}>{grade}</h2>
        <p className="text-base text-gray-600 m-0 mb-1">{message}</p>
        <p className="text-sm text-gray-500 m-0">{score} / {total} 문장 읽음</p>

        <div className="flex gap-3 mt-6 justify-center">
          <button
            className="py-3 px-6 border border-gray-200 rounded-xl bg-white
              text-gray-700 text-sm font-bold cursor-pointer hover:bg-gray-50"
            onClick={onRetry}
          >
            다시 하기
          </button>
          <button
            className="py-3 px-6 border-none rounded-xl bg-indigo-600
              text-white text-sm font-bold cursor-pointer hover:bg-indigo-700"
            onClick={onComplete}
          >
            완료
          </button>
        </div>
      </div>

      <img src={duckImg} alt="Duck" className="w-24 h-24 object-contain" />
    </div>
  );
}
