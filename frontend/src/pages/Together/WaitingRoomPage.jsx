import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "../../components/Layout/AppHeader/AppHeader";
import duckImg from "../../assets/images/duck.png";

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
      <path
        d="M8 5v14l11-7z"
        fill="currentColor"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      className={styles.MicIcon}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19v3h2v-3h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg
      className={styles.BulbIcon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 21h6v-1H9v1zm3-20C7.935 1 5 3.935 5 7c0 2.027 1.091 3.82 2.707 4.78.555.33 1.293 1.12 1.293 2.22v1h6v-1c0-1.1.738-1.89 1.293-2.22C17.909 10.82 19 9.027 19 7c0-3.065-2.935-6-7-6z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const roomInfo = location.state ?? {};
  const isHost = roomInfo.isHost ?? true;

  const participants = useMemo(
    () => [
      { id: "me", name: "나", isHost: true, isMicOn: true },
      // { id: "u2", name: "참여자2", isHost: false, isMicOn: false },
      // { id: "u3", name: "참여자3", isHost: false, isMicOn: false },
    ],
    []
  );

  const currentCount = participants.length;
  const maxCount = roomInfo.maxCount ?? 4;

  const handleBack = () => {
    navigate(-1);
  };

  const handleStart = () => {
    console.log("대화 시작하기 클릭", { roomInfo });
  };

  return (
    <div className={styles.Page}>
      <div className={styles.PageLabel}>대기 방 페이지-방장</div>

      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Top}>
          <button type="button" className={styles.BackButton} onClick={handleBack}>
            &lt; 뒤로가기
          </button>

          <div className={styles.SpeechRow}>
            <div className={styles.SpeechSide}>
              <img className={styles.Duck} src={duckImg} alt="오리" />
              <div className={styles.SpeechBubbleLeft}>
                첫 번째 대화 주제는 좋아하는 음식입니다!
              </div>
            </div>

            <div className={styles.SpeechCenter}>
              <div className={styles.SpeechBubbleCenter}>
                주제가 완료되면 대화 시작하기 버튼을 눌러주세요!
              </div>
            </div>

            <div className={styles.SpeechSide}>
              <div className={styles.SpeechBubbleRight} aria-hidden="true">
                {" "}
              </div>
              <img className={styles.Duck} src={duckImg} alt="오리" />
            </div>
          </div>

          <section className={styles.ParticipantsCard} aria-label="참여자 목록">
            <div className={styles.ParticipantsHeader}>
              <div className={styles.ParticipantsTitle}>
                <span className={styles.ParticipantsIcon} aria-hidden="true">
                  {" "}
                </span>
                <span>참여자</span>
                <span className={styles.ParticipantsCount}>
                  ({currentCount}/{maxCount})
                </span>
              </div>

              <div className={styles.StatusBadge}>대기 중</div>
            </div>

            <div className={styles.ParticipantsBody}>
              {participants.map((p) => (
                <div key={p.id} className={styles.ParticipantRow}>
                  <div className={styles.ParticipantLeft}>
                    <div className={styles.Avatar} aria-hidden="true">
                      {" "}
                    </div>
                    <div className={styles.NameArea}>
                      <div className={styles.ParticipantName}>{p.name}</div>
                      <div className={styles.MicState}>
                        <MicIcon />
                      </div>
                    </div>
                  </div>

                  <div className={styles.ParticipantRight}>
                    {(isHost && p.isHost) || (!isHost && p.id === "me" && p.isHost) ? (
                      <span className={styles.HostTag}>방장</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className={styles.StartButton} onClick={handleStart}>
              <PlayIcon />
              대화 시작하기
            </button>
          </section>

          <section className={styles.GuideBox} aria-label="시작 전 안내사항">
            <div className={styles.GuideHeader}>
              <BulbIcon />
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
