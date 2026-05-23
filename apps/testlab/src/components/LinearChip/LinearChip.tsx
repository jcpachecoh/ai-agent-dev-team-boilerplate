import type { JSX } from 'react';
import type { LinearLink } from '@/services/linear.service';
import styles from './LinearChip.module.css';

interface Props {
  link: LinearLink;
  onUnlink: () => void;
  isUnlinking?: boolean;
}

function LinearIcon(): JSX.Element {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="12" height="12" rx="3" fill="#5E6AD2" />
      <path
        d="M2 9.5L7.5 4M4 3.5h4.5V8"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LinearChip({ link, onUnlink, isUnlinking }: Props): JSX.Element {
  const shortTitle =
    link.issueTitle.length > 40 ? link.issueTitle.slice(0, 37) + '…' : link.issueTitle;

  return (
    <span className={styles.chip}>
      <LinearIcon />
      <a
        className={styles.chipLink}
        href={link.issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={link.issueTitle}
      >
        <span className={styles.identifier}>{link.issueId}</span>
        <span className={styles.title}>{shortTitle}</span>
        <svg
          className={styles.externalIcon}
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M7 2H10V5M10 2L5 7M2 4V10H8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
      <button
        className={styles.btnUnlink}
        onClick={onUnlink}
        disabled={isUnlinking}
        aria-label={`Unlink ${link.issueId}`}
        title="Unlink"
      >
        ×
      </button>
    </span>
  );
}
