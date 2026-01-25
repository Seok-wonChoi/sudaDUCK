import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader/AppHeader";
import TipBanner from "../components/common/TipBanner/TipBanner";

import copyIcon from "../assets/icons/copy_icon.png";
import kakaoIcon from "../assets/icons/kakaotalk_icon.png";

import styles from "./RoomCreatedPage.module.css";

export default function RoomCreatedPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const roomInfo = state ?? {};
  const roomTitle = roomInfo.roomTitle ?? "1번 영어 공부하자!";
  const topic = roomInfo.topic ?? "좋아하는 음식";
  const turnCount = roomInfo.turnCount ?? "3턴";
  const inviteCode = roomInfo.inviteCode ?? "92SA71";

  const handleBack = () => {
    navigate(-1);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      console.log("참여 코드 복사 완료");
    } catch (e) {
      console.log("복사 실패", e);
    }
  };

  const handleKakaoShare = () => {
    console.log("카카오 공유 클릭", inviteCode);
  };

  const handleGoWaiting = () => {
    navigate("/together/waiting", {
      state: {
        roomTitle,
        topic,
        turnCount,
        inviteCode,
        isHost: true,
        maxCount: 4,
      },
    });
  };

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Top}>
          <button type="button" className={styles.BackButton} onClick={handleBack}>
            &lt; 뒤로가기
          </button>

          <div className={styles.Head}>
            <h1 className={styles.Title}>방이 생성되었어요!</h1>
            <p className={styles.Subtitle}>친구들에게 참여 코드를 공유해보세요.</p>
          </div>

          <div className={styles.Card}>
            <div className={styles.FieldFull}>
              <div className={styles.Label}>방 제목</div>
              <div className={styles.Value}>{roomTitle}</div>
            </div>

            <div className={styles.FieldRow}>
              <div className={styles.FieldHalf}>
                <div className={styles.Label}>주제</div>
                <div className={styles.Value}>{topic}</div>
              </div>

              <div className={styles.FieldHalf}>
                <div className={styles.Label}>턴 수</div>
                <div className={styles.Value}>{turnCount}</div>
              </div>
            </div>

            <div className={styles.CodeLabel}>참여 코드</div>

            <div className={styles.CodeBox}>
              <div className={styles.CodeText}>{inviteCode}</div>

              <div className={styles.CodeActions}>
                <button
                  type="button"
                  className={styles.KakaoButton}
                  onClick={handleKakaoShare}
                >
                  <img className={styles.KakaoIcon} src={kakaoIcon} alt="카카오" />
                  공유
                </button>

                <button type="button" className={styles.CopyButton} onClick={handleCopy}>
                  <img className={styles.CopyIcon} src={copyIcon} alt="복사" />
                  복사
                </button>
              </div>

              <div className={styles.CodeHint}>위 코드를 친구에게 공유해주세요.</div>
            </div>

            <button
              type="button"
              className={styles.PrimaryButton}
              onClick={handleGoWaiting}
            >
              대기실로 이동 →
            </button>
          </div>
        </div>

        <div className={styles.Bottom}>
          <TipBanner text="Tip: 친구들이 코드를 입력하면 대기실에서 함께 만날 수 있어요!" />
        </div>
      </div>
    </div>
  );
}
