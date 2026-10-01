    // ==========================================
    // tab-products.js  (v2.14.3 Phase 4)
    // 商品庫分頁畫面（從 app-shell.js 原樣搬出；搜尋/篩選/多選/Grid・List 檢視）
    // 只搬畫面：所有 state 與 handler 仍在 app-shell.js，以 prod 物件傳入；本檔沒有任何 hook
    // 相依：React、Icon* 等全域
    // ==========================================

    // [Phase 4] 商品庫分頁
    function ProductsTab({ prod }) {
      const {
        activeTab, categoriesList, enrichedProducts, filteredProducts,
        handleDeleteProduct, handleDuplicateProduct, handleExportProductsExcel, handleFileUpload,
        handleOpenAddProductModal, handleOpenEditProductModal, handleQuickSelectToOrder, handleSelectAllFilteredProducts,
        handleSelectLatestImportBatch, handleToggleArchiveProduct, productCategoryFilter, productSearch,
        productSelectMode, productStagnantFilter, productViewMode, products,
        selectedProductIds, selectedProductVisibleCount, setConfirmProductBatchDelete, setImageLightboxUrl,
        setProductCategoryFilter, setProductSearch, setProductStagnantFilter, setProductViewMode,
        toggleProductSelectMode, toggleSelectProduct
      } = prod;
      return (
        <>
            {/* Tab 4: Upgraded Product Library V5.1 */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                {/* Control Bar: Search, Category, Stagnant, Actions */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                      <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="搜尋商品名稱、款號、顏色或備註..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                      {productSearch && (
                        <button onClick={() => setProductSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <IconX size={14} />
                        </button>
                      )}
                    </div>

                    {/* Stagnant Filter */}
                    <select
                      value={productStagnantFilter}
                      onChange={(e) => setProductStagnantFilter(e.target.value)}
                      className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">🔍 全部銷售狀態</option>
                      <option value="active">🟢 正常下單商品</option>
                      <option value="warning">⚠️ 半年+ 未銷售警示</option>
                      <option value="critical">⛔ 1年+ 嚴重滯銷警示</option>
                      <option value="archived">📦 已下架歸檔</option>
                    </select>

                    {/* View Switcher & Action Buttons
                        手機：檢視切換整列 + 四顆等寬按鈕（圖示在上、文字在下，不會被擠成直的）
                        桌機：全部排成一列 */}
                    <div className="grid grid-cols-4 gap-2 md:flex md:items-center">
                      <div className="col-span-4 flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => setProductViewMode('grid')}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-semibold whitespace-nowrap ${
                            productViewMode === 'grid' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
                          }`}
                          title="網格卡片視圖"
                        >
                          <IconGrid size={18} />
                          <span className="md:hidden">卡片</span>
                        </button>
                        <button
                          onClick={() => setProductViewMode('list')}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-semibold whitespace-nowrap ${
                            productViewMode === 'list' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
                          }`}
                          title="列表表格視圖"
                        >
                          <IconList size={18} />
                          <span className="md:hidden">列表</span>
                        </button>
                      </div>

                      <button
                        onClick={handleOpenAddProductModal}
                        className="flex flex-col md:flex-row items-center justify-center gap-1 px-2 py-2.5 md:px-3 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] md:text-sm rounded-xl shadow transition whitespace-nowrap"
                      >
                        <IconPlus size={18} />
                        新增商品
                      </button>

                      {/* Excel Import/Export Buttons */}
                      <label className="cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 px-2 py-2.5 md:px-3 md:py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-[11px] md:text-sm rounded-xl shadow transition whitespace-nowrap">
                        <IconDownload size={18} />
                        匯入 Excel
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                      </label>

                      <button
                        onClick={handleExportProductsExcel}
                        className="flex flex-col md:flex-row items-center justify-center gap-1 px-2 py-2.5 md:px-3 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] md:text-sm rounded-xl transition border border-slate-200 whitespace-nowrap"
                        title="匯出 Excel 報表"
                      >
                        <IconUpload size={18} />
                        匯出
                      </button>

                      <button
                        type="button"
                        onClick={toggleProductSelectMode}
                        className={`flex flex-col md:flex-row items-center justify-center gap-1 px-2 py-2.5 md:px-3 md:py-2 font-semibold text-[11px] md:text-sm rounded-xl border transition whitespace-nowrap ${
                          productSelectMode
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                        title="多選刪除"
                      >
                        <IconTrash2 size={18} />
                        {productSelectMode ? '結束多選' : '多選'}
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-2.5">
                    <button
                      onClick={() => setProductCategoryFilter('all')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                        productCategoryFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      全部分類 ({enrichedProducts.length})
                    </button>
                    {categoriesList.map(cat => {
                      const count = enrichedProducts.filter(p => (cat === '未分類' ? (!p.category || p.category === '未分類') : p.category === cat)).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setProductCategoryFilter(cat)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex-shrink-0 flex items-center gap-1 ${
                            productCategoryFilter === cat
                              ? 'bg-emerald-600 text-white shadow-sm font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <IconTag size={12} />
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* [V2.3] Product batch select toolbar */}
                {productSelectMode && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-red-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filteredProducts.length > 0 && selectedProductVisibleCount === filteredProducts.length}
                          onChange={handleSelectAllFilteredProducts}
                          className="w-4 h-4 accent-red-600"
                        />
                        全選目前顯示的 {filteredProducts.length} 項
                      </label>
                      <span className="text-xs sm:text-sm text-red-700 font-bold">已選 {selectedProductVisibleCount} 項</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectLatestImportBatch}
                        className="px-3 py-1.5 bg-white hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs rounded-lg transition"
                      >
                        只選「最近一次匯入」的商品
                      </button>
                      <button
                        type="button"
                        disabled={selectedProductVisibleCount === 0}
                        onClick={() => setConfirmProductBatchDelete(true)}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-lg shadow transition"
                      >
                        刪除所選
                      </button>
                    </div>
                  </div>
                )}

                {/* Products Cards / Table Rendering */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    <IconDatabase size={48} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm sm:text-base font-medium">尚無符合條件的商品資料</p>
                  </div>
                ) : productViewMode === 'grid' ? (
                  /* Grid View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredProducts.map((p) => {
                      const stagnant = getStagnantInfo(p);

                      return (
                        <div
                          key={p.id}
                          onClick={productSelectMode ? () => toggleSelectProduct(p.id) : undefined}
                          className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md relative ${
                            p.status === 'archived' ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200/80'
                          } ${productSelectMode ? 'cursor-pointer select-none' : ''} ${
                            productSelectMode && selectedProductIds.has(p.id) ? 'ring-2 ring-red-400' : ''
                          }`}
                        >
                          {/* [商品圖片 v2.12.9] 卡片橫幅縮圖，僅電腦版顯示 */}
                          <div
                            className={`hidden md:flex h-28 -mx-4 -mt-4 mb-3 rounded-t-2xl overflow-hidden items-center justify-center ${
                              p.imageUrl ? 'bg-slate-100' : 'bg-slate-50 border-b border-dashed border-slate-200'
                            } ${p.imageUrl && !productSelectMode ? 'cursor-zoom-in' : ''}`}
                            onClick={(e) => {
                              if (!p.imageUrl || productSelectMode) return;
                              e.stopPropagation();
                              setImageLightboxUrl(p.imageUrl);
                            }}
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <IconImage size={24} className="text-slate-300" />
                            )}
                          </div>
                          <div className="space-y-2">
                            {/* Header SKU & Category & Stagnant Badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {productSelectMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedProductIds.has(p.id)}
                                    onChange={() => {}}
                                    className="w-5 h-5 accent-red-600 flex-shrink-0 pointer-events-none"
                                  />
                                )}
                                {p.sku && (
                                  <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200">
                                    [{p.sku}]
                                  </span>
                                )}
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">
                                  {p.category || '未分類'}
                                </span>
                              </div>

                              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${stagnant.color}`}>
                                {stagnant.label}
                              </span>
                            </div>

                            {/* Product Name & Price */}
                            <div className="flex items-baseline justify-between pt-1">
                              <h3 className="font-bold text-base text-slate-800 leading-snug">{p.pinned ? '📌 ' : ''}{p.name}</h3>
                              <span className="text-lg font-black text-emerald-600 ml-2">${p.price}</span>
                            </div>

                            {/* Sizes & Colors */}
                            <div className="text-xs space-y-1 text-slate-500 pt-1">
                              <div>
                                <span className="font-semibold text-slate-600">尺寸：</span>
                                {p.sizes || 'F'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-600">款式：</span>
                                {p.colors || '預設'}
                              </div>
                              {p.note && (
                                <div className="text-slate-500 bg-amber-50/70 text-amber-900 p-2 rounded-lg text-xs mt-1 border border-amber-100">
                                  💡 {p.note}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Dates & Action Buttons */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-[11px] text-slate-400 font-mono">
                              建檔: {formatDate(p.createdAt)}
                            </div>

                            <div className={`flex items-center gap-1 ${productSelectMode ? 'hidden' : ''}`}>
                              <button
                                onClick={() => handleQuickSelectToOrder(p)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition"
                                title="快速帶入訂單"
                              >
                                + 帶入訂單
                              </button>
                              <button
                                onClick={() => handleOpenEditProductModal(p)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                                title="編輯商品"
                              >
                                <IconEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDuplicateProduct(p)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                                title="複製商品"
                              >
                                <IconCopy size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleArchiveProduct(p)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                                title={p.status === 'archived' ? '重新上架' : '下架歸檔'}
                              >
                                <IconArchive size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                                title="刪除商品"
                              >
                                <IconTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                  {/* List View：桌機用表格（md 以上） */}
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          {productSelectMode && <th className="p-3 w-8"></th>}
                          <th className="p-3">圖片</th>
                          <th className="p-3">款號</th>
                          <th className="p-3">商品名稱</th>
                          <th className="p-3">分類</th>
                          <th className="p-3">售價</th>
                          <th className="p-3">尺寸 / 顏色</th>
                          <th className="p-3">滯銷與銷售狀態</th>
                          <th className="p-3 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map(p => {
                          const stagnant = getStagnantInfo(p);
                          return (
                            <tr
                              key={p.id}
                              onClick={productSelectMode ? () => toggleSelectProduct(p.id) : undefined}
                              className={`hover:bg-slate-50 transition ${productSelectMode ? 'cursor-pointer select-none' : ''} ${
                                productSelectMode && selectedProductIds.has(p.id) ? 'bg-red-50' : ''
                              }`}
                            >
                              {productSelectMode && (
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedProductIds.has(p.id)}
                                    onChange={() => {}}
                                    className="w-4 h-4 accent-red-600 pointer-events-none"
                                  />
                                </td>
                              )}
                              <td className="p-3">
                                <div
                                  className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden ${p.imageUrl && !productSelectMode ? 'cursor-zoom-in' : ''}`}
                                  onClick={(e) => {
                                    if (!p.imageUrl || productSelectMode) return;
                                    e.stopPropagation();
                                    setImageLightboxUrl(p.imageUrl);
                                  }}
                                >
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <IconImage size={16} className="text-slate-300" />
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-600">{p.sku || '-'}</td>
                              <td className="p-3 font-bold text-slate-800">{p.pinned ? '📌 ' : ''}{p.name}</td>
                              <td className="p-3 text-slate-500">{p.category || '未分類'}</td>
                              <td className="p-3 font-semibold text-slate-900">${p.price}</td>
                              <td className="p-3 text-slate-500 text-xs">{p.sizes} / {p.colors}</td>
                              <td className="p-3">
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${stagnant.color}`}>
                                  {stagnant.label}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className={`flex items-center justify-end gap-1 ${productSelectMode ? 'hidden' : ''}`}>
                                  <button
                                    onClick={() => handleQuickSelectToOrder(p)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs"
                                  >
                                    帶入
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditProductModal(p)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700"
                                  >
                                    <IconEdit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500"
                                  >
                                    <IconTrash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* List View：手機用緊湊列表（md 以下）— 取代 7 欄表格，避免每欄被擠成一字一行 */}
                  <div className="md:hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {filteredProducts.map(p => {
                      const stagnant = getStagnantInfo(p);
                      const isSelected = productSelectMode && selectedProductIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={productSelectMode ? () => toggleSelectProduct(p.id) : undefined}
                          className={`px-3.5 py-3 space-y-1.5 transition ${
                            productSelectMode ? 'cursor-pointer select-none' : ''
                          } ${isSelected ? 'bg-red-50' : ''} ${p.status === 'archived' ? 'opacity-60' : ''}`}
                        >
                          {/* 第 1 行：品名（左） + 售價（右） */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 min-w-0">
                              {productSelectMode && (
                                <input
                                  type="checkbox"
                                  checked={selectedProductIds.has(p.id)}
                                  onChange={() => {}}
                                  className="w-5 h-5 mt-0.5 accent-red-600 pointer-events-none flex-shrink-0"
                                />
                              )}
                              <div className="text-sm font-bold text-slate-800 leading-snug min-w-0">
                                {p.pinned ? '📌 ' : ''}{p.name}
                              </div>
                            </div>
                            <div className="text-base font-black text-emerald-600 flex-shrink-0">${p.price}</div>
                          </div>

                          {/* 第 2 行：款號 · 分類 · 尺寸 · 款式（最多兩行） */}
                          <div className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                            {p.sku && <span className="font-mono font-bold text-emerald-600 mr-1.5">[{p.sku}]</span>}
                            {p.category || '未分類'} · 尺寸 {p.sizes || 'F'} · {p.colors || '預設'}
                          </div>

                          {/* 第 3 行：銷售狀態（左） + 操作（右） */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border min-w-0 truncate ${stagnant.color}`}>
                              {stagnant.label}
                            </span>
                            <div className={`flex items-center gap-0.5 flex-shrink-0 ${productSelectMode ? 'hidden' : ''}`}>
                              <button
                                onClick={() => handleQuickSelectToOrder(p)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs whitespace-nowrap"
                              >
                                帶入訂單
                              </button>
                              <button
                                onClick={() => handleOpenEditProductModal(p)}
                                className="p-1.5 text-slate-400 hover:text-slate-700"
                                title="編輯商品"
                              >
                                <IconEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500"
                                title="刪除商品"
                              >
                                <IconTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </>
                )}
              </div>
            )}
        </>
      );
    }
