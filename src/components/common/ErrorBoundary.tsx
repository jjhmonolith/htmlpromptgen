/**
 * 에러 바운더리 컴포넌트
 * 워크플로우에서 발생하는 오류 처리 및 복구
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryState>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // 부모 컴포넌트에 에러 알림
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // localStorage에서 워크플로우 상태 복구 시도
    this.attemptStateRecovery();
  }

  private attemptStateRecovery = () => {
    if (!this.props.enableRecovery) return;

    try {
      console.log('🔧 Attempting workflow state recovery...');
      
      // localStorage에서 워크플로우 상태 검색
      const keys = Object.keys(localStorage).filter(key => key.startsWith('workflow_'));
      
      if (keys.length > 0) {
        console.log('📦 Found workflow states in localStorage:', keys);
        // 가장 최근 상태 찾기
        const latestKey = keys
          .map(key => {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              return { key, timestamp: data.timestamp || 0 };
            } catch {
              return { key, timestamp: 0 };
            }
          })
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (latestKey) {
          console.log('✨ Recovery state available:', latestKey.key);
        }
      }
    } catch (recoveryError) {
      console.warn('Failed to recover workflow state:', recoveryError);
    }
  };

  private handleRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // 재시도 횟수 증가
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }));

    // 딜레이 후 상태 초기화
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }, 1000);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private renderDefaultError() {
    const { error, retryCount } = this.state;
    const maxRetries = 3;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              문제가 발생했습니다
            </h2>
            
            <p className="text-gray-600 mb-4">
              워크플로우 진행 중 오류가 발생했습니다. 이전 작업 내용은 자동으로 저장되어 복구할 수 있습니다.
            </p>
          </div>

          <div className="space-y-3">
            {retryCount < maxRetries && (
              <Button 
                onClick={this.handleRetry}
                className="w-full"
                variant="primary"
              >
                다시 시도 ({retryCount + 1}/{maxRetries})
              </Button>
            )}
            
            <Button 
              onClick={this.handleReload}
              className="w-full"
              variant="secondary"
            >
              페이지 새로고침
            </Button>
          </div>

          {error && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                오류 상세 정보
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-32">
                <pre>{error.message}</pre>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback 컴포넌트가 있으면 사용
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent {...this.state} />;
      }
      
      // 기본 에러 화면 렌더링
      return this.renderDefaultError();
    }

    return this.props.children;
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
}

// HOC 패턴으로 사용할 수 있는 래퍼
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}