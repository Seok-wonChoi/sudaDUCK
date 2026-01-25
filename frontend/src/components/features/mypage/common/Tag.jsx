import styles from "./Tag.module.css";

export default function Tag({ variant = "default", children }) {
  const variantClass = styles[variant] || styles.default;

  return <span className={`${styles.Tag} ${variantClass}`}>{children}</span>;
}
