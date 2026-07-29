import React from 'react';
import { withTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
          <div className="paper-dark p-8 rounded-2xl max-w-md w-full text-center border border-red-500/20">
            <h2 className="text-xl font-serif text-zinc-200 mb-2">
              {t('notification:error_boundary.title', { defaultValue: 'Something went wrong' })}
            </h2>
            <p className="text-xs text-zinc-400 font-serif italic mb-6">
              {t('notification:error_boundary.desc', { defaultValue: 'An unexpected runtime error occurred while rendering this page:' })}
            </p>
            <pre className="bg-black/40 text-red-400 p-4 rounded text-left text-[11px] overflow-auto max-h-40 mb-6 font-mono border border-border-warm/50">
              {this.state.error?.toString() || 'Unknown error'}
            </pre>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-lg bg-zinc-900 border border-gold-text/20 hover:border-gold-text/40 hover:bg-zinc-800 text-xs tracking-widest font-serif text-gold-accent uppercase transition-serene cursor-pointer"
            >
              {t('notification:error_boundary.button', { defaultValue: 'Reload Page' })}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation('notification')(ErrorBoundary);
