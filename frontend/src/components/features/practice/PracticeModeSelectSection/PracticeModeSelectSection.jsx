import ModeCard from "@/components/common/ModeCard/ModeCard";

export default function PracticeModeSelectSection({ onClickSolo, onClickAi }) {
  return (
    <section
      className="mt-4 sm:mt-[18px] flex justify-center gap-6 sm:gap-[34px] flex-wrap"
      aria-label="연습 모드 선택"
    >
      <ModeCard
        title="혼자 연습하기"
        description="1분간 같은 문장을 자유롭게 이야기하기"
        onClick={onClickSolo}
        duckCount={1}
      />

      <ModeCard
        title="AI와 대화하기"
        description="AI 친구와 자연스럽게 대화하며 연습하기"
        onClick={onClickAi}
        duckCount={1}
      />
    </section>
  );
}
