    // ==========================================
    // tab-tally.js  (v2.14.1 Phase 1)
    // 理貨清單分頁畫面（從 app-shell.js 原樣搬出）；tallyMatrix 等仍在 app-shell.js 計算
    // ==========================================

    // [Phase 1] 理貨清單分頁
    function TallyTab({ tally }) {
      const { activeTab, handleToggleTallyCheck, tallyChecked, tallyMatrix } = tally;
      return (
        <>
            {/* Tab 3: Picking List */}
            {activeTab === 'tally' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs sm:text-sm text-amber-800 flex items-start gap-3">
                  <IconCheckSquare size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">即時理貨與揀貨模式</span>
                    自動加總所有「待出貨」訂單的商品與數量。點擊卡片即可即時勾銷，多人持手機在倉庫理貨狀態也會即時同步！
                  </div>
                </div>

                {tallyMatrix.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    <IconCheckCircle2 size={48} className="mx-auto mb-3 text-emerald-500 opacity-60" />
                    <p className="text-sm sm:text-base font-medium">太棒了！所有訂單皆已揀貨出貨完成！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tallyMatrix.map((item) => {
                      const isChecked = tallyChecked[item.key] || false;

                      return (
                        <div
                          key={item.key}
                          onClick={() => handleToggleTallyCheck(item.key)}
                          className={`p-4 rounded-2xl border transition cursor-pointer select-none flex flex-col justify-between ${
                            isChecked
                              ? 'bg-slate-100 border-slate-300 opacity-60 line-through'
                              : 'bg-white border-slate-200/80 shadow-sm hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                                isChecked ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-slate-300'
                              }`}>
                                {isChecked && <IconCheck size={16} />}
                              </div>

                              <div>
                                <div className="text-sm sm:text-base font-bold text-slate-800">
                                  {item.sku && <span className="font-mono text-emerald-600 mr-1.5">[{item.sku}]</span>}
                                  {item.name}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-500">
                                  款式：<span className="font-semibold text-slate-700">{item.color || '預設'}</span> | 尺寸：<span className="font-semibold text-slate-700">{item.size}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs text-slate-400 block">總需求</span>
                              <span className="text-lg sm:text-xl font-black text-amber-600">{item.totalQty} 件</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {item.buyers.map((b, idx) => (
                              <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {b.customerName} x{b.qty}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
        </>
      );
    }
