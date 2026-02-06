import { useMemo } from 'react';
import styles from './ParticipantList.module.css';

export default function ParticipantList({ 
  participants = [],
  voiceLevels = {}
}) {
  // 참가자 데이터와 음성 레벨 매칭 - voiceLevel > 0인 경우만 업데이트
  const participantsWithVoice = useMemo(() => {
    console.log('🔍 [ParticipantList] voiceLevels:', voiceLevels);
    console.log('🔍 [ParticipantList] participants:', participants);

    return participants.map(p => {
      const level = voiceLevels[p.key] || voiceLevels[p.id] || voiceLevels[p.userId] || 0;
      const isSpeaking = level > 0.05;

      if (isSpeaking) {
        console.log('🎤 [ParticipantList] Speaking detected:', {
          name: p.name || p.nickname,
          key: p.key,
          id: p.id,
          userId: p.userId,
          level,
          isSpeaking
        });
      }

      return {
        ...p,
        voiceLevel: level,
        isSpeaking
      };
    });
  }, [participants, voiceLevels]);

  if (!participants || participants.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="#facc15"/>
        </svg>
        <span>참여자</span>
      </div>
      <div className={styles.list}>
        {participantsWithVoice.map((p, idx) => {
          // 프로필 이미지 URL (여러 fallback 시도)
          const profileUrl = p.avatar || p.profileImageUrl;
          
          return (
            <div key={p.id || p.userId || idx} className={styles.participant}>
              <div className={styles.avatar}>
                {/* 음성 레벨에 따른 빛 효과 */}
                {p.isSpeaking && p.voiceLevel > 0 && (
                  <div 
                    className={styles.voiceGlow}
                    style={{
                      opacity: Math.min(p.voiceLevel * 1.5, 1),
                    }}
                  />
                )}

                {/* 아바타 이미지 또는 이니셜 */}
                {profileUrl ? (
                  <img
                    src={profileUrl}
                    alt={p.name || p.nickname}
                    className={`${styles.avatarImage} ${p.isSpeaking ? styles.speaking : ''}`}
                    onError={(e) => {
                      // 이미지 로드 실패 시 이니셜로 대체
                      console.error('❌ 이미지 로드 실패:', profileUrl);
                      e.target.style.display = 'none';
                      // 이니셜 표시를 위해 부모 요소에 fallback 클래스 추가
                      if (e.target.parentElement) {
                        const placeholder = document.createElement('div');
                        placeholder.className = `${styles.avatarPlaceholder} ${p.isSpeaking ? styles.speaking : ''}`;
                        placeholder.textContent = (p.name || p.nickname)?.charAt(0)?.toUpperCase() || '?';
                        e.target.parentElement.appendChild(placeholder);
                      }
                    }}
                  />
                ) : (
                  <div className={`${styles.avatarPlaceholder} ${p.isSpeaking ? styles.speaking : ''}`}>
                    {(p.name || p.nickname)?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <span className={styles.name}>
                {p.name || p.nickname}
                {p.isMe && <span className={styles.meBadge}>나</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
