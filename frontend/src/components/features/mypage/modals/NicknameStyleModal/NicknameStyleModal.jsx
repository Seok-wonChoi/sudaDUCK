import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./NicknameStyleModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import NicknameBadge from "@/components/features/mypage/ProfileSection/NicknameBadge";
import PurchaseConfirmModal from "@/components/features/mypage/common/PurchaseConfirmModal";
import coinImage from "@/assets/images/coin.png";

const BACKGROUND_OPTIONS = [
  { id: "default", label: "ê¸°ë³¸", cost: 0 },
  { id: "gradient", label: "ê·¸ë¼?°ì´??, cost: 10 },
  { id: "ocean", label: "ë°”ë‹¤", cost: 10 },
  { id: "neon", label: "?¤ì˜¨", cost: 10 },
  { id: "gold", label: "ê³¨ë“œ", cost: 10 },
  { id: "rainbow", label: "?ˆì¸ë³´ìš°", cost: 10 },
];

const EFFECT_OPTIONS = [
  { id: "none", icon: "??, label: "?†ìŒ", cost: 0 },
  { id: "sparkle", icon: "??, label: "ë°˜ì§??, cost: 10 },
  { id: "star", icon: "â­?, label: "ë³?, cost: 10 },
  { id: "fire", icon: "?”¥", label: "ë¶ˆê½ƒ", cost: 10 },
  { id: "crown", icon: "?‘‘", label: "?•ê?", cost: 10 },
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

  // ?€???€???´ê¸ˆ??ê²ƒë§Œ ?•ì •)
  const [selectedBg, setSelectedBg] = useState(
    currentStyle.background || "default",
  );
  const [selectedEffect, setSelectedEffect] = useState(
    currentStyle.effect || "none",
  );

  // ë¯¸ë¦¬ë³´ê¸°??? ê¸´ ê²ƒë„ ë°˜ì˜
  const [previewBg, setPreviewBg] = useState(
    currentStyle.background || "default",
  );
  const [previewEffect, setPreviewEffect] = useState(
    currentStyle.effect || "none",
  );

  // 2?¨ê³„ ?´ë¦­???„í•œ pending
  const [pending, setPending] = useState({ type: null, id: null }); // type: "background" | "effect" | null
  const [purchaseModal, setPurchaseModal] = useState(null);

  // ? ë ¹ ?´ë¦­ ë°©ì?(type+id)
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
        BACKGROUND_OPTIONS.find((b) => b.id === id)?.label || "ë°°ê²½";
      setPurchaseModal({ type, id, name: bgName, cost });
      return;
    }
    const effectName = EFFECT_OPTIONS.find((e) => e.id === id)?.label || "?¨ê³¼";
    setPurchaseModal({ type, id, name: effectName, cost });
  };

  const handleOptionClick = (type, id, cost) => {
    // 1) ë¯¸ë¦¬ë³´ê¸°????ƒ ê°±ì‹ 
    if (type === "background") setPreviewBg(id);
    if (type === "effect") setPreviewEffect(id);

    const isUnlocked =
      (type === "background" && unlockedBackgrounds.includes(id)) ||
      (type === "effect" && unlockedEffects.includes(id));

    if (isUnlocked) {
      // ?´ê¸ˆ ?„ì´?œì? ì¦‰ì‹œ ? íƒ(?€???€?? ?•ì •
      if (type === "background") setSelectedBg(id);
      if (type === "effect") setSelectedEffect(id);
      setPending({ type: null, id: null });
      return;
    }

    // ? ê¸ˆ ?„ì´?œì? ? ë ¹ ?´ë¦­ ë°©ì?
    const ghostKey = `${type}:${id}`;
    if (guardGhostTap(ghostKey)) return;

    // 2) ??ë²ˆì§¸ ?´ë¦­?´ë©´ êµ¬ë§¤ ëª¨ë‹¬
    if (pending.type === type && pending.id === id) {
      setPending({ type: null, id: null });
      openPurchaseModalFor(type, id, cost);
      return;
    }

    // 1) ì²??´ë¦­?´ë©´ pendingë§??¤ì •(ë¯¸ë¦¬ë³´ê¸°ë§?ë°”ë€?
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
        ì·¨ì†Œ
      </button>
      <button type="button" className={styles.SaveBtn} onClick={handleSave} data-click-sound="false">
        ?€??
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

      <ModalWrapper title="?‰ë„¤???¤í??? onClose={onClose} footer={footer}>
        <div className={styles.Content}>
          <div className={styles.Preview}>
            <NicknameBadge
              nickname={editedNickname || nickname}
              style={previewStyle}
            />
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>?‰ë„¤??/h3>
            <input
              type="text"
              className={styles.NicknameInput}
              value={editedNickname}
              onChange={(e) => {
                const val = e.target.value;
                // ?œê?, ?ë¬¸, ?«ìžë§??ˆìš©?˜ëŠ” ?•ê·œ??
                const filtered = val.replace(/[^???Žê?-?£a-zA-Z0-9]/g, '');
                setEditedNickname(filtered);
              }}
              placeholder="?‰ë„¤?„ì„ ?…ë ¥?˜ì„¸??
              maxLength={12}
            />
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>ë°°ê²½ ?¤í???/h3>
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
                          alt="ì½”ì¸"
                          className={styles.CoinIconTiny}
                        />
                        <span>{option.cost}</span>
                      </div>
                    )}
                    {!isUnlocked && isPending && (
                      <span className={styles.PendingHint}>
                        ??ë²????„ë¥´ë©?êµ¬ë§¤
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>?¨ê³¼</h3>
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
                          alt="ì½”ì¸"
                          className={styles.CoinIconTiny}
                        />
                        <span>{option.cost}</span>
                      </div>
                    )}
                    {!isUnlocked && isPending && (
                      <span className={styles.PendingHintTiny}>??ë²???/span>
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
