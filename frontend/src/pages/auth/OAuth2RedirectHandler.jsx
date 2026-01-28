import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let processed = false; // 중복 실행 방지

    const run = async () => {
      if (processed) {
        console.log("[OAuth2] 이미 처리됨, 중복 실행 방지");
        return;
      }
      processed = true;

      console.log("[OAuth2] 리다이렉트 핸들러 실행");
      console.log("[OAuth2] 전체 URL:", window.location.href);

      // ✅ query / hash 모두에서 토큰 추출 (환경별 키 다 대응)
      const getTokensFromUrl = () => {
        const searchParams = new URLSearchParams(window.location.search);

        const hash = window.location.hash?.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const hashParams = new URLSearchParams(hash);

        // accessToken 추출
        const accessTokenKeys = ["access_token", "accessToken", "token", "access"];
        let accessToken = null;
        for (const key of accessTokenKeys) {
          const v = searchParams.get(key) || hashParams.get(key);
          if (v) {
            accessToken = v;
            break;
          }
        }

        // refreshToken 추출
        const refreshTokenKeys = ["refresh_token", "refreshToken", "refresh"];
        let refreshToken = null;
        for (const key of refreshTokenKeys) {
          const v = searchParams.get(key) || hashParams.get(key);
          if (v) {
            refreshToken = v;
            break;
          }
        }

        return { accessToken, refreshToken };
      };

      const { accessToken, refreshToken } = getTokensFromUrl();
      const error = new URLSearchParams(window.location.search).get("error");

      console.log("[OAuth2] accessToken:", accessToken ? `${accessToken.substring(0, 20)}...` : "null");
      console.log("[OAuth2] refreshToken:", refreshToken ? `${refreshToken.substring(0, 20)}...` : "null");
      console.log("[OAuth2] error:", error);

      if (error) {
        console.error("[OAuth2] 인증 실패:", error);
        alert("로그인에 실패했습니다. 다시 시도해주세요.");
        navigate("/login", { replace: true });
        return;
      }

      // 1) URL로 토큰이 온 경우 → 저장 후 메인 이동
      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        console.log("[OAuth2] accessToken 저장 완료");

        // refreshToken도 URL로 넘어온 경우 저장 (개발 환경)
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
          console.log("[OAuth2] refreshToken 저장 완료");
        }

        // 주소창 깔끔하게 정리
        window.history.replaceState({}, document.title, "/");

        console.log("[OAuth2] 메인 페이지로 이동");
        navigate("/", { replace: true });
        return;
      }

      // 2) URL에 토큰이 없는 경우
      // 개발 환경에서는 refresh API 없이 바로 로그인 페이지로 이동
      // (배포 환경에서 쿠키 기반 refresh가 필요한 경우에만 활성화)
      console.warn("[OAuth2] URL에 토큰이 없습니다. 로그인 페이지로 이동합니다.");
      alert("로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      navigate("/login", { replace: true });
    };

    run();
  }, [navigate]);

  return <div style={{ padding: 24 }}>로그인 처리 중...</div>;
}