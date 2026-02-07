import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./NicknameStyleModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import NicknameBadge from "@/components/features/mypage/ProfileSection/NicknameBadge";
import PurchaseConfirmModal from "@/components/features/mypage/common/PurchaseConfirmModal";
import coinImage from "@/assets/images/coin.png";

const BACKGROUND_OPTIONS = [
  { id: "default", label: "기본", cost: 0 },
  { id: "gradient", label: "그라데이션", cost: 10 },
  { id: "ocean", label: "바다", cost: 10 },
  { id: "neon", label: "네온", cost: 10 },
  { id: "gold", label: "골드", cost: 10 },
  { id: "rainbow", label: "레인보우", cost: 10 },
];

const EFFECT_OPTIONS = [
  { id: "none", icon: "❌", label: "없음", cost: 0 },
  { id: "sparkle", icon: "✨", label: "반짝임", cost: 10 },
  { id: "star", icon: "⭐", label: "별", cost: 10 },
  { id: "fire", icon: "🔥", label: "불꽃", cost: 10 },
  { id: "crown", icon: "👑", label: "왕관", cost: 10 },
];

export default function NicknameStyleModal({
  nickname = "example",
  currentStyle = {},
  coins = 0,
  unlockedBackgrounds = [],
  unlockedEffects = [],
  onPurchase,
  onSave,
  onClose,
}) {
  const [editedNickname, setEditedNickname] = useState(nickname);

  // 저장 대상(해금된 것만 확정)
  const [selectedBg, setSelectedBg] = useState(
    currentStyle.background || "default",
  );
  const [selectedEffect, setSelectedEffect] = useState(
    currentStyle.effect || "none",
  );

  // 미리보기는 잠긴 것도 반영
  const [previewBg, setPreviewBg] = useState(
    currentStyle.background || "default",
  );
  const [previewEffect, setPreviewEffect] = useState(
    currentStyle.effect || "none",
  );

  // 2단계 클릭을 위한 pending
  const [pending, setPending] = useState({ type: null, id: null }); // type: "background" | "effect" | null
  const [purchaseModal, setPurchaseModal] = useState(null);

  // 유령 클릭 방지(type+id)
  const lastTapRef = useRef({ key: null, ts: 0 });

  useEffect(() => {
    setEditedNickname(nickname);

    const bg = currentStyle.background || "default";
    const ef = currentStyle.effect || "none";

    setSelectedBg(bg);
    setSelectedEffect(ef);

    setPreviewBg(bg);
    setPreviewEffect(ef);

    setPending({ type: null, id: null });
    setPurchaseModal(null);
    lastTapRef.current = { key: null, ts: 0 };
  }, [nickname, currentStyle]);

  const guardGhostTap = (key) => {
    const now = Date.now();
    if (lastTapRef.current.key === key && now - lastTapRef.current.ts < 250) {
      return true;
    }
    lastTapRef.current = { key, ts: now };
    return false;
  };

  const openPurchaseModalFor = (type, id, cost) => {
    if (type === "background") {
      const bgName =
        BACKGROUND_OPTIONS.find((b) => b.id === id)?.label || "배경";
      setPurchaseModal({ type, id, name: bgName, cost });
      return;
    }
    const effectName = EFFECT_OPTIONS.find((e) => e.id === id)?.label || "효과";
    setPurchaseModal({ type, id, name: effectName, cost });
  };

  const handleOptionClick = (type, id, cost) => {
    // 1) 미리보기는 항상 갱신
    if (type === "background") setPreviewBg(id);
    if (type === "effect") setPreviewEffect(id);

    const isUnlocked =
      (type === "background" && unlockedBackgrounds.includes(id)) ||
      (type === "effect" && unlockedEffects.includes(id));

    if (isUnlocked) {
      // 해금 아이템은 즉시 선택(저장 대상) 확정
      if (type === "background") setSelectedBg(id);
      if (type === "effect") setSelectedEffect(id);
      setPending({ type: null, id: null });
      return;
    }

    // 잠금 아이템은 유령 클릭 방지
    const ghostKey = `${type}:${id}`;
    if (guardGhostTap(ghostKey)) return;

    // 2) 두 번째 클릭이면 구매 모달
    if (pending.type === type && pending.id === id) {
      setPending({ type: null, id: null });
      openPurchaseModalFor(type, id, cost);
      return;
    }

    // 1) 첫 클릭이면 pending만 설정(미리보기만 바뀜)
    setPending({ type, id });
  };

  const handlePurchaseConfirm = async () => {
    if (!purchaseModal) return;

    const ok = await onPurchase?.(
      purchaseModal.type,
      purchaseModal.id,
      purchaseModal.cost,
    );

    if (ok) {
      if (purchaseModal.type === "background") {
        setSelectedBg(purchaseModal.id);
        setPreviewBg(purchaseModal.id);
      } else if (purchaseModal.type === "effect") {
        setSelectedEffect(purchaseModal.id);
        setPreviewEffect(purchaseModal.id);
      }
    }

    setPurchaseModal(null);
    setPending({ type: null, id: null });
  };

  const handleSave = () => {
    onSave?.({
      nickname: editedNickname.trim() || nickname,
      background: selectedBg,
      effect: selectedEffect,
    });
    onClose?.();
  };

  const footer = (
    <>
      <button type="button" className={styles.CancelBtn} onClick={onClose} data-click-sound="false">
        취소
      </button>
      <button type="button" className={styles.SaveBtn} onClick={handleSave} data-click-sound="false">
        저장
      </button>
    </>
  );

  const previewStyle = useMemo(() => {
    return { background: previewBg, effect: previewEffect };
  }, [previewBg, previewEffect]);

  return (
    <>
      {purchaseModal && (
        <PurchaseConfirmModal
          itemName={purchaseModal.name}
          cost={purchaseModal.cost}
          currentCoins={coins}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => {
            setPurchaseModal(null);
            setPending({ type: null, id: null });
          }}
        />
      )}

      <ModalWrapper title="닉네임 스타일" onClose={onClose} footer={footer}>
        <div className={styles.Content}>
          <div className={styles.Preview}>
            <NicknameBadge
              nickname={editedNickname || nickname}
              style={previewStyle}
            />
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>닉네임</h3>
            <input
              type="text"
              className={styles.NicknameInput}
              value={editedNickname}
              onChange={(e) => {
                const val = e.target.value;
                // 한글, 영문, 숫자만 허용하는 정규식
                const filtered = val.replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9]/g, '');
                setEditedNickname(filtered);
              }}
              placeholder="닉네임을 입력하세요"
              maxLength={12}
            />
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>배경 스타일</h3>
            <div className={styles.OptionsGrid}>
              {BACKGROUND_OPTIONS.map((option) => {
                const isUnlocked = unlockedBackgrounds.includes(option.id);
                const isSelected = selectedBg === option.id;
                const isPending =
                  !isUnlocked &&
                  pending.type === "background" &&
                  pending.id === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.OptionButton} ${styles[`bg_${option.id}`]} ${
                      isSelected ? styles.Selected : ""
                    } ${!isUnlocked ? styles.Locked : ""} ${
                      isPending ? styles.PendingPurchase : ""
                    }`}
                    onClick={() =>
                      handleOptionClick("background", option.id, option.cost)
                    }
                  >
                    {option.label}
                    {!isUnlocked && (
                      <div className={styles.LockBadge}>
                        <img
                          src={coinImage}
                          alt="코인"
                          className={styles.CoinIconTiny}
                        />
                        <span>{option.cost}</span>
                      </div>
                    )}
                    {!isUnlocked && isPending && (
                      <span className={styles.PendingHint}>
                        한 번 더 누르면 구매
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>효과</h3>
            <div className={styles.EffectsRow}>
              {EFFECT_OPTIONS.map((option) => {
                const isUnlocked = unlockedEffects.includes(option.id);
                const isSelected = selectedEffect === option.id;
                const isPending =
                  !isUnlocked &&
                  pending.type === "effect" &&
                  pending.id === option.id;

                return (
                  <button
                    key={option.id || "none"}
                    type="button"
                    className={`${styles.EffectButton} ${
                      isSelected ? styles.Selected : ""
                    } ${!isUnlocked ? styles.Locked : ""} ${
                      isPending ? styles.PendingPurchase : ""
                    }`}
                    onClick={() =>
                      handleOptionClick("effect", option.id, option.cost)
                    }
                    title={option.label}
                  >
                    {option.icon}
                    {!isUnlocked && (
                      <div className={styles.EffectLockBadge}>
                        <img
                          src={coinImage}
                          alt="코인"
                          className={styles.CoinIconTiny}
                        />
                        <span>{option.cost}</span>
                      </div>
                    )}
                    {!isUnlocked && isPending && (
                      <span className={styles.PendingHintTiny}>한 번 더</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
