import { Component, ReactNode } from 'react';
import { Button, IllustratedMessage, Heading, Content } from '@react-spectrum/s2';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches React component errors and displays a fallback UI.
 * Prevents the entire app from crashing due to a single component error.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <IllustratedMessage styles={style({ justifySelf: 'center' })}>
          <Heading level={2}>Something went wrong</Heading>
          <Content>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'center',
                padding: 16,
              }}
            >
              <p>An error occurred while loading this section.</p>
              {import.meta.env.DEV && this.state.error && (
                <code
                  style={{
                    padding: 12,
                    backgroundColor: 'var(--spectrum-gray-100)',
                    borderRadius: 4,
                    fontSize: 12,
                    maxWidth: 400,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                </code>
              )}
              <Button variant="secondary" onPress={this.handleReset}>
                Try Again
              </Button>
            </div>
          </Content>
        </IllustratedMessage>
      );
    }

    return this.props.children;
  }
}
