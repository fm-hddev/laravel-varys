import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-6"
          role="alert"
        >
          <p className="text-sm font-medium text-red-400">
            {this.props.fallbackLabel ?? 'Une erreur est survenue dans cette vue'}
          </p>
          <p className="max-w-md text-center text-xs text-neutral-500">{this.state.message}</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
