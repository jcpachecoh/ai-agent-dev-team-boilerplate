import { useState, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/services/projects.service';
import { NewProjectModal } from '@/components/NewProjectModal';
import styles from './ProjectsPage.module.css';

export function ProjectsPage(): JSX.Element {
  const [showModal, setShowModal] = useState(false);
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsService.list,
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        <button className={styles.btnNew} onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </header>
      {isLoading && <p className={styles.empty}>Loading…</p>}
      {!isLoading && projects.length === 0 && (
        <p className={styles.empty}>No projects yet. Create your first one!</p>
      )}
      <ul className={styles.grid}>
        {projects.map((project) => (
          <li key={project.id} className={styles.card}>
            <a href={`/projects/${project.id}/suites`} className={styles.cardLink}>
              <span className={styles.cardName}>{project.name}</span>
              {project.description && (
                <span className={styles.cardDesc}>{project.description}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
