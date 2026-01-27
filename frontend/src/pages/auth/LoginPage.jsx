import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
import duckImage from "@/assets/images/duck_happy.png";
import kakaoIcon from "@/assets/icons/kakaotalk_icon.png";
import { loginWithKakao } from "@/api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: 로그인 로직 구현
    console.log("Login:", { email, password, rememberMe });
    navigate("/");
  };

  const handleKakaoLogin = () => {
    loginWithKakao();
  };

  return (
    <div className={styles.Page}>
      <div className={styles.Container}>
        <div className={styles.FormSection}>
          <div className={styles.Logo}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 4C12.268 4 6 10.268 6 18c0 4.416 2.04 8.352 5.224 10.928L10 34l6-3c1.268.396 2.612.612 4 .612 7.732 0 14-6.268 14-14S27.732 4 20 4z"
                fill="#4A90E2"
              />
              <path
                d="M14 15c0-3.314 2.686-6 6-6s6 2.686 6 6"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="14" cy="20" r="3" fill="#fff" />
              <circle cx="26" cy="20" r="3" fill="#fff" />
            </svg>
          </div>

          <div className={styles.FormContent}>
            <h1 className={styles.Title}>로그인</h1>
            <p className={styles.Subtitle}>
              Login to access your travelwise account
            </p>

            <form className={styles.Form} onSubmit={handleLogin}>
              <div className={styles.InputGroup}>
                <input
                  type="email"
                  id="email"
                  className={styles.Input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                />
                <label htmlFor="email" className={styles.Label}>
                  Email
                </label>
              </div>

              <div className={styles.InputGroup}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={styles.Input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  required
                />
                <label htmlFor="password" className={styles.Label}>
                  Password
                </label>
                <button
                  type="button"
                  className={styles.PasswordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>

              <div className={styles.Options}>
                <label className={styles.RememberMe}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className={styles.ForgotPassword}>
                  Forgot Password
                </button>
              </div>

              <button type="submit" className={styles.LoginButton}>
                Login
              </button>
            </form>

            <p className={styles.SignupText}>
              Don't have an account?{" "}
              <button type="button" className={styles.SignupLink}>
                Sign up
              </button>
            </p>

            <div className={styles.Divider}>
              <span>Or login with</span>
            </div>

            <button
              type="button"
              className={styles.KakaoButton}
              onClick={handleKakaoLogin}
            >
              <img src={kakaoIcon} alt="" className={styles.KakaoIcon} />
              <span>카카오 로그인</span>
            </button>
          </div>
        </div>

        <div className={styles.ImageSection}>
          <img src={duckImage} alt="마스코트" className={styles.DuckImage} />
        </div>
      </div>
    </div>
  );
}