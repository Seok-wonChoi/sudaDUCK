import { useMemo } from 'react';
import styles from './ParticipantList.module.css';

// ?´ë?ì§€ import
import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

// ?¤ë¦¬ ?¤ì • ?ìˆ˜ (RankingItemê³??™ì¼)
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
  hat: "?Ž©",
  sunglasses: "?•¶ï¸?,
  ribbon: "??",
  crown: "?‘‘",
  none: null,
};

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

export default function ParticipantList({ 
  participants = []
}) {
  // ì°¸ê????°ì´??ë§¤í•‘
  const processedParticipants = useMemo(() => {
    return participants.map(p => ({
      ...p,
      profileInfo: getDuckProfileInfo(p.duckCustomJson)
    }));
  }, [participants]);

  if (!participants || participants.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="#facc15"/>
        </svg>
        <span>ì°¸ì—¬??/span>
      </div>
      <div className={styles.list}>
        {processedParticipants.map((p, idx) => {
          const { profileInfo } = p;
          
          return (
            <div key={p.key || p.id || p.userId || idx} className={styles.participant}>
              <div 
                className={styles.avatar}
                style={{ backgroundColor: profileInfo.color }}
              >
                {/* ?¤ë¦¬ ?´ë?ì§€ */}
                <img
                  src={profileInfo.image}
                  alt={p.name || p.nickname}
                  className={styles.duckImage}
                />
                
                {/* ?¡ì„¸?œë¦¬ */}
                {profileInfo.accessory && (
                  <span className={styles.accessory}>{profileInfo.accessory}</span>
                )}
              </div>
              <span className={styles.name}>
                {p.nickname || p.name}
                {p.isMe && <span className={styles.meBadge}>??/span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
