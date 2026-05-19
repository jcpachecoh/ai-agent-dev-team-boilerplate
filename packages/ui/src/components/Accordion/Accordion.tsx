import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import styles from './Accordion.module.scss';
import tripStyles from '../TripCard/TripCard.module.scss';

export interface AccordionProps {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: any) => void;
  /** global size for triggers */
  size?: 'sm' | 'md' | 'lg';
  /** global color used as fallback for items (hex or CSS color) */
  color?: string;

  items: {
    value: string;
    trigger: React.ReactNode;
    content: React.ReactNode;
    disabled?: boolean;
    variant?: 'primary' | 'success' | 'warning' | 'neutral';
    /** optional hex color (e.g. #f6c661) to override variant colors */
    color?: string;
    size?: 'sm' | 'md' | 'lg';
    subtitle?: string;
    capText?: string;
    leftIcon?: string;
  }[];
  className?: string;
  icon?: React.ReactNode;
}

export function Accordion({
  type = 'single',
  collapsible = true,
  items,
  className,
  size = 'md',
  icon = <ChevronDown className={styles.icon} aria-hidden />,
  color,
  defaultValue,
  value,
  onValueChange,
  ...props
}: AccordionProps) {
  const hexToRgba = (hex?: string, alpha = 1) => {
    if (!hex) return undefined;
    const h = hex.replace('#', '');
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (h.length === 6) {
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  };
  const singleProps: Partial<AccordionPrimitive.AccordionSingleProps> = {};
  const multipleProps: Partial<AccordionPrimitive.AccordionMultipleProps> = {};

  if (type === 'single') {
    singleProps.defaultValue = Array.isArray(defaultValue)
      ? (defaultValue[0] as string)
      : (defaultValue as string | undefined);
    singleProps.value = Array.isArray(value) ? (value[0] as string) : (value as string | undefined);
    singleProps.onValueChange = onValueChange as ((val: string) => void) | undefined;
    singleProps.collapsible = collapsible;
    singleProps.type = 'single';
  } else {
    multipleProps.defaultValue = (
      Array.isArray(defaultValue)
        ? defaultValue
        : defaultValue
          ? [defaultValue as string]
          : undefined
    ) as string[] | undefined;
    multipleProps.value = (Array.isArray(value) ? value : value ? [value as string] : undefined) as
      | string[]
      | undefined;
    multipleProps.onValueChange = onValueChange as ((val: string[]) => void) | undefined;
    multipleProps.type = 'multiple';
  }

  return (
    <AccordionPrimitive.Root
      className={clsx(styles.root, className)}
      {...(type === 'single'
        ? (singleProps as AccordionPrimitive.AccordionSingleProps)
        : (multipleProps as AccordionPrimitive.AccordionMultipleProps))}
      {...props}
    >
      {items.map((item) => {
        const finalColor = item.color ?? color;
        const itemStyle: React.CSSProperties = {};
        if (finalColor) {
          itemStyle.border = `1px solid ${hexToRgba(finalColor, 0.18)}`;
        }

        const accentStyle: React.CSSProperties | undefined = item.color
          ? { background: hexToRgba(finalColor, 1) }
          : undefined;
        const itemSize = (item.size ?? size) as 'sm' | 'md' | 'lg';
        const triggerSizeClass =
          itemSize === 'sm'
            ? styles.triggerSm
            : itemSize === 'lg'
              ? styles.triggerLg
              : styles.triggerMd;
        const itemSizeClass =
          itemSize === 'sm' ? styles.itemSm : itemSize === 'lg' ? styles.itemLg : styles.itemMd;
        // derived colors similar to BadgeButton
        const derivedBg = finalColor ? hexToRgba(finalColor, 0.06) : undefined;
        const textColor = finalColor ?? undefined;
        const triggerStyle: React.CSSProperties = {};
        const labelStyle: React.CSSProperties = {};
        const iconStyle: React.CSSProperties = {};
        if (derivedBg) triggerStyle.backgroundColor = derivedBg;
        if (textColor) {
          labelStyle.color = textColor;
          iconStyle.color = textColor;
        }

        return (
          <AccordionPrimitive.Item
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={clsx(
              styles.item,
              itemSizeClass,
              item.variant && styles[`item--${item.variant}`],
            )}
            style={itemStyle}
          >
            <AccordionPrimitive.Header className={styles.header}>
              <AccordionPrimitive.Trigger
                className={clsx(styles.trigger, triggerSizeClass)}
                style={triggerStyle}
              >
                <span className={styles.accent} style={accentStyle} aria-hidden />
                <div className={styles.triggerLabel}>
                  <span className={styles.triggerTitle} style={labelStyle}>
                    {item.trigger}
                  </span>
                  {item.subtitle && <div className={styles.triggerMeta}>{item.subtitle}</div>}
                </div>
                {React.isValidElement(icon)
                  ? React.cloneElement(icon as any, { style: iconStyle })
                  : icon}
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className={styles.content}>
              <div className={styles.contentInner}>{item.content}</div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        );
      })}
    </AccordionPrimitive.Root>
  );
}
