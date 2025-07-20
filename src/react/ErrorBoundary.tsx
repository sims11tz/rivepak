import React, { Component, ReactNode, ErrorInfo } from 'react';

export interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	resetKeys?: Array<string | number>;
	resetOnPropsChange?: boolean;
}

export interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
			error
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log error details
		console.error('RivePak Error Boundary caught an error:', error, errorInfo);

		// Update state with error info
		this.setState({
			errorInfo
		});

		// Call custom error handler if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps) {
		const { resetKeys, resetOnPropsChange } = this.props;
		const { hasError } = this.state;

		// Reset error boundary if resetKeys have changed
		if (hasError && prevProps.resetKeys !== resetKeys) {
			if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
				this.resetErrorBoundary();
			}
		}

		// Reset error boundary if props have changed and resetOnPropsChange is true
		if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
			this.resetErrorBoundary();
		}
	}

	resetErrorBoundary = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null
		});
	};

	render() {
		const { hasError, error, errorInfo } = this.state;
		const { fallback, children } = this.props;

		if (hasError && error) {
			if (fallback) {
				return fallback(error, errorInfo!);
			}

			// Default fallback UI
			return (
				<div style={{
					padding: '20px',
					backgroundColor: '#f8d7da',
					border: '1px solid #f5c6cb',
					borderRadius: '4px',
					color: '#721c24',
					fontFamily: 'monospace'
				}}>
					<h2 style={{ margin: '0 0 10px 0' }}>RivePak Error</h2>
					<p style={{ margin: '0 0 10px 0' }}>
						<strong>Error:</strong> {error.message}
					</p>
					{errorInfo && (
						<details style={{ cursor: 'pointer' }}>
							<summary>Stack Trace</summary>
							<pre style={{
								margin: '10px 0 0 0',
								padding: '10px',
								backgroundColor: '#fff',
								border: '1px solid #ddd',
								borderRadius: '4px',
								overflow: 'auto',
								fontSize: '12px'
							}}>
								{errorInfo.componentStack}
							</pre>
						</details>
					)}
					<button
						onClick={this.resetErrorBoundary}
						style={{
							marginTop: '10px',
							padding: '5px 10px',
							backgroundColor: '#dc3545',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						Reset
					</button>
				</div>
			);
		}

		return children;
	}
}

// Hook for error handling in functional components
export function useErrorHandler() {
	const [error, setError] = React.useState<Error | null>(null);

	React.useEffect(() => {
		if (error) {
			throw error;
		}
	}, [error]);

	const resetError = () => setError(null);
	const captureError = (error: Error) => setError(error);

	return { resetError, captureError };
}

// Higher-order component for adding error boundary
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
	const WrappedComponent = (props: P) => (
		<ErrorBoundary {...errorBoundaryProps}>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

	return WrappedComponent;
}
