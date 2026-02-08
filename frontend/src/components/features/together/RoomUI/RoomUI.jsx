import { useMemo, useCallback, useState } from "react";
import styles from "./RoomUI.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";

import usersIcon from "@/assets/icons/users_icon.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

function normalizeParticipantsForMode({ mode, participants, maxCount, myName }) {
  const safe = Array.isArray(participants) ? participants : [];

  const me =
    safe.find((p) => p?.id === "me") ??
    { id: "me", name: myName ?? "??, isMe: true };

  const ai = safe.find((p) => p?.id === "ai") ?? { id: "ai", name: "AI", isMe: false };

  if (mode === "solo") {
    return [me];
  }

  if (mode === "ai") {
    return [me, ai];
  }

  const list = safe.length > 0 ? safe : [me];
  return list.slice(0, Math.max(1, maxCount));
}

function buildSlots({ mode, participants, maxCount }) {
  if (mode === "solo") return [{ kind: "filled", p: participants[0] }];

  if (mode === "ai") {
    return [
      { kind: "filled", p: participants[0] },
      { kind: "filled", p: participants[1] },
    ];
  }

  const slots = [];
  for (let i = 0; i < maxCount; i += 1) {
    const p = participants[i];
    if (p) slots.push({ kind: "filled", p });
    else slots.push({ kind: "empty", id: `empty-${i + 1}`, index: i + 1 });
  }
  return slots;
}

export default function RoomUI({
  mode = "together",
  participants,
  maxCount = 4,
  myName = "??,
  title = "?úÍµ≠???òÎã§ ?òÏù¥ÏßÄ",
  topic = "Ï¢ãÏïÑ?òÎäî ?åÏãù",
  rightTitle = "AI ?§Î™Ö",
  rightBody = "?∏ÌïòÍ≤?ÎßêÌï¥Î≥¥ÏÑ∏??",
  durationMs = 40000,
  onTimeDone,
  exitTo = "/",
  exitMessage = "?ïÎßê ?òÍ??úÍ≤†?µÎãàÍπ?",
}) {
  const normalized = useMemo(
    () => normalizeParticipantsForMode({ mode, participants, maxCount, myName }),
    [mode, participants, maxCount, myName]
  );

  const [myMicOn, setMyMicOn] = useState(true);

  const toggleMyMic = useCallback(() => {
    setMyMicOn((prev) => !prev);
  }, []);

  const slots = useMemo(
    () => buildSlots({ mode, participants: normalized, maxCount }),
    [mode, normalized, maxCount]
  );

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <div className={styles.TopBar}>
          <ExitButton to={exitTo} confirmMessage={exitMessage} />

          <div className={styles.CenterArea}>
            <div className={styles.PageTitle}>{title}</div>
            <TimerGauge durationMs={durationMs} isRunning onDone={onTimeDone} />
          </div>

          <div className={styles.RightArea}>
            <div className={styles.RightCard}>
              <div className={styles.RightCardTitle}>{rightTitle}</div>
              <div className={styles.RightCardBody}>{rightBody}</div>
            </div>
          </div>
        </div>

        <div className={styles.TopicRow}>
          <div className={styles.TopicBubble}>?Ä??Ï£ºÏ†ú??<span className={styles.TopicHighlight}>{topic}</span>?ÖÎãà??</div>
        </div>

        <main className={styles.Main}>
          <section
            className={`${styles.Slots} ${
              mode === "solo" ? styles.SlotsSolo : mode === "ai" ? styles.SlotsAi : styles.SlotsTogether
            }`}
            aria-label="Ï∞∏Ïó¨???ÅÏó≠"
          >
            {slots.map((slot) => {
              if (slot.kind === "empty") {
                return (
                  <div key={slot.id} className={`${styles.Tile} ${styles.TileEmpty}`}>
                    <div className={styles.EmptyText}>Îπ??êÎ¶¨</div>
                  </div>
                );
              }

              const p = slot.p;
              const isMe = p?.id === "me" || p?.isMe === true;
              const micOn = isMe ? myMicOn : false;

              return (
                <div key={p.id} className={styles.Tile}>
                  <div className={styles.Avatar} aria-hidden="true">
                    <img className={styles.AvatarImg} src={usersIcon} alt="" />
                  </div>

                  <div className={styles.NameRow}>
                    <div className={styles.NameText}>{p.name}</div>
                  </div>

                  <button
                    type="button"
                    className={styles.MicBtn}
                    onClick={isMe ? toggleMyMic : undefined}
                    disabled={!isMe}
                    aria-label={micOn ? "ÎßàÏù¥???ÑÍ∏∞" : "ÎßàÏù¥??ÏºúÍ∏∞"}
                  >
                    <img
                      className={styles.MicImg}
                      src={micOn ? micOnIcon : micOffIcon}
                      alt={micOn ? "ÎßàÏù¥??ÏºúÏßê" : "ÎßàÏù¥??Í∫ºÏßê"}
                    />
                  </button>
                </div>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}
