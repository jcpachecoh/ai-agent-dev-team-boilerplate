import * as React from 'react';

import styles from './Skeleton.module.scss';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'table';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'wave',
  className,
  style,
  ...props
}) => {
  const defaultDimensions: Record<
    NonNullable<SkeletonProps['variant']>,
    Pick<React.CSSProperties, 'width' | 'height'>
  > = {
    text: { width: '100%', height: '1em' },
    circular: { width: 40, height: 40 },
    rectangular: { width: '100%', height: 120 },
    table: { width: '100%', height: 'auto' },
  };

  const combinedClassName = [
    styles.skeleton,
    styles[variant],
    animation !== 'none' && styles[animation],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inlineStyles: React.CSSProperties = {
    width: width ?? defaultDimensions[variant].width,
    height: height ?? defaultDimensions[variant].height,
    ...style,
  };

  if (variant === 'table') {
    return (
      <div className={combinedClassName} style={inlineStyles} {...props}>
        <div className={styles.tableRow} />
        <div className={styles.tableRow} />
        <div className={styles.tableRow} />
      </div>
    );
  }

  return <div className={combinedClassName} style={inlineStyles} {...props} />;
};

export default Skeleton;
