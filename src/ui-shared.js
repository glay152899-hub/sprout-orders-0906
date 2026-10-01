    // ==========================================
    // [V2.1] 訂單列表升級：小元件
    // ==========================================
    function FilterPills({ value, onChange, options }) {
      return (
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
          {options.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                value === opt.key ? 'bg-white text-slate-800 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    // 編輯訂單 Modal（欄位對應主程式資料結構）
    function OrderEditModal({ order, onClose, onSave }) {
      const storeParts = deriveStoreDisplay(order);
      const [form, setForm] = React.useState(() => ({
        orderNo: order.orderNo || '',
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        customerLine: order.customerLine || '',
        customerIg: order.customerIg || '',
        deliveryMethod: order.deliveryMethod || '7-11 取貨付款',
        storeName: storeParts.name,
        storeAddress: storeParts.address, // [v2.13.0新增] 若是舊資料，這裡已經用括號規則拆過一次，存檔時就會變成新格式
        shippingFee: order.shippingFee,
        paymentStatus: Boolean(order.paymentStatus),
        shipmentStatus: order.shipmentStatus || 'unshipped',
        note: order.note || '',
        items: (order.items || []).map(i => ({ ...i }))
      }));
      const [error, setError] = React.useState('');

      const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

      const handleItemChange = (index, field, value) => {
        setForm(prev => {
          const items = [...prev.items];
          items[index] = { ...items[index], [field]: value };
          return { ...prev, items };
        });
      };

      const handleAddItem = () => {
        setForm(prev => ({
          ...prev,
          items: [
            ...prev.items,
            {
              id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              sku: '', name: '', color: '', size: 'F', price: 0, qty: 1
            }
          ]
        }));
      };

      const handleRemoveItem = (index) => {
        setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
      };

      const previewOrder = { items: form.items, shippingFee: form.shippingFee };
      const previewSubtotal = calcOrderSubtotal(previewOrder);
      const previewTotal = calcOrderTotal(previewOrder);

      const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.customerName.trim()) { setError('請輸入顧客姓名'); return; }
        if (form.items.length === 0) { setError('請至少保留一項商品'); return; }
        if (form.items.some(i => !String(i.name || '').trim())) { setError('商品名稱不可空白'); return; }

        onSave(order, {
          orderNo: form.orderNo.trim(),
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerLine: form.customerLine.trim(),
          customerIg: form.customerIg.trim(),
          deliveryMethod: form.deliveryMethod,
          storeName: form.storeName.trim(),
          storeAddress: form.storeAddress.trim(),
          shippingFee: Number(form.shippingFee) || 0,
          paymentStatus: Boolean(form.paymentStatus),
          shipmentStatus: form.shipmentStatus,
          note: form.note.trim(),
          items: form.items.map(sanitizeItem)
        });
      };

      const inputCls = "w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white";
      const miniInputCls = "w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-emerald-500";

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <IconEdit size={18} className="text-emerald-400" />
                編輯訂單
                {form.orderNo && (
                  <span className="text-[11px] bg-emerald-700 text-emerald-100 px-2 py-0.5 rounded-full font-semibold">{form.orderNo}</span>
                )}
              </h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">顧客姓名 *</label>
                  <input type="text" value={form.customerName} onChange={(e) => setField('customerName', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">手機號碼</label>
                  <input type="tel" value={form.customerPhone} onChange={(e) => setField('customerPhone', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">LINE ID / 暱稱</label>
                  <input type="text" placeholder="例如：mei_0912" value={form.customerLine} onChange={(e) => setField('customerLine', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">IG 帳號</label>
                  <input type="text" placeholder="例如：mei.shop" value={form.customerIg} onChange={(e) => setField('customerIg', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">單號 / 工作表名稱</label>
                  <input type="text" placeholder="選填，例如 0901林 涔" value={form.orderNo} onChange={(e) => setField('orderNo', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">配送方式</label>
                  <select value={form.deliveryMethod} onChange={(e) => setField('deliveryMethod', e.target.value)} className={inputCls}>
                    {DELIVERY_METHODS.map(({ key }) => <option key={key} value={key}>{key}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    門市名稱{form.deliveryMethod === '宅配到府' && <span className="text-slate-400 font-normal">（選填）</span>}
                  </label>
                  <input type="text" value={form.storeName} onChange={(e) => setField('storeName', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    {form.deliveryMethod === '宅配到府' ? '宅配地址' : '門市地址'}{form.deliveryMethod !== '宅配到府' && <span className="text-slate-400 font-normal">（選填）</span>}
                  </label>
                  <input type="text" value={form.storeAddress} onChange={(e) => setField('storeAddress', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">運費 ($)</label>
                <input type="number" value={form.shippingFee} onChange={(e) => setField('shippingFee', e.target.value)} className={inputCls} />
              </div>

              {/* 商品明細 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">訂購商品明細 ({form.items.length})</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition flex items-center gap-1"
                  >
                    <IconPlus size={14} />
                    新增商品
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/70">
                  {form.items.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4">目前沒有商品，請點擊「新增商品」</p>
                  )}
                  {form.items.map((item, idx) => (
                    <div key={item.id || idx} className="bg-white p-2.5 rounded-lg border border-slate-200/70 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="商品名稱（折抵/內退請填負數單價）"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className={miniInputCls + ' flex-1 font-semibold'}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                          title="移除此商品"
                        >
                          <IconTrash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                        <div>
                          <label className="text-[10px] text-slate-400 block">款號</label>
                          <input type="text" value={item.sku} onChange={(e) => handleItemChange(idx, 'sku', e.target.value)} className={miniInputCls} />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">顏色</label>
                          <input type="text" value={item.color} onChange={(e) => handleItemChange(idx, 'color', e.target.value)} className={miniInputCls} />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">尺寸</label>
                          <input type="text" value={item.size} onChange={(e) => handleItemChange(idx, 'size', e.target.value)} className={miniInputCls} />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">單價</label>
                          <input type="number" value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} className={miniInputCls} />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block">數量</label>
                          <input type="number" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} className={miniInputCls} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
                <span className="text-xs text-slate-400">小計 ${previewSubtotal} + 運費 ${Number(form.shippingFee) || 0}</span>
                <span className="text-lg font-bold text-emerald-400">${previewTotal}</span>
              </div>

              <div className="flex items-center gap-6 py-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.paymentStatus} onChange={(e) => setField('paymentStatus', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  已付款
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.shipmentStatus === 'shipped'}
                    onChange={(e) => setField('shipmentStatus', e.target.checked ? 'shipped' : 'unshipped')}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  已出貨
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">訂單備註</label>
                <textarea rows={2} value={form.note} onChange={(e) => setField('note', e.target.value)} className={inputCls} />
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <IconAlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="pt-1 flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition">
                  取消
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-1">
                  <IconCheck size={18} />
                  儲存變更
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // [V2.8] 匯入的訂單要用什麼狀態？（Excel 裡沒有付款、出貨資訊，由使用者在預覽時指定）
    const ORDER_IMPORT_STATUS = {
      pending: { key: 'pending', label: '待處理', desc: '未付款、待出貨（新的訂單）', paymentStatus: false, shipmentStatus: 'unshipped' },
      shipped: { key: 'shipped', label: '已出貨', desc: '未付款（等客人取貨）', paymentStatus: false, shipmentStatus: 'shipped' },
      done: { key: 'done', label: '已完成', desc: '已付款、已出貨（舊訂單歸檔）', paymentStatus: true, shipmentStatus: 'shipped' }
    };

    // 訂單 Excel 匯入預覽 Modal（可勾選、標示重複單號 / 已對齊 Excel 總計）
    function OrderImportPreviewModal({ drafts, existingOrderNos, existingOrders, trashOrderNos, isSaving, onClose, onConfirm }) {
      const [statusKey, setStatusKey] = React.useState('pending');
      // [v2.14.4] 分頁名只有 MMDD（沒有年份）時，讓使用者在預覽時指定年份；'' = 自動判斷（今年，太晚則算去年）
      const [assumedYear, setAssumedYear] = React.useState('');
      const needsYearChoice = React.useMemo(
        () => drafts.some(d => d.yearSource === 'mmdd-guessed' || d.yearSource === 'mmdd-chosen'),
        [drafts]
      );
      const yearOptions = React.useMemo(() => {
        const y = new Date().getFullYear();
        return [y + 1, y, y - 1, y - 2, y - 3];
      }, []);
      const shownDrafts = React.useMemo(
        () => drafts.map(d => resolveDraftTimestamp(d, assumedYear)),
        [drafts, assumedYear]
      );

      const rows = React.useMemo(() => {
        // 現有訂單的「簽章」（同客人 + 同商品 + 同金額），用來找出疑似已存在的訂單
        const sigMap = new Map();
        (existingOrders || []).forEach(o => {
          const s = orderSignature(o);
          if (!sigMap.has(s)) sigMap.set(s, o);
        });

        return shownDrafts.map((d, idx) => {
          const computed = calcOrderTotal(d);
          const isDuplicate = Boolean(d.orderNo) && existingOrderNos.has(d.orderNo);
          return {
            idx,
            d,
            computed,
            isDuplicate,                                                          // 單號已存在
            similar: isDuplicate ? null : (sigMap.get(orderSignature(d)) || null), // 單號不同，但客人、商品、金額都一樣
            inTrash: Boolean(d.orderNo) && Boolean(trashOrderNos) && trashOrderNos.has(d.orderNo), // 回收桶裡有同單號
            isEmpty: d.items.length === 0,
            adjustLine: d.items.find(i => i.sku === ADJUSTMENT_SKU) || null
          };
        });
      }, [shownDrafts, existingOrderNos, existingOrders, trashOrderNos]);

      const [selected, setSelected] = React.useState(
        () => new Set(rows.filter(r => !r.isDuplicate && !r.similar && !r.isEmpty).map(r => r.idx))
      );

      const toggleOne = (idx) => {
        setSelected(prev => {
          const next = new Set(prev);
          if (next.has(idx)) next.delete(idx);
          else next.add(idx);
          return next;
        });
      };

      const importableIdx = rows.filter(r => !r.isEmpty).map(r => r.idx);
      const allChecked = importableIdx.length > 0 && importableIdx.every(i => selected.has(i));
      const toggleAll = () => {
        setSelected(allChecked ? new Set() : new Set(importableIdx));
      };

      const duplicateCount = rows.filter(r => r.isDuplicate || r.similar).length;
      const adjustedCount = rows.filter(r => r.adjustLine).length;
      const selectedTotal = rows.filter(r => selected.has(r.idx)).reduce((s, r) => s + r.computed, 0);

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <IconFileSpreadsheet size={18} className="text-emerald-400" />
                  Excel 訂單匯入預覽
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  解析出 {rows.length} 筆訂購單
                  {duplicateCount > 0 && `，${duplicateCount} 筆可能重複`}
                  {adjustedCount > 0 && `，${adjustedCount} 筆已自動對齊 Excel 總計`}
                </p>
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
                <IconX size={20} />
              </button>
            </div>

            {needsYearChoice && (
              <div className="px-4 pt-3 space-y-1.5">
                <div className="text-xs font-bold text-slate-600">訂單年份</div>
                <div className="flex items-center gap-2">
                  <select
                    value={assumedYear}
                    onChange={(e) => setAssumedYear(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">自動判斷（今年；日期比今天晚就算去年）</option>
                    {yearOptions.map(y => <option key={y} value={y}>{y} 年</option>)}
                  </select>
                </div>
                <p className="text-[11px] text-amber-700 leading-snug">
                  有些工作表名稱只有月日（例如 0703），沒有年份。請確認下面每筆的 📅 日期是否正確；分頁名稱自帶年份的（例如 20260703 或民國 1140703）不受這個選項影響。
                </p>
              </div>
            )}

            <div className="px-4 pt-3 space-y-1.5">
              <div className="text-xs font-bold text-slate-600">匯入後的訂單狀態</div>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.values(ORDER_IMPORT_STATUS).map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setStatusKey(opt.key)}
                    className={`text-left px-2.5 py-2 rounded-xl border transition ${
                      statusKey === opt.key ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span className="block text-[10px] leading-tight opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-emerald-600" />
                全選 / 取消全選
              </label>
              <span className="text-slate-400">可能重複的預設不勾選</span>
            </div>

            <div className="p-4 pt-2 max-h-[55vh] overflow-y-auto space-y-2">
              {rows.map(r => (
                <div
                  key={r.idx}
                  className={`rounded-xl border p-3 text-xs sm:text-sm transition ${
                    selected.has(r.idx) ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'
                  } ${r.isEmpty ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      disabled={r.isEmpty}
                      checked={selected.has(r.idx)}
                      onChange={() => toggleOne(r.idx)}
                      className="w-4 h-4 mt-1 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-800">{r.d.customerName}</span>
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">📄 {r.d.orderNo}</span>
                        {r.isDuplicate && <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">單號已存在</span>}
                        {r.similar && <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">疑似已存在（{formatOrderStamp(r.similar)} 建立）</span>}
                        {r.inTrash && <span className="text-[11px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">回收桶有同單號</span>}
                        {r.isEmpty && <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">無商品</span>}
                        {r.adjustLine && <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">含差額調整</span>}
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                        {r.d.orderTimestamp ? `📅 ${new Date(r.d.orderTimestamp).toLocaleDateString('zh-TW')}` : '📅 匯入當天'}{(r.d.yearSource === 'mmdd-guessed' || r.d.yearSource === 'mmdd-chosen') && <span className="ml-1 text-amber-600">（年份{r.d.yearSource === 'mmdd-chosen' ? '已指定' : '自動判斷'}）</span>} · {r.d.customerPhone || '無電話'} · {r.d.deliveryMethod} · {r.d.storeName || '無門市資訊'}
                      </div>

                      <div className="mt-2 space-y-0.5 text-[11px] sm:text-xs text-slate-600">
                        {r.d.items.map((it, i) => (
                          <div key={i} className="flex justify-between gap-2">
                            <span className="truncate">
                              • {it.name}
                              {!isAdjustmentItem(it) && (it.color !== '預設' || it.size !== 'F') && (
                                <span className="text-slate-400"> ({it.color}/{it.size})</span>
                              )}
                            </span>
                            <span className="font-mono flex-shrink-0">
                              {isAdjustmentItem(it) ? (
                                <span className="text-rose-600 font-bold">{it.price < 0 ? '-' : '+'}${Math.abs(it.price)}</span>
                              ) : (
                                <>${it.price} × {it.qty}</>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">運費 ${r.d.shippingFee}</span>
                        <span className="font-bold text-emerald-600">總計 ${r.computed}</span>
                      </div>
                      {r.adjustLine && (
                        <p className="mt-1 text-[11px] text-amber-700">
                          Excel 內的總計為 ${r.d.excelTotal}，與明細加總不同（常見原因：折扣或小數），
                          已加入一行 {r.adjustLine.price < 0 ? '-' : '+'}${Math.abs(r.adjustLine.price)} 的調整，讓總計與 Excel 一致。匯入後可用「編輯」修改。
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                已選 {selected.size} / {rows.length} 筆 · 合計 ${selectedTotal}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition">
                  取消
                </button>
                <button
                  type="button"
                  disabled={selected.size === 0 || isSaving}
                  onClick={() => onConfirm(rows.filter(r => selected.has(r.idx)).map(r => r.d), statusKey)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow flex items-center gap-1.5"
                >
                  <IconCheck size={18} />
                  {isSaving ? '寫入中...' : `確認匯入 ${selected.size} 筆`}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // [V2.4] 快速帶入：商品晶片（可選取 / 單一規格可一鍵＋）
    // ==========================================
    // ==========================================
    // [V2.12] 運費與折扣設定視窗（老婆可以自己改，不用透過開發者）
    // ==========================================
    function ShippingSettingsModal({ config, isSaving, onSave, onClose }) {
      const [form, setForm] = React.useState(() => ({ ...config, fees: { ...config.fees } }));
      const [error, setError] = React.useState('');

      const setFee = (key, val) => setForm(prev => ({ ...prev, fees: { ...prev.fees, [key]: val } }));

      const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        for (const { key, short } of DELIVERY_METHODS) {
          const v = Number(form.fees[key]);
          if (!Number.isFinite(v) || v < 0) { setError(`「${short}」的運費請輸入 0 以上的數字`); return; }
        }
        if (form.freeShippingEnabled) {
          const t = Number(form.freeShippingThreshold);
          if (!Number.isFinite(t) || t < 0) { setError('免運門檻請輸入 0 以上的數字'); return; }
        }
        onSave({
          fees: Object.fromEntries(DELIVERY_METHODS.map(({ key }) => [key, Math.round(Number(form.fees[key]))])),
          freeShippingEnabled: Boolean(form.freeShippingEnabled),
          freeShippingThreshold: Math.round(Number(form.freeShippingThreshold) || 0)
        });
      };

      const inputCls = "w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white";

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">⚙️ 運費與折扣設定</h3>
                <p className="text-[11px] text-slate-400">新增訂單時會依物流方式自動帶入，之後仍可手動修改</p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <IconX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-600 block">各物流方式的運費</label>
                {DELIVERY_METHODS.map(({ key, short }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-14 flex-shrink-0 text-sm font-semibold text-slate-700">{short}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        value={form.fees[key]}
                        onChange={(e) => setFee(key, e.target.value)}
                        className={inputCls + ' pl-7'}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3.5 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.freeShippingEnabled}
                    onChange={(e) => setForm(prev => ({ ...prev, freeShippingEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-slate-600">滿額免運</span>
                </label>
                {form.freeShippingEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 flex-shrink-0">訂單小計滿</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        value={form.freeShippingThreshold}
                        onChange={(e) => setForm(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
                        className={inputCls + ' pl-7'}
                      />
                    </div>
                    <span className="text-sm text-slate-600 flex-shrink-0">免運費</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  免運不含商品折抵金額；以商品小計（不含運費）判斷。
                </p>
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <IconAlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition">
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-1"
                >
                  <IconCheck size={18} />
                  {isSaving ? '儲存中...' : '儲存設定'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    function QuickPickChip({ product, selected, badge, note, mobileHidden, onSelect, onQuickAdd }) {
      const canQuickAdd = isSingleVariantProduct(product);
      // 手機：一行一個的緊湊列表（品名在左、價格在右）；桌機：兩欄卡片（品名、價格 | 款號 | 備註）
      return (
        <div
          className={`${mobileHidden ? 'hidden md:flex' : 'flex'} items-stretch rounded-xl border overflow-hidden transition ${
            selected
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          <button
            type="button"
            onClick={() => onSelect(product)}
            className="flex-1 min-w-0 text-left px-3 py-2.5 md:py-2 flex items-center justify-between gap-3 md:block"
          >
            <div className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 min-w-0">
              {badge ? `${badge} ` : ''}{product.name}
            </div>
            <div className={`text-xs md:text-[11px] font-semibold md:font-normal flex-shrink-0 md:mt-0.5 ${selected ? 'text-emerald-100' : 'text-slate-500'}`}>
              ${product.price}
              <span className="hidden md:inline">{product.sku ? ` | ${product.sku}` : ''}{note ? ` | ${note}` : ''}</span>
            </div>
          </button>
          {canQuickAdd && (
            <button
              type="button"
              onClick={() => onQuickAdd(product)}
              title="直接加入 1 件"
              className={`px-3.5 border-l font-black text-lg leading-none ${
                selected
                  ? 'border-emerald-500 bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'border-slate-200 bg-white hover:bg-emerald-50 text-emerald-600'
              }`}
            >
              +
            </button>
          )}
        </div>
      );
    }

    // 全部商品：從畫面底部滑出的選擇面板（搜尋 + 分類 + 釘選）
    function ProductPickerPanel({ products, scores, recent, categories, initialSearch, selectedId, onSelect, onTogglePin, onClose }) {
      const [search, setSearch] = React.useState(initialSearch || '');
      const [category, setCategory] = React.useState('all');

      const rows = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        return products.filter(p => {
          const matchCategory =
            category === 'all' ? true :
            category === '未分類' ? (!p.category || p.category === '未分類') :
            p.category === category;
          const matchSearch = !q || [p.name, p.sku, p.colors, p.sizes, p.note, p.category]
            .some(v => String(v || '').toLowerCase().includes(q));
          return matchCategory && matchSearch;
        });
      }, [products, search, category]);

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">選擇商品</h3>
                <p className="text-[11px] text-slate-400">已依 📌 釘選、🔥 近期熱銷排序 · 已排除下架商品</p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <IconX size={22} />
              </button>
            </div>

            <div className="px-4 pt-3 space-y-2.5">
              <div className="relative">
                <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜尋商品名稱、款號、顏色..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <IconX size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['all', ...categories].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold flex-shrink-0 transition ${
                      category === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? '全部' : cat}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-400">共 {rows.length} 項</div>
            </div>

            <div className="flex-1 overflow-y-auto border-t border-slate-100 mt-1">
              {rows.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-12">找不到符合的商品</div>
              ) : rows.map(p => {
                const isHot = (scores[p.id] || 0) >= QUICK_PICK_MIN_SCORE;
                const recentQty = recent[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center border-b border-slate-100 ${selectedId === p.id ? 'bg-emerald-50' : ''}`}
                  >
                    <button type="button" onClick={() => onSelect(p)} className="flex-1 min-w-0 text-left px-4 py-3 active:bg-slate-100">
                      <div className="text-sm font-bold text-slate-800 leading-snug">
                        {p.pinned ? '📌 ' : ''}{!p.pinned && isHot ? '🔥 ' : ''}{p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ${p.price} · {p.sku || '無款號'} · {p.category || '未分類'} · 尺寸 {p.sizes}
                        {recentQty > 0 ? ` · 近${QUICK_PICK_RECENT_DAYS}天 ${recentQty} 件` : ''}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onTogglePin(p)}
                      title={p.pinned ? '取消釘選' : '釘選到常用區'}
                      className={`p-3 mr-1 rounded-lg ${p.pinned ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}
                    >
                      <IconStar size={20} filled={Boolean(p.pinned)} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }


    // ==========================================
    // [V2.7] 回收桶視窗：還原 / 永久刪除
    // ==========================================
    function TrashModal({ trashOrders, trashProducts, orders, products, onRestore, onPurge, onPurgeAll, onClose }) {
      const [tab, setTab] = React.useState('orders');
      const list = tab === 'orders' ? trashOrders : trashProducts;

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">🗑️ 回收桶</h3>
                <p className="text-[11px] text-slate-400">刪除的資料會先放在這裡，按「還原」就會回到原本的位置</p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <IconX size={22} />
              </button>
            </div>

            <div className="px-4 pt-3 flex items-center gap-2">
              {[
                { key: 'orders', label: `訂單 (${trashOrders.length})` },
                { key: 'products', label: `商品 (${trashProducts.length})` }
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    tab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto mt-2 border-t border-slate-100">
              {list.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-12">
                  {tab === 'orders' ? '沒有已刪除的訂單' : '沒有已刪除的商品'}
                </div>
              ) : list.map(item => (
                <div key={item.id} className="px-4 py-3 border-b border-slate-100 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 leading-snug break-words">
                        {tab === 'orders' ? item.customerName : item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {tab === 'orders'
                          ? `${(item.items || []).filter(i => !isAdjustmentItem(i)).length} 項商品 · ${item.deliveryMethod} · 建立 ${formatOrderStamp(item)}`
                          : `${item.sku || '無款號'} · ${item.category || '未分類'} · 尺寸 ${item.sizes}`}
                      </div>
                    </div>
                    <div className="text-base font-black text-emerald-600 flex-shrink-0">
                      ${tab === 'orders' ? calcOrderTotal(item) : item.price}
                    </div>
                  </div>
                  {(() => {
                    const dup = tab === 'orders' ? findDuplicateOrder(item, orders) : findDuplicateProduct(item, products);
                    return dup ? (
                      <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 leading-snug">
                        ⚠️ {tab === 'orders'
                          ? `目前已有相同的訂單（${formatOrderStamp(dup)} 建立），還原後會變成兩筆`
                          : '目前已有同名的商品，還原後會有兩個同名商品'}
                      </div>
                    ) : null;
                  })()}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      刪除於 {formatLogTime(item.deletedAt)} · {shortUser(item.deletedBy)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onRestore(tab, item)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs whitespace-nowrap"
                      >
                        ♻️ 還原
                      </button>
                      <button
                        type="button"
                        onClick={() => onPurge(tab, item)}
                        className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs whitespace-nowrap"
                      >
                        永久刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">回收桶的資料不會自動清除</span>
              <button
                type="button"
                disabled={trashOrders.length + trashProducts.length === 0}
                onClick={onPurgeAll}
                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg whitespace-nowrap"
              >
                清空回收桶
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // [黑名單] 手動新增彈窗
    // ==========================================
    function BlacklistAddModal({ initialDraft, blacklist, isSaving, onSave, onClose }) {
      const [form, setForm] = React.useState(() => ({
        name: initialDraft?.name || '',
        phone: initialDraft?.phone || '',
        ig: initialDraft?.ig || '',
        line: initialDraft?.line || '',
        reason: initialDraft?.reason || '',
        sourceOrderNo: initialDraft?.sourceOrderNo || '',
      }));
      const [error, setError] = React.useState('');

      const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
      const duplicate = findBlacklistDuplicate(form, blacklist);

      const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!form.phone.trim() && !form.ig.trim() && !form.line.trim()) {
          setError('電話、IG、LINE 請至少填一項，單靠姓名無法有效比對');
          return;
        }
        onSave({
          name: form.name.trim(),
          phone: form.phone.trim(),
          ig: form.ig.trim(),
          line: form.line.trim(),
          reason: form.reason.trim(),
          sourceOrderNo: form.sourceOrderNo.trim(),
        });
      };

      const inputCls = "w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white";

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">🚫 新增黑名單</h3>
                <p className="text-[11px] text-slate-400">建立訂單時會依電話/IG/LINE/姓名自動比對提醒</p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <IconX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">姓名（選填）</label>
                <input type="text" placeholder="例如：王小美" value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">電話</label>
                <input type="text" placeholder="例如：0912345678" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">IG</label>
                <input type="text" placeholder="例如：mei.shop" value={form.ig} onChange={(e) => setField('ig', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">LINE</label>
                <input type="text" placeholder="例如：mei_0912" value={form.line} onChange={(e) => setField('line', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">原因（選填）</label>
                <textarea rows={2} placeholder="例如：多次未取貨棄單" value={form.reason} onChange={(e) => setField('reason', e.target.value)} className={inputCls + ' resize-none'} />
              </div>

              {duplicate && (
                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-snug flex items-start gap-1.5">
                  <IconAlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>黑名單裡已有電話/IG/LINE相符的紀錄（{duplicate.name || '未填姓名'}），仍可繼續新增（例如原因不同想分開記錄）</span>
                </div>
              )}
              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <IconAlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition">
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-1"
                >
                  <IconCheck size={18} />
                  {isSaving ? '儲存中...' : '加入黑名單'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // ==========================================
    // [黑名單] 清單管理彈窗（移除不走回收桶：資料量小、可隨時重新輸入，見交接文件說明）
    // ==========================================
    function BlacklistModal({ blacklist, onAdd, onDelete, onClose }) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">🚫 黑名單管理（{blacklist.length}）</h3>
                <p className="text-[11px] text-slate-400">新增訂單時會自動比對，命中會跳出提醒</p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <IconX size={22} />
              </button>
            </div>

            <div className="px-4 pt-3">
              <button
                type="button"
                onClick={onAdd}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5"
              >
                <IconPlus size={16} /> 手動新增黑名單
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-2 border-t border-slate-100">
              {blacklist.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-12">目前沒有黑名單紀錄</div>
              ) : blacklist.map((entry) => (
                <div key={entry.id} className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 leading-snug break-words">
                        {entry.name || '（未填姓名）'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 break-words">
                        {[entry.phone, entry.ig && `IG:${entry.ig}`, entry.line && `LINE:${entry.line}`].filter(Boolean).join(' · ') || '無聯絡資訊'}
                      </div>
                      {entry.reason && (
                        <div className="text-[11px] text-slate-400 mt-1 break-words">原因：{entry.reason}</div>
                      )}
                      {entry.sourceOrderNo && (
                        <div className="text-[11px] text-slate-400 mt-0.5">來源訂單：{entry.sourceOrderNo}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(entry)}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // [v2.13.5] 還原JSON備份：讀取本機JSON檔案，合併寫回Firebase
    // 流程：選檔案 → 預覽勾選要還原哪些節點 → 重新輸入密碼驗證身分 → 還原前自動下載目前資料當「還原點」→ 合併寫入
    // 安全設計：
    // 1. 只認 RESTORE_ALLOWED_NODES 白名單裡的檔名，避免選錯檔案寫進不相關的路徑
    // 2. 用 Firebase Auth 的 reauthenticateWithCredential 真的重新驗證密碼，不是前端自己比對
    // 3. 寫入用 update()（合併），不會刪除節點裡沒被提到的其他既有資料
    // 4. 動手寫入前，一定先把「現在」的資料下載一份，讓使用者手上永遠留著還原前的版本
    // ==========================================
    function RestoreBackupModal({ onConfirm, onClose }) {
      const [step, setStep] = React.useState('pick'); // pick → preview → password → working → done
      const [parsedFiles, setParsedFiles] = React.useState([]); // [{node,label,filename,data,count}]
      const [unrecognized, setUnrecognized] = React.useState([]); // 選到但認不出檔名的檔案
      const [selectedNodes, setSelectedNodes] = React.useState(() => new Set());
      const [password, setPassword] = React.useState('');
      const [error, setError] = React.useState('');
      const [resultSummary, setResultSummary] = React.useState(null);
      const fileInputRef = React.useRef(null);

      const handleFiles = async (fileList) => {
        setError('');
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const nextParsed = [];
        const nextUnrecognized = [];

        for (const file of files) {
          const match = RESTORE_ALLOWED_NODES.find(
            (n) => n.filename.toLowerCase() === file.name.toLowerCase()
          );
          if (!match) {
            nextUnrecognized.push(file.name);
            continue;
          }
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (typeof data !== 'object' || data === null || Array.isArray(data)) {
              nextUnrecognized.push(`${file.name}（內容格式不是預期的物件，已略過）`);
              continue;
            }
            nextParsed.push({
              node: match.key,
              label: match.label,
              filename: file.name,
              data,
              count: Object.keys(data).length
            });
          } catch (err) {
            nextUnrecognized.push(`${file.name}（不是有效的JSON檔案，已略過）`);
          }
        }

        if (nextParsed.length === 0) {
          setError('沒有辨識出任何可還原的檔案，請確認檔名是否為 orders.json／products.json／blacklist.json／settings.json／trash.json／logs.json 其中之一');
          setUnrecognized(nextUnrecognized);
          return;
        }

        setParsedFiles(nextParsed);
        setUnrecognized(nextUnrecognized);
        setSelectedNodes(new Set(nextParsed.map((p) => p.node))); // 預設全選
        setStep('preview');
      };

      const toggleNode = (node) => {
        setSelectedNodes((prev) => {
          const next = new Set(prev);
          if (next.has(node)) next.delete(node); else next.add(node);
          return next;
        });
      };

      const handleConfirmPassword = async () => {
        if (!password) {
          setError('請輸入密碼');
          return;
        }
        setError('');
        setStep('working');
        try {
          const selections = parsedFiles.filter((p) => selectedNodes.has(p.node));
          const summary = await onConfirm({ selections, password });
          setResultSummary(summary);
          setStep('done');
        } catch (err) {
          console.error('Restore error:', err);
          setError(err?.message || '還原失敗，請確認密碼是否正確、網路是否正常');
          setStep('password');
        }
      };

      const inputCls = "w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white";

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={step === 'working' ? undefined : onClose}>
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">📥 還原 JSON 備份</h3>
                <p className="text-[11px] text-slate-400">合併寫入，不會刪除現有的其他資料</p>
              </div>
              {step !== 'working' && (
                <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                  <IconX size={22} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {step === 'pick' && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                    <p>⚠️ 還原會把備份檔裡的資料寫回資料庫，請確認是正確的備份檔案。</p>
                    <p>檔名需為：orders.json／products.json／blacklist.json／settings.json／trash.json／logs.json，一次可以選多個檔案。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 flex flex-col items-center gap-2"
                  >
                    <IconFileDown size={28} />
                    <span className="text-sm font-semibold">點此選擇備份 JSON 檔案</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
                  )}
                </>
              )}

              {step === 'preview' && (
                <>
                  <p className="text-xs text-slate-500">辨識出以下檔案，勾選要還原的節點（合併寫入，不會刪除現有其他資料）：</p>
                  <div className="space-y-2">
                    {parsedFiles.map((p) => (
                      <label key={p.node} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedNodes.has(p.node)}
                          onChange={() => toggleNode(p.node)}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800">{p.label}</div>
                          <div className="text-[11px] text-slate-400">{p.filename} · 共 {p.count} 筆</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {unrecognized.length > 0 && (
                    <div className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      已略過無法辨識的檔案：{unrecognized.join('、')}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={selectedNodes.size === 0}
                    onClick={() => setStep('password')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl"
                  >
                    下一步：確認身分（已選 {selectedNodes.size} 個節點）
                  </button>
                </>
              )}

              {(step === 'password' || step === 'working') && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
                    <p>🔒 為避免誤觸，還原前請再輸入一次登入密碼確認身分。</p>
                    <p>系統會先自動下載一份「還原前」的現有資料備份，再進行還原，萬一選錯還能救回來。</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">請重新輸入密碼</label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      disabled={step === 'working'}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
                  )}
                  <button
                    type="button"
                    disabled={step === 'working'}
                    onClick={handleConfirmPassword}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl"
                  >
                    {step === 'working' ? '還原中，請稍候…' : '確認並開始還原'}
                  </button>
                </>
              )}

              {step === 'done' && resultSummary && (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 space-y-2">
                    <p className="font-bold">✅ 還原完成</p>
                    <ul className="text-xs space-y-1">
                      {resultSummary.map((s) => (
                        <li key={s.node}>{s.label}：合併寫入 {s.count} 筆</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-emerald-600">還原前的資料已自動下載一份到瀏覽器下載資料夾，請妥善保存。</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl"
                  >
                    完成
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }


    // ==========================================
    // [v2.14.0] 公版訊息：傳給客人確認訂單用
    // OrderMessageModal：顯示依訂單產生的訊息，可微調後一鍵複製（複製一定要在使用者點按鈕的當下，手機/LINE瀏覽器才不會被擋）
    // MessageTemplateModal：維護前綴、後綴、優惠規則、自訂優惠行，並有即時預覽
    // ==========================================
    function OrderMessageModal({ order, template, onClose, showToast }) {
      const [text, setText] = React.useState(() => buildOrderMessage(order, template));
      const [copied, setCopied] = React.useState(false);

      const handleCopy = async () => {
        const ok = await copyTextToClipboard(text);
        if (ok) {
          setCopied(true);
          showToast('📋 已複製，可以貼到 LINE / IG 給客人了');
        } else {
          showToast('❌ 這個瀏覽器不允許自動複製，請長按文字框手動全選複製');
        }
      };

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">💬 給客人的確認訊息</h3>
                <p className="text-[11px] text-slate-400">{order.customerName} · 可直接修改文字後再複製</p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <IconX size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setCopied(false); }}
                rows={14}
                className="w-full text-sm leading-relaxed p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setText(buildOrderMessage(order, template)); setCopied(false); }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl whitespace-nowrap"
                >
                  還原預設
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex-1 py-3 font-bold text-sm rounded-xl text-white ${copied ? 'bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {copied ? '✓ 已複製（可再複製一次）' : '📋 複製訊息'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    function MessageTemplateModal({ template, onSave, onClose, isSaving }) {
      const [form, setForm] = React.useState(() => sanitizeMessageTemplate(template));

      // 預覽用的範例訂單（不是真的訂單）
      const sampleOrder = {
        customerName: '王小美',
        deliveryMethod: '7-11 取貨付款',
        shippingFee: 38,
        items: [
          { name: '手繪小熊條紋百搭外套', color: '卡其色', size: '90', price: 550, qty: 1 },
          { name: '手繪小熊長袖大學T恤', color: '米色', size: '90', price: 365, qty: 1 }
        ]
      };

      const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
      const updateRule = (id, patch) => setForm(prev => ({
        ...prev, discounts: prev.discounts.map(d => d.id === id ? { ...d, ...patch } : d)
      }));
      const addRule = () => setForm(prev => ({
        ...prev,
        discounts: [...prev.discounts, { id: `d_${Date.now()}`, enabled: true, minQty: 2, percent: 95, label: '滿2件95折' }]
      }));
      const removeRule = (id) => setForm(prev => ({ ...prev, discounts: prev.discounts.filter(d => d.id !== id) }));

      const inputCls = "w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white";

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">💬 公版訊息設定</h3>
                <p className="text-[11px] text-slate-400">商品清單與運費會依每張訂單自動產生</p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <IconX size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">前綴（訊息第一行）</label>
                <input type="text" value={form.prefix} onChange={(e) => setField('prefix', e.target.value)} className={inputCls} placeholder="例如：訂購單" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600">優惠規則（用來計算訊息裡的優惠金額）</label>
                  <button type="button" onClick={addRule} className="text-xs font-bold text-emerald-700">＋ 新增</button>
                </div>
                <div className="space-y-2">
                  {form.discounts.length === 0 && (
                    <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">目前沒有優惠規則</p>
                  )}
                  {form.discounts.map(d => (
                    <div key={d.id} className="border border-slate-200 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" checked={d.enabled} onChange={(e) => updateRule(d.id, { enabled: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                        <span>滿</span>
                        <input type="number" min="1" value={d.minQty} onChange={(e) => updateRule(d.id, { minQty: Number(e.target.value) })} className="w-14 text-sm px-2 py-1 rounded-lg border border-slate-200" />
                        <span>件，</span>
                        <input type="number" min="1" max="99" value={d.percent} onChange={(e) => updateRule(d.id, { percent: Number(e.target.value) })} className="w-14 text-sm px-2 py-1 rounded-lg border border-slate-200" />
                        <span>折</span>
                        <button type="button" onClick={() => removeRule(d.id)} className="ml-auto text-slate-400 hover:text-red-600 p-1"><IconTrash2 size={15} /></button>
                      </div>
                      <input type="text" value={d.label} onChange={(e) => updateRule(d.id, { label: e.target.value })} className={inputCls} placeholder="訊息顯示文字，例如：滿兩件95折" />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">折數填 95 代表 95 折（原價 ×0.95）。多條規則同時符合時，只套用折後最便宜的那一條。優惠只影響訊息顯示，不會改動訂單本身的金額。</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">自訂優惠／備註行（每行一句，會加在運費上方）</label>
                <textarea
                  rows={3}
                  value={form.customLines.join('\n')}
                  onChange={(e) => setField('customLines', e.target.value.split('\n'))}
                  className={inputCls}
                  placeholder="例如：本週加購小物85折"
                />
                <label className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                  <input type="checkbox" checked={form.showSubtotalWhenNoDiscount} onChange={(e) => setField('showSubtotalWhenNoDiscount', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  沒有符合優惠時，仍顯示「商品金額」一行
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">後綴（訊息最後一段）</label>
                <textarea rows={3} value={form.suffix} onChange={(e) => setField('suffix', e.target.value)} className={inputCls} />
                <p className="text-[11px] text-slate-400 mt-1">輸入 {'{顧客姓名}'} 會自動換成該訂單的客人名字（前綴、自訂行也可使用）。</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">預覽（範例訂單）</label>
                <pre className="text-xs leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700">{buildOrderMessage(sampleOrder, form)}</pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2">
              <button type="button" onClick={() => setForm(sanitizeMessageTemplate(null))} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl whitespace-nowrap">還原預設</button>
              <button type="button" disabled={isSaving} onClick={() => onSave(sanitizeMessageTemplate(form))} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl">
                {isSaving ? '儲存中…' : '儲存設定'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ==========================================
    // [V2.7] 操作日誌視窗：最近 200 筆，編輯訂單可「還原此次修改」
    // ==========================================
    function LogModal({ orders, onRevert, onClose }) {
      const [entries, setEntries] = React.useState(null); // null = 載入中
      const [filter, setFilter] = React.useState('all');

      React.useEffect(() => {
        const query = dbRef('logs').orderByKey().limitToLast(200); // 推播 ID 依時間排序，不需要另外建索引
        const handler = query.on('value', (snapshot) => {
          const val = snapshot.val() || {};
          const list = Object.entries(val)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (b.ts || 0) - (a.ts || 0));
          setEntries(list);
        }, (error) => {
          console.error('Logs error:', error);
          setEntries([]);
        });
        return () => query.off('value', handler);
      }, []);

      const isDangerAction = (a) => /delete|purge/.test(a || '');
      const filtered = (entries || []).filter(e => {
        if (filter === 'all') return true;
        if (filter === 'order') return e.target === 'order';
        if (filter === 'product') return e.target === 'product';
        if (filter === 'danger') return isDangerAction(e.action) || /restore/.test(e.action || '');
        return true;
      });

      const actionBadge = (a) => {
        if (isDangerAction(a)) return { text: '刪除', cls: 'bg-red-100 text-red-700' };
        if (/restore|revert/.test(a || '')) return { text: '還原', cls: 'bg-emerald-100 text-emerald-700' };
        if (/create|import/.test(a || '')) return { text: '新增', cls: 'bg-blue-100 text-blue-700' };
        return { text: '修改', cls: 'bg-amber-100 text-amber-800' };
      };

      return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">📒 操作日誌</h3>
                <p className="text-[11px] text-slate-400">最近 200 筆 · 記錄誰在什麼時候改了什麼</p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <IconX size={22} />
              </button>
            </div>

            <div className="px-4 pt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { key: 'all', label: '全部' },
                { key: 'order', label: '訂單' },
                { key: 'product', label: '商品' },
                { key: 'danger', label: '刪除與還原' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold flex-shrink-0 transition ${
                    filter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto mt-2 border-t border-slate-100">
              {entries === null ? (
                <div className="text-center text-sm text-slate-400 py-12">載入中...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-12">還沒有紀錄</div>
              ) : filtered.map(e => {
                const badge = actionBadge(e.action);
                const diff = e.action === 'order_edit' ? describeEditDiff(e) : '';
                const canRevert = e.action === 'order_edit' && e.before && orders.some(o => o.id === e.targetId);
                return (
                  <div key={e.id} className="px-4 py-2.5 border-b border-slate-100 space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${badge.cls}`}>{badge.text}</span>
                      <span className="font-mono">{formatLogTime(e.ts)}</span>
                      <span>· {shortUser(e.user)}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-800 leading-snug break-words">{e.summary}</div>
                    {diff && <div className="text-[11px] text-slate-500 leading-snug break-words">{diff}</div>}
                    {canRevert && (
                      <button
                        type="button"
                        onClick={() => onRevert(e)}
                        className="mt-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px]"
                      >
                        ↩︎ 還原此次修改
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
