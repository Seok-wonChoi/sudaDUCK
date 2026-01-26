export default function BlankFillSentence({ parts = [], blanks = [] }) {
  const getBlankClass = (status) => {
    const base = "inline-block min-w-[60px] mx-1 px-2 py-0.5 rounded border-b-2 text-center font-semibold";
    if (status === 'correct') return `${base} bg-emerald-100 border-emerald-500 text-emerald-700`;
    if (status === 'wrong') return `${base} bg-red-100 border-red-500 text-red-700`;
    return `${base} bg-gray-100 border-gray-400 text-gray-400`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold">
        <span className="text-indigo-600">English</span>
        <span className="text-gray-400"> - 빈칸 채우기</span>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="text-base leading-loose text-gray-900">
          {parts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < blanks.length && (
                <span className={getBlankClass(blanks[idx].status)}>
                  {blanks[idx].value || '___'}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
