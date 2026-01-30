import styles from "./InfoGrid.module.css";
import Tag from "../../common/Tag";

export default function InfoGrid({ topic, participants = [] }) {
  return (
    <div className={styles.Grid}>
      <div className={styles.Box}>
        <div className={styles.Header}>
          <span className={styles.Icon}>💬</span>
          <span className={styles.Label}>대화 주제</span>
        </div>
        <div className={styles.Value}>{topic || "-"}</div>
      </div>

      <div className={styles.Box}>
        <div className={styles.Header}>
          <span className={styles.Icon}>👥</span>
          <span className={styles.Label}>참여자</span>
        </div>
        <div className={styles.Participants}>
          {participants.length > 0 ? (
            participants.map((name, index) => (
              <Tag key={index} variant="participant">{name}</Tag>
            ))
          ) : (
            <span className={styles.Empty}>-</span>
          )}
        </div>
      </div>
    </div>
  );
}
