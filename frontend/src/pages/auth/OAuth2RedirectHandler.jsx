// import { useEffect, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { loadDuckProfileToLocalStorage } from "@/utils/authProfile";

// export default function OAuth2RedirectHandler() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const isProcessed = useRef(false); // ì¤‘ë³µ ?¤í–‰ ë°?ë¬´í•œ ë£¨í”„ ë°©ì?

//   // ??StrictMode/ë¦¬ë Œ?”ì—??? ì??˜ëŠ” "1??ì²˜ë¦¬" ?Œë˜ê·?
//   const processedRef = useRef(false);

//   useEffect(() => {
//     if (isProcessed.current) return;
//     isProcessed.current = true;

//     // console.log("[OAuth2] ë¦¬ë‹¤?´ë ‰???¸ë“¤???¤í–‰");

//     // 1. URL ?Œë¼ë¯¸í„°?ì„œ ? í° ì¶”ì¶œ
//     const params = new URLSearchParams(location.search);
//     const accessToken = params.get("accessToken") || params.get("access_token");
//     const refreshToken = params.get("refreshToken") || params.get("refresh_token");
//     const error = params.get("error");

//     const goLanding = () => navigate("/", { replace: true });

//     // 2. ?ëŸ¬ ë°œìƒ ??ì²˜ë¦¬
//     if (error) {
//       console.error("[OAuth2] ?¸ì¦ ?ëŸ¬:", error);
//       alert("ë¡œê·¸??ì¤?ë¬¸ì œê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
//       navigate("/", { replace: true });
//       return;
//     }

//     // 3. ? í° ?€??ë°??´ë™
//     if (accessToken) {
//       localStorage.setItem("accessToken", accessToken);
//       if (refreshToken) {
//         localStorage.setItem("refreshToken", refreshToken);
//       }
//       // WSê°€ ì¿ í‚¤ access_token???”êµ¬ - cross-site ?”ì²­???„í•´ SameSite=None; Secure ?¤ì •
//       document.cookie = `access_token=${accessToken}; Path=/; SameSite=None; Secure`;

//       // console.log("[OAuth2] ? í° ?€???„ë£Œ. ë©”ì¸ ?˜ì´ì§€ë¡??´ë™?©ë‹ˆ??");

//       // ??replace: trueë¥??¬ìš©?˜ì—¬ ?¤ë¡œê°€ê¸??¤íƒ?ì„œ ???¸ë“¤?¬ë? ?œê±°?©ë‹ˆ??
//       navigate("/main", { replace: true });
//     } else {
//       // 4. ? í°???†ëŠ” ê²½ìš° (?˜ëª»???‘ê·¼ ??
//       console.warn("[OAuth2] ? í°???†ìŠµ?ˆë‹¤. ë¡œê·¸???˜ì´ì§€ë¡?ë³´ëƒ…?ˆë‹¤.");
//       navigate("/", { replace: true });
//     }
//   }, [navigate, location]);

//   return (
//     <div style={{ padding: "50px", textAlign: "center" }}>
//       <h2>ë¡œê·¸??ì¤‘ì…?ˆë‹¤...</h2>
//       <p>? ì‹œë§?ê¸°ë‹¤??ì£¼ì„¸??</p>
//     </div>
//   );
// }

import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadDuckProfileToLocalStorage } from "@/utils/authProfile";

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const isProcessed = useRef(false); // ì¤‘ë³µ ?¤í–‰ ë°©ì?

  useEffect(() => {
    if (isProcessed.current) return;
    isProcessed.current = true;

    const run = async () => {
      // console.log("[OAuth2] ë¦¬ë‹¤?´ë ‰???¸ë“¤???¤í–‰");

      // 1) URL ?Œë¼ë¯¸í„°?ì„œ ? í° ì¶”ì¶œ
      const params = new URLSearchParams(location.search);
      const accessToken = params.get("accessToken") || params.get("access_token");
      const refreshToken = params.get("refreshToken") || params.get("refresh_token");
      const error = params.get("error");

      // 2) ?ëŸ¬ ì²˜ë¦¬
      if (error) {
        console.error("[OAuth2] ?¸ì¦ ?ëŸ¬:", error);
        alert("ë¡œê·¸??ì¤?ë¬¸ì œê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
        navigate("/", { replace: true });
        return;
      }

      // 3) ? í° ?†ëŠ” ê²½ìš°
      if (!accessToken) {
        console.warn("[OAuth2] ? í°???†ìŠµ?ˆë‹¤. ?œë”©?¼ë¡œ ?´ë™");
        navigate("/", { replace: true });
        return;
      }

      // 4) ? í° ?€??
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // ì¿ í‚¤ ?€??(WS ?±ì—???„ìš”?˜ë©´)
      document.cookie = `access_token=${accessToken}; Path=/; SameSite=None; Secure`;

      // 5) ?¤ë”???„ë¡œ??ë¡œë”© (?¤íŒ¨?´ë„ ë¡œê·¸?¸ì? ì§„í–‰)
      try {
        await loadDuckProfileToLocalStorage();
      } catch (e) {
        console.warn("[OAuth2] ?„ë¡œ??ë¡œë”© ?¤íŒ¨:", e);
      }

      // console.log("[OAuth2] ? í° ?€???„ë£Œ. ë©”ì¸?¼ë¡œ ?´ë™");
      navigate("/main", { replace: true });
    };

    run();
  }, [navigate, location.search]); // location ?„ì²´ ë§ê³  searchë§?

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>ë¡œê·¸??ì¤‘ì…?ˆë‹¤...</h2>
      <p>? ì‹œë§?ê¸°ë‹¤??ì£¼ì„¸??</p>
    </div>
  );
}
