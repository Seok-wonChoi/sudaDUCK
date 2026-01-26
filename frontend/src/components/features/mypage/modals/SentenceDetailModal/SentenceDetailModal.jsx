import { useState } from "react";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import SentenceCard from "./SentenceCard";
import InfoGrid from "./InfoGrid";
import SimilarExpressions from "./SimilarExpressions";
import QuizSection from "./QuizSection";

export default function SentenceDetailModal({ sentence, onClose }) {
  const [quizOpen, setQuizOpen] = useState(false);

  if (!sentence) return null;

  const {
    english,
    korean,
    topic,
    participants = [],
    similarExpressions = [],
    quizQuestion,
    quizAnswer,
  } = sentence;

  const handlePlayAudio = () => {
    console.log("Playing audio for:", english);
  };

  const footer = (
    <button
      type="button"
      className="py-2.5 px-6 border-none rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600
        text-white text-sm font-bold cursor-pointer hover:brightness-105"
      onClick={onClose}
    >
      닫기
    </button>
  );

  return (
    <ModalWrapper title="문장 상세" onClose={onClose} footer={footer}>
      <div className="flex flex-col gap-5">
        <SentenceCard
          english={english}
          korean={korean}
          onPlayAudio={handlePlayAudio}
        />

        <InfoGrid topic={topic} participants={participants} />

        <SimilarExpressions expressions={similarExpressions} />

        <QuizSection
          isOpen={quizOpen}
          onToggle={() => setQuizOpen(!quizOpen)}
          question={quizQuestion}
          answer={quizAnswer}
        />
      </div>
    </ModalWrapper>
  );
}
