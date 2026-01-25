import styles from './AnswerInput.module.css';

export default function AnswerInput({
  value = '',
  onChange,
  onSubmit,
  placeholder = '여기에 입력...'
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>빈칸에 들어갈 단어를 입력하세요</div>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <button className={styles.button} onClick={onSubmit}>
        확인
      </button>
    </div>
  );
}
