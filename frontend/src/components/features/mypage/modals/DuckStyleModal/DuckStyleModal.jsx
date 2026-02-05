import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DuckStyleModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import PurchaseConfirmModal from "@/components/features/mypage/common/PurchaseConfirmModal";
import coinImage from "@/assets/images/coin.png";

import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

const PROFILE_OPTIONS = [
  { id: "profile1", image: duckProfile1, cost: 0 },
  { id: "profile2", image: duckProfile2, cost: 10 },
  { id: "profile3", image: duckProfile3, cost: 10 },
  { id: "profile4", image: duckProfile4, cost: 10 },
];

const COLOR_OPTIONS = [
  { id: "white", color: "#ffffff", cost: 0 },
  { id: "yellow", color: "#fef08a", cost: 20 },
  { id: "blue", color: "#93c5fd", cost: 20 },
  { id: "pink", color: "#f9a8d4", cost: 20 },
  { id: "green", color: "#86efac", cost: 20 },
  { id: "purple", color: "#c4b5fd", cost: 20 },
  { id: "orange", color: "#fdba74", cost: 20 },
];

const ACCESSORY_OPTIONS = [
  { id: "none", icon: "❌", label: "없음", cost: 0 },
  { id: "hat", icon: "🎩", label: "모자", cost: 20 },
  { id: "sunglasses", icon: "🕶️", label: "선글라스", cost: 20 },
  { id: "ribbon", icon: "🎀", label: "리본", cost: 20 },
  { id: "crown", icon: "👑", label: "왕관", cost: 20 },
];

export default function DuckStyleModal({
  currentProfileId = "profile1",
  currentColor = "yellow",
  currentAccessory = "none",
  coins = 0,
  unlockedProfiles = [],
  unlockedColors = [],
  unlockedAccessories = [],
  onPurchase,
  onSave,
  onClose,
}) {
  // 저장 대상(해금된 것만 확정)
  const [selectedProfileId, setSelectedProfileId] = useState(currentProfileId);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [selectedAccessory, setSelectedAccessory] = useState(currentAccessory);

  // 미리보기는 잠긴 것도 반영
  const [previewProfileId, setPreviewProfileId] = useState(currentProfileId);
  const [previewColor, setPreviewColor] = useState(currentColor);
  const [previewAccessory, setPreviewAccessory] = useState(currentAccessory);

  // 잠금 아이템 2단계 클릭용 pending
  const [pending, setPending] = useState({
    type: null, // "profile" | "color" | "accessory" | null
    id: null,
  });

  const [purchaseModal, setPurchaseModal] = useState(null);

  // 유령 클릭 방지(type+id 기준)
  const lastTapRef = useRef({ key: null, ts: 0 });

  useEffect(() => {
    setSelectedProfileId(currentProfileId);
    setSelectedColor(currentColor);
    setSelectedAccessory(currentAccessory);

    setPreviewProfileId(currentProfileId);
    setPreviewColor(currentColor);
    setPreviewAccessory(currentAccessory);

    setPending({ type: null, id: null });
    setPurchaseModal(null);
    lastTapRef.current = { key: null, ts: 0 };
  }, [currentProfileId, currentColor, currentAccessory]);

  const selectedProfile = useMemo(() => {
    return (
      PROFILE_OPTIONS.find((p) => p.id === previewProfileId) ||
      PROFILE_OPTIONS[0]
    );
  }, [previewProfileId]);

  const selectedColorObj = useMemo(() => {
    return COLOR_OPTIONS.find((c) => c.id === previewColor) || COLOR_OPTIONS[0];
  }, [previewColor]);

  const previewAccessoryObj = useMemo(() => {
    return (
      ACCESSORY_OPTIONS.find((a) => a.id === previewAccessory) ||
      ACCESSORY_OPTIONS[0]
    );
  }, [previewAccessory]);

  const openPurchaseModalFor = (type, id, cost, name) => {
    setPurchaseModal({ type, id, cost, name });
  };

  const guardGhostTap = (key) => {
    const now = Date.now();
    if (lastTapRef.current.key === key && now - lastTapRef.current.ts < 250) {
      return true;
    }
    lastTapRef.current = { key, ts: now };
    return false;
  };

  const handleClickOption = (type, id, cost) => {
    // 1) 미리보기는 항상 갱신
    if (type === "profile") setPreviewProfileId(id);
    if (type === "color") setPreviewColor(id);
    if (type === "accessory") setPreviewAccessory(id);

    const isUnlocked =
      (type === "profile" && unlockedProfiles.includes(id)) ||
      (type === "color" && unlockedColors.includes(id)) ||
      (type === "accessory" && unlockedAccessories.includes(id));

    if (isUnlocked) {
      // 해금 아이템은 즉시 선택(저장 대상) 확정
      if (type === "profile") setSelectedProfileId(id);
      if (type === "color") setSelectedColor(id);
      if (type === "accessory") setSelectedAccessory(id);

      setPending({ type: null, id: null });
      return;
    }

    // 잠금 아이템은 유령 클릭 방지
    const ghostKey = `${type}:${id}`;
    if (guardGhostTap(ghostKey)) return;

    // 2단계 클릭: 같은 아이템을 연속으로 눌렀을 때만 구매 모달
    if (pending.type === type && pending.id === id) {
      setPending({ type: null, id: null });

      if (type === "profile") {
        openPurchaseModalFor(
          "profile",
          id,
          cost,
          `오리 프로필 ${String(id).slice(-1)}`,
        );
      } else if (type === "color") {
        const colorName = COLOR_OPTIONS.find((c) => c.id === id)?.id || "색상";
        openPurchaseModalFor(
          "color",
          id,
          cost,
          `${colorName.toUpperCase()} 색상`,
        );
      } else {
        const accessoryName =
          ACCESSORY_OPTIONS.find((a) => a.id === id)?.label || "악세사리";
        openPurchaseModalFor("accessory", id, cost, accessoryName);
      }
      return;
    }

    // 첫 클릭: pending만 설정 (미리보기만 바뀜)
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
      if (purchaseModal.type === "profile") {
        setSelectedProfileId(purchaseModal.id);
        setPreviewProfileId(purchaseModal.id);
      } else if (purchaseModal.type === "color") {
        setSelectedColor(purchaseModal.id);
        setPreviewColor(purchaseModal.id);
      } else if (purchaseModal.type === "accessory") {
        setSelectedAccessory(purchaseModal.id);
        setPreviewAccessory(purchaseModal.id);
      }
    }

    setPurchaseModal(null);
    setPending({ type: null, id: null });
  };

  const handleSave = () => {
    onSave?.({
      profileId: selectedProfileId,
      color: selectedColor,
      accessory: selectedAccessory,
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

      <ModalWrapper title="프로필 바꾸기" onClose={onClose} footer={footer}>
        <div className={styles.Content}>
          <div
            className={styles.Preview}
            style={{ backgroundColor: selectedColorObj?.color || "#fef08a" }}
          >
            <div className={styles.DuckWrapper}>
              <img
                src={selectedProfile?.image}
                alt="프로필 오리"
                className={styles.DuckImage}
              />
              {previewAccessory && previewAccessory !== "none" && (
                <span className={styles.Accessory}>
                  {previewAccessoryObj?.icon}
                </span>
              )}
            </div>
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>프로필</h3>
            <div className={styles.ProfileGrid}>
              {PROFILE_OPTIONS.map((option) => {
                const isUnlocked = unlockedProfiles.includes(option.id);
                const isSelected = selectedProfileId === option.id;
                const isPending =
                  !isUnlocked &&
                  pending.type === "profile" &&
                  pending.id === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.ProfileCard} ${
                      isSelected ? styles.Selected : ""
                    } ${!isUnlocked ? styles.Locked : ""} ${
                      isPending ? styles.PendingPurchase : ""
                    }`}
                    onClick={() =>
                      handleClickOption("profile", option.id, option.cost)
                    }
                  >
                    <img
                      src={option.image}
                      alt={option.id}
                      className={styles.ProfileThumb}
                    />
                    {!isUnlocked && (
                      <div className={styles.ProfileLockOverlay}>
                        <span className={styles.LockIcon}>🔒</span>
                        <div className={styles.CoinPrice}>
                          <img
                            src={coinImage}
                            alt="코인"
                            className={styles.CoinIconSmall}
                          />
                          <span>{option.cost}</span>
                        </div>
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
            <h3 className={styles.SectionTitle}>색상</h3>
            <div className={styles.ColorsRow}>
              {COLOR_OPTIONS.map((option) => {
                const isUnlocked = unlockedColors.includes(option.id);
                const isSelected = selectedColor === option.id;
                const isPending =
                  !isUnlocked &&
                  pending.type === "color" &&
                  pending.id === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.ColorButton} ${
                      isSelected ? styles.Selected : ""
                    } ${!isUnlocked ? styles.Locked : ""} ${
                      isPending ? styles.PendingPurchase : ""
                    } ${option.id === "white" ? styles.WhiteBorder : ""}`}
                    style={{ backgroundColor: option.color }}
                    onClick={() =>
                      handleClickOption("color", option.id, option.cost)
                    }
                    aria-label={option.id}
                  >
                    {!isUnlocked && (
                      <div className={styles.LockOverlay}>
                        <span className={styles.LockIcon}>🔒</span>
                        <div className={styles.CoinPrice}>
                          <img
                            src={coinImage}
                            alt="코인"
                            className={styles.CoinIconSmall}
                          />
                          <span>{option.cost}</span>
                        </div>
                      </div>
                    )}

                    {!isUnlocked && isPending && (
                      <span className={styles.PendingHintFloat}>
                        한 번 더 누르면 구매
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>액세서리</h3>
            <div className={styles.AccessoriesRow}>
              {ACCESSORY_OPTIONS.map((option) => {
                const isUnlocked = unlockedAccessories.includes(option.id);
                const isSelected = selectedAccessory === option.id;
                const isPending =
                  !isUnlocked &&
                  pending.type === "accessory" &&
                  pending.id === option.id;

                return (
                  <button
                    key={option.id || "none"}
                    type="button"
                    className={`${styles.AccessoryButton} ${
                      isSelected ? styles.Selected : ""
                    } ${!isUnlocked ? styles.Locked : ""} ${
                      isPending ? styles.PendingPurchase : ""
                    }`}
                    onClick={() =>
                      handleClickOption("accessory", option.id, option.cost)
                    }
                    title={option.label}
                  >
                    {option.icon}
                    {!isUnlocked && (
                      <div className={styles.AccessoryLockBadge}>
                        <img
                          src={coinImage}
                          alt="코인"
                          className={styles.CoinIconTiny}
                        />
                        <span>{option.cost}</span>
                      </div>
                    )}
                    {!isUnlocked && isPending && (
                      <span className={styles.PendingHintTiny}>
                        한 번 더 누르면 구매
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className={styles.AccessoryLabel}>
              {ACCESSORY_OPTIONS.find((a) => a.id === previewAccessory)
                ?.label || "없음"}
            </div>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
