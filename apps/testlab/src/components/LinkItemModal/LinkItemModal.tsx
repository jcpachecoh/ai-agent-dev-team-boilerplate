import { useRef, useEffect, useState, type JSX } from 'react';
import styles from './LinkItemModal.module.css';

export interface LinkableItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface Props {
  title: string;
  items: LinkableItem[];
  isLoading?: boolean;
  isPending?: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function LinkItemModal({
  title,
  items,
  isLoading = false,
  isPending = false,
  error,
  onClose,
  onSelect,
}: Props): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const filtered = items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
      <h2 className={styles.title}>{title}</h2>
      <input
        className={styles.search}
        type="search"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div className={styles.list}>
        {isLoading && <p className={styles.hint}>Loading…</p>}
        {!isLoading && filtered.length === 0 && <p className={styles.hint}>No available items.</p>}
        {filtered.map((item) => (
          <button
            key={item.id}
            className={styles.item}
            disabled={isPending}
            onClick={() => {
              onSelect(item.id);
              onClose();
            }}
          >
            <span className={styles.itemLabel}>{item.label}</span>
            {item.sublabel && <span className={styles.itemSublabel}>{item.sublabel}</span>}
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.btnCancel} onClick={onClose}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}
