import { Upload, X, FileText } from 'lucide-react';
import * as React from 'react';

import styles from './FileUpload.module.scss';
import { ProgressBar } from '../../feedback/progress';

export interface FileUploadProps {
  onFileSelect?: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  progress?: number;
  theme?: 'light' | 'dark';
  className?: string;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'xl';
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept,
  maxSize,
  multiple = false,
  progress,
  theme = 'dark',
  className,
  label = 'Click to upload or drag and drop',
  description = 'SVG, PNG, JPG or GIF (max. 800x400px)',
  size = 'md',
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFiles = (files: File[]): File[] => {
    return files.filter((file) => {
      const isValidType =
        !accept ||
        accept.split(',').some((type) => {
          const t = type.trim();
          if (t.startsWith('.')) {
            return file.name.endsWith(t);
          }
          return file.type.match(new RegExp(t.replace('*', '.*')));
        });
      const isValidSize = !maxSize || file.size <= maxSize;
      return isValidType && isValidSize;
    });
  };

  const handleFiles = (files: File[]): void => {
    const validFiles = validateFiles(files);
    const newFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;

    setSelectedFiles(newFiles);
    onFileSelect?.(newFiles);

    // Generate previews for images
    const newPreviews = validFiles
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => URL.createObjectURL(file));

    setPreviews(multiple ? [...previews, ...newPreviews] : newPreviews);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number): void => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    onFileSelect?.(newFiles);
  };

  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <div className={[styles.container, themeClass, sizeClass, className].filter(Boolean).join(' ')}>
      <div
        className={[styles.dropZone, dragActive && styles.dragActive].filter(Boolean).join(' ')}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className={styles.hiddenInput}
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
        <div className={styles.dropZoneContent}>
          <div className={styles.iconContainer}>
            <Upload size={24} />
          </div>
          <p className={styles.label}>{label}</p>
          <p className={styles.description}>{description}</p>
        </div>
      </div>

      {progress !== undefined && progress > 0 && (
        <div className={styles.progressContainer}>
          <ProgressBar value={progress} showLabel />
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className={styles.fileList}>
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                {file.type.startsWith('image/') ? (
                  <div className={styles.previewThumbnail}>
                    <img src={previews[index]} alt={file.name} />
                  </div>
                ) : (
                  <FileText size={20} className={styles.fileIcon} />
                )}
                <div className={styles.fileDetails}>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.removeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
