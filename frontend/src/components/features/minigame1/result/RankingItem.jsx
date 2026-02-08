import styles from './RankingItem.module.css';
import { useState, useMemo } from 'react';

// ?¥Î?ÏßÄ import (Í≤ΩÎ°ú ?ïÏù∏ ?ÑÏöî)
import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

// ?§Î¶¨ ?§Ï†ï ?ÅÏàò
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
  hat: "?é©",
  sunglasses: "?ï∂Ô∏?,
  ribbon: "??",
  crown: "?ëë",
  none: null,
};

// JSON ?åÏã± Î∞??ïÎ≥¥ Ï∂îÏ∂ú ?®Ïàò
function safeParseJson(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function getDuckProfileInfo(duckCustomJson) {
  let parsed = null;
  if (typeof duckCustomJson === 'object' && duckCustomJson !== null) {
    parsed = duckCustomJson;
  } else {
    parsed = safeParseJson(duckCustomJson);
  }

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
  isMe = false
}) {

  const profileInfo = useMemo(() => getDuckProfileInfo(duckCustomJson), [duckCustomJson]);
  const [imgError, setImgError] = useState(false); // ?¥Î?ÏßÄ ?êÎü¨ ?ÅÌÉú
  
  const getRankIcon = (rank) => {
    if (rank === 1) return '?•á';
    if (rank === 2) return '?•à';
    if (rank === 3) return '?•â';
    return null;
  };

  const rankIcon = getRankIcon(rank);

  // ?ÑÎ°ú???¥Î?ÏßÄÍ∞Ä null?¥Î©¥ Í∏∞Î≥∏ ?åÏÉâ ??
  const getProfileImage = () => {
    if (profileImageUrl && !imgError) {
      return <img src={profileImageUrl} alt={nickname} className={styles.avatarImage} onError={() => setImgError(true)} />;
    }
    return <div className={styles.avatarPlaceholder} />;
  };

  return (
    <div className={`${styles.item} ${isMe ? styles.isMe : ''}`}>
      {/* ?ºÏ™Ω: Î©îÎã¨ */}
      <div className={styles.rankIcon}>
        {rankIcon ? (
          <span className={styles.medal}>{rankIcon}</span>
        ) : (
          <span className={styles.rankNumber}>{rank}</span>
        )}
      </div>

      {/* Ï§ëÏïô: ?ÑÎ°ú??+ ?¥Î¶Ñ */}
      {/* Ï§ëÏïô: ?§Î¶¨ ?ÑÎ°ú??+ ?¥Î¶Ñ */}
      <div className={styles.userInfo}>
        {/* ?§Î¶¨ ?ÑÏù¥ÏΩ??òÌçº */}
        <div
          className={styles.duckWrapper}
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

      {/* ?§Î•∏Ï™? ?êÏàò */}
      <div className={styles.score}>
        <span className={styles.scoreNumber}>{score}</span>
        <span className={styles.scoreTotal}>/ {total}</span>
      </div>
    </div>
  );
}
