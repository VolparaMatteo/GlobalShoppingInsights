import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title={this.props.fallbackTitle || 'Something went wrong'}
          subTitle={this.state.error?.message || 'An unexpected error occurred.'}
          extra={
            <Button type="primary" onClick={this.handleReset}>
              Try Again
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
