    // ==========================================
    // tab-more.js — 「更多」分頁（畫面）
    // 從 app-shell.js 抽出，只搬「畫面(JSX)」本身，狀態與商業邏輯仍留在 app-shell.js，
    // 透過單一 `more` 物件把所有需要的資料/狀態/處理函式一次傳入（跟 tab-orderList.js 同一套做法）。
    // ==========================================
    function MoreTab({ more }) {
      const {
        user,
        trashOrders,
        trashProducts,
        shippingConfig,
        blacklist,
        setIsTrashOpen,
        setIsLogOpen,
        setIsRestoreModalOpen,
        setIsMessageTemplateOpen,
        setIsShippingSettingsOpen,
        setIsBlacklistOpen,
        handleExportCSV,
        handleExportProductsExcel,
        handleSignOut,
        handleToggleTestMode,
      } = more;

      return (
              <div className="space-y-4 sm:space-y-6">
                {/* Export Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg space-y-4">
                  <div className="flex items-center gap-3">
                    <IconFileSpreadsheet className="text-emerald-400 w-8 h-8" />
                    <div>
                      <h3 className="font-bold text-base sm:text-lg">匯出 Excel / CSV 訂單與商品報表</h3>
                      <p className="text-xs sm:text-sm text-slate-300">內建 UTF-8 防亂碼機制，可直接用 Microsoft Excel 或 Google 試算表開啟。</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExportCSV}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      <IconFileDown size={18} />
                      下載訂單 CSV 報表
                    </button>

                    <button
                      onClick={handleExportProductsExcel}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition flex items-center justify-center gap-2"
                    >
                      <IconFileDown size={18} />
                      下載商品庫與滯銷分析 Excel
                    </button>
                  </div>
                </div>

                {/* [V2.7] Data protection: trash + log */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">🛡️ 資料保護</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    刪除的訂單和商品會先放進回收桶，可以還原；重要操作都會記在日誌裡，改錯的訂單可以還原到修改前。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTrashOpen(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition whitespace-nowrap"
                    >
                      🗑️ 回收桶 ({trashOrders.length + trashProducts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLogOpen(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition whitespace-nowrap"
                    >
                      📒 操作日誌
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRestoreModalOpen(true)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs sm:text-sm rounded-xl border border-red-200 transition whitespace-nowrap"
                    >
                      📥 還原 JSON 備份
                    </button>
                  </div>
                </div>

                {/* [黑名單 v2.12.5] */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">🚫 黑名單管理</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    新增訂單時會依電話/IG/LINE/姓名自動比對，命中會跳出提醒（目前共 {blacklist.length} 筆）。
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsBlacklistOpen(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition whitespace-nowrap"
                  >
                    🚫 管理黑名單 ({blacklist.length})
                  </button>
                </div>

                {/* [v2.14.0] 公版訊息設定入口 */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">💬 公版訊息</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    傳給客人確認訂單的訊息格式：可自訂前綴、後綴與優惠規則。建立訂單後會自動帶出，也可以從訂單卡片上的對話框圖示隨時再開。
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsMessageTemplateOpen(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition whitespace-nowrap"
                  >
                    💬 編輯公版訊息
                  </button>
                </div>

                {/* [V2.12] Shipping & Discount Settings entry */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">⚙️ 運費與折扣設定</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    新增訂單時會依物流方式自動帶入運費；滿額可自動免運。這裡的設定隨時可以自己調整。
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {DELIVERY_METHODS.map(({ key, short }) => (
                      <div key={key} className="bg-slate-50 rounded-lg px-2.5 py-2 text-center">
                        <div className="text-slate-500">{short}</div>
                        <div className="font-bold text-slate-800">${shippingConfig.fees[key]}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {shippingConfig.freeShippingEnabled ? `滿 $${shippingConfig.freeShippingThreshold.toLocaleString()} 免運` : '目前未啟用滿額免運'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsShippingSettingsOpen(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition whitespace-nowrap"
                  >
                    修改設定
                  </button>
                </div>

                {/* [V2.5] Account */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">👤 帳號</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    目前登入：<span className="font-semibold text-slate-700">{user?.email || '（未知）'}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition"
                  >
                    登出
                  </button>
                </div>

                {/* [V2.2] Test Mode entry */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">🧪 測試模式</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    想試匯入 Excel、試建立訂單時，先切到測試模式。測試資料存放在獨立區域，不會混進正式訂單，測完可一鍵清空。
                    {IS_TEST_MODE ? '（你現在就在測試模式）' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleTestMode}
                    className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-xl border transition ${
                      IS_TEST_MODE
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {IS_TEST_MODE ? '回到正式資料' : '進入測試模式'}
                  </button>
                </div>
              </div>
      );
    }
