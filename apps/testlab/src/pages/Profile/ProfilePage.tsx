import type { JSX } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './ProfilePage.module.css';

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export function ProfilePage(): JSX.Element {
  const { user } = useAuth();

  if (!user) return <></>;

  const joinedId = user.sub;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Profile</h1>

      <div className={styles.card}>
        <div className={styles.avatarBlock}>
          <span className={styles.avatar}>{getInitials(user.email)}</span>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{user.email}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>User ID</span>
            <span className={`${styles.value} ${styles.mono}`}>{joinedId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
