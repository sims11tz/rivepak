import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.resetErrorBoundary = () => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null
            });
        };
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
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
    componentDidUpdate(prevProps) {
        const { resetKeys, resetOnPropsChange } = this.props;
        const { hasError } = this.state;
        // Reset error boundary if resetKeys have changed
        if (hasError && prevProps.resetKeys !== resetKeys) {
            if (resetKeys === null || resetKeys === void 0 ? void 0 : resetKeys.some((key, idx) => { var _a; return key !== ((_a = prevProps.resetKeys) === null || _a === void 0 ? void 0 : _a[idx]); })) {
                this.resetErrorBoundary();
            }
        }
        // Reset error boundary if props have changed and resetOnPropsChange is true
        if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
            this.resetErrorBoundary();
        }
    }
    render() {
        const { hasError, error, errorInfo } = this.state;
        const { fallback, children } = this.props;
        if (hasError && error) {
            if (fallback) {
                return fallback(error, errorInfo);
            }
            // Default fallback UI
            return (_jsxs("div", Object.assign({ style: {
                    padding: '20px',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    color: '#721c24',
                    fontFamily: 'monospace'
                } }, { children: [_jsx("h2", Object.assign({ style: { margin: '0 0 10px 0' } }, { children: "RivePak Error" })), _jsxs("p", Object.assign({ style: { margin: '0 0 10px 0' } }, { children: [_jsx("strong", { children: "Error:" }), " ", error.message] })), errorInfo && (_jsxs("details", Object.assign({ style: { cursor: 'pointer' } }, { children: [_jsx("summary", { children: "Stack Trace" }), _jsx("pre", Object.assign({ style: {
                                    margin: '10px 0 0 0',
                                    padding: '10px',
                                    backgroundColor: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    overflow: 'auto',
                                    fontSize: '12px'
                                } }, { children: errorInfo.componentStack }))] }))), _jsx("button", Object.assign({ onClick: this.resetErrorBoundary, style: {
                            marginTop: '10px',
                            padding: '5px 10px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        } }, { children: "Reset" }))] })));
        }
        return children;
    }
}
// Hook for error handling in functional components
export function useErrorHandler() {
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);
    const resetError = () => setError(null);
    const captureError = (error) => setError(error);
    return { resetError, captureError };
}
// Higher-order component for adding error boundary
export function withErrorBoundary(Component, errorBoundaryProps) {
    const WrappedComponent = (props) => (_jsx(ErrorBoundary, Object.assign({}, errorBoundaryProps, { children: _jsx(Component, Object.assign({}, props)) })));
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    return WrappedComponent;
}
