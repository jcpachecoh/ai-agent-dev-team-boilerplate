import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as React from 'react';

import styles from './ErrorBoundary.module.scss';
import { Button } from '../../Button';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'page' | 'section';
  onReset?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
    // Here you would typically log to Sentry or similar service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isPage = this.props.variant === 'page';
      const containerClass = [styles.container, isPage ? styles.page : styles.section].join(' ');

      return (
        <div className={containerClass}>
          <div className={styles.content}>
            <div className={styles.iconContainer}>
              <AlertTriangle size={isPage ? 64 : 32} />
            </div>
            <h2 className={styles.title}>{isPage ? 'Unexpected Error' : 'Something went wrong'}</h2>
            <p className={styles.message}>
              {isPage
                ? 'The application encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.'
                : 'This section could not be loaded.'}
            </p>
            <div className={styles.actions}>
              <Button variant="primary" onClick={this.handleReset} className={styles.resetButton}>
                <RefreshCw size={16} className={styles.refreshIcon} />
                Try Again
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className={styles.debug}>{this.state.error.toString()}</pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
