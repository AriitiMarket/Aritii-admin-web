import { Component, type ReactNode, type ErrorInfo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faRedo } from '@fortawesome/free-solid-svg-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="text-center max-w-lg w-full">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-5xl text-amber-500 mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Page temporarily unavailable
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              The requested data could not be loaded. Please refresh the page or try again.
            </p>
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-left border border-red-200 dark:bg-red-950/40 dark:border-red-900">
              <p className="font-mono text-xs text-red-800 dark:text-red-300 break-words">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {this.state.error?.stack && (
                <details className="mt-2 text-xs text-red-700 dark:text-red-400">
                  <summary className="cursor-pointer font-sans underline">Show details</summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px]">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700"
              >
                <FontAwesomeIcon icon={faRedo} />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { useRouteError } from 'react-router-dom';

export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error('RouteErrorBoundary caught error:', error);

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'statusText' in error
        ? String((error as { statusText?: string }).statusText)
        : String(error ?? 'An unexpected error occurred');

  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="text-center max-w-lg w-full">
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className="text-5xl text-amber-500 mb-4"
        />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Page temporarily unavailable
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          The requested data could not be loaded. Please refresh the page or try again.
        </p>
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-left border border-red-200 dark:bg-red-950/40 dark:border-red-900">
          <p className="font-mono text-xs text-red-800 dark:text-red-300 break-words">
            {errorMessage}
          </p>
          {errorStack && (
            <details className="mt-2 text-xs text-red-700 dark:text-red-400">
              <summary className="cursor-pointer font-sans underline">Show details</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px]">
                {errorStack}
              </pre>
            </details>
          )}
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700"
          >
            <FontAwesomeIcon icon={faRedo} />
            Reload
          </button>
          <a
            href="/home"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
