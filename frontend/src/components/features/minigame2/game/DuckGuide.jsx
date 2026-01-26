import duckImg from '@/assets/images/duck.png';

export default function DuckGuide({
  message = '문장을 읽어서 카드를 없애봐요!!',
  visible = true
}) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 flex items-end gap-2 z-10">
      <div className="bg-white rounded-xl py-2 px-3 shadow-lg border border-gray-100 max-w-[200px]">
        <p className="text-xs font-semibold text-gray-900 m-0">{message}</p>
      </div>
      <img src={duckImg} alt="Duck" className="w-16 h-16 object-contain" />
    </div>
  );
}
