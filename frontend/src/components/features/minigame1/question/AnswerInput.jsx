export default function AnswerInput({
  value = '',
  onChange,
  onSubmit,
  placeholder = '여기에 입력...'
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-gray-500">빈칸에 들어갈 단어를 입력하세요</div>
      <input
        type="text"
        className="h-12 px-4 border border-gray-200 rounded-xl text-base
          focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <button
        className="h-12 border-none rounded-xl bg-indigo-600 text-white
          text-base font-bold cursor-pointer hover:bg-indigo-700 transition-colors"
        onClick={onSubmit}
      >
        확인
      </button>
    </div>
  );
}
