import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import TipBanner from "@/components/common/TipBanner/TipBanner";

import duckImg from "@/assets/images/duck.png";

const CODE_LEN = 6;

function normalizeCode(raw) {
  return (raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LEN);
}

export default function JoinRoomPage() {
  const navigate = useNavigate();

  const [codeArr, setCodeArr] = useState(() => Array(CODE_LEN).fill(""));
  const inputsRef = useRef([]);

  const code = useMemo(() => codeArr.join(""), [codeArr]);
  const isComplete = codeArr.every((c) => c.length === 1);

  useEffect(() => {
    inputsRef.current?.[0]?.focus?.();
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/together");
  };

  const focusAt = (idx) => {
    const el = inputsRef.current?.[idx];
    if (el) el.focus();
  };

  const setAt = (idx, value) => {
    setCodeArr((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleChange = (idx, e) => {
    const v = normalizeCode(e.target.value);

    if (!v) {
      setAt(idx, "");
      return;
    }

    if (v.length > 1) {
      const chars = v.split("");
      setCodeArr(() => {
        const next = Array(CODE_LEN).fill("");
        for (let i = 0; i < CODE_LEN; i += 1) next[i] = chars[i] ? chars[i] : "";
        return next;
      });
      focusAt(Math.min(v.length, CODE_LEN - 1));
      return;
    }

    setAt(idx, v);
    if (idx < CODE_LEN - 1) focusAt(idx + 1);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (codeArr[idx]) {
        setAt(idx, "");
      } else if (idx > 0) {
        setAt(idx - 1, "");
        focusAt(idx - 1);
      }
      return;
    }

    if (e.key === "ArrowLeft" && idx > 0) focusAt(idx - 1);
    if (e.key === "ArrowRight" && idx < CODE_LEN - 1) focusAt(idx + 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = normalizeCode(e.clipboardData.getData("text"));
    if (!pasted) return;

    const chars = pasted.split("");
    setCodeArr(() => {
      const next = Array(CODE_LEN).fill("");
      for (let i = 0; i < CODE_LEN; i += 1) next[i] = chars[i] ? chars[i] : "";
      return next;
    });

    focusAt(Math.min(pasted.length, CODE_LEN - 1));
  };

  const handleSubmit = () => {
    if (!isComplete) return;

    navigate("/together/waiting", {
      state: {
        isHost: false,
        joinCode: code,
        topic: "좋아하는 음식",
        maxCount: 4,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f8ff] py-7">
      <div className="max-w-[1120px] mx-auto bg-white rounded-[28px] shadow-[0_18px_50px_rgba(17,24,39,0.1)] overflow-hidden">
        <AppHeader userName="user" notifications={[]} />

        <main className="relative px-4 sm:px-8 py-11 pb-8 bg-white">
          <button
            className="absolute top-3 sm:top-4 left-3 sm:left-4 h-10 px-3 rounded-xl
              border border-indigo-600/20 bg-indigo-600/10 text-indigo-800
              flex items-center gap-2 cursor-pointer font-black text-sm
              hover:border-indigo-600/35 hover:bg-indigo-600/15"
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            <span className="text-lg leading-none -translate-y-px" aria-hidden="true">
              &lt;
            </span>
            <span className="text-sm leading-none">뒤로가기</span>
          </button>

          <h1 className="mt-15 text-3xl font-black tracking-tight text-center text-gray-900">
            참여 코드를 입력하세요.
          </h1>
          <p className="mt-3 text-sm text-center text-gray-500 font-bold">
            친구에게 받은 6자리 코드를 입력해주세요.
          </p>

          <section
            className="max-w-[760px] mx-auto mt-6 border border-gray-200 rounded-2xl bg-white
              shadow-[0_10px_28px_rgba(17,24,39,0.08)] px-4 sm:px-5 py-5"
            aria-label="참여 코드 입력"
          >
            <div className="flex justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
              {codeArr.map((v, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputsRef.current[idx] = el;
                  }}
                  className="w-11 sm:w-13 h-11 sm:h-13 rounded-xl border border-gray-300 bg-white
                    text-center text-lg font-black text-gray-900 outline-none
                    focus:border-indigo-600/55 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
                  value={v}
                  onChange={(e) => handleChange(idx, e)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={1}
                  aria-label={`코드 ${idx + 1}번째 자리`}
                />
              ))}
            </div>

            <button
              type="button"
              className={`w-full h-11 mt-4 border-0 rounded-xl font-black text-sm
                ${isComplete
                  ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-violet-800 text-white shadow-[0_14px_30px_rgba(79,70,229,0.22)] cursor-pointer"
                  : "bg-indigo-500/35 text-white/90 cursor-not-allowed"
                }`}
              onClick={handleSubmit}
              disabled={!isComplete}
            >
              참여하기
            </button>
          </section>

          <div className="max-w-[760px] mx-auto mt-4">
            <TipBanner text="Tip: 코드를 복사해서 붙여넣기 할 수 있어요!" />
          </div>

          <div className="mt-5 flex flex-col items-center gap-2.5">
            <img className="w-12 h-12 object-contain" src={duckImg} alt="오리" />
            <div className="text-xs text-gray-500 font-extrabold">친구들이 기다리고 있어요!</div>
          </div>
        </main>
      </div>
    </div>
  );
}
