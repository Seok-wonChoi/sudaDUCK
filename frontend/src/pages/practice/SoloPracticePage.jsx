import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SoloPracticePage.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitGuard from "@/components/common/ExitGuard/ExitGuard";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";
import ConfirmModal from "@/components/common/ConfirmModal/ConfirmModal";

import duckImg from "@/assets/images/duck.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

function VoiceWave({ level, enabled }) {
  const multipliers = [0.5, 0.7, 0.85, 1, 0.85, 0.7, 0.5];
  const v = Math.max(0, Math.min(1, level));

  return (
    <span
      className={`${styles.Wave} ${enabled ? styles.WaveOn : styles.WaveOff}`}
      aria-hidden="true"
    >
      {multipliers.map((m, idx) => {
        const h = enabled ? 10 + v * 16 * m : 10;
        return (
          <span
            key={idx}
            className={`${styles.WaveBar} ${styles[`WaveBar${idx + 1}`]}`}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </span>
  );
}

export default function SoloPracticePage() {
  const navigate = useNavigate();
  const topic = useMemo(() => "Ï¢ãÏïÑ?òÎäî ?åÏãù", []);
  const DURATION_MS = 40_000;

  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const handleBack = () => {
    setShowBackConfirm(true);
  };

  const handleBackConfirm = useCallback(() => {
    setShowBackConfirm(false);
    if (window.history.length > 1) navigate(-1);
    else navigate("/practice");
  }, [navigate]);

  const handleBackCancel = useCallback(() => {
    setShowBackConfirm(false);
  }, []);

  const [micOn, setMicOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const [isCountdownOpen, setIsCountdownOpen] = useState(true);
  const [countdownSec, setCountdownSec] = useState(3);
  const [isRunning, setIsRunning] = useState(false);

  // ?Ä?¥Î®∏ ?úÏûë ?úÍ∞Ñ (?àÎ? timestamp)
  const [timerStartedAt] = useState(() => {
    try {
      const saved = sessionStorage.getItem('solo_practice_timer');
      return saved ? parseInt(saved, 10) : Date.now();
    } catch {
      return Date.now();
    }
  });

  // sessionStorage ?Ä??
  useEffect(() => {
    try {
      sessionStorage.setItem('solo_practice_timer', String(timerStartedAt));
    } catch {
      // ignore
    }
  }, [timerStartedAt]);

  const audioRef = useRef({
    stream: null,
    ctx: null,
    analyser: null,
    source: null,
    rafId: null,
    lastVoiceAt: 0,
    speakingNow: false,
    level: 0,
    lastUiAt: 0,
  });

  const stopAudioAnalysis = useCallback(async () => {
    const a = audioRef.current;

    if (a.rafId) {
      cancelAnimationFrame(a.rafId);
      a.rafId = null;
    }

    if (a.stream) {
      a.stream.getTracks().forEach((t) => t.stop());
      a.stream = null;
    }

    if (a.ctx) {
      try {
        await a.ctx.close();
      } catch (e) {
        // ignore
      }
      a.ctx = null;
    }

    a.analyser = null;
    a.source = null;
    a.lastVoiceAt = 0;
    a.speakingNow = false;
    a.level = 0;
    a.lastUiAt = 0;

    setIsSpeaking(false);
    setVoiceLevel(0);
  }, []);

  const startAudioAnalysis = useCallback(async () => {
    const a = audioRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      a.stream = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      a.ctx = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      a.analyser = analyser;

      const source = ctx.createMediaStreamSource(stream);
      a.source = source;
      source.connect(analyser);

      const data = new Float32Array(analyser.fftSize);

      const THRESHOLD = 0.03;
      const HOLD_MS = 220;
      const UI_INTERVAL_MS = 60;

      const tick = () => {
        if (!a.analyser) return;

        if (typeof a.analyser.getFloatTimeDomainData === "function") {
          a.analyser.getFloatTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = data[i];
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);

          const now = performance.now();
          if (rms > THRESHOLD) a.lastVoiceAt = now;

          const speaking = now - a.lastVoiceAt < HOLD_MS;

          if (speaking !== a.speakingNow) {
            a.speakingNow = speaking;
            setIsSpeaking(speaking);
          }

          const raw = Math.max(0, Math.min(1, (rms - 0.005) / 0.08));
          a.level = a.level * 0.82 + raw * 0.18;

          if (now - a.lastUiAt > UI_INTERVAL_MS) {
            a.lastUiAt = now;
            setVoiceLevel(a.level);
          }
        }

        a.rafId = requestAnimationFrame(tick);
      };

      try {
        await ctx.resume();
      } catch (e) {
        // ignore
      }

      tick();
    } catch (e) {
      setIsSpeaking(false);
      setVoiceLevel(0);
    }
  }, []);

  useEffect(() => {
    setIsCountdownOpen(true);
    setCountdownSec(3);
    setIsRunning(false);

    const id = window.setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setIsCountdownOpen(false);
          setIsRunning(true);
          // Ïπ¥Ïö¥?∏Îã§??Ï¢ÖÎ£å ??ÎßàÏù¥???êÎèô ÏºúÍ∏∞
          startAudioAnalysis();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [startAudioAnalysis]);

  useEffect(() => {
    return () => {
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  const toggleMic = useCallback(async () => {
    if (isCountdownOpen) return;

    if (micOn) {
      setMicOn(false);
      await stopAudioAnalysis();
      return;
    }

    setMicOn(true);
    await startAudioAnalysis();
  }, [isCountdownOpen, micOn, startAudioAnalysis, stopAudioAnalysis]);

  const handleEnd = useCallback(async () => {
    await stopAudioAnalysis();
    // ?Ä??Ï¢ÖÎ£å ???πÏùå ?òÏù¥ÏßÄÎ°??¥Îèô
    navigate("/recording", {
      replace: true,
      state: {
        mode: "solo",
        topic,
      }
    });
  }, [stopAudioAnalysis, navigate, topic]);

  const handleDone = useCallback(async () => {
    await stopAudioAnalysis();
    setMicOn(false);
    setIsRunning(false);
    // console.log("?úÍ∞Ñ Ï¢ÖÎ£å");

    // ?Ä??Ï¢ÖÎ£å ???πÏùå ?òÏù¥ÏßÄÎ°??¥Îèô
    navigate("/recording", {
      replace: true,
      state: {
        mode: "solo",
        topic,
      }
    });
  }, [stopAudioAnalysis, navigate, topic]);

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <ExitGuard to="/" message="Î©îÏù∏ ?îÎ©¥?ºÎ°ú ?òÍ??úÍ≤†?µÎãàÍπ?" />
        <AppHeader userName="user" notifications={[]} />

        {isCountdownOpen && (
          <div className={styles.CountdownOverlay} role="dialog" aria-label="?∞Ïäµ ?úÏûë Ïπ¥Ïö¥?∏Îã§??>
            <div className={styles.CountdownModal}>
              <div className={styles.CountdownTitle}>Í≥??úÏûë?©Îãà??/div>
              <div className={styles.CountdownNumber}>{countdownSec}</div>
              <div className={styles.CountdownHint}>ÎßàÏù¥?¨Î? Ï§ÄÎπÑÌï¥ Ï£ºÏÑ∏??/div>
            </div>
          </div>
        )}

        <div className={styles.Content}>
          <button
            className={styles.BackButton}
            type="button"
            onClick={handleBack}
            aria-label="?§Î°ú Í∞ÄÍ∏?
          >
            &lt;
          </button>

          <div className={styles.HeaderRow}>
            <div className={styles.ExitCol}>
              <ExitButton to="/" label="?òÍ?Í∏? confirmMessage="?∞Ïäµ??Ï¢ÖÎ£å?òÍ≥† ?òÍ??úÍ≤†?µÎãàÍπ?" />
            </div>

            <div className={styles.TopicRow}>
              <img className={styles.SmallDuck} src={duckImg} alt="?§Î¶¨" />
              <div className={styles.TopicBubble}>?Ä??Ï£ºÏ†ú??<span className={styles.TopicHighlight}>{topic}</span>?ÖÎãà??</div>
            </div>

            <div className={styles.TimerCol}>
              <TimerGauge durationMs={DURATION_MS} isRunning={isRunning} onDone={handleDone} startTimeMs={timerStartedAt} />
            </div>
          </div>

          <div className={styles.Stage}>
            <div className={styles.LeftStage}>
              <div className={styles.VideoArea}>
                <div className={styles.CardsGrid}>
                  <div
                    className={`${styles.VideoCard} ${
                      isSpeaking ? styles.VideoCardSpeaking : styles.VideoCardIdle
                    }`}
                  >
                    <div className={styles.VideoInner}>
                      <div className={styles.AvatarCircle}>
                        <img className={styles.AvatarDuck} src={duckImg} alt="???ÑÎ∞î?Ä" />
                      </div>
                    </div>

                    <div className={styles.VideoFooter}>
                      <div className={styles.VideoFooterLeft}>
                        <span className={styles.MeLabel}>??/span>
                        <img
                          className={styles.MicMini}
                          src={micOn ? micOffIcon : micOnIcon}
                          alt={micOn ? "ÎßàÏù¥??ÏºúÏßê" : "ÎßàÏù¥??Í∫ºÏßê"}
                        />
                      </div>

                      <div className={styles.VideoFooterRight}>
                        <VoiceWave level={voiceLevel} enabled={micOn} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.BottomActions}>
                <button
                  type="button"
                  className={styles.PrimaryButton}
                  onClick={toggleMic}
                  disabled={isCountdownOpen}
                >
                  <img className={styles.ButtonIcon} src={micOn ? micOffIcon : micOnIcon} alt="" aria-hidden="true" />
                  {micOn ? "ÎßàÏù¥???ÑÍ∏∞" : "ÎßàÏù¥??ÏºúÍ∏∞"}
                </button>

                <button type="button" className={styles.SecondaryButton} onClick={handleEnd}>
                  ?Ä??Ï¢ÖÎ£å
                </button>
              </div>
            </div>

            <aside className={styles.RightStage} aria-label="AI ?ÑÏö∞ÎØ?>
              <div className={styles.AiBubble}>
                <div className={styles.AiHeader}>
                  <span className={styles.AiDot} aria-hidden="true" />
                  <span className={styles.AiTitle}>AI ?òÎçï</span>
                  <span className={styles.AiDot} aria-hidden="true" />
                </div>

                <div className={styles.AiFace} aria-hidden="true">
                  ?ôÇ
                </div>

                <div className={styles.AiMainText}>?úÍµ≠?¥Î°ú ?∏ÌïòÍ≤?ÎßêÌï¥Î≥¥ÏÑ∏??</div>
                <div className={styles.AiSubText}>ÎßâÌûàÎ©?ÏßßÍ≤å?ºÎèÑ ?¥Ïñ¥??ÎßêÌïò??Í≤ÉÏù¥ Ï§ëÏöî?©Îãà??</div>

                <div className={styles.AiPointer} aria-hidden="true" />
              </div>

              <img className={styles.BigDuck} src={duckBotCyanImg} alt="AI ?§Î¶¨" />
            </aside>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showBackConfirm}
        message="?∞Ïäµ??Ï¢ÖÎ£å?òÍ≥† ?òÍ??úÍ≤†?µÎãàÍπ?"
        confirmText="?òÍ?Í∏?
        cancelText="Ï∑®ÏÜå"
        onConfirm={handleBackConfirm}
        onClose={handleBackCancel}
      />
    </div>
  );
}
