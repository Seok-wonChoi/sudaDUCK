export default function TurnTabs({ currentTurn = 1 }) {
  const turns = [1, 2, 3];

  return (
    <div className="flex gap-2 md:gap-3 justify-center mb-6 md:mb-8">
      {turns.map((turn) => (
        <button
          key={turn}
          className={`py-2 px-5 md:py-2.5 md:px-7 text-sm md:text-base font-medium rounded-full
            border-[1.5px] cursor-pointer transition-all
            ${currentTurn === turn
              ? "bg-[#2B7FFF] text-white border-[#2B7FFF] shadow-[0_4px_12px_rgba(43,127,255,0.2)]"
              : "bg-white text-gray-500 border-gray-200 hover:border-[#2B7FFF] hover:text-[#2B7FFF]"
            }`}
        >
          Turn {turn}
        </button>
      ))}
    </div>
  );
}
