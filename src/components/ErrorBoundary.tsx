import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    // Attempt to recover by resetting the error state
    this.setState({ hasError: false, error: null });
    // Also clear session storage as a precaution if it was a storage-related crash
    if (typeof window !== "undefined") {
      // sessionStorage.clear(); // Optional: might be too aggressive
      window.location.href = "/"; // Force a clean reload
    }
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We encountered an unexpected error. This usually happens when the application state becomes inconsistent.
            </p>
            
            {this.state.error && (
              <div className="bg-red-50 rounded-lg p-4 mb-8 text-left overflow-auto max-h-32 border border-red-100">
                <code className="text-xs text-red-700 break-all font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <Button 
              onClick={handleReset}
              className="w-full py-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reload Application
            </Button>
            
            <p className="mt-6 text-sm text-gray-400">
              If the problem persists, please clear your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const handleReset = () => {
  window.location.href = "/";
};

export default ErrorBoundary;
