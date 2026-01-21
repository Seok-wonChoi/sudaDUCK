import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./RoomCreatedPage.module.css";

import AppHeader from "../../components/Layout/AppHeader/AppHeader";
import TipBanner from "../../components/Main/TipBanner/TipBanner";

import kakaoIcon from "../../assets/icons/kakaotalk_icon.png";
import copyIcon from "../../assets/icons/copy_icon.png";

export default function RoomCreatedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const fallback = useMemo(
    () => ({
      roomTitle: "1반 영어 공부하자!",
      roomTopic: "좋아하는 음식",
      turnCount: 3,
      inviteCode: "92SA71",
    }),
    []
  );

  const [data] = useState(() => {
    const fromState = location.state;
    if (fromState && fromState.inviteCode) {
      sessionStorage.setItem("roomCreateResult", JSON.stringify(fromState));
      return fromState;
    }

    const saved = sessionStorage.getItem("roomCreateResult");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.inviteCode) return parsed;
      } catch (e) {
        return fallback;
      }
    }

    return fallback;
  });

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/together");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.inviteCode);
      alert("참여 코드가 복사되었습니다.");
    } catch (e) {
      alert("복사에 실패했습니다.");
    }
  };

  const handleShare = async () => {
    const text = `참여 코드: ${data.inviteCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "참여 코드 공유", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      alert("공유 문구가 복사되었습니다.");
    } catch (e) {
      alert("공유에 실패했습니다.");
    }
  };

  const handleGoWaiting = () => {
    console.log("대기실로 이동");
  };

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <main className={styles.Top}>
          <button
            className={styles.BackButton}
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            <span className={styles.BackIcon} aria-hidden="true">
              &lt;
            </span>
            <span className={styles.BackText}>뒤로가기</span>
          </button>

          <h1 className={styles.Title}>방이 생성되었어요!</h1>
          <p className={styles.Subtitle}>친구들에게 참여 코드를 공유해보세요.</p>

          <section className={styles.Card} aria-label="방 생성 결과">
            <div className={styles.InfoGrid}>
              <div className={styles.InfoWide}>
                <div className={styles.InfoLabel}>방 제목</div>
                <div className={styles.InfoValue}>{data.roomTitle}</div>
              </div>

              <div className={styles.InfoBox}>
                <div className={styles.InfoLabel}>주제</div>
                <div className={styles.InfoValue}>{data.roomTopic}</div>
              </div>

              <div className={styles.InfoBox}>
                <div className={styles.InfoLabel}>턴 수</div>
                <div className={styles.InfoValue}>{data.turnCount}턴</div>
              </div>
            </div>

            <div className={styles.CodeLabel}>참여 코드</div>

            <div className={styles.CodeBox}>
              <div className={styles.CodeText}>{data.inviteCode}</div>

              <div className={styles.CodeActions}>
                <button type="button" className={styles.ShareBtn} onClick={handleShare}>
                  <img className={styles.BtnIcon} src={kakaoIcon} alt="" aria-hidden="true" />
                  공유
                </button>

                <button type="button" className={styles.CopyBtn} onClick={handleCopy}>
                  <img className={styles.BtnIcon} src={copyIcon} alt="" aria-hidden="true" />
                  복사
                </button>
              </div>

              <div className={styles.CodeHint}>위 코드를 친구에게 공유해주세요.</div>
            </div>

            <button type="button" className={styles.PrimaryButton} onClick={handleGoWaiting}>
              대기실로 이동
              <span className={styles.Arrow} aria-hidden="true">
                →
              </span>
            </button>
          </section>
        </main>

        <section className={styles.Bottom}>
          <div className={styles.TipWrap}>
            <TipBanner text="Tip: 친구들이 코드를 입력하면 대기실에서 함께 만날 수 있어요!" />
          </div>
        </section>
      </div>
    </div>
  );
}
