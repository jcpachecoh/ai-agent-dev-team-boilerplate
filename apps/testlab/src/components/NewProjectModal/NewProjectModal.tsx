import { useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService, type CreateProjectPayload } from '@/services/projects.service';
import styles from './NewProjectModal.module.css';

interface Props {
  onClose: () => void;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function NewProjectModal({ onClose }: Props): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectsService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    mutation.mutate({
      name: data.get('name') as string,
      slug: data.get('slug') as string,
      description: (data.get('description') as string) || undefined,
    });
  }

  function handleNameChange(e: ChangeEvent<HTMLInputElement>): void {
    const form = e.currentTarget.closest('form') as HTMLFormElement;
    const slugInput = form.elements.namedItem('slug') as HTMLInputElement;
    if (slugInput && !slugInput.dataset['touched']) {
      slugInput.value = toSlug(e.currentTarget.value);
    }
  }

  function handleSlugChange(e: ChangeEvent<HTMLInputElement>): void {
    e.currentTarget.dataset['touched'] = '1';
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
      <h2 className={styles.title}>New Project</h2>
      <form method="dialog" onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="np-name" className={styles.label}>
            Name
          </label>
          <input
            id="np-name"
            name="name"
            className={styles.input}
            required
            maxLength={100}
            autoFocus
            onChange={handleNameChange}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="np-slug" className={styles.label}>
            Slug
          </label>
          <input
            id="np-slug"
            name="slug"
            className={styles.input}
            required
            pattern="[a-z0-9-]+"
            maxLength={60}
            onChange={handleSlugChange}
          />
          <span className={styles.hint}>Lowercase letters, numbers, and hyphens only</span>
        </div>
        <div className={styles.field}>
          <label htmlFor="np-desc" className={styles.label}>
            Description <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            id="np-desc"
            name="description"
            className={styles.textarea}
            rows={3}
            maxLength={500}
          />
        </div>
        {mutation.isError && <p className={styles.error}>{(mutation.error as Error).message}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.btnSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
