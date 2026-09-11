import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tactical ErrorBoundary caught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-slate-950 text-slate-100 p-6 font-mono">
          <div className="max-w-xl w-full p-6 bg-slate-900 border border-rose-500 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <span className="text-xl">⚠️</span>
              <h2 className="text-lg font-bold">ResQGrid Tactical Command Encountered an Exception</h2>
            </div>
            <p className="text-xs text-slate-400">
              An unhandled render exception occurred. Details below:
            </p>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-rose-300 text-xs overflow-auto max-h-48 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition"
            >
              🔄 Reload Command Center
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
