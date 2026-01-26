import { useMemo, useCallback, useState } from "react";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";

import usersIcon from "@/assets/icons/users_icon.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

function normalizeParticipantsForMode({ mode, participants, maxCount, myName }) {
  const safe = Array.isArray(participants) ? participants : [];

  const me =
    safe.find((p) => p?.id === "me") ??
    { id: "me", name: myName ?? "나", isMe: true };

  const ai = safe.find((p) => p?.id === "ai") ?? { id: "ai", name: "AI", isMe: false };

  if (mode === "solo") {
    return [me];
  }

  if (mode === "ai") {
    return [me, ai];
  }

  const list = safe.length > 0 ? safe : [me];
  return list.slice(0, Math.max(1, maxCount));
}

function buildSlots({ mode, participants, maxCount }) {
  if (mode === "solo") return [{ kind: "filled", p: participants[0] }];

  if (mode === "ai") {
    return [
      { kind: "filled", p: participants[0] },
      { kind: "filled", p: participants[1] },
    ];
  }

  const slots = [];
  for (let i = 0; i < maxCount; i += 1) {
    const p = participants[i];
    if (p) slots.push({ kind: "filled", p });
    else slots.push({ kind: "empty", id: `empty-${i + 1}`, index: i + 1 });
  }
  return slots;
}

export default function RoomUI({
  mode = "together",
  participants,
  maxCount = 4,
  myName = "나",
  title = "한국어 수다 페이지",
  topic = "좋아하는 음식",
  rightTitle = "AI 설명",
  rightBody = "편하게 말해보세요.",
  durationMs = 60_000,
  onTimeDone,
  exitTo = "/",
  exitMessage = "정말 나가시겠습니까?",
}) {
  const normalized = useMemo(
    () => normalizeParticipantsForMode({ mode, participants, maxCount, myName }),
    [mode, participants, maxCount, myName]
  );

  const [myMicOn, setMyMicOn] = useState(true);

  const toggleMyMic = useCallback(() => {
    setMyMicOn((prev) => !prev);
  }, []);

  const slots = useMemo(
    () => buildSlots({ mode, participants: normalized, maxCount }),
    [mode, normalized, maxCount]
  );

  const slotsClass =
    mode === "solo"
      ? "flex justify-center items-center"
      : mode === "ai"
        ? "flex justify-center items-center gap-3.5"
        : "grid grid-cols-1 md:grid-cols-2 gap-3.5 content-start";

  return (
    <div className="min-h-screen bg-[#f6f8ff] px-4 sm:px-[18px] pt-4 sm:pt-[18px] pb-6">
      <div className="max-w-[1120px] mx-auto">
        <AppHeader userName="user" notifications={[]} />

        <div
          className="mt-3 grid grid-cols-[auto_1fr] md:grid-cols-[auto_1fr_auto] items-center gap-3.5
            py-3.5 px-4 bg-white rounded-[18px] shadow-lg"
        >
          <ExitButton to={exitTo} confirmMessage={exitMessage} />

          <div className="flex flex-col gap-2.5 items-center">
            <div className="text-sm font-black text-gray-900">{title}</div>
            <TimerGauge durationMs={durationMs} isRunning onDone={onTimeDone} />
          </div>

          <div className="flex justify-center md:justify-end col-span-2 md:col-span-1">
            <div className="w-[220px] border border-[#e8edf6] rounded-[14px] py-2.5 px-3 bg-white">
              <div className="text-xs font-black text-indigo-600 mb-1.5">{rightTitle}</div>
              <div className="text-xs font-bold text-gray-900 leading-snug">{rightBody}</div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-start">
          <div
            className="py-2.5 px-3 rounded-[14px] bg-white border border-[#e8edf6]
              shadow-lg text-xs font-black text-gray-900"
          >
            첫 번째 대화 주제는 {topic}입니다.
          </div>
        </div>

        <main className="mt-3.5 bg-white rounded-[18px] p-4 shadow-lg">
          <section className={`min-h-[420px] ${slotsClass}`} aria-label="참여자 영역">
            {slots.map((slot) => {
              if (slot.kind === "empty") {
                return (
                  <div
                    key={slot.id}
                    className="relative border border-dashed border-indigo-50 rounded-2xl
                      bg-gray-900/[0.02] flex flex-col items-center justify-center p-4 min-h-[180px]"
                  >
                    <div className="text-xs font-black text-gray-400">빈 자리</div>
                  </div>
                );
              }

              const p = slot.p;
              const isMe = p?.id === "me" || p?.isMe === true;
              const micOn = isMe ? myMicOn : false;

              return (
                <div
                  key={p.id}
                  className="relative border border-indigo-50 rounded-2xl bg-white
                    flex flex-col items-center justify-center p-4 min-h-[180px]"
                >
                  <div
                    className="w-[86px] h-[86px] rounded-full bg-indigo-600/10
                      flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <img className="w-[34px] h-[34px] object-contain" src={usersIcon} alt="" />
                  </div>

                  <div className="mt-3">
                    <div className="text-[13px] font-black text-gray-900">{p.name}</div>
                  </div>

                  <button
                    type="button"
                    className="absolute right-3 bottom-3 w-8 h-8 rounded-full border border-[#e8edf6]
                      bg-white inline-flex items-center justify-center cursor-pointer
                      disabled:opacity-55 disabled:cursor-default"
                    onClick={isMe ? toggleMyMic : undefined}
                    disabled={!isMe}
                    aria-label={micOn ? "마이크 끄기" : "마이크 켜기"}
                  >
                    <img
                      className="w-[18px] h-[18px] object-contain"
                      src={micOn ? micOnIcon : micOffIcon}
                      alt={micOn ? "마이크 켜짐" : "마이크 꺼짐"}
                    />
                  </button>
                </div>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}
