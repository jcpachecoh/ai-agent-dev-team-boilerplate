import { Copy } from 'lucide-react';
import type { ButtonHTMLAttributes, JSX } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaCopyButton.module.scss';

export interface RecetaCopyButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  ariaLabel?: string;
  theme?: RecetaTheme;
  size?: RecetaSize;
}

export function RecetaCopyButton({
  ariaLabel = 'Duplicar receta',
  theme = 'dark',
  size = 'md',
  className,
  ...props
}: RecetaCopyButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={[styles.button, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      {...props}
    >
      <Copy className={styles.icon} aria-hidden />
    </button>
  );
}

export default RecetaCopyButton;
