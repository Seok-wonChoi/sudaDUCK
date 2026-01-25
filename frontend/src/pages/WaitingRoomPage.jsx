import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader/AppHeader";
import ExitButton from "../components/common/ExitButton/ExitButton";

import duckImg from "@/assets/images/duck.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";
import usersIcon from "@/assets/icons/users_icon.png";

import styles from "./WaitingRoomPage.module.css";

function PlayIcon() {
  return (
    <svg
      className={styles.PlayIcon}
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
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Top}>
          <ExitButton to="/" label="나가기" confirmMessage="메인 화면으로 나가시겠습니까?"
          replace 
          />

          <div className={styles.SpeechRow}>
            <div className={styles.SpeechLeft}>
              <img className={styles.Duck} src={duckImg} alt="오리" />
              <div className={styles.SpeechBubbleLeft}>
                첫 번째 대화 주제는 {roomInfo.topic ?? "좋아하는 음식"}입니다!
              </div>
            </div>

            <div className={styles.SpeechRight}>
              <div className={styles.SpeechBubbleRight}>
                {isHost
                  ? "준비가 완료 되면 대화 시작하기 버튼을 눌러주세요!"
                  : "준비가 완료 되면 준비하기 버튼을 눌러주세요!"}
              </div>
              <img className={styles.Duck} src={duckImg} alt="오리" />
            </div>
          </div>

          <section className={styles.ParticipantsCard} aria-label="참여자 목록">
            <div className={styles.ParticipantsHeader}>
              <div className={styles.ParticipantsTitle}>
                <img
                  className={styles.ParticipantsTitleIcon}
                  src={usersIcon}
                  alt=""
                  aria-hidden="true"
                />
                <span>참여자</span>
                <span className={styles.ParticipantsCount}>
                  ({currentCount}/{maxCount})
                </span>
              </div>

              <div className={styles.StatusBadge}>대기 중</div>
            </div>

            <div className={styles.ParticipantsBody}>
              {participants.map((p) => {
                const isMe = p.id === "me";
                const micOn = isMe ? myMicOn : false;

                return (
                  <div key={p.id} className={styles.ParticipantRow}>
                    <div className={styles.ParticipantLeft}>
                      <div className={styles.UserIconWrap} aria-hidden="true">
                        <img className={styles.UserIconImg} src={usersIcon} alt="" />
                      </div>

                      <div className={styles.InfoColumn}>
                        <div className={styles.NameRow}>
                          <div className={styles.ParticipantName}>{p.name}</div>

                          {!p.isHost ? (
                            <span
                              className={`${styles.ReadyTag} ${
                                p.isReady ? styles.ReadyTagOn : styles.ReadyTagOff
                              }`}
                            >
                              {p.isReady ? "준비 완료" : "대기"}
                            </span>
                          ) : null}
                        </div>

                        <div className={styles.ActionRow}>
                          <button
                            type="button"
                            className={styles.MicButton}
                            onClick={isMe ? toggleMyMic : undefined}
                            disabled={!isMe}
                            aria-label={micOn ? "마이크 끄기" : "마이크 켜기"}
                          >
                            <img
                              className={styles.MicIconImg}
                              src={micOn ? micOnIcon : micOffIcon}
                              alt={micOn ? "마이크 켜짐" : "마이크 꺼짐"}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={styles.ParticipantRight}>
                      {p.isHost ? <span className={styles.HostTag}>방장</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className={`${styles.StartButton} ${
                primaryDisabled ? styles.StartButtonDisabled : ""
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
              {isHost ? <PlayIcon /> : null}
              {primaryLabel}
            </button>
          </section>

          <section className={styles.GuideBox} aria-label="시작 전 안내사항">
            <div className={styles.GuideHeader}>
              <span className={styles.GuideDot} aria-hidden="true" />
              <span className={styles.GuideTitle}>시작 전 안내사항</span>
            </div>

            <ul className={styles.GuideList}>
              <li className={styles.GuideItem}>
                {isHost
                  ? "모든 참여자가 준비 완료하면 대화를 시작할 수 있습니다"
                  : "준비하기를 누르면 방장이 대화를 시작할 수 있습니다"}
              </li>
              <li className={styles.GuideItem}>각 턴마다 1분간 자유롭게 대화하세요</li>
              <li className={styles.GuideItem}>AI가 대화를 분석하고 피드백을 제공합니다</li>
              <li className={styles.GuideItem}>조용한 환경에서 진행하면 더 좋습니다</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
