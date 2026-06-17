import styles from './HomePage.module.scss';

export default function HomePage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Home</h1>
    </div>
  );
}
