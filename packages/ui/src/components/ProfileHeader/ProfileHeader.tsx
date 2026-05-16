import * as React from 'react';
import styles from './ProfileHeader.module.scss';
import InitialBadge from '../InitialBadge';
import { LoginTitle } from '../LoginTitle/LoginTitle';

export interface ProfileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  subtitle?: string;
  badgeLabel?: string;
  badgeSize?: 'sm' | 'md' | 'lg';
  titleSize?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}

export function ProfileHeader({
  name = 'Patricia Álvarez',
  subtitle = 'Administrador · Flota',
  badgeLabel = 'PA',
  badgeSize = 'md',
  titleSize = 'md',
  theme = 'light',
  className,
  ...props
}: ProfileHeaderProps) {
  const cls = [styles.container, theme === 'dark' ? styles.dark : styles.light, className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} {...props}>
      <div className={styles.left}>
        <InitialBadge label={badgeLabel} size={badgeSize} />
      </div>

      <div className={styles.right}>
        <LoginTitle
          title={name}
          subtitle={subtitle}
          variant={theme}
          titleSize={titleSize}
          className={styles.titleOverride}
        />
      </div>
    </div>
  );
}

export default ProfileHeader;
