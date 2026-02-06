import styles from './RankingItem.module.css';
import { useState, useMemo } from 'react';

// 이미지 import (경로 확인 필요)
import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

// 오리 설정 상수
const DUCK_PROFILE_IMAGES = {
  profile1: duckProfile1,
  profile2: duckProfile2,
  profile3: duckProfile3,
  profile4: duckProfile4,
};

const COLOR_MAP = {
  white: "#ffffff",
  yellow: "#fef08a",
  blue: "#93c5fd",
  pink: "#f9a8d4",
  green: "#86efac",
  purple: "#c4b5fd",
  orange: "#fdba74",
};

const ACCESSORY_MAP = {
  hat: "🎩",
  sunglasses: "🕶️",
  ribbon: "🎀",
  crown: "👑",
  none: null,
};

// JSON 파싱 및 정보 추출 함수
function safeParseJson(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function getDuckProfileInfo(duckCustomJson) {
  const parsed = safeParseJson(duckCustomJson);
  if (!parsed) {
    return { image: duckProfile1, color: "#ffffff", accessory: null };
  }
  const style = parsed.style || "profile1";
  const color = parsed.color || "white";
  const accessory = parsed.accessory || "none";

  return {
    image: DUCK_PROFILE_IMAGES[style] || duckProfile1,
    color: COLOR_MAP[color] || "#ffffff",
    accessory: ACCESSORY_MAP[accessory] || null,
  };
}


export default function RankingItem({
  rank,
  nickname,
  profileImageUrl,
  duckCustomJson,
  score,
  total = 4,
  isMe = false,
  isSpeaking = false
}) {

  const profileInfo = useMemo(() => getDuckProfileInfo(duckCustomJson), [duckCustomJson]);
  const [imgError, setImgError] = useState(false); // 이미지 에러 상태
  // 순위에 따른 메달 이모지
  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const rankIcon = getRankIcon(rank);

  // 프로필 이미지가 null이면 기본 회색 원
  const getProfileImage = () => {
    if (profileImageUrl && !imgError) {
      return <img src={profileImageUrl} alt={nickname} className={styles.avatarImage} onError={() => setImgError(true)} />;
    }
    return <div className={styles.avatarPlaceholder} />;
  };

  return (
    <div className={`${styles.item} ${isMe ? styles.isMe : ''}`}>
      {/* 왼쪽: 메달 */}
      <div className={styles.rankIcon}>
        {rankIcon ? (
          <span className={styles.medal}>{rankIcon}</span>
        ) : (
          <span className={styles.rankNumber}>{rank}</span>
        )}
      </div>

      {/* 중앙: 프로필 + 이름 */}
      {/* 중앙: 오리 프로필 + 이름 */}
      <div className={styles.userInfo}>
        {/* 오리 아이콘 래퍼 */}
        <div
          className={`${styles.duckWrapper} ${isSpeaking ? styles.speaking : ''}`}
          style={{ backgroundColor: profileInfo.color }}
        >
          <img
            src={profileInfo.image}
            alt="duck"
            className={styles.duckImage}
          />
          {profileInfo.accessory && (
            <span className={styles.accessory}>{profileInfo.accessory}</span>
          )}
          {isSpeaking && (
            <span className={styles.micIcon}>🎤</span>
          )}
        </div>

        <div className={styles.nameContainer}>
          <span className={styles.nickname}>{nickname}</span>
          {isMe && <span className={styles.youBadge}>YOU</span>}
        </div>
      </div>

      {/* <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {getProfileImage()}
        </div>
        <div className={styles.nameContainer}>
          <span className={styles.nickname}>{nickname}</span>
          {isMe && <span className={styles.youBadge}>YOU</span>}
        </div>
      </div> */}

      {/* 오른쪽: 점수 */}
      <div className={styles.score}>
        <span className={styles.scoreNumber}>{score}</span>
        <span className={styles.scoreTotal}>/ {total}</span>
      </div>
    </div>
  );
}
