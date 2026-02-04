// import { useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { loadDuckProfileToLocalStorage } from "@/utils/authProfile";

// export default function OAuth2RedirectHandler() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const isProcessed = useRef(false); // 중복 실행 및 무한 루프 방지

//   // ✅ StrictMode/리렌더에도 유지되는 "1회 처리" 플래그
//   const processedRef = useRef(false);

//   useEffect(() => {
//     if (isProcessed.current) return;
//     isProcessed.current = true;

//     console.log("[OAuth2] 리다이렉트 핸들러 실행");

//     // 1. URL 파라미터에서 토큰 추출
//     const params = new URLSearchParams(location.search);
//     const accessToken = params.get("accessToken") || params.get("access_token");
//     const refreshToken = params.get("refreshToken") || params.get("refresh_token");
//     const error = params.get("error");

//     const goLanding = () => navigate("/", { replace: true });

//     // 2. 에러 발생 시 처리
//     if (error) {
//       console.error("[OAuth2] 인증 에러:", error);
//       alert("로그인 중 문제가 발생했습니다.");
//       navigate("/", { replace: true });
//       return;
//     }

//     // 3. 토큰 저장 및 이동
//     if (accessToken) {
//       localStorage.setItem("accessToken", accessToken);
//       if (refreshToken) {
//         localStorage.setItem("refreshToken", refreshToken);
//       }
//       // WS가 쿠키 access_token을 요구 - cross-site 요청을 위해 SameSite=None; Secure 설정
//       document.cookie = `access_token=${accessToken}; Path=/; SameSite=None; Secure`;

//       console.log("[OAuth2] 토큰 저장 완료. 메인 페이지로 이동합니다.");

//       // ✅ replace: true를 사용하여 뒤로가기 스택에서 이 핸들러를 제거합니다.
//       navigate("/main", { replace: true });
//     } else {
//       // 4. 토큰이 없는 경우 (잘못된 접근 등)
//       console.warn("[OAuth2] 토큰이 없습니다. 로그인 페이지로 보냅니다.");
//       navigate("/", { replace: true });
//     }
//   }, [navigate, location]);

//   return (
//     <div style={{ padding: "50px", textAlign: "center" }}>
//       <h2>로그인 중입니다...</h2>
//       <p>잠시만 기다려 주세요.</p>
//     </div>
//   );
// }

import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadDuckProfileToLocalStorage } from "@/utils/authProfile";

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const isProcessed = useRef(false); // 중복 실행 방지

  useEffect(() => {
    if (isProcessed.current) return;
    isProcessed.current = true;

    const run = async () => {
      console.log("[OAuth2] 리다이렉트 핸들러 실행");

      // 1) URL 파라미터에서 토큰 추출
      const params = new URLSearchParams(location.search);
      const accessToken = params.get("accessToken") || params.get("access_token");
      const refreshToken = params.get("refreshToken") || params.get("refresh_token");
      const error = params.get("error");

      // 2) 에러 처리
      if (error) {
        console.error("[OAuth2] 인증 에러:", error);
        alert("로그인 중 문제가 발생했습니다.");
        navigate("/", { replace: true });
        return;
      }

      // 3) 토큰 없는 경우
      if (!accessToken) {
        console.warn("[OAuth2] 토큰이 없습니다. 랜딩으로 이동");
        navigate("/", { replace: true });
        return;
      }

      // 4) 토큰 저장
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // 쿠키 저장 (WS 등에서 필요하면)
      document.cookie = `access_token=${accessToken}; Path=/; SameSite=None; Secure`;

      // 5) 헤더용 프로필 로딩 (실패해도 로그인은 진행)
      try {
        await loadDuckProfileToLocalStorage();
      } catch (e) {
        console.warn("[OAuth2] 프로필 로딩 실패:", e);
      }

      console.log("[OAuth2] 토큰 저장 완료. 메인으로 이동");
      navigate("/main", { replace: true });
    };

    run();
  }, [navigate, location.search]); // location 전체 말고 search만

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>로그인 중입니다...</h2>
      <p>잠시만 기다려 주세요.</p>
    </div>
  );
}
