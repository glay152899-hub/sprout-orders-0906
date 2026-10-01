    // ==========================================
    // Error Boundary Component
    // ==========================================
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }

      componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo);
      }

      handleReset = () => {
        window.location.reload();
      };

      render() {
        if (this.state.hasError) {
          return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconAlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">發生未預期的錯誤</h2>
                <p className="text-sm text-gray-500 mb-4">
                  若持續出現，請檢查網路連線、登入狀態，以及 Firebase 的規則設定。
                </p>
                <div className="bg-gray-50 p-3 rounded-lg text-left font-mono text-xs text-red-500 overflow-auto max-h-28 mb-6 border border-gray-200">
                  {this.state.error?.toString()}
                </div>
                <button
                  onClick={this.handleReset}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <IconRefreshCw size={18} />
                  重新整理網頁
                </button>
              </div>
            </div>
          );
        }
        return this.props.children;
      }
    }
