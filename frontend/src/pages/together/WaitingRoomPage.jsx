import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitButton from "@/components/common/ExitButton/ExitButton";

import duckImg from "@/assets/images/duck.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";
import usersIcon from "@/assets/icons/users_icon.png";
import copyIcon from "@/assets/icons/copy_icon.png";
import kakaoIcon from "@/assets/icons/kakaotalk_icon.png";

function PlayIcon() {
  return (
    <svg
      className="inline-block"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const roomInfo = state ?? {};
  const isHost = roomInfo.isHost ?? true;
  const maxCount = roomInfo.maxCount ?? 4;
  const roomTitle = roomInfo.roomTitle ?? "영어 공부하자!";
  const topic = roomInfo.roomTopic ?? roomInfo.topic ?? "좋아하는 음식";
  const turnCount = roomInfo.turnCount ?? 3;
  const inviteCode = roomInfo.inviteCode ?? "ABC123";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      alert("참여 코드가 복사되었습니다!");
    } catch (e) {
      console.log("복사 실패", e);
    }
  };

  const handleKakaoShare = () => {
    console.log("카카오 공유 클릭", inviteCode);
  };

  const [participants, setParticipants] = useState(() => {
    if (isHost) {
      return [
        { id: "me", name: "나", isHost: true, isReady: true },
        { id: "u2", name: "참여자 1", isHost: false, isReady: true },
        { id: "u3", name: "참여자 2", isHost: false, isReady: true },
        { id: "u4", name: "참여자 3", isHost: false, isReady: true },
      ];
    }

    return [
      { id: "host", name: "방장", isHost: true, isReady: true },
      { id: "me", name: "나", isHost: false, isReady: false },
      { id: "u2", name: "참여자 2", isHost: false, isReady: true },
      { id: "u3", name: "참여자 3", isHost: false, isReady: true },
    ];
  });

  const [myMicOn, setMyMicOn] = useState(true);

  const currentCount = participants.length;

  const me = useMemo(() => participants.find((p) => p.id === "me"), [participants]);
  const myReady = me?.isReady ?? false;

  const nonHostAllReady = useMemo(
    () => participants.filter((p) => !p.isHost).every((p) => p.isReady),
    [participants]
  );

  const canStart = isHost && nonHostAllReady;

  const toggleMyMic = useCallback(() => {
    setMyMicOn((prev) => !prev);
  }, []);

  const toggleMyReady = useCallback(() => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === "me" ? { ...p, isReady: !p.isReady } : p))
    );
  }, []);

  const handleStart = useCallback(() => {
    if (!canStart) return;

    navigate("/together/talk", {
      state: {
        ...roomInfo,
        isHost,
        maxCount,
        participants: participants.map((p) => ({
          id: p.id,
          name: p.name,
          isMe: p.id === "me",
          micOn: p.id === "me" ? myMicOn : false,
          voiceLevel: 0,
        })),
      },
    });
  }, [canStart, navigate, roomInfo, isHost, maxCount, participants, myMicOn]);

  const handlePrimary = useCallback(() => {
    if (isHost) handleStart();
    else toggleMyReady();
  }, [isHost, handleStart, toggleMyReady]);

  const primaryLabel = isHost ? "대화 시작하기" : myReady ? "준비 취소" : "준비하기";
  const primaryDisabled = isHost ? !canStart : false;

  return (
    <div className="min-h-screen bg-[#f6f8ff] py-7">
      <div className="max-w-[1120px] mx-auto bg-white rounded-[28px] shadow-[0_18px_50px_rgba(17,24,39,0.1)] overflow-hidden relative">
        <AppHeader userName="user" notifications={[]} />

        <div className="px-4 md:px-8 py-5 pb-8">
          {/* 상단 헤더 */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
            <ExitButton
              to="/"
              label="나가기"
              confirmMessage="메인 화면으로 나가시겠습니까?"
              replace
            />

            {/* 방 정보 카드 */}
            <aside
              className="bg-white border border-[#e8edf6] rounded-xl p-3.5 px-4
                shadow-[0_8px_20px_rgba(17,24,39,0.08)] w-full md:w-auto md:min-w-[320px]"
              aria-label="방 정보"
            >
              <div className="flex flex-wrap gap-3 md:gap-5 mb-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-gray-500">방 제목</span>
                  <span className="text-[13px] font-black text-gray-900">{roomTitle}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-gray-500">주제</span>
                  <span className="text-[13px] font-black text-gray-900">{topic}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-gray-500">턴 수</span>
                  <span className="text-[13px] font-black text-gray-900">{turnCount}턴</span>
                </div>
              </div>

              <div className="border-t border-indigo-50 pt-3">
                <span className="text-[11px] font-bold text-gray-500 block mb-1.5">참여 코드</span>
                <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-200 rounded-xl py-2 px-3">
                  <span className="text-lg font-black tracking-widest text-indigo-600">{inviteCode}</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="h-7 px-2.5 rounded-full border-0 bg-yellow-400 text-[11px] font-black text-gray-900
                        inline-flex items-center gap-1 cursor-pointer"
                      onClick={handleKakaoShare}
                    >
                      <img className="w-3 h-3 object-contain" src={kakaoIcon} alt="카카오" />
                      공유
                    </button>
                    <button
                      type="button"
                      className="h-7 px-2.5 rounded-full border border-indigo-200 bg-white text-[11px] font-black text-indigo-600
                        inline-flex items-center gap-1 cursor-pointer"
                      onClick={handleCopy}
                    >
                      <img className="w-3 h-3 object-contain" src={copyIcon} alt="복사" />
                      복사
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* 말풍선 영역 */}
          <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-center">
            <div className="flex items-center gap-3.5 justify-start">
              <img className="w-16 h-16 object-contain" src={duckImg} alt="오리" />
              <div className="max-w-[420px] p-3 px-3.5 rounded-xl bg-white border border-[#e8edf6]
                shadow-[0_14px_26px_rgba(17,24,39,0.1)] text-xs font-extrabold text-gray-900 leading-snug">
                첫 번째 대화 주제는 {topic}입니다!
              </div>
            </div>

            <div className="flex items-center gap-3.5 justify-start md:justify-end">
              <div className="max-w-[420px] p-3 px-4 rounded-xl bg-white border border-[#e8edf6]
                shadow-[0_18px_30px_rgba(17,24,39,0.14)] text-xs font-black text-gray-900 leading-snug">
                {isHost
                  ? "준비가 완료 되면 대화 시작하기 버튼을 눌러주세요!"
                  : "준비가 완료 되면 준비하기 버튼을 눌러주세요!"}
              </div>
              <img className="w-16 h-16 object-contain" src={duckImg} alt="오리" />
            </div>
          </div>

          {/* 참여자 카드 */}
          <section className="mt-4 border border-[#e8edf6] rounded-2xl bg-white overflow-hidden" aria-label="참여자 목록">
            <div className="flex items-center justify-between p-3.5 px-4 border-b border-indigo-50">
              <div className="inline-flex items-center gap-2 text-[13px] font-black text-gray-900">
                <img className="w-4 h-4 object-contain" src={usersIcon} alt="" aria-hidden="true" />
                <span>참여자</span>
                <span className="font-black text-indigo-600">({currentCount}/{maxCount})</span>
              </div>
              <div className="py-1.5 px-3 rounded-xl bg-gray-100 border border-gray-200 text-xs font-extrabold text-gray-500">
                대기 중
              </div>
            </div>

            <div className="p-3.5 px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[210px]">
              {participants.map((p) => {
                const isMe = p.id === "me";
                const micOn = isMe ? myMicOn : false;

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border border-indigo-50 rounded-xl p-3.5 min-h-[80px] bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <img className="w-4.5 h-4.5 object-contain" src={usersIcon} alt="" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="text-[13px] font-black text-gray-900">{p.name}</div>
                          {!p.isHost && (
                            <span
                              className={`py-1 px-2.5 rounded-full text-xs font-black
                                ${p.isReady
                                  ? "bg-green-500/15 border border-green-500/35 text-green-600"
                                  : "bg-gray-500/10 border border-gray-500/20 text-gray-500"
                                }`}
                            >
                              {p.isReady ? "준비 완료" : "대기"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center">
                          <button
                            type="button"
                            className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer
                              inline-flex items-center justify-center disabled:cursor-default disabled:opacity-60"
                            onClick={isMe ? toggleMyMic : undefined}
                            disabled={!isMe}
                            aria-label={micOn ? "마이크 끄기" : "마이크 켜기"}
                          >
                            <img
                              className="w-4.5 h-4.5 object-contain"
                              src={micOn ? micOnIcon : micOffIcon}
                              alt={micOn ? "마이크 켜짐" : "마이크 꺼짐"}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {p.isHost && (
                        <span className="py-1.5 px-2.5 rounded-full bg-amber-500/20 border border-amber-500/35 text-xs font-black text-amber-700">
                          방장
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className={`w-[calc(100%-32px)] mx-4 mb-4 h-13 border-0 rounded-xl
                text-sm font-black flex items-center justify-center gap-2.5 cursor-pointer
                ${primaryDisabled
                  ? "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed"
                  : "bg-indigo-600 text-white shadow-[0_16px_30px_rgba(79,70,229,0.28)]"
                }`}
              onClick={handlePrimary}
              disabled={primaryDisabled}
              aria-disabled={primaryDisabled}
              title={
                isHost && primaryDisabled
                  ? "모든 참여자가 준비 완료해야 시작할 수 있습니다."
                  : undefined
              }
            >
              {isHost && <PlayIcon />}
              {primaryLabel}
            </button>
          </section>

          {/* 안내 박스 */}
          <section
            className="mt-3 rounded-xl border border-amber-500/25 bg-amber-100/20 p-3.5 px-4"
            aria-label="시작 전 안내사항"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/55" aria-hidden="true" />
              <span className="text-[13px] font-black text-gray-900">시작 전 안내사항</span>
            </div>

            <ul className="mt-2.5 pl-4 m-0">
              <li className="text-xs font-bold text-gray-500 leading-relaxed my-1.5">
                {isHost
                  ? "모든 참여자가 준비 완료하면 대화를 시작할 수 있습니다"
                  : "준비하기를 누르면 방장이 대화를 시작할 수 있습니다"}
              </li>
              <li className="text-xs font-bold text-gray-500 leading-relaxed my-1.5">
                각 턴마다 1분간 자유롭게 대화하세요
              </li>
              <li className="text-xs font-bold text-gray-500 leading-relaxed my-1.5">
                AI가 대화를 분석하고 피드백을 제공합니다
              </li>
              <li className="text-xs font-bold text-gray-500 leading-relaxed my-1.5">
                조용한 환경에서 진행하면 더 좋습니다
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
