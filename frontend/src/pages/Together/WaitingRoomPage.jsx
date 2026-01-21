import { useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "../../components/Layout/AppHeader/AppHeader";
import ExitGuard from "../../components/Common/ExitGuard/ExitGuard";

import duckImg from "../../assets/images/duck.png";

// 실제 확장자에 맞게 수정 필요
import micOnIcon from "../../assets/icons/mic_on.png";
import micOffIcon from "../../assets/icons/mic_off.png";
import usersIcon from "../../assets/icons/users_icon.png";

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

  const participants = useMemo(
    () => [
      { id: "me", name: "나", isHost: true, isReady: false },
      { id: "u2", name: "참여자", isHost: false, isReady: false },
      { id: "u3", name: "참여자", isHost: false, isReady: false },
      { id: "u4", name: "참여자", isHost: false, isReady: false },
    ],
    []
  );

  const [myMicOn, setMyMicOn] = useState(true);

  const currentCount = participants.length;
  const maxCount = roomInfo.maxCount ?? 4;

  const nonHostAllReady = participants
    .filter((p) => !p.isHost)
    .every((p) => p.isReady);

  const canStart = isHost && nonHostAllReady;

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const toggleMyMic = useCallback(() => {
    setMyMicOn((prev) => !prev);
  }, []);

  const handleStart = useCallback(() => {
    if (!canStart) return;
    console.log("대화 시작하기 클릭", roomInfo);
  }, [canStart, roomInfo]);

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <ExitGuard to="/" message="메인 화면으로 나가시겠습니까?" />

        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Top}>
          <button type="button" className={styles.BackButton} onClick={handleBack}>
            &lt; 뒤로가기
          </button>

          <div className={styles.SpeechRow}>
            <div className={styles.SpeechLeft}>
              <img className={styles.Duck} src={duckImg} alt="오리" />
              <div className={styles.SpeechBubbleLeft}>
                첫 번째 대화 주제는 {roomInfo.topic ?? "좋아하는 음식"}입니다!
              </div>
            </div>

            <div className={styles.SpeechRight}>
              <div className={styles.SpeechBubbleRight}>
                준비가 완료 되면 대화 시작하기 버튼을 눌러주세요!
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
                !canStart ? styles.StartButtonDisabled : ""
              }`}
              onClick={handleStart}
              disabled={!canStart}
              aria-disabled={!canStart}
              title={!canStart ? "모든 참여자가 준비 완료해야 시작할 수 있습니다." : undefined}
            >
              <PlayIcon />
              대화 시작하기
            </button>
          </section>

          <section className={styles.GuideBox} aria-label="시작 전 안내사항">
            <div className={styles.GuideHeader}>
              <span className={styles.GuideDot} aria-hidden="true" />
              <span className={styles.GuideTitle}>시작 전 안내사항</span>
            </div>

            <ul className={styles.GuideList}>
              <li className={styles.GuideItem}>모든 참여자가 준비 완료하면 대화가 시작됩니다</li>
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
