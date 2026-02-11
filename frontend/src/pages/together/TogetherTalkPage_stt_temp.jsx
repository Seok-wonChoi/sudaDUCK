    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.continuous = true;
      recognition.interimResults = true;

      sttOffsetRef.current = "";
      isSTTIntentionallyStopped.current = false;

      const processNewPart = async (fullTranscript) => {
        const currentFull = fullTranscript.trim();
        if (!currentFull || currentFull.length < 2) return;

        let newPart = currentFull;
        const lastSent = sttOffsetRef.current;
        if (lastSent && currentFull.startsWith(lastSent)) {
          newPart = currentFull.substring(lastSent.length).trim();
        }

        if (newPart.length < 2) return;

        console.log("🎤", newPart);
        sttOffsetRef.current = currentFull;

        const currentTurnVal = currentTurnRef.current;
        if (roomId && myUserId && currentTurnVal) {
          recordVoiceActivity(roomId, myUserId, currentTurnVal).catch(() => {});
        }

        try {
          await translateToEnglish(roomId, newPart, currentTurnVal, myUserId);
        } catch (error) {
          console.error("[STT] 번역 실패");
        }
      };

      recognition.onresult = (event) => {
        let currentFull = "";
        for (let i = 0; i < event.results.length; i++) {
          currentFull += event.results[i][0].transcript;
        }

        if (currentFull.trim().length >= 2) {
          if (sttTimerRef.current) clearTimeout(sttTimerRef.current);
          sttTimerRef.current = setTimeout(() => {
            processNewPart(currentFull);
          }, 500);
        }
      };

      recognition.onend = () => {
        if (!isSTTIntentionallyStopped.current) {
          if (sttTimerRef.current) clearTimeout(sttTimerRef.current);
          sttTimerRef.current = setTimeout(() => {
            if (!isSTTIntentionallyStopped.current) {
              try { recognition.start(); } catch (e) {}
            }
          }, 2000);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          console.error("[STT] 마이크 권한 거부");
          return;
        }
        console.error("[STT] 에러:", event.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error("[STT] 시작 오류");
    }
  }, [roomId, myUserId, isTransitioning]);