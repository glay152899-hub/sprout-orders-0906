    // ==========================================
    // tab-orderList.js — 訂單列表分頁（畫面）
    // 從 app-shell.js 抽出，只搬「畫面(JSX)」本身，狀態與商業邏輯仍留在 app-shell.js，
    // 透過單一 `list` 物件把所有需要的資料/狀態/處理函式一次傳入（過渡方案，非最終精緻拆法）。
    // ==========================================
    function OrderListTab({ list }) {
      const {
        orders,
        filteredOrders,
        filteredOrdersTotal,
        orderListStats,
        selectedVisibleCount,
        hasActiveOrderFilter,
        orderDateChips,
        isOrderParsing,
        selectMode,
        searchTerm,
        filterPayment,
        filterShipment,
        filterDelivery,
        filterDate,
        expandedOrders,
        selectedOrderIds,
        setSearchTerm,
        setFilterPayment,
        setFilterShipment,
        setFilterDelivery,
        setExpandedOrders,
        setConfirmBatchDelete,
        setEditingOrder,
        setMessageOrder,
        setConfirmDeleteId,
        handleOrderFileUpload,
        handleExportOrdersExcel,
        toggleSelectMode,
        toggleSelectOrder,
        handleClearOrderFilters,
        handleSelectDateFilter,
        handlePickDate,
        handleSetAllExpanded,
        handleSelectAllFiltered,
        handleSelectExcelImported,
        handleTogglePayment,
        handleToggleShipment,
      } = list;

      return (
              <div className="space-y-3">
                {/* Action Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-slate-800">訂單列表</h2>
                    <p className="hidden sm:block text-xs text-slate-400">Excel 匯入：每個工作表視為一筆訂購單，匯入前可預覽與勾選</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <label
                      title="匯入 Excel 訂單"
                      className={`cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition flex items-center gap-1 whitespace-nowrap ${isOrderParsing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <IconDownload size={15} />
                      {isOrderParsing ? '解析中...' : '匯入訂單'}
                      <input type="file" accept=".xlsx, .xls" onChange={handleOrderFileUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleExportOrdersExcel}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1 whitespace-nowrap"
                      title="匯出目前篩選結果"
                    >
                      <IconUpload size={15} />
                      匯出
                    </button>
                    <button
                      type="button"
                      onClick={toggleSelectMode}
                      className={`px-2.5 py-1.5 sm:px-3 sm:py-2 font-semibold text-xs sm:text-sm rounded-xl border shadow-sm transition flex items-center gap-1 whitespace-nowrap ${
                        selectMode
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                      title="多選刪除"
                    >
                      <IconTrash2 size={15} />
                      {selectMode ? '結束' : '多選'}
                    </button>
                  </div>
                </div>

                {/* Stats：手機一排四格。四格都是「標題 / 數字 / 小字」三行、靠上對齊，看起來才會整齊 */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleClearOrderFilters}
                    className="flex flex-col items-start justify-start text-left bg-white px-2 py-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm transition min-w-0"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-500 leading-4 truncate w-full">總訂單</span>
                    <span className="text-lg sm:text-2xl font-bold text-slate-800 leading-7">{orderListStats.total}</span>
                    <span className="text-[10px] text-slate-400 leading-4 truncate w-full">合計 ${(orderListStats.receivedRevenue + orderListStats.pendingRevenue).toLocaleString()}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPayment(filterPayment === 'unpaid' ? 'all' : 'unpaid')}
                    className={`flex flex-col items-start justify-start text-left bg-white px-2 py-2 sm:p-4 rounded-xl sm:rounded-2xl border shadow-sm transition min-w-0 ${filterPayment === 'unpaid' ? 'border-amber-400 ring-1 ring-amber-300' : 'border-slate-200/80'}`}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-amber-600 leading-4 truncate w-full">未付款</span>
                    <span className="text-lg sm:text-2xl font-bold text-amber-600 leading-7">{orderListStats.unpaidCount}</span>
                    <span className="text-[10px] text-slate-400 leading-4 truncate w-full">待收 ${orderListStats.pendingRevenue.toLocaleString()}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterShipment(filterShipment === 'unshipped' ? 'all' : 'unshipped')}
                    className={`flex flex-col items-start justify-start text-left bg-white px-2 py-2 sm:p-4 rounded-xl sm:rounded-2xl border shadow-sm transition min-w-0 ${filterShipment === 'unshipped' ? 'border-blue-400 ring-1 ring-blue-300' : 'border-slate-200/80'}`}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-blue-600 leading-4 truncate w-full">待出貨</span>
                    <span className="text-lg sm:text-2xl font-bold text-blue-600 leading-7">{orderListStats.unshippedCount}</span>
                    <span className="text-[10px] text-slate-400 leading-4 truncate w-full">已付 {orderListStats.readyToShipCount} 筆</span>
                  </button>
                  <div className="flex flex-col items-start justify-start bg-white px-2 py-2 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-emerald-700 leading-4 truncate w-full">已實收</span>
                    <span className="text-lg sm:text-2xl font-bold text-emerald-700 leading-7 truncate w-full tracking-tight">${orderListStats.receivedRevenue.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 leading-4 truncate w-full">{orderListStats.paidCount} 筆已付</span>
                  </div>
                </div>

                {/* Search Bar & Filters */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-sm space-y-2.5">
                  <div className="relative">
                    <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜尋姓名、電話、LINE/IG、門市、商品..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <IconX size={14} />
                      </button>
                    )}
                  </div>

                  {/* 付款 / 出貨 / 物流：同一排，手機可左右滑動 */}
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                    <div className="flex-shrink-0">
                      <FilterPills
                        value={filterPayment}
                        onChange={setFilterPayment}
                        options={[
                          { key: 'all', label: '全部付款' },
                          { key: 'unpaid', label: '未付款' },
                          { key: 'paid', label: '已付款' }
                        ]}
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <FilterPills
                        value={filterShipment}
                        onChange={setFilterShipment}
                        options={[
                          { key: 'all', label: '全部出貨' },
                          { key: 'unshipped', label: '待出貨' },
                          { key: 'shipped', label: '已出貨' }
                        ]}
                      />
                    </div>
                    <select
                      value={filterDelivery}
                      onChange={(e) => setFilterDelivery(e.target.value)}
                      className="flex-shrink-0 p-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="all">🚚 所有物流</option>
                      <option value="7-11">7-11</option>
                      <option value="全家">全家</option>
                      <option value="宅配">宅配</option>
                    </select>
                  </div>

                  {/* [V2.6] 日期快捷鈕：只列出「有訂單」的日期，點一下就只看那天並自動展開；也可以用最右邊選其他日期 */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <span className="flex-shrink-0 text-[11px] font-semibold text-slate-400">📅</span>
                    <button
                      type="button"
                      onClick={() => handleSelectDateFilter('all')}
                      className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap transition ${
                        filterDate === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      全部日期
                    </button>
                    {orderDateChips.map(chip => (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => handleSelectDateFilter(chip.key)}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap transition ${
                          filterDate === chip.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {chip.label}
                        <span className="opacity-70 ml-0.5">({chip.count})</span>
                      </button>
                    ))}
                    <label className="relative flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border border-dashed border-slate-300 text-slate-500 whitespace-nowrap cursor-pointer">
                      選其他日期
                      <input
                        type="date"
                        value={filterDate !== 'all' ? filterDate : ''}
                        onChange={(e) => handlePickDate(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="text-[11px] sm:text-xs text-slate-400 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <span className="min-w-0 truncate">
                      {filteredOrders.length} / {orders.length} 筆 · 合計 <b className="text-slate-600">${filteredOrdersTotal.toLocaleString()}</b>
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {hasActiveOrderFilter && (
                        <button
                          type="button"
                          onClick={handleClearOrderFilters}
                          className="px-2 py-1 font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition whitespace-nowrap"
                        >
                          清除篩選
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSetAllExpanded(true)}
                        className="px-2 py-1 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition whitespace-nowrap"
                      >
                        全部展開
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllExpanded(false)}
                        className="px-2 py-1 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition whitespace-nowrap"
                      >
                        全部收合
                      </button>
                    </div>
                  </div>
                </div>

                {/* [V2.2] Batch select toolbar */}
                {selectMode && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3 sm:p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-red-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filteredOrders.length > 0 && selectedVisibleCount === filteredOrders.length}
                          onChange={handleSelectAllFiltered}
                          className="w-4 h-4 accent-red-600"
                        />
                        全選目前顯示的 {filteredOrders.length} 筆
                      </label>
                      <span className="text-xs sm:text-sm text-red-700 font-bold">已選 {selectedVisibleCount} 筆</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectExcelImported}
                        className="px-3 py-1.5 bg-white hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs rounded-lg transition"
                      >
                        只選「Excel 匯入」的訂單
                      </button>
                      <button
                        type="button"
                        disabled={selectedVisibleCount === 0}
                        onClick={() => setConfirmBatchDelete(true)}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-lg shadow transition"
                      >
                        刪除所選
                      </button>
                    </div>
                  </div>
                )}

                {/* Orders Cards */}
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    <IconShoppingBag size={48} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm sm:text-base font-medium">尚無符合條件的雲端訂單</p>
                    <p className="text-xs mt-1">可調整篩選條件，或使用上方「匯入 Excel 訂單」</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      // 預設收合；選了某一天的日期時，那天的訂單預設展開。手動點開/收合或按「全部展開/收合」會覆蓋預設。
                      const isExpanded = expandedOrders[order.id] ?? (filterDate !== 'all');
                      const subtotal = calcOrderSubtotal(order);
                      const totalAmount = calcOrderTotal(order);
                      const realItems = order.items.filter(i => !isAdjustmentItem(i));
                      const realItemCount = realItems.length;

                      const dateShort = formatOrderStamp(order); // 日期 + 時間（Excel 匯入的訂單沒有真實時間，只顯示日期）

                      return (
                        <div key={order.id} className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md overflow-hidden transition ${selectMode && selectedOrderIds.has(order.id) ? 'ring-2 ring-red-400' : ''}`}>
                          {/* 第 1 行（收合時也顯示）：姓名 + 付款 / 出貨狀態 */}
                          <div className="px-3.5 pt-3 sm:px-4 sm:pt-4 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {selectMode && (
                                <input
                                  type="checkbox"
                                  checked={selectedOrderIds.has(order.id)}
                                  onChange={() => toggleSelectOrder(order.id)}
                                  className="w-5 h-5 accent-red-600 flex-shrink-0"
                                />
                              )}
                              <span className="font-bold text-sm sm:text-base text-slate-800 truncate">{order.customerName}</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleTogglePayment(order.id, order.paymentStatus)}
                                className={`px-2 py-1 rounded-full text-[11px] sm:text-xs font-bold transition whitespace-nowrap ${
                                  order.paymentStatus
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {order.paymentStatus ? '✓ 已付款' : '✕ 未付款'}
                              </button>

                              <button
                                onClick={() => handleToggleShipment(order.id, order.shipmentStatus)}
                                className={`px-2 py-1 rounded-full text-[11px] sm:text-xs font-bold transition whitespace-nowrap ${
                                  order.shipmentStatus === 'shipped'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {order.shipmentStatus === 'shipped' ? '🚚 已出貨' : '📦 待出貨'}
                              </button>
                            </div>
                          </div>

                          {/* 第 2 行（收合時也顯示）：金額 + 日期，右邊是操作 */}
                          <div className="px-3.5 pb-2.5 pt-1 sm:px-4 sm:pb-3 flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-2 min-w-0">
                              <span className="font-bold text-base sm:text-lg text-emerald-600">${totalAmount}</span>
                              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{dateShort}</span>
                            </div>

                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => setExpandedOrders(p => ({ ...p, [order.id]: !isExpanded }))}
                                className="flex items-center gap-0.5 px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 whitespace-nowrap"
                                title={isExpanded ? '收合明細' : '展開明細'}
                              >
                                {isExpanded ? '收合' : '明細'}
                                {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                              </button>
                              <button
                                onClick={() => setMessageOrder(order)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition"
                                title="產生給客人的確認訊息"
                              >
                                <IconMessageSquare size={18} />
                              </button>
                              <button
                                onClick={() => setEditingOrder(order)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                                title="編輯訂單"
                              >
                                <IconEdit size={18} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(order.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                                title="刪除訂單"
                              >
                                <IconTrash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {/* 展開後才顯示（手機版：維持原本的緊湊排版） */}
                          {isExpanded && (
                            <div className="md:hidden border-t border-slate-100 bg-slate-50/60 px-3.5 py-3 space-y-2 text-xs">
                              {((order.orderNo && !isOrderNoRedundant(order)) || order.customerPhone || order.customerLine || order.customerIg) && (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
                                  {order.orderNo && !isOrderNoRedundant(order) && (
                                    <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                                      📄 {order.orderNo}
                                    </span>
                                  )}
                                  {order.customerPhone && <span className="font-mono">📞 {order.customerPhone}</span>}
                                  {order.customerLine && <span>LINE：<span className="font-semibold">{order.customerLine}</span></span>}
                                  {order.customerIg && <span>IG：<span className="font-semibold">{order.customerIg}</span></span>}
                                </div>
                              )}

                              <div className="flex items-start gap-1.5 text-slate-600">
                                <IconTruck size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                <span>
                                  <span className="font-semibold">{order.deliveryMethod}</span>
                                  <span> - {formatStoreLine(order) || '無門市/地址資訊'}</span>
                                </span>
                              </div>

                              <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200/60">
                                <div className="flex justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-100 pb-1">
                                  <span>商品項目 ({realItemCount} 項)</span>
                                  {/* 欄位寬度需與下方每一列完全相同，數字才會對齊標題 */}
                                  <span className="flex items-baseline flex-shrink-0">
                                    <span className="w-12 text-right">單價</span>
                                    <span className="w-4 text-center">×</span>
                                    <span className="w-6 text-right">數量</span>
                                    <span className="w-4 text-center">=</span>
                                    <span className="min-w-[3.5rem] text-right">小計</span>
                                  </span>
                                </div>
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-slate-700 min-w-0">
                                      {isAdjustmentItem(item) ? (
                                        <span className="font-semibold text-rose-600">🏷️ {item.name}</span>
                                      ) : (
                                        <>
                                          {item.sku && <span className="font-mono text-slate-400 mr-1.5">[{item.sku}]</span>}
                                          {item.name} <span className="text-slate-400">({item.color}/{item.size})</span>
                                        </>
                                      )}
                                    </span>
                                    {isAdjustmentItem(item) ? (
                                      <span className="flex items-baseline flex-shrink-0 tabular-nums">
                                        <span className="min-w-[3.5rem] text-right whitespace-nowrap font-semibold text-rose-600">{item.price * item.qty < 0 ? '- ' : '+ '}${Math.abs(item.price * item.qty)}</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-baseline flex-shrink-0 tabular-nums font-semibold text-slate-800">
                                        <span className="w-12 text-right">${item.price}</span>
                                        <span className="w-4 text-center font-normal text-slate-400">×</span>
                                        <span className="w-6 text-right">{item.qty}</span>
                                        <span className="w-4 text-center font-normal text-slate-400">=</span>
                                        <span className="min-w-[3.5rem] text-right whitespace-nowrap">${item.price * item.qty}</span>
                                      </span>
                                    )}
                                  </div>
                                ))}
                                <div className="flex justify-between text-xs text-slate-500 border-t border-slate-100 pt-1.5">
                                  <span>小計 ${subtotal} + 運費 ${order.shippingFee}</span>
                                  <span className="font-bold text-emerald-600">總計 ${totalAmount}</span>
                                </div>
                              </div>

                              {order.note && (
                                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                                  💬 備註：{order.note}
                                </p>
                              )}
                            </div>
                          )}

                          {/* [V2.10] 展開後：電腦版（md 以上）比照紙本「訂購單」的版面，手機不受影響 */}
                          {isExpanded && (
                            <div className="hidden md:block border-t border-slate-100 bg-white px-6 py-5">
                              <div className="max-w-3xl">
                                <h3 className="text-base font-bold text-slate-800 mb-3">訂購單</h3>

                                {/* 抬頭：顧客姓名 / 手機 / 物流勾選 */}
                                <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-sm text-slate-700">
                                  <span>
                                    <span className="text-slate-500">顧客姓名：</span>
                                    <span className="font-semibold">{order.customerName}</span>
                                    {order.orderNo && !isOrderNoRedundant(order) && (
                                      <span className="ml-2 text-xs text-slate-400 font-mono">({order.orderNo})</span>
                                    )}
                                  </span>
                                  <span>
                                    <span className="text-slate-500">手機：</span>
                                    <span className="font-mono">{order.customerPhone || '＿＿＿＿＿＿'}</span>
                                  </span>
                                  {order.customerLine && (
                                    <span>
                                      <span className="text-slate-500">LINE：</span>
                                      <span className="font-semibold">{order.customerLine}</span>
                                    </span>
                                  )}
                                  {order.customerIg && (
                                    <span>
                                      <span className="text-slate-500">IG：</span>
                                      <span className="font-semibold">{order.customerIg}</span>
                                    </span>
                                  )}
                                  <span className="flex items-center gap-4">
                                    {['7-11', '全家', '宅配'].map(m => (
                                      <span key={m} className={(order.deliveryMethod || '').includes(m) ? 'font-bold text-slate-800' : 'text-slate-400'}>
                                        {(order.deliveryMethod || '').includes(m) ? '☑' : '☐'} {m}
                                      </span>
                                    ))}
                                  </span>
                                </div>
                                <div className="mt-2 text-sm text-slate-700">
                                  <span className="text-slate-500">到貨店家：</span>
                                  <span className="font-semibold">{formatStoreLine(order) || '＿＿＿＿＿＿'}</span>
                                  <span className="ml-8 text-slate-500">建立：</span>
                                  <span className="font-mono text-slate-600">{dateShort}</span>
                                </div>

                                {/* 品項表格 */}
                                <table className="mt-4 w-full text-sm border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-600">
                                      <th className="border border-slate-300 px-2 py-1.5 w-10 font-semibold"></th>
                                      <th className="border border-slate-300 px-3 py-1.5 text-center font-semibold">品項</th>
                                      <th className="border border-slate-300 px-3 py-1.5 w-24 text-center font-semibold">金額</th>
                                      <th className="border border-slate-300 px-3 py-1.5 w-20 text-center font-semibold">數量</th>
                                      <th className="border border-slate-300 px-3 py-1.5 w-28 text-center font-semibold">總金額</th>
                                      <th className="border border-slate-300 px-3 py-1.5 w-40 text-center font-semibold">備註</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, idx) => {
                                      const adj = isAdjustmentItem(item);
                                      return (
                                        <tr key={idx} className={adj ? 'text-rose-600' : 'text-slate-800'}>
                                          <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-500">{idx + 1}</td>
                                          <td className="border border-slate-300 px-3 py-1.5">
                                            {item.name}
                                            {!adj && (item.color || item.size) && (
                                              <span className="text-slate-500">-{item.color}{item.size}</span>
                                            )}
                                          </td>
                                          <td className="border border-slate-300 px-3 py-1.5 text-right tabular-nums">{item.price}</td>
                                          <td className="border border-slate-300 px-3 py-1.5 text-right tabular-nums">{item.qty}</td>
                                          <td className="border border-slate-300 px-3 py-1.5 text-right tabular-nums">{item.price * item.qty}</td>
                                          <td className="border border-slate-300 px-3 py-1.5 text-slate-500">
                                            {adj ? '折抵/內退' : (item.sku || '')}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>

                                {/* 金額 / 運費 / 總計：靠右，對齊表格 */}
                                <div className="mt-3 flex justify-end">
                                  <table className="text-sm">
                                    <tbody>
                                      <tr>
                                        <td className="py-0.5 pr-4 text-right text-slate-500">金額：</td>
                                        <td className="py-0.5 text-right tabular-nums w-28">{subtotal.toLocaleString()} 元</td>
                                      </tr>
                                      <tr>
                                        <td className="py-0.5 pr-4 text-right text-slate-500">運費：</td>
                                        <td className="py-0.5 text-right tabular-nums">{Number(order.shippingFee).toLocaleString()} 元</td>
                                      </tr>
                                      <tr className="border-t border-slate-300">
                                        <td className="py-1 pr-4 text-right font-semibold text-slate-700">總計：</td>
                                        <td className="py-1 text-right font-bold text-emerald-600 tabular-nums">{totalAmount.toLocaleString()} 元</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                {order.note && (
                                  <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                                    備註：{order.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
      );
    }
