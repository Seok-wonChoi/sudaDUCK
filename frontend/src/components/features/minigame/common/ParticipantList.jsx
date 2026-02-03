import { useMemo } from 'react';
import styles from './ParticipantList.module.css';

export default function ParticipantList({ 
  participants = [],
  voiceLevels = {} // { userId: level } 형태
}) {
  // 참가자 데이터와 음성 레벨 매칭
  const participantsWithVoice = useMemo(() => {
    return participants.map(p => ({
      ...p,
      voiceLevel: voiceLevels[p.id] || 0,
      isSpeaking: (voiceLevels[p.id] || 0) > 0.1 // 10% 이상이면 말하는 중
    }));
  }, [participants, voiceLevels]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="#facc15"/>
        </svg>
        <span>참여자</span>
      </div>
      <div className={styles.list}>
        {participantsWithVoice.map((p, idx) => (
          <div key={p.id || idx} className={styles.participant}>
            <div className={`${styles.avatar} ${p.isActive ? styles.active : styles.inactive}`}>
              {/* 음성 레벨에 따른 빛 효과 */}
              {p.isSpeaking && (
                <div 
                  className={styles.voiceGlow}
                  style={{
                    opacity: Math.min(p.voiceLevel * 1.5, 1),
                    animation: 'pulse 0.5s ease-in-out infinite'
                  }}
                />
              )}

              {/* 아바타 이미지 */}
              {p.avatar || p.profileImageUrl ? (
                <img 
                  src={p.avatar || p.profileImageUrl} 
                  alt={p.name || p.nickname} 
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {(p.name || p.nickname)?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}

              {/* 마이크 아이콘 */}
              <div className={`${styles.micIcon} ${p.isActive ? styles.micActive : styles.micInactive} ${p.isSpeaking ? styles.speaking : ''}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path 
                    d="M5 1V6M5 6C3.89543 6 3 5.10457 3 4M5 6C6.10457 6 7 5.10457 7 4M2 4V5C2 6.65685 3.34315 8 5 8C6.65685 8 8 6.65685 8 5V4" 
                    stroke="currentColor" 
                    strokeWidth="1.2" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <span className={styles.name}>
              {p.name || p.nickname}
              {p.isMe && <span className={styles.meBadge}>나</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
