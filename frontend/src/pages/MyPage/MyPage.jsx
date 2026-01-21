import styles from "./MyPage.module.css";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/Layout/AppHeader/AppHeader";

export default function MyPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />
        <div className={styles.Content}>
          <h1 className={styles.Title}>마이페이지</h1>
          <p className={styles.Text}>현재는 화면 구성만 준비되어 있습니다.</p>
          <button className={styles.Button} type="button" onClick={() => navigate("/")}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
