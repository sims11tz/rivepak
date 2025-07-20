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
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState>;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    componentDidUpdate(prevProps: ErrorBoundaryProps): void;
    resetErrorBoundary: () => void;
    render(): string | number | boolean | Iterable<React.ReactNode> | import("react/jsx-runtime").JSX.Element | null | undefined;
}
export declare function useErrorHandler(): {
    resetError: () => void;
    captureError: (error: Error) => void;
};
export declare function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>): {
    (props: P): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
