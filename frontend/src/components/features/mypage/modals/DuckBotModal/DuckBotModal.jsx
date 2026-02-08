import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DuckBotModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import PurchaseConfirmModal from "@/components/features/mypage/common/PurchaseConfirmModal";
import coinImage from "@/assets/images/coin.png";

import duckBotCyan from "@/assets/images/duck_bot_cyan.png";
import duckBotOrange from "@/assets/images/duck_bot_orange.png";
import duckBotDigital from "@/assets/images/duck_bot_digital.png";
import duckBotMecha from "@/assets/images/duck_bot_mecha.png";

const DUCK_OPTIONS = [
  { id: "cyan", label: "?¨Ïù¥Î≤?, image: duckBotCyan, cost: 0 },
  { id: "orange", label: "?ÑÎ®∏", image: duckBotOrange, cost: 20 },
  { id: "digital", label: "?îÏ???, image: duckBotDigital, cost: 20 },
  { id: "mecha", label: "Î©îÏπ¥", image: duckBotMecha, cost: 20 },
];

export default function DuckBotModal({
  currentDuckId = "cyan",
  coins = 0,
  unlockedDuckBots = [],
  onPurchase,
  onSave,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(currentDuckId);
  const [previewId, setPreviewId] = useState(currentDuckId);
  const [pendingPurchaseId, setPendingPurchaseId] = useState(null);
  const [purchaseModal, setPurchaseModal] = useState(null);

  // ?∞Ïπò + ?¥Î¶≠ ?±ÏúºÎ°??ôÏùº ?ÖÎ†•??2Î≤??§Ïñ¥?§Îäî(?†Î†π ?¥Î¶≠) ÏºÄ?¥Ïä§ Î∞©Ï?
  const lastTapRef = useRef({ id: null, ts: 0 });

  useEffect(() => {
    setSelectedId(currentDuckId);
    setPreviewId(currentDuckId);
    setPendingPurchaseId(null);
    setPurchaseModal(null);
    lastTapRef.current = { id: null, ts: 0 };
  }, [currentDuckId]);

  const selectedDuck = useMemo(() => {
    return DUCK_OPTIONS.find((d) => d.id === previewId) || DUCK_OPTIONS[0];
  }, [previewId]);

  const openPurchaseModalFor = (duckId, cost) => {
    const duckName =
      DUCK_OPTIONS.find((d) => d.id === duckId)?.label || "?§Î¶¨Î¥?;
    setPurchaseModal({
      id: duckId,
      name: `${duckName} ?§Î¶¨Î¥?,
      cost,
    });
  };

  const handleDuckClick = (duckId, cost) => {
    const isUnlocked = unlockedDuckBots.includes(duckId);

    // 1) ÎØ∏Î¶¨Î≥¥Í∏∞????ÉÅ Í∞±Ïã†
    setPreviewId(duckId);

    if (isUnlocked) {
      // ?¥Í∏à ?ÑÏù¥?úÏ? Ï¶âÏãú ?†ÌÉù(?Ä???Ä??
      setSelectedId(duckId);
      setPendingPurchaseId(null);
      return;
    }

    // ?†Í∏à ?ÑÏù¥?úÏóê???†Î†π ?¥Î¶≠(?∞Ïπò+?¥Î¶≠ ?? Î∞©Ï?
    const now = Date.now();
    if (lastTapRef.current.id === duckId && now - lastTapRef.current.ts < 250) {
      return;
    }
    lastTapRef.current = { id: duckId, ts: now };

    // ?†Í∏à ?ÑÏù¥?úÏ? 2?®Í≥Ñ ?¥Î¶≠
    if (pendingPurchaseId === duckId) {
      // ??Î≤àÏß∏ ?¥Î¶≠: Íµ¨Îß§ Î™®Îã¨
      setPendingPurchaseId(null);
      openPurchaseModalFor(duckId, cost);
      return;
    }

    // Ï≤?Î≤àÏß∏ ?¥Î¶≠: Íµ¨Îß§ ?ÄÍ∏??ÅÌÉúÎß??§Ï†ï (ÎØ∏Î¶¨Î≥¥Í∏∞Îß?Î∞îÎÄ?
    setPendingPurchaseId(duckId);
  };

  const handlePurchaseConfirm = async () => {
    if (!purchaseModal) return;

    const ok = await onPurchase?.(
      "duckBot",
      purchaseModal.id,
      purchaseModal.cost,
    );

    if (ok) {
      // Íµ¨Îß§ ?±Í≥µ ???†ÌÉù + ÎØ∏Î¶¨Î≥¥Í∏∞ ?ïÏ†ï
      setSelectedId(purchaseModal.id);
      setPreviewId(purchaseModal.id);
    }

    setPurchaseModal(null);
    setPendingPurchaseId(null);
  };

  const handleSave = () => {
    onSave?.(selectedId);
    onClose?.();
  };

  const footer = (
    <>
      <button type="button" className={styles.CancelBtn} onClick={onClose} data-click-sound="false">
        Ï∑®ÏÜå
      </button>
      <button type="button" className={styles.SaveBtn} onClick={handleSave} data-click-sound="false">
        ?Ä??
      </button>
    </>
  );

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
            setPendingPurchaseId(null);
          }}
        />
      )}

      <ModalWrapper title="AI?§Î¶¨Î¥?Î∞îÍæ∏Í∏? onClose={onClose} footer={footer}>
        <div className={styles.Content}>
          <div className={styles.Preview}>
            <img
              src={selectedDuck?.image}
              alt={selectedDuck?.label}
              className={styles.PreviewImage}
            />
          </div>

          <div className={styles.Grid}>
            {DUCK_OPTIONS.map((option) => {
              const isUnlocked = unlockedDuckBots.includes(option.id);
              const isSelected = selectedId === option.id;
              const isPending = !isUnlocked && pendingPurchaseId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.DuckCard} ${
                    isSelected ? styles.Selected : ""
                  } ${!isUnlocked ? styles.Locked : ""} ${
                    isPending ? styles.PendingPurchase : ""
                  }`}
                  onClick={() => handleDuckClick(option.id, option.cost)}
                >
                  <div className={styles.DuckImageWrapper}>
                    <img
                      src={option.image}
                      alt={option.label}
                      className={styles.DuckThumb}
                    />
                    {!isUnlocked && (
                      <div className={styles.LockOverlay}>
                        <span className={styles.LockIcon}>?îí</span>
                        <div className={styles.CoinBadge}>
                          <img
                            src={coinImage}
                            alt="ÏΩîÏù∏"
                            className={styles.CoinIconSmall}
                          />
                          <span>{option.cost}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className={styles.DuckLabel}>{option.label}</span>

                  {!isUnlocked && isPending && (
                    <span className={styles.PendingHint}>
                      ??Î≤????ÑÎ•¥Î©?Íµ¨Îß§
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
