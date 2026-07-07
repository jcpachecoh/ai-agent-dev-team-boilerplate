import { RecetaFilterSelect } from '@restopsiq/ui';

import { ThousandsInput } from '@/components/shared/ThousandsInput';
import { Paperclip, Plus, Trash2, X } from 'lucide-react';
import { useRef } from 'react';

import { validateEmployeeAssetFile } from '../api/employee-assets.upload';

import type { EmployeeAsset, EmployeeAssetDraft } from '../types/employee-asset.types';
import { ASSET_STATUS_LABELS, ASSET_TYPE_OPTIONS } from '../types/employee-asset.types';
import styles from './PayrollEmployeeWizardAssetsStep.module.scss';

const TYPE_OPTIONS = ASSET_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

const EMPTY_DRAFT: EmployeeAssetDraft = {
  assetName: '',
  type: '',
  value: '',
  notes: '',
  file: null,
};

interface PayrollEmployeeWizardAssetsStepProps {
  theme: 'light' | 'dark';
  drafts: EmployeeAssetDraft[];
  onChange: (drafts: EmployeeAssetDraft[]) => void;
  existingAssets?: EmployeeAsset[];
}

export function PayrollEmployeeWizardAssetsStep({
  theme,
  drafts,
  onChange,
  existingAssets,
}: PayrollEmployeeWizardAssetsStepProps): React.JSX.Element {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateDraft = (index: number, patch: Partial<EmployeeAssetDraft>) => {
    onChange(drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const removeDraft = (index: number) => {
    onChange(drafts.filter((_, i) => i !== index));
  };

  const addDraft = () => {
    onChange([...drafts, { ...EMPTY_DRAFT }]);
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const error = validateEmployeeAssetFile(file);
    if (error) {
      alert(error);
      e.target.value = '';
      return;
    }
    updateDraft(index, { file });
  };

  const clearFile = (index: number) => {
    updateDraft(index, { file: null });
    const input = fileInputRefs.current[index];
    if (input) input.value = '';
  };

  return (
    <div className={styles.root}>
      <p className={styles.hint}>
        Opcional. Registra equipos, documentos o recursos asignados al colaborador. Puedes
        agregarlos ahora o desde el perfil del empleado después de crearlo.
      </p>

      {existingAssets && existingAssets.length > 0 ? (
        <div className={styles.existingSection}>
          <p className={styles.sectionLabel}>Activos existentes</p>
          <div className={styles.existingList}>
            {existingAssets.map((asset) => (
              <div key={asset.id} className={styles.existingRow}>
                <span className={styles.existingName}>{asset.assetName}</span>
                <span className={styles.existingType}>
                  {ASSET_TYPE_OPTIONS.find((o) => o.value === asset.type)?.label ?? asset.type}
                </span>
                <span className={styles.existingValue}>
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(asset.value)}
                </span>
                <span className={`${styles.statusBadge} ${styles[`status${asset.status}`]}`}>
                  {ASSET_STATUS_LABELS[asset.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {drafts.length > 0 ? (
        <div className={styles.drafts}>
          <p className={styles.sectionLabel}>Nuevos activos</p>
          {drafts.map((draft, index) => (
            <div key={index} className={styles.draftRow}>
              <div className={styles.draftFields}>
                <label className={styles.field}>
                  <span className={styles.label}>Nombre del activo</span>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="ej. Computador portátil"
                    value={draft.assetName}
                    onChange={(e) => updateDraft(index, { assetName: e.target.value })}
                    autoComplete="off"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Categoría</span>
                  <RecetaFilterSelect
                    aria-label="Categoría del activo"
                    options={TYPE_OPTIONS}
                    value={draft.type}
                    onChange={(value) =>
                      updateDraft(index, { type: value as EmployeeAssetDraft['type'] })
                    }
                    theme={theme}
                    size="md"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Valor (COP)</span>
                  <ThousandsInput
                    className={styles.input}
                    placeholder="0"
                    autoComplete="off"
                    value={draft.value}
                    onChange={(num) => updateDraft(index, { value: String(num) })}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Observaciones</span>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Opcional"
                    value={draft.notes ?? ''}
                    onChange={(e) => updateDraft(index, { notes: e.target.value })}
                    autoComplete="off"
                  />
                </label>

                <div className={`${styles.field} ${styles.fileRow}`}>
                  <span className={styles.label}>Documento adjunto</span>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    className={styles.fileInput}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileChange(index, e)}
                  />
                  {draft.file ? (
                    <div className={styles.fileSelected}>
                      <Paperclip size={13} aria-hidden />
                      <span className={styles.fileName}>{draft.file.name}</span>
                      <button
                        type="button"
                        className={styles.fileClearButton}
                        onClick={() => clearFile(index)}
                        aria-label="Quitar archivo"
                      >
                        <X size={12} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.fileButton}
                      onClick={() => fileInputRefs.current[index]?.click()}
                    >
                      <Paperclip size={13} aria-hidden />
                      Adjuntar documento
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeDraft(index)}
                aria-label="Eliminar activo"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <button type="button" className={styles.addButton} onClick={addDraft}>
        <Plus size={14} aria-hidden />
        Agregar activo
      </button>
    </div>
  );
}
