import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SmartMart POS Uncaught Exception:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('smartmart_active_session_v2');
      localStorage.removeItem('smartmart_live_sync_state');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-[#0c1222] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-400">
                ⚠️
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Terminal Display Recovered</h3>
                <p className="text-xs text-slate-400">An unexpected state occurred and was safely caught</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 max-h-36 overflow-y-auto break-words">
              {String(this.state.error?.message || this.state.error || "Component render exception caught.")}
            </div>

            <div className="flex gap-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                🔄 Refresh Terminal
              </button>
              <button
                onClick={this.handleResetState}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all active:scale-95"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
