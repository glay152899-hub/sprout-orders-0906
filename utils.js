
    // ==========================================
    // Helper Functions & Data Sanitizers
    // ==========================================
    const formatDate = (dateStr) => {
      if (!dateStr) return '無紀錄';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '無紀錄';
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    };

    const inferCategoryFromTitle = (title, currentCat = '') => {
      if (currentCat && currentCat !== '未分類') return currentCat;
      if (!title) return '未分類';
      const t = title.toLowerCase();
      const hasAny = (words) => words.some(w => t.includes(w));

      // [V2.1.1] 先判斷「明確的衣物字眼」，避免「連帽上衣」「吊帶褲」「包屁衣」被 帽/帶/包 誤判
      if (hasAny(['衣', '褲', '裙', '外套', '洋裝', 't恤', '背心', '連身', '套裝', '斗篷', '披風', '睡袍', '罩衫'])) {
        return '服飾';
      }
      if (hasAny(['圍兜', '奶嘴', '固齒', '咬咬', '奶瓶', '餐具', '口水巾', '寶', '童', '嬰'])) {
        return '母嬰用品';
      }
      if (hasAny(['包', '皮夾', '帽', '飾', '襪', '鞋', '帶'])) {
        return '鞋包配飾';
      }
      return '服飾';
    };

    const getStagnantInfo = (prod) => {
      if (prod.status === 'archived') {
        return {
          type: 'archived',
          label: '📦 已下架歸檔',
          color: 'bg-slate-100 text-slate-500 border-slate-200',
          days: 0,
          isAlert: false
        };
      }

      const refDateStr = prod.lastOrderedAt || prod.createdAt;
      if (!refDateStr) {
        return {
          type: 'none',
          label: '⚪ 無銷售紀錄',
          color: 'bg-slate-100 text-slate-600 border-slate-200',
          days: 0,
          isAlert: false
        };
      }

      const refDate = new Date(refDateStr);
      const diffTime = Math.max(0, new Date() - refDate);
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (days >= 365) {
        return {
          type: 'critical',
          label: `⛔ 1年+ 未銷售 (${days}天)`,
          color: 'bg-red-50 text-red-700 border-red-200 font-bold',
          days,
          isAlert: true
        };
      }
      if (days >= 180) {
        return {
          type: 'warning',
          label: `⚠️ 半年+ 未銷售 (${days}天)`,
          color: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
          days,
          isAlert: true
        };
      }
      if (!prod.lastOrderedAt) {
        return {
          type: 'unsold',
          label: `⚪ 上架 ${days} 天未銷售`,
          color: 'bg-slate-100 text-slate-600 border-slate-200',
          days,
          isAlert: false
        };
      }

      return {
        type: 'active',
        label: `🟢 ${days} 天前下單`,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        days,
        isAlert: false
      };
    };

    const findSmartValue = (row, keyType) => {
      const keys = Object.keys(row);
      for (const k of keys) {
        const cleanK = k.trim().toLowerCase();
        if (keyType === 'sku' && (cleanK.includes('sku') || cleanK.includes('款號') || cleanK.includes('編號') || cleanK.includes('代碼'))) {
          return row[k];
        }
        if (keyType === 'title' && (cleanK.includes('名') || cleanK.includes('標題') || cleanK.includes('title') || cleanK.includes('品名') || cleanK.includes('商品') || cleanK.includes('品項'))) {
          return row[k];
        }
        if (keyType === 'price' && !cleanK.includes('總') && (cleanK.includes('價') || cleanK.includes('price') || cleanK.includes('金額'))) {
          return row[k];
        }
        if (keyType === 'sizes' && (cleanK.includes('尺') || cleanK.includes('尺寸') || cleanK.includes('size'))) {
          return row[k];
        }
        if (keyType === 'colors' && (cleanK.includes('色') || cleanK.includes('顏色') || cleanK.includes('color'))) {
          return row[k];
        }
        if (keyType === 'category' && (cleanK.includes('類') || cleanK.includes('分類') || cleanK.includes('category'))) {
          return row[k];
        }
        if (keyType === 'note' && (cleanK.includes('備註') || cleanK.includes('note') || cleanK.includes('說明'))) {
          return row[k];
        }
      }
      return '';
    };

    const parseItemDetails = (title) => {
      let baseName = title;
      let color = '預設';
      let size = 'F';

      const bracketMatch = title.match(/[【\[(](.*?)[】\])]/);
      if (bracketMatch) {
        const content = bracketMatch[1];
        baseName = title.replace(bracketMatch[0], '').trim();
        if (content.includes('/')) {
          const parts = content.split('/');
          color = parts[0].trim() || color;
          size = parts[1].trim() || size;
        } else {
          color = content.trim();
        }
      } else {
        const hyphenMatch = title.match(/[-_\s]+([^\s-_\d]+)?(\d+|S|M|L|XL|XXL|F)?$/i);
        if (hyphenMatch) {
          if (hyphenMatch[1]) color = hyphenMatch[1].trim();
          if (hyphenMatch[2]) size = hyphenMatch[2].trim();
          baseName = title.substring(0, hyphenMatch.index).trim();
        }
      }
      return { baseName: baseName || title, color, size };
    };

    // ==========================================
    // [V2.1.1] 商品庫 Excel 智慧匯入（移植自獨立測試版）
    // ==========================================
    // Excel 裡常見的「空值」字串（例如備註欄寫 null）
    const cleanImportCell = (val) => {
      const s = String(val ?? '').trim();
      return ['null', 'undefined', 'nan'].includes(s.toLowerCase()) ? '' : s;
    };

    const splitImportList = (s) =>
      s ? s.split(/[,，、]+/).map(x => x.trim()).filter(Boolean) : [];

    const sortSizes = (sizeArr) => {
      const standardOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'F', 'FREE'];
      return [...sizeArr].sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

        const idxA = standardOrder.indexOf(a.toUpperCase());
        const idxB = standardOrder.indexOf(b.toUpperCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });
    };

    // （DEFAULT_IMPORT_OPTIONS 已搬到 config.js）

    // 把 Excel 的原始列 → 預覽 / 匯入用的商品清單（純函式，不碰資料庫）
    const buildImportProducts = (rawRows, opts, existingProducts, reservedSkus = []) => {
      const tempItems = [];

      rawRows.forEach((row) => {
        const rawTitle = cleanImportCell(findSmartValue(row, 'title'));
        if (!rawTitle) return;

        let name = rawTitle;
        let sizes = cleanImportCell(findSmartValue(row, 'sizes'));
        let colors = cleanImportCell(findSmartValue(row, 'colors'));
        const rawCategory = cleanImportCell(findSmartValue(row, 'category'));

        if (opts.autoExtract) {
          const parsed = parseItemDetails(rawTitle);
          name = parsed.baseName;
          if (!colors || colors === '預設') colors = parsed.color;
          if (!sizes || sizes === 'F') sizes = parsed.size;
        }

        const category = opts.autoCategory
          ? inferCategoryFromTitle(rawTitle, rawCategory)
          : (rawCategory || '未分類');

        tempItems.push({
          sku: cleanImportCell(findSmartValue(row, 'sku')).toUpperCase(),
          name,
          price: parseCleanNumber(findSmartValue(row, 'price')),
          sizeList: splitImportList(sizes),
          colorList: splitImportList(colors),
          category,
          note: opts.importNote ? cleanImportCell(findSmartValue(row, 'note')) : ''
        });
      });

      let merged = tempItems;
      if (opts.groupBySeries) {
        const map = new Map();
        tempItems.forEach(item => {
          if (!map.has(item.name)) {
            map.set(item.name, {
              ...item,
              sizeList: [...item.sizeList],
              colorList: [...item.colorList]
            });
          } else {
            const ex = map.get(item.name);
            item.sizeList.forEach(s => { if (!ex.sizeList.includes(s)) ex.sizeList.push(s); });
            item.colorList.forEach(c => { if (!ex.colorList.includes(c)) ex.colorList.push(c); });
            if (!ex.price && item.price) ex.price = item.price;
            if ((!ex.category || ex.category === '未分類') && item.category) ex.category = item.category;
            if (!ex.note && item.note) ex.note = item.note;
            if (!ex.sku && item.sku) ex.sku = item.sku;
          }
        });
        merged = Array.from(map.values());
      }

      const existingNames = new Set(
        (existingProducts || []).map(p => String(p.name || '').trim().toLowerCase())
      );
      // [V2.8] 款號不能撞號：現有商品 + 回收桶裡的商品（reservedSkus）的款號都算「已使用」。
      // 沒有款號的商品自動編 SKU-數字，從已使用的最大編號往後接；匯入檔的款號若已被使用，也改成自動編號。
      const usedSkus = new Set(
        [...(existingProducts || []).map(p => p.sku), ...reservedSkus]
          .map(s => String(s || '').trim().toUpperCase())
          .filter(Boolean)
      );
      let skuCounter = [...usedSkus].reduce((max, s) => {
        const m = /^SKU-(\d+)$/.exec(s);
        return m ? Math.max(max, Number(m[1])) : max;
      }, 0);

      return merged.map(item => {
        const sizeList = opts.smartSort ? sortSizes(item.sizeList) : item.sizeList;
        const isExisting = existingNames.has(item.name.trim().toLowerCase());
        const willImport = !(opts.skipExisting && isExisting);
        let sku = item.sku;
        let skuChanged = false;
        if (willImport && sku && usedSkus.has(sku.toUpperCase())) {
          sku = '';          // 匯入檔的款號已被別的商品使用 → 改成自動編號
          skuChanged = true;
        }
        if (!sku && willImport) {
          do { sku = `SKU-${++skuCounter}`; } while (usedSkus.has(sku.toUpperCase()));
        }
        if (sku && willImport) usedSkus.add(sku.toUpperCase());

        return {
          sku,
          name: item.name,
          price: item.price,
          sizes: sizeList.join(', ') || 'F',
          colors: item.colorList.join(', ') || '預設',
          category: item.category || '未分類',
          note: item.note,
          isExisting,
          willImport,
          skuChanged
        };
      });
    };

    const sanitizeItem = (item) => ({
      id: item?.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sku: item?.sku || '',
      name: item?.name || '未命名商品',
      color: item?.color || '',
      size: item?.size || 'F',
      price: Number(item?.price) || 0,
      qty: Number(item?.qty) || 1
    });

    const sanitizeOrder = (order) => ({
      id: order?.id || `ORD${Date.now()}`,
      orderNo: order?.orderNo || '', // [V2.1] 選填：Excel 匯入時帶入工作表名稱 (例如 0901林 涔)
      customerName: order?.customerName || '顧客',
      customerPhone: order?.customerPhone || '',
      customerLine: order?.customerLine || '', // [V2.11] 客人的 LINE ID / 暱稱（只能用 LINE 聯絡的客人）
      customerIg: order?.customerIg || '',     // [V2.11] 客人的 IG 帳號
      deliveryMethod: order?.deliveryMethod || '7-11 取貨付款',
      storeName: order?.storeName || '', // 門市名稱（宅配到府時通常留空）
      storeAddress: order?.storeAddress || '', // [v2.13.0新增] 地址：門市地址（選填）或宅配到府的完整地址
      shippingFee: Number(order?.shippingFee) ?? 60,
      paymentStatus: Boolean(order?.paymentStatus),
      shipmentStatus: order?.shipmentStatus || 'unshipped',
      items: Array.isArray(order?.items) ? order.items.map(sanitizeItem) : [],
      note: order?.note || '',
      createdAt: order?.createdAt || new Date().toLocaleString('zh-TW', { hour12: false }),
      timestamp: order?.timestamp || Date.now()
    });

    const sanitizeProduct = (prod) => ({
      id: prod?.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sku: prod?.sku || '',
      name: prod?.name || '新品',
      price: Number(prod?.price) || 0,
      sizes: prod?.sizes || 'S, M, L, XL',
      colors: prod?.colors || '黑色, 白色',
      category: prod?.category || inferCategoryFromTitle(prod?.name || '', ''),
      note: prod?.note || '',
      createdAt: prod?.createdAt || new Date().toISOString(),
      lastOrderedAt: prod?.lastOrderedAt || null,
      status: prod?.status || 'active',
      pinned: Boolean(prod?.pinned), // [V2.4] 釘選為常用商品
      imageUrl: prod?.imageUrl || '' // [商品圖片 v2.12.9] Cloudinary回傳的完整圖片網址，沒圖是空字串
    });

    // （[v2.13.0] 已隨自動補範例商品機制一起移除，商品庫真的清空後就是空的）

    // ==========================================
    // [V2.1] 訂單列表升級：金額計算工具
    // 折抵 / 內退 項目以「單價為負數」表示，不需要額外欄位。
    // ==========================================
    // 「Excel 總計差額調整」這種自動產生的調整行用固定款號標記，
    // 這樣即使差額是正數，也不會被當成實體商品算進理貨清單。
    // [V2.12] 運費與折扣設定：物流方式清單只在這裡定義一次，其他地方都引用它，
    // 避免像運費 60/38 那樣「同一件事、兩個地方各寫一次、忘了同步」。
    // （DELIVERY_METHODS 已搬到 config.js）

    // 預設值只在資料庫還沒存過設定時使用（不會自動寫入資料庫，存了才算數）
    // （DEFAULT_SHIPPING_CONFIG 已搬到 config.js）

    // 讀進來的設定可能缺欄位（例如剛升級、資料庫還是舊格式），一律補上預設值
    const sanitizeShippingConfig = (raw) => {
      const fees = { ...DEFAULT_SHIPPING_CONFIG.fees };
      DELIVERY_METHODS.forEach(({ key }) => {
        const v = raw?.fees?.[key];
        if (Number.isFinite(Number(v)) && Number(v) >= 0) fees[key] = Number(v);
      });
      return {
        fees,
        freeShippingEnabled: raw?.freeShippingEnabled !== undefined ? Boolean(raw.freeShippingEnabled) : DEFAULT_SHIPPING_CONFIG.freeShippingEnabled,
        freeShippingThreshold: Number.isFinite(Number(raw?.freeShippingThreshold)) ? Number(raw.freeShippingThreshold) : DEFAULT_SHIPPING_CONFIG.freeShippingThreshold
      };
    };

    // 依物流方式與目前小計，算出建議運費（滿額免運時回傳 0）
    const suggestShippingFee = (deliveryMethod, subtotal, config) => {
      if (config.freeShippingEnabled && subtotal >= config.freeShippingThreshold) return 0;
      return config.fees[deliveryMethod] ?? 0;
    };

    // （ADJUSTMENT_SKU 已搬到 config.js）
    const isAdjustmentItem = (item) => Number(item?.price) < 0 || item?.sku === ADJUSTMENT_SKU;

    const calcOrderSubtotal = (order) =>
      (order?.items || []).reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);

    // 統一四捨五入成整數，避免小數單價造成 99.99999 之類的顯示
    const calcOrderTotal = (order) =>
      Math.round(calcOrderSubtotal(order) + (Number(order?.shippingFee) || 0));

    // ==========================================
    // [v2.13.0] 門市名稱／地址 拆分顯示（含舊資料相容）
    // 背景：v2.13.0 之前 storeName 是「門市名稱」跟「地址」黏在同一欄的舊格式，
    // 新訂單會分別存進 storeName／storeAddress 兩個欄位，但舊訂單只有合併過的 storeName、
    // 沒有 storeAddress。這兩個函式讓畫面顯示時，新舊資料都能得到合理的結果，
    // 不需要另外跑一次資料庫遷移。
    // ==========================================
    // 拆解出 { name, address }：
    // - 新格式（storeAddress 有值）→ 直接回傳兩個欄位
    // - 舊格式（storeAddress 是空的）→ 嘗試從 storeName 裡挖出「門市名稱 (地址)」的括號寫法；
    //   沒有括號的話，宅配到府視為地址，其餘（超商取貨）視為門市名稱，跟舊版單一欄位的語意一致
    const deriveStoreDisplay = (order) => {
      const rawName = String(order?.storeName || '').trim();
      const rawAddr = String(order?.storeAddress || '').trim();
      if (rawAddr) return { name: rawName, address: rawAddr };
      if (!rawName) return { name: '', address: '' };
      const bracketMatch = rawName.match(/^(.*?)[\s]*[（(]([^）)]+)[）)]\s*$/);
      if (bracketMatch) {
        return { name: bracketMatch[1].trim(), address: bracketMatch[2].trim() };
      }
      if (order?.deliveryMethod === '宅配到府') return { name: '', address: rawName };
      return { name: rawName, address: '' };
    };

    // 合併成單行顯示用的文字，例如「世貿門市／台北市信義區信義路五段5號1樓」
    const formatStoreLine = (order) => {
      const { name, address } = deriveStoreDisplay(order);
      if (name && address) return `${name}／${address}`;
      return name || address || '';
    };

    // ==========================================
    // [V2.7] 回收桶 + 操作日誌 共用工具
    // ==========================================
    const ORDER_FIELD_LABELS = {
      orderNo: '單號',
      customerName: '姓名',
      customerPhone: '電話',
      customerLine: 'LINE',
      customerIg: 'IG',
      deliveryMethod: '物流方式',
      storeName: '門市名稱',
      storeAddress: '地址', // [v2.13.0新增]
      shippingFee: '運費',
      paymentStatus: '付款狀態',
      shipmentStatus: '出貨狀態',
      note: '備註',
      items: '商品明細'
    };

    const formatLogTime = (ts) => {
      const d = new Date(Number(ts));
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const shortUser = (email) => String(email || '').split('@')[0] || '（未知）';

    const formatLogValue = (key, value) => {
      if (key === 'paymentStatus') return value ? '已付款' : '未付款';
      if (key === 'shipmentStatus') return value === 'shipped' ? '已出貨' : '待出貨';
      if (value === '' || value === null || value === undefined) return '（空）';
      return String(value);
    };

    // 把「編輯訂單」日誌的 before / after 轉成一行看得懂的文字（商品明細只說有修改）
    const describeEditDiff = (entry) => {
      if (!entry?.before || !entry?.after) return '';
      return Object.keys(entry.after).map(key => {
        if (key === 'items') return '商品明細已修改';
        return `${ORDER_FIELD_LABELS[key] || key}：${formatLogValue(key, entry.before[key])} → ${formatLogValue(key, entry.after[key])}`;
      }).join('；');
    };

    // [V2.7.2] 訂單時間戳記：Excel 匯入的訂單時間是我們固定填的「中午 12 點」（沒有真實時間），
    // 只有在程式裡建立的訂單才有真實時間，所以匯入的訂單只顯示日期。
    const isSyntheticNoonTs = (ts) => {
      const d = new Date(Number(ts));
      if (isNaN(d.getTime())) return true;
      const noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0).getTime();
      return Math.abs(d.getTime() - noon) <= 5000; // 匯入時為了維持順序會差幾毫秒
    };

    const formatOrderTimeShort = (ts) => {
      if (isSyntheticNoonTs(ts)) return '';
      const d = new Date(Number(ts));
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // 例如「9/21 14:32」；匯入的訂單只有「9/16」
    const formatOrderStamp = (order) => {
      const date = formatOrderDateShort(order?.createdAt);
      const time = formatOrderTimeShort(order?.timestamp);
      return time ? `${date} ${time}` : date;
    };

    // 「相同訂單」：同一位客人、同樣的商品明細、同樣的總金額
    const orderSignature = (o) => {
      const items = (o.items || [])
        .map(i => `${String(i.name || '').trim()}|${i.color || ''}|${i.size || ''}|${Number(i.price) || 0}|${Number(i.qty) || 0}`)
        .sort()
        .join(';');
      return `${String(o.customerName || '').trim()}#${calcOrderTotal(o)}#${items}`;
    };

    // 找「看起來重複」的訂單：簽章相同（同客人 + 同商品 + 同金額），或單號相同。
    // withinDays：只比對最近 N 天內的訂單（建立訂單時用，避免每週回購的客人一直被提醒）。
    const findDuplicateOrder = (item, orders, withinDays = null, nowMs = Date.now()) => {
      const sig = orderSignature(item);
      const orderNo = String(item.orderNo || '').trim();
      return (orders || []).find(o => {
        if (o.id === item.id) return false;
        if (withinDays !== null && nowMs - (Number(o.timestamp) || 0) > withinDays * 86400000) return false;
        if (orderSignature(o) === sig) return true;
        return Boolean(orderNo) && String(o.orderNo || '').trim() === orderNo;
      }) || null;
    };

    const findDuplicateProduct = (item, products) => {
      const key = String(item.name || '').trim().toLowerCase();
      if (!key) return null;
      return (products || []).find(p => p.id !== item.id && String(p.name || '').trim().toLowerCase() === key) || null;
    };

    // [V2.6.3] 單號若只是「日期 + 姓名」（例如 0914王振婷），跟卡片上已有的日期、姓名重複，展開時就不再顯示
    const isOrderNoRedundant = (order) => {
      const no = String(order?.orderNo || '');
      if (!/^\d{4}/.test(no)) return false;
      const d = new Date(order.timestamp);
      if (isNaN(d.getTime())) return false;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      // [v2.14.4] 單號開頭可能是 YYYYMMDD（8碼）、民國 YYYMMDD（7碼）或舊的 MMDD（4碼）；
      // 開頭日期與訂單日期一致時，單號的日期部分只是重複資訊，卡片上不必再顯示一次
      if (no.startsWith(`${d.getFullYear()}${mm}${dd}`)) return true;
      if (no.startsWith(`${d.getFullYear() - 1911}${mm}${dd}`)) return true;
      return no.slice(0, 4) === `${mm}${dd}`;
    };

    // [V2.6.2] 訂單卡片上的簡短日期：今年的訂單只顯示「9/16」，其他年份顯示完整日期
    const formatOrderDateShort = (createdAt) => {
      const datePart = String(createdAt || '').split(' ')[0];
      const parts = datePart.split('/');
      if (parts.length === 3 && Number(parts[0]) === new Date().getFullYear()) return `${parts[1]}/${parts[2]}`;
      return datePart;
    };

    // [V2.6] 訂單日期篩選：把時間戳轉成「本地日期」YYYY-MM-DD
    const toDateKey = (ts) => {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const formatDateChipLabel = (key, nowMs = Date.now()) => {
      if (key === toDateKey(nowMs)) return '今天';
      if (key === toDateKey(nowMs - 86400000)) return '昨天';
      const [, m, d] = key.split('-');
      return `${Number(m)}/${Number(d)}`;
    };

    // ==========================================
    // [V2.4] 新增訂單「快速帶入」：近期熱銷自動排序
    // 不去猜「檔期」，改用時間衰減：越近的訂單權重越高（每過 N 天減半），
    // 所以這一檔的明星商品會自動浮上來、上一檔的舊明星商品自然沉下去。
    // ==========================================
    // （QUICK_PICK_* 常數 已搬到 config.js）

    // 尺寸 / 顏色欄位的拆分（逗號、頓號、斜線、空白）
    const splitProductOptions = (s) =>
      String(s || '').split(/[,，、/ ]+/).map(x => x.trim()).filter(Boolean);

    // 只有一種尺寸且一種顏色 → 可以「＋」一鍵直接加入，不必再選規格
    const isSingleVariantProduct = (p) =>
      splitProductOptions(p.sizes).length <= 1 && splitProductOptions(p.colors).length <= 1;

    // ==========================================
    // [v2.14.0] 公版訊息：傳給客人確認訂單用的文字
    // ==========================================
    // 整理公版設定：資料庫完全沒有設定(null)時用預設值；已經存過的設定，缺的欄位不再補預設優惠規則
    // （Firebase 不會存空陣列，若刪光優惠規則後又被補回預設，使用者會以為刪不掉）
    const sanitizeMessageTemplate = (raw) => {
      const def = DEFAULT_MESSAGE_TEMPLATE;
      if (!raw || typeof raw !== 'object') {
        return JSON.parse(JSON.stringify(def));
      }
      const toArray = (v) => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []);
      const discounts = toArray(raw.discounts)
        .filter(d => d && typeof d === 'object')
        .map((d, i) => ({
          id: String(d.id || `d_${i}_${Date.now()}`),
          enabled: d.enabled !== false,
          minQty: Math.max(1, Math.floor(Number(d.minQty) || 1)),
          percent: Math.min(100, Math.max(0, Number(d.percent) || 0)),
          label: String(d.label || '')
        }));
      return {
        prefix: typeof raw.prefix === 'string' ? raw.prefix : def.prefix,
        suffix: typeof raw.suffix === 'string' ? raw.suffix : def.suffix,
        discounts,
        customLines: toArray(raw.customLines).map(x => String(x || '')).filter(x => x.trim()),
        showSubtotalWhenNoDiscount: raw.showSubtotalWhenNoDiscount !== false
      };
    };

    // 依訂單內容＋公版設定，產生要傳給客人的確認訊息。格式：
    //   前綴 / 1.品名-顏色尺寸$單價（數量>1 加 x數量）/ 空行 / 優惠金額行 / 自訂優惠行 / 運費行 / 空行 / 後綴
    // 優惠規則若有多條同時符合，只套用「金額最低」的那一條（對客人最有利），不疊加。
    const buildOrderMessage = (order, template) => {
      const t = sanitizeMessageTemplate(template);
      const customerName = String(order?.customerName || '');
      const fill = (str) => String(str || '').replace(/\{顧客姓名\}/g, customerName);

      const allItems = order?.items || [];
      const goodsItems = allItems.filter(i => !isAdjustmentItem(i));
      const adjustItems = allItems.filter(i => isAdjustmentItem(i));

      const itemLines = goodsItems.map((it, idx) => {
        const size = it.size && it.size !== 'F' ? String(it.size) : '';
        const spec = `${it.color || ''}${size}`;
        const qty = Number(it.qty) || 1;
        return `${idx + 1}.${it.name}${spec ? '-' + spec : ''}$${Number(it.price) || 0}${qty > 1 ? ` x${qty}` : ''}`;
      });

      const goodsSubtotal = goodsItems.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
      const totalQty = goodsItems.reduce((s, it) => s + (Number(it.qty) || 1), 0);
      const adjustSum = adjustItems.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);

      // 找出符合條件、折後金額最低的那條優惠規則
      let bestRule = null;
      let bestAmount = goodsSubtotal;
      t.discounts.forEach(d => {
        if (!d.enabled || d.percent <= 0 || d.percent >= 100) return;
        if (totalQty < d.minQty) return;
        const amount = Math.round(goodsSubtotal * d.percent / 100);
        if (amount < bestAmount) { bestAmount = amount; bestRule = d; }
      });

      const middle = [];
      if (bestRule) {
        middle.push(`${bestRule.label || `滿${bestRule.minQty}件${bestRule.percent}折`}優惠金額${bestAmount}`);
      } else if (t.showSubtotalWhenNoDiscount && goodsItems.length > 0) {
        middle.push(`商品金額${goodsSubtotal}`);
      }
      if (adjustSum !== 0) middle.push(`其他調整${adjustSum}`);
      t.customLines.forEach(line => middle.push(fill(line)));

      const fee = Number(order?.shippingFee) || 0;
      const feeLabel = order?.deliveryMethod === '宅配到府' ? '宅配運費' : '賣貨便運費';
      middle.push(fee === 0 ? '免運' : `${feeLabel}${fee}`);

      const out = [];
      const prefix = fill(t.prefix);
      if (prefix.trim()) out.push(prefix);
      out.push(...itemLines);
      out.push('');
      out.push(...middle);
      const suffix = fill(t.suffix);
      if (suffix.trim()) { out.push(''); out.push(suffix); }
      return out.join('\n');
    };

    // 複製文字到剪貼簿：優先用新API，LINE 內建瀏覽器等不支援時退回舊方法。回傳 true/false。
    const copyTextToClipboard = async (text) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (err) { /* 往下走舊方法 */ }
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (err) {
        return false;
      }
    };

    // ---- [v2.13.4／原對話v2.12.11起] 新增訂單手動輸入商品名稱時的相似商品比對 ----
    // 純字元層級比對(Levenshtein編輯距離)，抓的是「打錯字/打一半」這種情境，不是語意理解
    // （例如不會知道「上衣」跟「T恤」是類似概念，只比對字面）。
    const levenshteinDistance = (a, b) => {
      const m = a.length, n = b.length;
      if (m === 0) return n;
      if (n === 0) return m;
      let prev = Array.from({ length: n + 1 }, (_, j) => j);
      for (let i = 1; i <= m; i++) {
        const curr = [i];
        for (let j = 1; j <= n; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        prev = curr;
      }
      return prev[n];
    };

    // 回傳 0~1 的相似度（1 = 完全相同）
    const stringSimilarity = (a, b) => {
      const s1 = String(a || '').trim().toLowerCase();
      const s2 = String(b || '').trim().toLowerCase();
      if (!s1 && !s2) return 1;
      if (!s1 || !s2) return 0;
      const maxLen = Math.max(s1.length, s2.length);
      return 1 - levenshteinDistance(s1, s2) / maxLen;
    };

    // 依商品名稱長度動態決定「至少要對到幾個字」：商品名稱字數的一半(無條件進位)要對上，
    // 名稱越短容錯字數越少、越長容錯越多。例如 3字商品要對到2字、4字對到2字、5字對到3字。
    const getRequiredCharMatches = (len) => Math.ceil(len / 2);

    // 找出商品庫裡名稱跟輸入文字相似的商品（排除下架歸檔），依相似度高到低排序，只取前 maxResults 筆
    const findSimilarProducts = (inputName, products, maxResults = PRODUCT_NAME_SIMILARITY_MAX_RESULTS) => {
      const name = String(inputName || '').trim();
      if (!name) return [];
      const nameLower = name.toLowerCase();
      return (products || [])
        .filter(p => p.status !== 'archived' && p.name)
        .map(p => {
          const productName = String(p.name).trim();
          const productLower = productName.toLowerCase();

          // 關鍵字包含比對：輸入的字完整出現在商品名稱裡（或商品名稱完整出現在輸入裡），
          // 例如打「連身褲」對到「小熊圖案舒棉連身褲」——不用管字數比例，直接算相似。
          // 限制至少2個字，避免打單一個字就對到一堆不相關商品。
          const minLen = Math.min(nameLower.length, productLower.length);
          const isKeywordMatch = minLen >= 2 && (productLower.includes(nameLower) || nameLower.includes(productLower));

          const distance = levenshteinDistance(nameLower, productLower);
          const allowedDistance = productName.length - getRequiredCharMatches(productName.length);
          const isTypoMatch = distance <= allowedDistance;

          return {
            product: p,
            score: stringSimilarity(name, productName),
            matched: isKeywordMatch || isTypoMatch,
            isKeywordMatch
          };
        })
        .filter(x => x.matched)
        // 關鍵字包含比對優先排在前面，再依相似度高到低排序
        .sort((a, b) => (b.isKeywordMatch - a.isKeywordMatch) || (b.score - a.score))
        .slice(0, maxResults);
    };

    // 依訂單歷史算出每個商品的熱銷分數。比對方式與滯銷分析一致：先款號、再品名。
    const computeProductScores = (products, orders, nowMs = Date.now()) => {
      const bySku = new Map();
      const byName = new Map();
      products.forEach(p => {
        const s = String(p.sku || '').trim().toUpperCase();
        if (s && !bySku.has(s)) bySku.set(s, p.id);
        const n = String(p.name || '').trim().toLowerCase();
        if (n && !byName.has(n)) byName.set(n, p.id);
      });

      const scores = {};
      const recent = {};
      orders.forEach(order => {
        const ts = Number(order.timestamp) || 0;
        if (!ts) return;
        const ageDays = Math.max(0, (nowMs - ts) / 86400000);
        const weight = Math.pow(0.5, ageDays / QUICK_PICK_HALF_LIFE_DAYS);

        (order.items || []).forEach(item => {
          if (isAdjustmentItem(item)) return;
          const skuKey = String(item.sku || '').trim().toUpperCase();
          const nameKey = String(item.name || '').trim().toLowerCase();
          const id = (skuKey && bySku.get(skuKey)) || byName.get(nameKey);
          if (!id) return;
          const qty = Math.max(0, Number(item.qty) || 0);
          scores[id] = (scores[id] || 0) + qty * weight;
          if (ageDays <= QUICK_PICK_RECENT_DAYS) recent[id] = (recent[id] || 0) + qty;
        });
      });
      return { scores, recent };
    };

    // 排序：釘選 → 熱銷分數 → 建檔時間(新的在前) → 名稱
    const compareByQuickRank = (scores) => (a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      const sa = scores[a.id] || 0;
      const sb = scores[b.id] || 0;
      if (Math.abs(sa - sb) > 1e-9) return sb - sa;
      const ta = new Date(a.createdAt).getTime() || 0;
      const tb = new Date(b.createdAt).getTime() || 0;
      if (ta !== tb) return tb - ta;
      return String(a.name).localeCompare(String(b.name), 'zh-Hant');
    };

    // [V2.4.1] 手機版只顯示 3～4 個：品名短最多 4 個；品名長（會折成兩行）約 3 個。
    // 依排序順序累加，遇到放不下的就停止，確保顯示的一定是排名最前面的。
    // （MOBILE_QUICK_* / MOBILE_CHARS_PER_LINE 常數 已搬到 config.js）
    const estimateNameLines = (name) => Math.max(1, Math.ceil((String(name || '').length + 2) / MOBILE_CHARS_PER_LINE));

    const pickMobileVisibleIds = (orderedProducts) => {
      const ids = new Set();
      let lines = 0;
      for (const p of orderedProducts) {
        const need = Math.min(2, estimateNameLines(p.name)); // 名稱最多顯示兩行
        if (ids.size >= MOBILE_QUICK_MAX_ITEMS || lines + need > MOBILE_QUICK_MAX_LINES) break;
        ids.add(p.id);
        lines += need;
      }
      return ids;
    };

    // 產生畫面要用的三份清單：常用區(釘選+熱銷)、新品區、完整排序清單(已排除下架歸檔)
    const buildQuickPickLists = (products, scores, nowMs = Date.now()) => {
      const active = products.filter(p => p.status !== 'archived');
      const allSorted = [...active].sort(compareByQuickRank(scores));

      const pinned = allSorted.filter(p => p.pinned).slice(0, QUICK_PICK_SLOTS);
      const hot = allSorted
        .filter(p => !p.pinned && (scores[p.id] || 0) >= QUICK_PICK_MIN_SCORE)
        .slice(0, Math.max(0, QUICK_PICK_SLOTS - pinned.length));
      const quick = [...pinned, ...hot];

      const quickIds = new Set(quick.map(p => p.id));
      const createdTime = (p) => new Date(p.createdAt).getTime() || 0;
      const byNewest = active.filter(p => !quickIds.has(p.id)).sort((a, b) => createdTime(b) - createdTime(a));
      const recentNew = byNewest.filter(p => nowMs - createdTime(p) <= QUICK_PICK_NEW_DAYS * 86400000).slice(0, 3);
      // 還沒有任何訂單紀錄時（剛開始使用），改顯示最新建檔的商品
      const fresh = quick.length === 0 ? byNewest.slice(0, 6) : recentNew;

      return { quick, fresh, allSorted };
    };

    // ==========================================
    // [V2.1] 訂單 Excel 匯入：智慧解析
    // 解析邏輯沿用「訂單列表程式碼」：每個工作表 = 一筆訂購單，
    // 只是輸出改成主程式 (Firebase) 的欄位格式。
    // ==========================================
    const parseCleanNumber = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (!val) return 0;
      const cleaned = String(val).replace(/[,NT\$\s元]/g, '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    // 訂購單範本的空欄位是「______________」，不能當成真的資料
    const cleanExcelPlaceholder = (val) => {
      const s = String(val || '').trim();
      return /^[_＿\-－\s]*$/.test(s) ? '' : s;
    };

    // 這些名稱的工作表視為範本/備份頁，匯入時略過
    const ORDER_IMPORT_SKIP_SHEETS = ['原稿', '工作表37', 'Template', 'Sheet1'];

    // Excel 內的簡稱 → 主程式的配送方式選項
    const mapImportedDelivery = (method) => {
      if (method === '全家') return '全家取貨付款';
      if (method === '宅配') return '宅配到府';
      return '7-11 取貨付款';
    };

    // [V2.4] 工作表名稱前四碼 = 建單日期（MMDD，例如「0901林 涔」→ 9/1）。
    // 年份沒寫：先假設今年；若算出來比今天晚超過 2 天，就當成去年。時間統一設成中午 12 點。
    // [v2.14.4 年份修正] 由工作表名稱解析訂單日期。回傳 { timestamp, source, year }：
    //   source = 'full'         → 名稱開頭自帶年份：YYYYMMDD（如 20260703王明）
    //   source = 'roc'          → 民國年 YYYMMDD（如 1140222熊熊，換算成西元）
    //   source = 'mmdd-chosen'  → 只有 MMDD，年份採用使用者指定的 assumedYear
    //   source = 'mmdd-guessed' → 只有 MMDD 且沒指定年份：沿用舊做法（今年，若比今天晚超過兩天就算去年）
    //   null                    → 看不出日期（或日期不存在，例如 0231）
    const parseSheetNameDate = (sheetName, opts = {}) => {
      const nowMs = opts.nowMs !== undefined ? opts.nowMs : Date.now();
      const assumedYear = Number(opts.assumedYear) || 0;
      const name = String(sheetName || '').trim();
      const build = (year, month, day) => {
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        const d = new Date(year, month - 1, day, 12, 0, 0);
        if (d.getMonth() !== month - 1 || d.getDate() !== day) return null; // 例如 0231 這種不存在的日期
        return d;
      };
      let m = /^(20\d{2})(\d{2})(\d{2})/.exec(name);           // YYYYMMDD
      if (m) {
        const d = build(Number(m[1]), Number(m[2]), Number(m[3]));
        if (d) return { timestamp: d.getTime(), source: 'full', year: d.getFullYear() };
      }
      m = /^(1\d{2})(\d{2})(\d{2})/.exec(name);                // 民國 YYYMMDD（民國100~199年）
      if (m) {
        const d = build(Number(m[1]) + 1911, Number(m[2]), Number(m[3]));
        if (d) return { timestamp: d.getTime(), source: 'roc', year: d.getFullYear() };
      }
      m = /^(\d{2})(\d{2})/.exec(name);                          // MMDD
      if (!m) return null;
      const month = Number(m[1]);
      const day = Number(m[2]);
      if (assumedYear) {
        const d = build(assumedYear, month, day);
        return d ? { timestamp: d.getTime(), source: 'mmdd-chosen', year: assumedYear } : null;
      }
      const year = new Date(nowMs).getFullYear();
      let d = build(year, month, day);
      if (!d) return null;
      if (d.getTime() > nowMs + 2 * 86400000) d = build(year - 1, month, day);
      return d ? { timestamp: d.getTime(), source: 'mmdd-guessed', year: d.getFullYear() } : null;
    };

    // 舊介面保留（只回傳時間戳）
    const inferOrderTimestampFromSheetName = (sheetName, nowMs = Date.now()) => {
      const r = parseSheetNameDate(sheetName, { nowMs });
      return r ? r.timestamp : null;
    };

    // 預覽視窗改選年份時使用：只有「只有 MMDD」的訂單會受影響；自帶年份的（YYYYMMDD／民國年）不動。
    // assumedYear 為空 → 還原成自動判斷。回傳新的 draft（不修改原物件）。
    const resolveDraftTimestamp = (draft, assumedYear, nowMs = Date.now()) => {
      if (!draft || (draft.yearSource !== 'mmdd-guessed' && draft.yearSource !== 'mmdd-chosen')) return draft;
      const r = parseSheetNameDate(draft.orderNo, { assumedYear, nowMs });
      if (!r) return { ...draft, orderTimestamp: null, yearSource: null };
      return { ...draft, orderTimestamp: r.timestamp, yearSource: r.source };
    };

    const parseOrderExcelWorkbook = (workbook, defaultShippingFee = 38, options = {}) => {
      const drafts = [];

      workbook.SheetNames.forEach(sheetName => {
        const cleanedSheetName = sheetName.trim();
        if (ORDER_IMPORT_SKIP_SHEETS.includes(cleanedSheetName)) return;

        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rows || rows.length < 3) return;

        let customerName = '';
        let customerPhone = '';
        let shippingMethod = '7-11';
        let storeAddress = '';
        let shippingFee = defaultShippingFee;
        let excelTotalAmount = null;

        // 1. 解析買家基本資訊 (買家姓名、電話、門市)
        for (let r = 0; r < Math.min(8, rows.length); r++) {
          const row = rows[r] || [];
          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').trim();
            if (cell.includes('顧客姓名') || cell.includes('收件人')) {
              const nameMatch = cell.match(/(?:顧客姓名|收件人)\s*[:：]\s*(.*)/);
              if (nameMatch && nameMatch[1]) customerName = nameMatch[1].trim();
              else if (row[c + 1]) customerName = String(row[c + 1]).trim();
            }
            if (cell.includes('手機') || cell.includes('電話')) {
              const phoneMatch = cell.match(/(?:手機|電話)\s*[:：]\s*(.*)/);
              if (phoneMatch && phoneMatch[1]) customerPhone = phoneMatch[1].trim();
              else if (row[c + 1]) customerPhone = String(row[c + 1]).trim();
            }
            if (cell.includes('到貨店家') || cell.includes('取件門市') || cell.includes('取貨門市') || cell.includes('7-11門市') || cell.includes('門市') || cell.includes('賣貨便')) {
              const storeMatch = cell.match(/(?:到貨店家|取件門市|取貨門市|7-11門市|門市|賣貨便)\s*[:：]\s*(.*)/);
              if (storeMatch && storeMatch[1]) storeAddress = storeMatch[1].trim();
              else if (row[c + 1]) storeAddress = String(row[c + 1]).trim();
            }
            if (cell.includes('全家')) shippingMethod = '全家';
            if (cell.includes('宅配')) shippingMethod = '宅配';
            if (cell.includes('7-11') || cell.includes('賣貨便')) shippingMethod = '7-11';
          }
        }

        customerName = cleanExcelPlaceholder(customerName);
        customerPhone = cleanExcelPlaceholder(customerPhone);
        storeAddress = cleanExcelPlaceholder(storeAddress);
        if (!customerName) customerName = cleanedSheetName;

        // 2. 尋找商品表頭列 (品項, 金額, 數量)
        let headerRowIdx = -1;
        for (let r = 0; r < rows.length; r++) {
          const rowStr = rows[r].map(c => String(c)).join(' ');
          if (rowStr.includes('品項') && (rowStr.includes('金額') || rowStr.includes('數量'))) {
            headerRowIdx = r;
            break;
          }
        }

        const items = [];
        if (headerRowIdx !== -1) {
          const header = rows[headerRowIdx].map(c => String(c).trim());
          const colItem = header.findIndex(h => h.includes('品項'));
          const colPrice = header.findIndex(h => h === '金額' || h.includes('單價'));
          const colQty = header.findIndex(h => h.includes('數量'));
          const colRowTotal = header.findIndex(h => h.includes('總金額'));

          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row) continue;

            const itemName = String(row[colItem] || '').trim();
            if (!itemName) continue;

            // 遇到底部統計列時停止抓取商品
            if (itemName.includes('金額') || itemName.includes('運費') || itemName.includes('總計') || itemName.includes('備註')) break;

            const price = parseCleanNumber(row[colPrice]);
            const qty = parseInt(parseCleanNumber(row[colQty]), 10) || 0;
            const rowTotal = parseCleanNumber(row[colRowTotal]);

            // 檢測是否為折抵/內退項目 (例如: 內退62元)
            const isAdjustment = /內退|退款|折扣|折抵|優惠|補貼/.test(itemName);

            if (isAdjustment) {
              let discountAmt = 0;
              const matchNum = itemName.match(/(?:內退|退款|折扣|折抵)\s*(\d+)/);
              if (matchNum && matchNum[1]) {
                discountAmt = parseFloat(matchNum[1]);
              } else if (price !== 0) {
                discountAmt = Math.abs(price);
              } else if (rowTotal !== 0) {
                discountAmt = Math.abs(rowTotal);
              }

              if (discountAmt > 0) {
                items.push({
                  sku: '',
                  name: itemName,
                  color: '折抵',
                  size: 'F',
                  qty: 1,
                  price: -Math.abs(discountAmt)
                });
              }
            } else if (qty > 0 || price > 0) {
              // [V2.1.1] 與「商品庫智慧匯入」共用同一套拆解規則：
              // 「消防小狗長袖上衣-藏青色90」→ 品名 / 顏色 藏青色 / 尺寸 90，
              // 這樣訂單、理貨清單、商品庫、滯銷分析才對得起來。
              const parsed = parseItemDetails(itemName);
              items.push({
                sku: '',
                name: parsed.baseName,
                color: parsed.color,
                size: parsed.size,
                qty: qty || 1,
                price: price
              });
            }
          }
        }

        // 3. 解析運費與 Excel 底層記載的總金額
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r] || [];
          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || '').trim();
            if (cellVal.includes('運費')) {
              const val = parseCleanNumber(row[c + 1]);
              if (val >= 0) shippingFee = val;
            } else if (cellVal.includes('總計')) {
              const val = parseCleanNumber(row[c + 1]);
              if (val > 0) excelTotalAmount = val;
            }
          }
        }

        if (items.length > 0 || customerName) {
          const draftItems = items.map(sanitizeItem);
          const draftShipping = Math.round(shippingFee);
          const excelTotal = excelTotalAmount ? Math.round(excelTotalAmount) : null;

          // Excel 的「金額」欄常有隱藏的折扣公式（例如 95 折、小數），
          // 明細加總會跟 Excel 總計對不上。以 Excel 總計為準（那才是客人實際要付的），
          // 差額用一行明確的「調整」補上，預覽和列表都看得到，也能事後編輯。
          const itemsSum = draftItems.reduce((s, i) => s + i.price * i.qty, 0);
          const computed = Math.round(itemsSum + draftShipping);
          if (excelTotal !== null && Math.abs(excelTotal - computed) >= 1) {
            draftItems.push(sanitizeItem({
              sku: ADJUSTMENT_SKU,
              name: 'Excel 總計差額調整（折扣／小數）',
              color: '調整',
              size: 'F',
              qty: 1,
              price: excelTotal - computed
            }));
          }

          const sheetDate = parseSheetNameDate(cleanedSheetName, { assumedYear: options.assumedYear });
          drafts.push({
            orderNo: cleanedSheetName,
            customerName,
            customerPhone,
            deliveryMethod: mapImportedDelivery(shippingMethod),
            storeName: storeAddress,
            shippingFee: draftShipping,
            paymentStatus: false,
            shipmentStatus: 'unshipped',
            items: draftItems,
            note: '由 Excel 檔案匯入',
            // 以下兩個欄位僅供預覽與計算用，寫入資料庫前會移除
            excelTotal,
            orderTimestamp: sheetDate ? sheetDate.timestamp : null,
            yearSource: sheetDate ? sheetDate.source : null   // [v2.14.4] full／roc／mmdd-chosen／mmdd-guessed／null
          });
        }
      });

      return drafts;
    };

    // ==========================================
    // [黑名單] 標準化 / 比對 / 整理（純函式，無副作用，不碰資料庫）
    // ==========================================

    // 電話標準化：去除非數字字元，把 +886/886 開頭轉回 0 開頭，方便跨格式比對
    const normalizePhone = (v) => {
      let digits = String(v || '').replace(/[^\d+]/g, '');
      if (digits.startsWith('+886')) digits = '0' + digits.slice(4);
      else if (digits.startsWith('886')) digits = '0' + digits.slice(3);
      return digits.replace(/\D/g, '');
    };
    const BLACKLIST_PHONE_MIN_LEN = 8; // 標準化後電話號碼要 >= 這個長度才納入比對，避免打一半的號碼誤中

    // LINE/IG 帳號標準化：去除開頭@、前後空白、轉小寫，方便跨大小寫/有無@比對
    const normalizeHandle = (v) => String(v || '').trim().replace(/^@/, '').toLowerCase().replace(/\s+/g, '');

    // 姓名標準化：去除空白；預設值「顧客」視同未填寫，不納入比對（避免大量顧客都用預設值互相誤判）
    const normalizeName = (v) => {
      const s = String(v || '').trim().replace(/\s+/g, '');
      return (!s || s === '顧客') ? '' : s;
    };

    const sanitizeBlacklistEntry = (raw, id) => ({
      id: id || raw?.id || '',
      name: raw?.name || '',
      phone: raw?.phone || '',
      ig: raw?.ig || '',
      line: raw?.line || '',
      reason: raw?.reason || '',
      sourceOrderNo: raw?.sourceOrderNo || '',
      createdAt: raw?.createdAt || '',
      timestamp: typeof raw?.timestamp === 'number' ? raw.timestamp : 0,
      createdBy: raw?.createdBy || '',
    });

    // 比對「顧客資料」是否命中黑名單清單。strong=電話/LINE/IG命中(高信度)，weak=只有姓名命中(低信度，僅供參考)
    const findBlacklistMatches = (customer, list) => {
      const cName = normalizeName(customer?.name);
      const cPhoneRaw = normalizePhone(customer?.phone);
      const cPhone = cPhoneRaw.length >= BLACKLIST_PHONE_MIN_LEN ? cPhoneRaw : '';
      const cLine = normalizeHandle(customer?.line);
      const cIg = normalizeHandle(customer?.ig);
      const hits = [];
      (list || []).forEach((entry) => {
        const fields = [];
        const ePhoneRaw = normalizePhone(entry.phone);
        const ePhone = ePhoneRaw.length >= BLACKLIST_PHONE_MIN_LEN ? ePhoneRaw : '';
        if (cPhone && ePhone && cPhone === ePhone) fields.push('phone');
        if (cIg && normalizeHandle(entry.ig) === cIg) fields.push('ig');
        if (cLine && normalizeHandle(entry.line) === cLine) fields.push('line');
        if (cName && normalizeName(entry.name) === cName) fields.push('name');
        if (fields.length) hits.push({ entry, fields });
      });
      if (!hits.length) return { level: 'none', hits: [] };
      const strong = hits.some((h) => h.fields.some((f) => f !== 'name'));
      return { level: strong ? 'strong' : 'weak', hits };
    };

    // 新增黑名單前的重複偵測：只比對強識別欄位(電話/LINE/IG)，姓名不列入(避免同名同姓誤判)
    const findBlacklistDuplicate = (draft, list) => {
      const dPhoneRaw = normalizePhone(draft?.phone);
      const dPhone = dPhoneRaw.length >= BLACKLIST_PHONE_MIN_LEN ? dPhoneRaw : '';
      const dLine = normalizeHandle(draft?.line);
      const dIg = normalizeHandle(draft?.ig);
      return (list || []).find((entry) => {
        const ePhoneRaw = normalizePhone(entry.phone);
        const ePhone = ePhoneRaw.length >= BLACKLIST_PHONE_MIN_LEN ? ePhoneRaw : '';
        return (dPhone && ePhone && dPhone === ePhone) ||
               (dLine && normalizeHandle(entry.line) === dLine) ||
               (dIg && normalizeHandle(entry.ig) === dIg);
      }) || null;
    };

    // 從一筆訂單快速帶出「加入黑名單」的草稿內容，給「更多」頁的手動新增或未來訂單列表的快速加入按鈕共用
    const blacklistDraftFromOrder = (order) => ({
      name: order?.customerName || '',
      phone: order?.customerPhone || '',
      ig: order?.customerIg || '',
      line: order?.customerLine || '',
      reason: '',
      sourceOrderNo: order?.orderNo || '',
    });

    // ==========================================
    // [商品圖片 v2.12.9] 上傳前壓縮（純函式，用Canvas等比例縮小+轉JPEG，不依賴任何外部狀態）
    // ==========================================
    const compressImageFile = (file, maxDimension = PRODUCT_IMAGE_MAX_DIMENSION, quality = PRODUCT_IMAGE_JPEG_QUALITY) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let { width, height } = img;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round(height * (maxDimension / width));
                width = maxDimension;
              } else {
                width = Math.round(width * (maxDimension / height));
                height = maxDimension;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('圖片壓縮失敗，請換一張圖片再試一次'));
            }, 'image/jpeg', quality);
          };
          img.onerror = () => reject(new Error('圖片讀取失敗，請確認檔案格式是否正確'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('檔案讀取失敗'));
        reader.readAsDataURL(file);
      });
    };
