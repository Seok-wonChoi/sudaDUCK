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
  { id: "cyan", label: "사이버", image: duckBotCyan, cost: 0 },
  { id: "orange", label: "아머", image: duckBotOrange, cost: 20 },
  { id: "digital", label: "디지털", image: duckBotDigital, cost: 20 },
  { id: "mecha", label: "메카", image: duckBotMecha, cost: 20 },
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

  // 터치 + 클릭 등으로 동일 입력이 2번 들어오는(유령 클릭) 케이스 방지
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
      DUCK_OPTIONS.find((d) => d.id === duckId)?.label || "오리봇";
    setPurchaseModal({
      id: duckId,
      name: `${duckName} 오리봇`,
      cost,
    });
  };

  const handleDuckClick = (duckId, cost) => {
    const isUnlocked = unlockedDuckBots.includes(duckId);

    // 1) 미리보기는 항상 갱신
    setPreviewId(duckId);

    if (isUnlocked) {
      // 해금 아이템은 즉시 선택(저장 대상)
      setSelectedId(duckId);
      setPendingPurchaseId(null);
      return;
    }

    // 잠금 아이템에서 유령 클릭(터치+클릭 등) 방지
    const now = Date.now();
    if (lastTapRef.current.id === duckId && now - lastTapRef.current.ts < 250) {
      return;
    }
    lastTapRef.current = { id: duckId, ts: now };

    // 잠금 아이템은 2단계 클릭
    if (pendingPurchaseId === duckId) {
      // 두 번째 클릭: 구매 모달
      setPendingPurchaseId(null);
      openPurchaseModalFor(duckId, cost);
      return;
    }

    // 첫 번째 클릭: 구매 대기 상태만 설정 (미리보기만 바뀜)
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
      // 구매 성공 시 선택 + 미리보기 확정
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
      <button type="button" className={styles.CancelBtn} onClick={onClose}>
        취소
      </button>
      <button type="button" className={styles.SaveBtn} onClick={handleSave}>
        저장
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

      <ModalWrapper title="AI오리봇 바꾸기" onClose={onClose} footer={footer}>
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
                        <span className={styles.LockIcon}>🔒</span>
                        <div className={styles.CoinBadge}>
                          <img
                            src={coinImage}
                            alt="코인"
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
                      한 번 더 누르면 구매
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
