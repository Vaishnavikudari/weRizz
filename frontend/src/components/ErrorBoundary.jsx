import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Mavora caught runtime error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        } else {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full min-h-[500px] flex items-center justify-center p-6 text-white">
                    <div className="max-w-md w-full bg-[#0B1736]/90 border border-blue-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl text-center space-y-5">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                            <AlertTriangle size={30} />
                        </div>
                        <div className="space-y-2">
                            <h2 
                                className="font-serif text-2xl text-[#F4EDE0]"
                                style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                            >
                                Interface <span className="italic text-blue-400">Recovered</span>
                            </h2>
                            <p className="text-xs text-white/70 leading-relaxed font-sans">
                                A temporary view state encountered an error. Mavora kept your session safe.
                            </p>
                            {this.state.error?.message && (
                                <p className="text-[11px] font-mono p-2 rounded-xl bg-black/40 text-amber-300 border border-amber-500/20 break-words text-left">
                                    {this.state.error.message}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                            >
                                <RefreshCw size={14} /> Try Again
                            </button>
                            <button
                                onClick={() => {
                                    this.setState({ hasError: false });
                                    window.location.href = '/';
                                }}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer"
                            >
                                <Home size={14} /> Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

