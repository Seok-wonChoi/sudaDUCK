import { useEffect, useRef, useState } from "react";
import styles from "./UnexpectedQuestFillBlankModal.module.css";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";
import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

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

function safeParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getDuckProfileInfo(duckCustomJson) {
  const parsed = safeParseJson(duckCustomJson);
  if (!parsed) {
    return {
      image: duckProfile1,
      color: "#ffffff",
      accessory: null,
    };
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

export default function UnexpectedQuestFillBlankModal({ open, duckSrc, onSubmit, participants = [] }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const t = setTimeout(() => {
      firstRef.current?.focus?.();
    }, 50);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  if (!open) return null;

  // ?îÎ≤ÑÍπ? participants ?ïÏù∏
  // console.log("[UnexpectedQuestFillBlankModal] participants:", participants);
  // console.log("[UnexpectedQuestFillBlankModal] participants.length:", participants?.length);

  const submit = () => {
    onSubmit?.({ a, b });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={styles.Backdrop} role="dialog" aria-modal="true">
      <div className={styles.Stage}>
        <div className={styles.Card}>
          <div className={styles.CardTitle}>?åÎ∞ú ?òÏä§??!</div>
          <div className={styles.CardSub}>ÎπàÏπ∏??Ï±ÑÏõåÎ≥¥ÏÑ∏??</div>

          <div className={styles.FormRow}>
            <span className={styles.Word}>The</span>
            <input
              ref={firstRef}
              className={styles.Input}
              value={a}
              onChange={(e) => setA(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder=""
            />
            <span className={styles.Word}>was</span>
            <input
              className={styles.Input}
              value={b}
              onChange={(e) => setB(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder=""
            />
            <span className={styles.Word}>too.</span>
          </div>

          <button type="button" className={styles.SubmitBtn} onClick={submit}>
            ?ÖÎ†•
          </button>

          <div className={styles.Hint}>?ºÎ∏îÎ¶¨Ïã± ?®Í≥Ñ: ?ÑÎ¨¥ ?®Ïñ¥???ÖÎ†•?òÎ©¥ ÏßÑÌñâ?©Îãà??</div>
        </div>

        {duckSrc ? <img className={styles.Duck} src={duckSrc} alt="?åÎ∞ú ?òÏä§???§Î¶¨" /> : null}

        {/* Ï∞∏Ïó¨??Î™©Î°ù - Ï¢åÏ∏° ?òÎã® */}
        <div className={styles.ParticipantsList}>
          {participants && participants.length > 0 ? (
            participants.map((p) => {
              const profileInfo = getDuckProfileInfo(p.duckCustomJson);
              const isSpeaking = p.isSpeaking ?? false;
              const micOn = p.micOn ?? false;

              // console.log("[Participant]", {
                id: p.id,
                name: p.name,
                micOn,
                isSpeaking,
                duckCustomJson: p.duckCustomJson,
              });

              return (
                <div
                  key={p.id}
                  className={`${styles.ParticipantCard} ${
                    isSpeaking ? styles.ParticipantCardSpeaking : ""
                  }`}
                >
                  <div
                    className={styles.ParticipantAvatar}
                    style={{ background: profileInfo.color }}
                  >
                    <img
                      className={styles.ParticipantAvatarImg}
                      src={profileInfo.image}
                      alt={`${p.name} ?ÑÎ°ú??}
                    />
                    {profileInfo.accessory && (
                      <span className={styles.ParticipantAccessory}>
                        {profileInfo.accessory}
                      </span>
                    )}
                  </div>
                  <div className={styles.ParticipantInfo}>
                    <div className={styles.ParticipantName}>{p.name}</div>
                    <img
                      className={styles.ParticipantMicIcon}
                      src={micOn ? micOffIcon : micOnIcon}
                      alt={micOn ? "ÎßàÏù¥??ÏºúÏßê" : "ÎßàÏù¥??Í∫ºÏßê"}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "#888"
            }}>
              Ï∞∏Ïó¨??Î°úÎî© Ï§?.. ({participants?.length ?? 0}Î™?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
