import styles from "./TogetherPage.module.css";
import { useNavigate } from "react-router-dom";

import AppHeader from "../../components/Layout/AppHeader/AppHeader";
import ActionCard from "../../components/Common/ActionCard/ActionCard";

import makeRoomIcon from "../../assets/icons/make_room.png";
import joinRoomIcon from "../../assets/icons/join_room.png";

export default function TogetherPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleMakeRoom = () => {
    navigate("/together/make");
  };

  const handleJoinRoom = () => {
    navigate("/together/join");
  };

  const topics = [
    "첫 아르바이트 추억",
    "최악의 데이트",
    "나만의 취미생활",
    "학창시절 이야기",
    "여행 경험담",
  ];

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

          <h1 className={styles.Title}>함께 하기</h1>
          <p className={styles.Subtitle}>새로운 방을 만들거나 친구의 방에 참여해보세요</p>

          <section className={styles.CardRow} aria-label="함께하기 메뉴">
            <ActionCard
              title="방 만들기"
              description="새로운 방을 만들고 친구들을 초대하세요."
              iconSrc={makeRoomIcon}
              iconAlt="방 만들기"
              onClick={handleMakeRoom}
            />
            <ActionCard
              title="참여하기"
              description="친구가 공유한 참여 코드로 방에 입장하세요."
              iconSrc={joinRoomIcon}
              iconAlt="참여하기"
              onClick={handleJoinRoom}
            />
          </section>
        </main>

        <section className={styles.Bottom} aria-label="공유 및 인기 주제">
          <div className={styles.ShareBanner}>
            <span className={styles.ShareText}>
              친구에게 참여 코드를 <span className={styles.Emph}>카톡</span>으로 공유하세요!
            </span>
          </div>

          <div className={styles.Popular}>
            <div className={styles.PopularTitle}>지금 인기있는 주제</div>
            <div className={styles.TopicRow}>
              {topics.map((t) => (
                <button key={t} type="button" className={styles.TopicChip}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
