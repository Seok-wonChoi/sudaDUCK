import duckImg from '@/assets/images/duck.png';

export default function CountdownOverlay({
  count = 3,
  title = '준비되셨나요?',
  subtitle = '알맞은 단어로 빈칸을 채우세요!'
}) {
  return (
    <div className="fixed inset-0 bg-indigo-600/95 flex items-center justify-center z-50">
      <div className="flex flex-col items-center text-center">
        <div className="bg-white rounded-2xl py-4 px-6 mb-6 shadow-lg">
          <p className="text-lg font-bold text-gray-900 m-0 mb-1">{title}</p>
          <p className="text-sm text-gray-500 m-0">{subtitle}</p>
        </div>

        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-xl">
          <span className="text-5xl font-black text-indigo-600">{count}</span>
        </div>

        <img src={duckImg} alt="Duck" className="w-32 h-32 object-contain" />
      </div>
    </div>
  );
}
