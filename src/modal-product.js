    // ==========================================
    // modal-product.js  (v2.14.1 Phase 1)
    // 商品編輯彈窗 / 商品匯入預覽彈窗（從 app-shell.js 原樣搬出，僅改為元件）
    // 相依：React、Icon* 等全域；資料與 handler 一律由 app-shell.js 以 pe / pi 物件傳入
    // ==========================================

    // [Phase 1] 商品新增/編輯彈窗
    function ProductEditModal({ pe }) {
      const { editingProduct, handleProductImageUpload, handleRemoveProductImage, handleSaveProductModal, isProductModalOpen, isUploadingProductImage, setEditingProduct, setImageLightboxUrl, setIsProductModalOpen } = pe;
      return (
        <>
          {/* Edit / Add Product Modal */}
          {isProductModalOpen && editingProduct && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <IconDatabase size={18} className="text-emerald-400" />
                    {editingProduct.id ? '編輯商品資料' : '新增商品至雲端庫'}
                  </h3>
                  <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white">
                    <IconX size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveProductModal} className="p-6 space-y-4">
                  {/* [商品圖片 v2.12.9] 圖片上傳/預覽 */}
                  <div className="flex items-center gap-3 pb-1">
                    <button
                      type="button"
                      onClick={() => editingProduct.imageUrl && setImageLightboxUrl(editingProduct.imageUrl)}
                      className={`w-20 h-20 flex-shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden ${editingProduct.imageUrl ? 'cursor-zoom-in' : ''}`}
                    >
                      {editingProduct.imageUrl ? (
                        <img src={editingProduct.imageUrl} alt="商品預覽" className="w-full h-full object-cover" />
                      ) : (
                        <IconImage size={28} className="text-slate-300" />
                      )}
                    </button>
                    <div className="flex-1 space-y-1.5">
                      <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition ${
                        isUploadingProductImage
                          ? 'bg-slate-100 text-slate-400 opacity-50 pointer-events-none'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}>
                        <IconImage size={16} />
                        {isUploadingProductImage ? '上傳中...' : (editingProduct.imageUrl ? '更換圖片' : '上傳圖片')}
                        <input type="file" accept="image/*" onChange={handleProductImageUpload} disabled={isUploadingProductImage} className="hidden" />
                      </label>
                      {editingProduct.imageUrl && (
                        <button type="button" onClick={handleRemoveProductImage} className="block text-xs text-red-500 hover:text-red-700 font-semibold">
                          移除圖片
                        </button>
                      )}
                      <p className="text-[11px] text-slate-400">上傳後會自動壓縮；手機版商品庫目前還不會顯示圖片。</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">商品款號 (SKU)</label>
                      <input
                        type="text"
                        placeholder="A01"
                        value={editingProduct.sku}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                        className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">商品名稱 *</label>
                      <input
                        type="text"
                        required
                        placeholder="例如：韓系厚磅純棉T恤"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">預設售價 ($)</label>
                      <input
                        type="number"
                        placeholder="390"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">商品分類</label>
                      <select
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
                      >
                        <option value="服飾">服飾</option>
                        <option value="鞋包配飾">鞋包配飾</option>
                        <option value="母嬰用品">母嬰用品</option>
                        <option value="未分類">未分類</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">尺寸選項 (以逗號或斜線隔開)</label>
                    <input
                      type="text"
                      placeholder="S, M, L, XL 或 F"
                      value={editingProduct.sizes}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sizes: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">顏色款式 (以逗號或斜線隔開)</label>
                    <input
                      type="text"
                      placeholder="奶茶色, 黑色, 白色"
                      value={editingProduct.colors}
                      onChange={(e) => setEditingProduct({ ...editingProduct, colors: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">商品備註說明</label>
                    <textarea
                      rows={2}
                      placeholder="例如：版型偏大，建議拿小一號"
                      value={editingProduct.note}
                      onChange={(e) => setEditingProduct({ ...editingProduct, note: e.target.value })}
                      className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.pinned)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, pinned: e.target.checked })}
                      className="w-4 h-4 mt-0.5 accent-emerald-600"
                    />
                    <span>
                      📌 釘選為常用商品
                      <span className="block text-[11px] font-normal text-slate-400">固定顯示在「新增訂單」的常用區最上面</span>
                    </span>
                  </label>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-1"
                    >
                      <IconCheck size={18} />
                      儲存商品
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      );
    }

    // [Phase 1] 商品 Excel 匯入預覽彈窗
    function ProductImportModal({ pi }) {
      const { handleCloseImportModal, handleConfirmBatchImport, importFileName, importHeaders, importOptions, importRawRows, isImportModalOpen, isProductImporting, parsedImportProducts, setImportOptions } = pi;
      return (
        <>
          {/* Import Preview Modal (V2.1.1 智慧歸納) */}
          {isImportModalOpen && (() => {
            const importableCount = parsedImportProducts.filter(p => p.willImport).length;
            const existingCount = parsedImportProducts.filter(p => p.isExisting).length;
            const optionItems = [
              { key: 'autoExtract', title: '⚡ 智慧拆解名稱', desc: '-藏青90 → 顏色藏青 / 尺寸90' },
              { key: 'groupBySeries', title: '📦 歸納同系列規格', desc: '同品名合併多尺寸多顏色' },
              { key: 'smartSort', title: '📐 尺寸智慧排序', desc: 'XS→S→M 或 66→80→90' },
              { key: 'autoCategory', title: '🧠 關鍵字分類推斷', desc: '服飾 / 鞋包配飾 / 母嬰' },
              { key: 'skipExisting', title: '🛡️ 略過已有同名商品', desc: '避免重複匯入' },
              { key: 'importNote', title: '📝 匯入備註欄', desc: '訂購單的備註是訂單備註，通常不用勾' }
            ];

            return (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
                  <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <IconFileSpreadsheet size={18} className="text-emerald-400" />
                        Excel 商品智慧歸納預覽
                      </h3>
                      <p className="text-xs text-slate-300 truncate">
                        {importFileName} · 讀到 {importRawRows.length} 列 → 歸納出 {parsedImportProducts.length} 項商品
                        {existingCount > 0 && `（${existingCount} 項商品庫已有）`}
                      </p>
                    </div>
                    <button type="button" onClick={handleCloseImportModal} className="text-slate-400 hover:text-white">
                      <IconX size={20} />
                    </button>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 border-b border-slate-100 text-xs">
                    {optionItems.map(opt => (
                      <label key={opt.key} className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(importOptions[opt.key])}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                          className="w-4 h-4 mt-0.5 accent-emerald-600 flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">{opt.title}</span>
                          <span className="text-[10px] text-slate-500">{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {parsedImportProducts.length === 0 ? (
                    <div className="p-5">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs sm:text-sm text-red-800 space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <IconAlertTriangle size={18} />
                          找不到「商品名稱」欄位，無法匯入
                        </div>
                        <p>
                          偵測到的欄位標題：
                          <span className="font-mono bg-white border border-red-100 rounded px-1.5 py-0.5 ml-1">
                            {importHeaders.join(' | ') || '（無）'}
                          </span>
                        </p>
                        <p>請確認 Excel 第一列是欄位標題，且其中一欄叫「品項、商品名稱、品名、名稱」之一。</p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-[50vh] overflow-auto">
                      <table className="w-full text-left text-xs text-slate-700 min-w-[640px]">
                        <thead className="bg-slate-100 sticky top-0 font-bold text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">款號</th>
                            <th className="p-2.5">品名</th>
                            <th className="p-2.5">單價</th>
                            <th className="p-2.5">尺寸</th>
                            <th className="p-2.5">顏色 / 款式</th>
                            <th className="p-2.5">分類</th>
                            <th className="p-2.5">狀態</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedImportProducts.map((p, idx) => (
                            <tr key={idx} className={`hover:bg-slate-50 ${p.willImport ? '' : 'opacity-50'}`}>
                              <td className="p-2.5 font-mono text-emerald-600 font-semibold">{p.sku || '-'}</td>
                              <td className="p-2.5 font-bold text-slate-800">{p.name}</td>
                              <td className="p-2.5 font-semibold">${p.price}</td>
                              <td className="p-2.5">
                                <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200 inline-block">{p.sizes}</span>
                              </td>
                              <td className="p-2.5">
                                <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200 inline-block">{p.colors}</span>
                              </td>
                              <td className="p-2.5 text-slate-500">{p.category}</td>
                              <td className="p-2.5">
                                {p.isExisting ? (
                                  <span className="text-[11px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                    {p.willImport ? '已有（仍匯入）' : '已有，略過'}
                                  </span>
                                ) : (
                                  <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">新增</span>
                                )}
                                {p.skuChanged && (
                                  <span className="ml-1 text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">款號已被使用，改編</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      預計匯入 <strong className="text-emerald-600 text-sm">{importableCount}</strong> 項，寫入 Firebase 商品庫
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCloseImportModal}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        disabled={importableCount === 0 || isProductImporting}
                        onClick={handleConfirmBatchImport}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow flex items-center gap-1.5"
                      >
                        <IconCheck size={18} />
                        {isProductImporting ? '寫入中...' : `確認匯入 ${importableCount} 項`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      );
    }
