    // ==========================================
    // [V2.5] 登入：只有 Firebase 裡建立的帳號能進來
    // 帳號由管理者在 Firebase Console 建立（畫面上沒有「註冊」）。
    // 真正的資料保護在 Firebase 規則（依 UID 白名單），登入畫面只是入口。
    // ==========================================
    const mapAuthError = (err) => {
      const code = err?.code || '';
      if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(code)) {
        return '帳號或密碼錯誤';
      }
      if (code === 'auth/invalid-email') return '信箱格式不正確';
      if (code === 'auth/too-many-requests') return '嘗試次數過多，請稍後再試';
      if (code === 'auth/network-request-failed') return '網路連線失敗，請檢查網路';
      if (code === 'auth/user-disabled') return '這個帳號已被停用';
      if (code === 'auth/operation-not-supported-in-this-environment') return '目前的開啟方式不支援登入，請改用網頁網址開啟';
      return `登入失敗（${code || '未知錯誤'}）`;
    };

    function LoginScreen() {
      const [email, setEmail] = React.useState('');
      const [password, setPassword] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [info, setInfo] = React.useState('');

      const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');
        if (!email.trim() || !password) {
          setError('請輸入信箱和密碼');
          return;
        }
        setBusy(true);
        try {
          await auth.signInWithEmailAndPassword(email.trim(), password);
          // 成功後 AuthGate 會偵測到登入狀態並切換畫面
        } catch (err) {
          console.error('Login error:', err);
          setError(mapAuthError(err));
          setBusy(false);
        }
      };

      const handleReset = async () => {
        setError('');
        setInfo('');
        if (!email.trim()) {
          setError('請先輸入信箱，再按「忘記密碼」');
          return;
        }
        try {
          await auth.sendPasswordResetEmail(email.trim());
          setInfo('如果這個信箱已註冊，重設密碼的信件已寄出，請到信箱收信。');
        } catch (err) {
          console.error('Reset error:', err);
          setError(mapAuthError(err));
        }
      };

      const inputCls = "w-full text-sm px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white";

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow">
                <IconShoppingBag size={28} />
              </div>
              <h1 className="text-lg font-bold text-slate-800">小豆苗訂單助手</h1>
              <p className="text-xs text-slate-500">請登入後使用</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">電子信箱</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">密碼</label>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <IconAlertTriangle size={16} />
                  {error}
                </div>
              )}
              {info && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                {busy ? '登入中...' : '登入'}
              </button>
            </form>

            <button type="button" onClick={handleReset} className="w-full text-xs text-slate-500 hover:text-slate-700">
              忘記密碼？寄送重設信
            </button>
            <p className="text-center text-[11px] text-slate-400">版本 v{APP_VERSION}</p>
          </div>
        </div>
      );
    }

    // 登入狀態閘門：沒登入 → 登入畫面；登入後才載入主程式（也才開始讀資料庫）
    function AuthGate() {
      const [user, setUser] = React.useState(undefined); // undefined = 還在確認登入狀態

      React.useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
          // 匿名登入不視為有效登入（以前若曾啟用匿名，這裡會直接登出）
          if (u && u.isAnonymous) {
            auth.signOut();
            return;
          }
          setUser(u);
        });
        return unsubscribe;
      }, []);

      if (user === undefined) {
        return (
          <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">
            確認登入狀態中...
          </div>
        );
      }
      if (!user) return <LoginScreen />;
      return <SproutOrderAssistant user={user} onSignOut={() => auth.signOut()} />;
    }
