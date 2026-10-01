    // ==========================================
    // Main Component: SproutOrderAssistant
    // ==========================================
    function SproutOrderAssistant({ user, onSignOut }) {
      const [activeTab, setActiveTab] = React.useState('add');
      
      // Firebase Synchronized States
      const [orders, setOrders] = React.useState([]);
      const [products, setProducts] = React.useState([]);
      const [tallyChecked, setTallyChecked] = React.useState({});
      const [isConnected, setIsConnected] = React.useState(false);
      const [isSyncing, setIsSyncing] = React.useState(true);
      const [permissionDenied, setPermissionDenied] = React.useState(false);

      // [V2.12] 運費與折扣設定
      const [shippingConfig, setShippingConfig] = React.useState(DEFAULT_SHIPPING_CONFIG);
      const [isShippingSettingsOpen, setIsShippingSettingsOpen] = React.useState(false);
      const [isSavingShippingConfig, setIsSavingShippingConfig] = React.useState(false); // [V2.5] 已登入但帳號不在規則白名單內

      const [toastMessage, setToastMessage] = React.useState('');
      const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);

      // Product Library Enhanced States V5.1
      const [productSearch, setProductSearch] = React.useState('');
      const [productCategoryFilter, setProductCategoryFilter] = React.useState('all');
      const [productStagnantFilter, setProductStagnantFilter] = React.useState('all');
      const [productViewMode, setProductViewMode] = React.useState('grid'); // 'grid' | 'list'
      const [editingProduct, setEditingProduct] = React.useState(null); // Product object or null
      const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);

      // ---------- [商品圖片 v2.12.9] ----------
      const [isUploadingProductImage, setIsUploadingProductImage] = React.useState(false);
      const [imageLightboxUrl, setImageLightboxUrl] = React.useState(''); // 燈箱目前顯示的圖片網址，空字串=不顯示
      const productImageSessionKeyRef = React.useRef(null); // 新增商品(還沒有id)時，暫時分組圖片路徑用
      
      // Import Preview Modal State
      const [importRawRows, setImportRawRows] = React.useState([]);          // Excel 讀進來的原始列
      const [importFileName, setImportFileName] = React.useState('');
      const [importOptions, setImportOptions] = React.useState(DEFAULT_IMPORT_OPTIONS);
      const [isProductImporting, setIsProductImporting] = React.useState(false);
      const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);

      // [V2.1] Order List Upgrade States
      const [editingOrder, setEditingOrder] = React.useState(null); // Order object or null
      const [orderImportDrafts, setOrderImportDrafts] = React.useState([]);
      const [isOrderImportModalOpen, setIsOrderImportModalOpen] = React.useState(false);
      const [isOrderParsing, setIsOrderParsing] = React.useState(false);
      const [isOrderImporting, setIsOrderImporting] = React.useState(false);

      // [V2.2] 訂單多選刪除
      const [selectMode, setSelectMode] = React.useState(false);
      const [selectedOrderIds, setSelectedOrderIds] = React.useState(() => new Set());
      const [confirmBatchDelete, setConfirmBatchDelete] = React.useState(false);
      const [isBatchDeleting, setIsBatchDeleting] = React.useState(false);

      // [V2.3] 商品庫多選刪除
      const [productSelectMode, setProductSelectMode] = React.useState(false);
      const [selectedProductIds, setSelectedProductIds] = React.useState(() => new Set());
      const [confirmProductBatchDelete, setConfirmProductBatchDelete] = React.useState(false);
      const [isProductBatchDeleting, setIsProductBatchDeleting] = React.useState(false);

      // [V2.7] 回收桶與操作日誌
      const [trashOrders, setTrashOrders] = React.useState([]);
      const [trashProducts, setTrashProducts] = React.useState([]);
      const [isTrashOpen, setIsTrashOpen] = React.useState(false);
      const [isLogOpen, setIsLogOpen] = React.useState(false);
      const [isRestoreModalOpen, setIsRestoreModalOpen] = React.useState(false); // [v2.13.5] 還原JSON備份

      // ---------- [v2.14.0] 公版訊息 ----------
      const [messageTemplate, setMessageTemplate] = React.useState(() => sanitizeMessageTemplate(null));
      const [messageOrder, setMessageOrder] = React.useState(null); // 要產生訊息的訂單；有值時顯示「給客人的確認訊息」視窗
      const [isMessageTemplateOpen, setIsMessageTemplateOpen] = React.useState(false);
      const [isSavingMessageTemplate, setIsSavingMessageTemplate] = React.useState(false);

      // ---------- [黑名單 v2.12.5] ----------
      const [blacklist, setBlacklist] = React.useState([]);
      const [isBlacklistOpen, setIsBlacklistOpen] = React.useState(false);
      const [isBlacklistAddOpen, setIsBlacklistAddOpen] = React.useState(false);
      const [isSavingBlacklist, setIsSavingBlacklist] = React.useState(false);

      const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 2500);
      };

      // ------------------------------------------
      // Real-time Firebase Database Listeners (on)
      // ------------------------------------------
      React.useEffect(() => {
        setIsSyncing(true);

        // 1. Monitor Connection Status
        const connectedRef = db.ref('.info/connected');
        connectedRef.on('value', (snap) => {
          setIsConnected(snap.val() === true);
          setIsSyncing(false);
        });

        // 2. Listen to Orders Ref
        const ordersRef = dbRef('orders');
        ordersRef.on('value', (snapshot) => {
          const val = snapshot.val();
          if (!val) {
            setOrders([]);
          } else {
            const loadedOrders = Object.entries(val).map(([id, data]) => 
              sanitizeOrder({ ...data, id }) // [v2.13.3修正] id放最後，避免資料裡殘留的id欄位蓋掉Firebase真正的key
            );
            loadedOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setOrders(loadedOrders);
          }
          setIsSyncing(false);
        }, (error) => {
          console.error("RTDB Orders Error:", error);
          setIsSyncing(false);
          if (error && error.code === 'PERMISSION_DENIED') {
            setPermissionDenied(true);
          } else {
            showToast('⚠️ 雲端訂單同步異常，請檢查網路連線');
          }
        });

        // 3. Listen to Products Ref
        const productsRef = dbRef('products');
        productsRef.on('value', (snapshot) => {
          const val = snapshot.val();
          if (!val) {
            setProducts([]);
          } else {
            const loadedProducts = Object.entries(val).map(([id, data]) => 
              sanitizeProduct({ ...data, id }) // [v2.13.3修正] id放最後，確保Firebase真正的key永遠贏過資料裡可能殘留的舊id欄位
            );
            setProducts(loadedProducts);
          }
        }, (error) => {
          console.error("RTDB Products Error:", error);
        });

        // 4. [V2.12] Listen to Shipping Settings（資料庫沒有時用預設值，不會自動寫入）
        const shippingRef = dbRef('settings/shipping');
        shippingRef.on('value', (snapshot) => {
          setShippingConfig(sanitizeShippingConfig(snapshot.val()));
        }, (error) => {
          console.error("RTDB Shipping Config Error:", error);
        });

        // 4b. [v2.14.0] 公版訊息設定（資料庫沒有時用預設值，不會自動寫入）
        const messageTemplateRef = dbRef('settings/messageTemplate');
        messageTemplateRef.on('value', (snapshot) => {
          setMessageTemplate(sanitizeMessageTemplate(snapshot.val()));
        }, (error) => {
          console.error("RTDB Message Template Error:", error);
        });

        // 5. Listen to Tally States
        const tallyRef = dbRef('settings/tally');
        tallyRef.on('value', (snapshot) => {
          setTallyChecked(snapshot.val() || {});
        });

        // 5. [V2.7] 回收桶
        const trashRef = dbRef('trash');
        trashRef.on('value', (snapshot) => {
          const val = snapshot.val() || {};
          const build = (node, sanitize) => Object.entries(node || {})
            .map(([id, data]) => ({ ...sanitize({ ...data, id }), deletedAt: data.deletedAt || 0, deletedBy: data.deletedBy || '' })) // [v2.13.3修正] id放最後
            .sort((a, b) => b.deletedAt - a.deletedAt);
          setTrashOrders(build(val.orders, sanitizeOrder));
          setTrashProducts(build(val.products, sanitizeProduct));
        }, (error) => {
          console.error("RTDB Trash Error:", error);
        });

        // 6. [黑名單 v2.12.5]
        const blacklistRef = dbRef('blacklist');
        blacklistRef.on('value', (snapshot) => {
          const val = snapshot.val();
          if (!val) {
            setBlacklist([]);
          } else {
            const loaded = Object.entries(val).map(([id, data]) => sanitizeBlacklistEntry(data, id));
            loaded.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setBlacklist(loaded);
          }
        }, (error) => {
          console.error("RTDB Blacklist Error:", error);
        });

        return () => {
          ordersRef.off();
          productsRef.off();
          tallyRef.off();
          shippingRef.off();
          trashRef.off();
          blacklistRef.off();
          connectedRef.off();
        };
      }, []);

      React.useEffect(() => {
        if (IS_TEST_MODE) document.title = '🧪 [測試模式] ' + document.title.replace('🧪 [測試模式] ', '');
      }, []);

      // Dynamic calculation of lastOrderedAt based on actual live orders
      const enrichedProducts = React.useMemo(() => {
        const latestOrderMap = {};
        
        orders.forEach(order => {
          if (!order.items) return;
          const orderTime = order.timestamp || (order.createdAt ? new Date(order.createdAt).getTime() : 0);
          order.items.forEach(item => {
            const skuKey = item.sku ? item.sku.trim().toUpperCase() : null;
            const nameKey = item.name ? item.name.trim().toLowerCase() : null;

            if (skuKey) {
              if (!latestOrderMap[skuKey] || orderTime > latestOrderMap[skuKey]) {
                latestOrderMap[skuKey] = orderTime;
              }
            }
            if (nameKey) {
              if (!latestOrderMap[nameKey] || orderTime > latestOrderMap[nameKey]) {
                latestOrderMap[nameKey] = orderTime;
              }
            }
          });
        });

        return products.map(p => {
          const skuKey = p.sku ? p.sku.trim().toUpperCase() : null;
          const nameKey = p.name ? p.name.trim().toLowerCase() : null;

          let computedLastOrderTime = null;
          if (skuKey && latestOrderMap[skuKey]) {
            computedLastOrderTime = latestOrderMap[skuKey];
          } else if (nameKey && latestOrderMap[nameKey]) {
            computedLastOrderTime = latestOrderMap[nameKey];
          }

          let finalLastOrderedAt = p.lastOrderedAt;
          if (computedLastOrderTime) {
            finalLastOrderedAt = new Date(computedLastOrderTime).toISOString();
          }

          return {
            ...p,
            lastOrderedAt: finalLastOrderedAt
          };
        });
      }, [products, orders]);

      // Form state for new orders
      const [lineText, setLineText] = React.useState('');
      const [customerName, setCustomerName] = React.useState('');
      const [customerPhone, setCustomerPhone] = React.useState('');
      const [customerLine, setCustomerLine] = React.useState(''); // [V2.11]
      const [customerIg, setCustomerIg] = React.useState('');     // [V2.11]
      const [deliveryMethod, setDeliveryMethod] = React.useState('7-11 取貨付款');
      const [storeName, setStoreName] = React.useState('');
      const [storeAddress, setStoreAddress] = React.useState(''); // [v2.13.0新增] 門市地址／宅配地址，跟門市名稱分開存
      const [shippingFee, setShippingFee] = React.useState(DEFAULT_SHIPPING_CONFIG.fees['7-11 取貨付款']);
      const [shippingFeeAuto, setShippingFeeAuto] = React.useState(true); // 運費是否跟著物流方式/滿額自動帶入
      const [orderNote, setOrderNote] = React.useState('');
      
      const [orderItems, setOrderItems] = React.useState([]);

      const [currentItem, setCurrentItem] = React.useState({
        sku: '',
        name: '',
        color: '',
        size: 'F',
        price: 0,
        qty: 1
      });

      const [selectedProductRef, setSelectedProductRef] = React.useState(null);

      // [v2.13.4] 「加入此訂單品項」後是否保留欄位不清空（同商品要連續輸入不同花色/尺寸時使用）
      const [isKeepFieldsLocked, setIsKeepFieldsLocked] = React.useState(false);

      // [v2.13.4] 手動輸入商品名稱時的相似商品建議清單（debounce 400ms 後比對，避免每個按鍵都重算）
      const [nameSuggestions, setNameSuggestions] = React.useState([]);
      React.useEffect(() => {
        if (selectedProductRef) { setNameSuggestions([]); return; } // 已經是從商品庫選的，不需要再提示
        const handle = setTimeout(() => {
          setNameSuggestions(findSimilarProducts(currentItem.name, products));
        }, 400);
        return () => clearTimeout(handle);
      }, [currentItem.name, products, selectedProductRef]);

      // [V2.4] 快速帶入：搜尋 / 全部商品面板 / 自動捲動到編輯區
      const [pickerSearch, setPickerSearch] = React.useState('');
      const [isPickerPanelOpen, setIsPickerPanelOpen] = React.useState(false);
      const itemEditorRef = React.useRef(null);

      // [V2.8] 送出防連點：送出中鎖住按鈕；同一張訂單重試時沿用同一個訂單編號（重送只會覆蓋、不會多一張）
      const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);
      const pendingOrderKeyRef = React.useRef(null);

      // [V2.8] 訂單草稿：填到一半被打斷（切換 App、網頁被系統回收）時，內容不會消失
      const draftKey = `sprout_order_draft_${IS_TEST_MODE ? 'test' : 'prod'}_${user?.uid || 'anon'}`;
      const [draftReady, setDraftReady] = React.useState(false);
      const [draftRestored, setDraftRestored] = React.useState(false);

      React.useEffect(() => {
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const d = JSON.parse(raw);
            const isFresh = d && d.ts && (Date.now() - d.ts) < 7 * 86400000; // 草稿只保留 7 天
            if (isFresh) {
              setLineText(d.lineText || '');
              setCustomerName(d.customerName || '');
              setCustomerPhone(d.customerPhone || '');
              setCustomerLine(d.customerLine || '');
              setCustomerIg(d.customerIg || '');
              setDeliveryMethod(d.deliveryMethod || '7-11 取貨付款');
              setStoreName(d.storeName || '');
              setStoreAddress(d.storeAddress || '');
              setShippingFee(Number.isFinite(Number(d.shippingFee)) ? Number(d.shippingFee) : DEFAULT_SHIPPING_CONFIG.fees['7-11 取貨付款']);
              setShippingFeeAuto(false); // 還原草稿代表她可能已經自己調過運費，先不要再自動覆蓋
              setOrderNote(d.orderNote || '');
              setOrderItems(Array.isArray(d.orderItems) ? d.orderItems.map(sanitizeItem) : []);
              setDraftRestored(true);
            } else {
              localStorage.removeItem(draftKey);
            }
          }
        } catch (err) {
          console.error('Draft restore error:', err);
        }
        setDraftReady(true); // 還原完成後才開始自動存檔，避免一開始的空白表單把草稿蓋掉
      }, []);

      React.useEffect(() => {
        if (!draftReady) return;
        try {
          const hasContent = lineText.trim() || customerName.trim() || customerPhone.trim() ||
            customerLine.trim() || customerIg.trim() ||
            storeName.trim() || storeAddress.trim() || orderNote.trim() || orderItems.length > 0;
          if (!hasContent) {
            localStorage.removeItem(draftKey);
            return;
          }
          localStorage.setItem(draftKey, JSON.stringify({
            ts: Date.now(), lineText, customerName, customerPhone, customerLine, customerIg, deliveryMethod,
            storeName, storeAddress, shippingFee, orderNote, orderItems
          }));
        } catch (err) {
          // 私密瀏覽模式等情況無法儲存草稿，不影響正常使用
        }
      }, [draftReady, lineText, customerName, customerPhone, customerLine, customerIg, deliveryMethod, storeName, storeAddress, shippingFee, orderNote, orderItems]);

      const handleDiscardDraft = () => {
        setLineText('');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerLine('');
        setCustomerIg('');
        setStoreName('');
        setStoreAddress('');
        setOrderNote('');
        setOrderItems([]);
        setSelectedProductRef(null);
        setDraftRestored(false);
        setShippingFeeAuto(true);
        setShippingFee(suggestShippingFee(deliveryMethod, 0, shippingConfig));
        try { localStorage.removeItem(draftKey); } catch (err) { /* ignore */ }
      };

      // 登出時一併清掉這台裝置上的草稿（草稿含客人資料）
      const handleSignOut = () => {
        try { localStorage.removeItem(draftKey); } catch (err) { /* ignore */ }
        if (onSignOut) onSignOut();
      };

      // Search and filters for orders
      const [searchTerm, setSearchTerm] = React.useState('');
      const [filterPayment, setFilterPayment] = React.useState('all');
      const [filterShipment, setFilterShipment] = React.useState('all');
      const [filterDate, setFilterDate] = React.useState('all'); // [V2.6] 'all' 或 'YYYY-MM-DD'
      const [filterDelivery, setFilterDelivery] = React.useState('all'); // [V2.1] 'all' | '7-11' | '全家' | '宅配'
      const [expandedOrders, setExpandedOrders] = React.useState({});

      // Smart Text Parser for Orders
      const handleParseLineText = () => {
        if (!lineText.trim()) {
          showToast('請先貼上顧客的對話訊息！');
          return;
        }

        let name = '';
        let phone = '';
        let store = '';     // 門市名稱
        let address = '';   // 地址
        let delivery = deliveryMethod;

        const phoneMatch = lineText.match(/(?:電話|手機|tel|phone)?[:：\s]*(\+?\d{8,15}|09\d{8}|\d{3}[-\s]?\d{3}[-\s]?\d{4})/i) || lineText.match(/(09\d{2}[-\s]?\d{3}[-\s]?\d{3})/);
        if (phoneMatch) {
          phone = phoneMatch[1].replace(/[-\s]/g, '');
        }

        // 找出「整行」含有關鍵字的那一行，而不是只抓關鍵字後面的文字——
        // 避免像「世貿門市 (地址)」這種店名本身就包含「門市」兩字時，
        // 把「世貿」誤判成關鍵字前綴而被丟掉（v2.13.0 修正的 bug）。
        const findLine = (regex) => {
          const lines = lineText.split('\n').map(l => l.trim()).filter(Boolean);
          return lines.find(l => regex.test(l)) || '';
        };

        // 把整行文字拆成「門市名稱」跟「地址」：
        // 先去掉「門市:」「店名:」這種明確的標籤字首，再嘗試抓「名稱 (地址)」的括號寫法。
        // 注意：「全家」「7-11」這類品牌字不能當標籤去除，否則像「全家松山店」會被誤刪成「松山店」。
        const extractStoreParts = (line) => {
          if (!line) return { store: '', address: '' };
          const stripped = line.replace(/^(?:門市|店名|地址|宅配)[:：\s]*/i, '').trim();
          const cleaned = stripped || line.trim();
          const bracketMatch = cleaned.match(/^(.*?)[\s]*[（(]([^）)]+)[）)]\s*$/);
          if (bracketMatch) {
            return { store: bracketMatch[1].trim(), address: bracketMatch[2].trim() };
          }
          return { store: cleaned, address: '' };
        };

        if (/全家|familymart/i.test(lineText)) {
          delivery = '全家取貨付款';
          const parts = extractStoreParts(findLine(/全家|familymart|門市|店名/i));
          store = parts.store;
          address = parts.address;
        } else if (/宅配|郵寄/i.test(lineText) || /地址[:：\s]/i.test(lineText)) {
          delivery = '宅配到府';
          const line = findLine(/地址|宅配|郵寄/i);
          const parts = extractStoreParts(line);
          // 宅配沒有「門市名稱」的概念，抓到的內容整段當地址
          address = (parts.store && parts.address) ? `${parts.store} ${parts.address}` : (parts.address || parts.store);
        } else {
          delivery = '7-11 取貨付款';
          const parts = extractStoreParts(findLine(/7-11|711|7-eleven|門市|店名/i));
          store = parts.store;
          address = parts.address;
        }

        const nameMatch = lineText.match(/(?:姓名|名字|收件人|稱呼)[:：\s]*([^\n,，]+)/i);
        if (nameMatch) {
          name = nameMatch[1].trim();
        } else {
          const lines = lineText.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 0 && !lines[0].match(/\d{8,}/) && lines[0].length <= 20) {
            name = lines[0].replace(/^(姓名|名字|收件人)[:：\s]*/i, '');
          }
        }

        if (name) setCustomerName(name);
        if (phone) setCustomerPhone(phone);
        if (store) setStoreName(store);
        if (address) setStoreAddress(address);
        setDeliveryMethod(delivery);

        showToast('✨ 智慧解析對話成功！');
      };

      // [V2.12] 選物流方式：運費若仍是「自動帶入」狀態，依新方式與目前小計重新建議
      const handleSelectDeliveryMethod = (method) => {
        setDeliveryMethod(method);
        if (shippingFeeAuto) {
          setShippingFee(suggestShippingFee(method, currentOrderSubtotal, shippingConfig));
        }
      };

      const handleShippingFeeInput = (val) => {
        setShippingFee(val);
        setShippingFeeAuto(false); // 使用者手動改過，這張訂單之後不再自動覆蓋
      };

      const handleSelectProductFromLibrary = (prod) => {
        setSelectedProductRef(prod);
        const sizeList = splitProductOptions(prod.sizes);
        const colorList = splitProductOptions(prod.colors);

        // [v2.13.4] 選到單一規格商品（顏色、尺寸都只有1種）時自動解鎖，
        // 避免使用者忘記解鎖，讓下一個不相關的商品也被鎖住不清空
        if (isKeepFieldsLocked && isSingleVariantProduct(prod)) {
          setIsKeepFieldsLocked(false);
        }

        setCurrentItem({
          sku: prod.sku || '',
          name: prod.name,
          price: prod.price,
          color: colorList[0] || '',
          size: sizeList[0] || 'F',
          qty: 1
        });
        showToast(`已選取商品：「${prod.name}」`);
      };

      const handleQuickSelectToOrder = (prod) => {
        handleSelectProductFromLibrary(prod);
        setActiveTab('add');
      };

      // 同款（款號/品名/顏色/尺寸/單價都相同）再加入時，合併成同一行並累加數量
      const addOrMergeItem = (rawItem) => {
        const item = sanitizeItem(rawItem);
        setOrderItems(prev => {
          const idx = prev.findIndex(x =>
            x.sku === item.sku && x.name === item.name && x.color === item.color &&
            x.size === item.size && x.price === item.price
          );
          if (idx === -1) return [...prev, item];
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
          return next;
        });
      };

      // [v2.13.4] 手動輸入商品時完全找不到相似商品，使用者選擇「順便建立新商品」→ 用這次輸入的品名/單價/顏色/尺寸建立
      const handleCreateProductFromOrderItem = async (item) => {
        const name = String(item.name || '').trim();
        if (!name) return;
        const sku = String(item.sku || '').trim();

        // 款號不能跟既有商品重複（含回收桶），跟商品庫「新增商品」用同一套規則；為避免擋住訂單，衝突時只跳過建立，不影響加入訂單
        if (sku) {
          const skuKey = sku.toUpperCase();
          const clash = products.find(p => String(p.sku || '').trim().toUpperCase() === skuKey);
          if (clash) {
            showToast(`款號 ${sku} 已被「${clash.name}」使用，這次先不建立新商品，請自行到商品庫處理`);
            return;
          }
        }

        const prodData = {
          sku,
          name,
          price: Number(item.price) || 0,
          sizes: String(item.size || 'F').trim() || 'F',
          colors: String(item.color || '').trim() || '預設',
          category: inferCategoryFromTitle(name, ''),
          note: '',
          status: 'active',
          pinned: false,
          imageUrl: '',
          createdAt: new Date().toISOString()
        };

        try {
          const newRef = dbRef('products').push();
          await withSyncTracking(newRef.set(prodData));
          logAction('product_create', 'product', newRef.key, `新增商品：${prodData.name}（$${prodData.price}）（從新增訂單順便建立）`);
          showToast(`🎉 已順便建立新商品：「${name}」`);
        } catch (err) {
          console.error('Create product from order item error:', err);
          showToast('❌ 建立新商品失敗，這筆訂單品項仍會照常加入');
        }
      };

      const handleAddItemToOrder = () => {
        if (!currentItem.name.trim()) {
          showToast('請輸入商品名稱或從商品庫選擇！');
          return;
        }

        // [v2.13.4] 價格為0或空白時直接擋下，不給加入購物清單（避免漏填價格的訂單被送出）
        if (!(Number(currentItem.price) > 0)) {
          showToast('❌ 請輸入商品單價（不能是0或空白）');
          return;
        }

        // [v2.13.4] 單價比商品庫定價低時，送出前再跟使用者確認一次，避免不小心改低價吃掉利潤
        if (selectedProductRef && Number(currentItem.price) < Number(selectedProductRef.price || 0)) {
          const confirmLowPrice = window.confirm(
            `單價 $${currentItem.price} 比商品庫定價 $${selectedProductRef.price} 低，確定要用這個價格加入嗎？`
          );
          if (!confirmLowPrice) return; // 取消就不加入，留在原畫面讓她修改
        }

        // [v2.13.4] 手動輸入且完全找不到相似商品時，詢問是否順便建立為新商品
        // 這裡重新即時計算一次（不直接讀 nameSuggestions），因為那個 state 有 400ms debounce，
        // 剛打完字馬上按「加入」的話 nameSuggestions 可能還是舊的，會誤判。
        if (!selectedProductRef) {
          const freshMatches = findSimilarProducts(currentItem.name, products);
          if (freshMatches.length === 0) {
            const wantCreate = window.confirm(
              `商品庫中沒有找到跟「${currentItem.name.trim()}」相似的商品，要不要順便建立為新商品？`
            );
            if (wantCreate) {
              handleCreateProductFromOrderItem(currentItem);
            }
          }
        }

        addOrMergeItem(currentItem);

        // [v2.13.4] 決定加入後要不要完全清空：
        // 1. 鎖頭上鎖時，一律不完全清空（不用再跳確認）。
        // 2. 沒上鎖但這個商品（從商品庫選或建議帶入的）有多種顏色/尺寸時，跳出確認問要不要保留繼續輸入同商品的其他規格。
        const isMultiSpec = !!selectedProductRef && !isSingleVariantProduct(selectedProductRef);
        let keepFields = isKeepFieldsLocked;
        if (!keepFields && isMultiSpec) {
          keepFields = window.confirm(
            `「${currentItem.name.trim()}」有多種花色/尺寸，要保留款號/名稱/單價繼續輸入其他規格嗎？\n（選取消會清空全部欄位）`
          );
        }

        if (keepFields) {
          // 保留款號/名稱/單價，只清空顏色/尺寸、數量重置為1，方便繼續輸入同商品的其他規格
          // selectedProductRef 也保留，畫面上的顏色/尺寸快捷點選才會繼續顯示
          setCurrentItem(prev => ({ ...prev, color: '', size: 'F', qty: 1 }));
        } else {
          // 完全清空，避免下一筆手動輸入沿用上一個商品的資料
          setCurrentItem({
            sku: '',
            name: '',
            color: '',
            size: 'F',
            price: 0,
            qty: 1
          });
          setSelectedProductRef(null);
        }
        setNameSuggestions([]);
        showToast('已加入購物清單！');
      };

      // [v2.13.4] 點選「相似商品建議」：完全套用商品庫資料（款號/名稱/價格/顏色/尺寸），
      // 跟從商品庫選取的行為一致，若有多種顏色/尺寸會自動選第一個、並跳出快捷點選讓使用者換規格，
      // 換完再按「加入此訂單品項」即可（不用另外做一個彈窗視窗）。
      const handleApplySuggestedProduct = (product) => {
        handleSelectProductFromLibrary(product);
        setNameSuggestions([]);
      };

      const handleRemoveOrderItem = (id) => {
        setOrderItems(prev => prev.filter(item => item.id !== id));
      };

      // [V2.4] 熱銷排序（依訂單歷史，越近的訂單權重越高）
      const quickPickData = React.useMemo(() => {
        const { scores, recent } = computeProductScores(enrichedProducts, orders);
        const lists = buildQuickPickLists(enrichedProducts, scores);
        // 手機版：常用區 + 新品 依排序取前 3～4 個（其餘在手機上隱藏，桌機仍完整顯示）
        const mobileIds = pickMobileVisibleIds([...lists.quick, ...lists.fresh]);
        return { scores, recent, mobileIds, ...lists };
      }, [enrichedProducts, orders]);

      const pickerSearchResults = React.useMemo(() => {
        const q = pickerSearch.trim().toLowerCase();
        if (!q) return [];
        return quickPickData.allSorted.filter(p =>
          [p.name, p.sku, p.colors, p.note, p.category].some(v => String(v || '').toLowerCase().includes(q))
        );
      }, [pickerSearch, quickPickData]);

      // 選取商品 → 帶入下方編輯區，並捲動到編輯區讓手機使用者看得到
      const handlePickProduct = (prod) => {
        handleSelectProductFromLibrary(prod);
        setPickerSearch('');
        setIsPickerPanelOpen(false);
        setTimeout(() => {
          itemEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 80);
      };

      // 單一規格商品：一鍵直接加入 1 件（重複點會累加數量）
      const handleQuickAddProduct = (prod) => {
        addOrMergeItem({
          sku: prod.sku || '',
          name: prod.name,
          price: prod.price,
          color: splitProductOptions(prod.colors)[0] || '',
          size: splitProductOptions(prod.sizes)[0] || 'F',
          qty: 1
        });
        showToast(`已加入：${prod.name}`);
      };

      const handleTogglePinProduct = async (prod) => {
        try {
          await withSyncTracking(dbRef(`products/${prod.id}`).update({ pinned: !prod.pinned }));
          showToast(prod.pinned ? '已取消釘選' : `📌 已釘選：${prod.name}`);
        } catch (err) {
          console.error("Toggle pin error:", err);
          showToast('❌ 釘選失敗，請檢查網路連線');
        }
      };

      const currentOrderSubtotal = React.useMemo(() => {
        return orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      }, [orderItems]);

      // [黑名單 v2.12.8] 邊填顧客資料邊即時比對，不用等到送出才發現
      const liveBlacklistMatch = React.useMemo(() => {
        return findBlacklistMatches(
          { name: customerName, phone: customerPhone, line: customerLine, ig: customerIg },
          blacklist
        );
      }, [customerName, customerPhone, customerLine, customerIg, blacklist]);

      const currentOrderTotal = currentOrderSubtotal + Number(shippingFee || 0);

      // 商品增減可能讓小計跨過「滿額免運」門檻；只在使用者還沒手動改過運費時才自動更新
      React.useEffect(() => {
        if (!shippingFeeAuto) return;
        setShippingFee(suggestShippingFee(deliveryMethod, currentOrderSubtotal, shippingConfig));
      }, [currentOrderSubtotal, deliveryMethod, shippingConfig, shippingFeeAuto]);

      // Create New Order in RTDB
      // ==========================================
      // [V2.9] 連線狀態：待同步計數 + 大量操作的連線檢查
      // Firebase 網頁版的離線寫入只存在記憶體，網頁一關就沒了，
      // 所以斷線時要明白告訴使用者「先暫存、請保持網頁開著」。
      // ==========================================
      const [pendingSyncCount, setPendingSyncCount] = React.useState(0);

      // 包住所有寫入：期間計入「尚未同步」，完成或失敗才扣掉
      const withSyncTracking = async (promise) => {
        setPendingSyncCount(n => n + 1);
        try {
          return await promise;
        } finally {
          setPendingSyncCount(n => Math.max(0, n - 1));
        }
      };

      // 大量操作（匯入、批次刪除、還原、清空）在沒有網路時直接擋下，避免大批資料只存在記憶體裡
      const requireConnection = (actionLabel) => {
        if (isConnected) return true;
        showToast(`📵 目前沒有網路，${actionLabel}請連上網路後再操作`);
        return false;
      };

      // ==========================================
      // [V2.7] 操作日誌 + 回收桶：共用工具
      // ==========================================
      const userEmail = user?.email || '';

      // 寫入日誌（失敗不影響主要操作）。日誌只記姓名與金額，不記電話、地址。
      const cleanForDb = (obj) => JSON.parse(JSON.stringify(obj));
      const logAction = (action, target, targetId, summary, extra = {}) => {
        try {
          dbRef('logs').push({
            ts: Date.now(),
            user: userEmail,
            action,
            target,
            targetId: targetId || '',
            summary,
            ...cleanForDb(extra)
          }).catch((err) => console.error('Log write error:', err));
        } catch (err) {
          console.error('Log error:', err);
        }
      };

      // 要放進回收桶的資料：去掉 id（id 當作路徑），加上刪除時間與刪除者
      const trashEntry = (data) => {
        const { id, ...rest } = data;
        return cleanForDb({ ...rest, deletedAt: Date.now(), deletedBy: userEmail });
      };

      const summarizeNames = (names) => {
        const shown = names.slice(0, 5).join('、');
        return names.length > 5 ? `${shown} 等 ${names.length} 筆` : shown;
      };

      const handleSubmitNewOrder = async (e) => {
        e.preventDefault();
        if (isSubmittingOrder) return; // 送出中，忽略重複點擊

        if (!customerName.trim()) {
          showToast('請輸入顧客姓名！');
          return;
        }
        if (orderItems.length === 0) {
          showToast('請至少新增一項商品！');
          return;
        }

        // 這張訂單的固定編號：第一次送出時產生，重試時沿用。就算前一次其實已寫入、只是沒收到回覆，
        // 重送也只會覆蓋同一筆，不會多出一張。
        const orderKey = pendingOrderKeyRef.current || (pendingOrderKeyRef.current = dbRef('orders').push().key);

        const newOrderObj = {
          customerName,
          customerPhone,
          customerLine: customerLine.trim(),
          customerIg: customerIg.trim(),
          deliveryMethod,
          storeName,
          storeAddress: storeAddress.trim(),
          shippingFee: Number(shippingFee),
          paymentStatus: false,
          shipmentStatus: 'unshipped',
          items: orderItems,
          note: orderNote,
          createdAt: new Date().toLocaleString('zh-TW', { hour12: false }),
          timestamp: Date.now()
        };

        // 最近 3 天內已經有看起來相同的訂單（同客人、同商品、同金額）→ 先提醒，由使用者決定
        const dup = findDuplicateOrder({ ...newOrderObj, id: orderKey }, orders, 3);
        if (dup && !window.confirm(
          `最近 3 天內已經有一筆看起來相同的訂單：\n${dup.customerName}　$${calcOrderTotal(dup)}　${formatOrderStamp(dup)} 建立\n\n仍要建立這一筆嗎？`
        )) {
          return;
        }

        // [黑名單 v2.12.7] 比對顧客資料是否命中黑名單，命中僅提醒、不強制攔截，由使用者自行判斷是否仍要送出
        const blacklistMatch = findBlacklistMatches(
          { name: customerName, phone: customerPhone, line: customerLine, ig: customerIg },
          blacklist
        );
        if (blacklistMatch.level !== 'none') {
          const hitLabels = blacklistMatch.hits.map((h) => {
            const e = h.entry;
            const fieldNames = h.fields.map((f) => ({ phone: '電話', ig: 'IG', line: 'LINE', name: '姓名' }[f])).join('/');
            return `${e.name || e.phone || e.ig || e.line || '（未填資料）'}（${fieldNames}相符${e.reason ? '，原因：' + e.reason : ''}）`;
          }).join('\n');
          const warnTitle = blacklistMatch.level === 'strong'
            ? '⚠️ 這位顧客的電話/IG/LINE 符合黑名單紀錄：'
            : '⚠️ 這位顧客的姓名跟黑名單紀錄相同（僅姓名相符，請自行確認是否為同一人）：';
          if (!window.confirm(`${warnTitle}\n${hitLabels}\n\n仍要建立這筆訂單嗎？`)) {
            return;
          }
        }

        setIsSubmittingOrder(true);
        // 已經知道沒網路 → 立刻說明；網路慢 → 8 秒後才提示，避免一般情況下干擾
        if (!isConnected) {
          showToast('📵 沒有網路：訂單先暫存在手機，請保持網頁開著，連上網路後會自動送出');
        }
        const slowTimer = isConnected ? setTimeout(() => {
          showToast('⏳ 網路較慢，仍在送出中…請不要重複按，恢復連線後會自動完成');
        }, 8000) : null;

        try {
          await withSyncTracking(dbRef(`orders/${orderKey}`).set(newOrderObj));
          pendingOrderKeyRef.current = null; // 成功了，下一張訂單用新的編號
          logAction('order_create', 'order', orderKey, `建立訂單：${customerName}（$${calcOrderTotal(newOrderObj)}）`);

          setCustomerName('');
          setCustomerPhone('');
          setCustomerLine('');
          setCustomerIg('');
          setStoreName('');
          setStoreAddress(''); // [v2.13.4修正] 之前拆分門市名稱/地址時漏了這行，地址欄位送出後不會清空
          setOrderNote('');
          setOrderItems([]);
          setLineText('');
          setSelectedProductRef(null);
          setIsKeepFieldsLocked(false); // [v2.13.4] 避免鎖頭狀態帶到下一張訂單的第一個品項
          setNameSuggestions([]);
          setDraftRestored(false);
          setMessageOrder(newOrderObj); // [v2.14.0] 訂單存好後，彈出「給客人的確認訊息」讓她直接複製（選擇不複製也能之後從訂單卡片再開）
          setShippingFeeAuto(true);
          setShippingFee(suggestShippingFee(deliveryMethod, 0, shippingConfig));

          showToast('🎉 訂單已建立，已即時同步至雲端！');
          setActiveTab('list');
        } catch (err) {
          console.error("Add order error:", err);
          showToast('❌ 新增訂單失敗，請檢查權限或網路連線（內容還在，可以再按一次送出）');
        } finally {
          if (slowTimer) clearTimeout(slowTimer);
          setIsSubmittingOrder(false);
        }
      };

      const handleTogglePayment = async (orderId, currentStatus) => {
        try {
          await withSyncTracking(dbRef(`orders/${orderId}`).update({
            paymentStatus: !currentStatus
          }));
          const target = orders.find(o => o.id === orderId);
          logAction('order_payment', 'order', orderId, `付款狀態：${target?.customerName || ''}　${currentStatus ? '已付款' : '未付款'} → ${currentStatus ? '未付款' : '已付款'}`);
          showToast('更新付款狀態成功');
        } catch (err) {
          console.error("Toggle payment error:", err);
        }
      };

      const handleToggleShipment = async (orderId, currentStatus) => {
        try {
          await withSyncTracking(dbRef(`orders/${orderId}`).update({
            shipmentStatus: currentStatus === 'shipped' ? 'unshipped' : 'shipped'
          }));
          const target = orders.find(o => o.id === orderId);
          logAction('order_shipment', 'order', orderId, `出貨狀態：${target?.customerName || ''}　${currentStatus === 'shipped' ? '已出貨' : '待出貨'} → ${currentStatus === 'shipped' ? '待出貨' : '已出貨'}`);
          showToast('更新出貨狀態成功');
        } catch (err) {
          console.error("Toggle shipment error:", err);
        }
      };

      const handleDeleteOrderConfirm = async () => {
        if (!confirmDeleteId) return;
        const target = orders.find(o => o.id === confirmDeleteId);
        try {
          if (target) {
            // 一次寫入：從 orders 移除 + 放進 trash/orders（要嘛都成功、要嘛都不動）
            await withSyncTracking(dbRoot().update({
              [`orders/${target.id}`]: null,
              [`trash/orders/${target.id}`]: trashEntry(target)
            }));
            logAction('order_delete', 'order', target.id, `刪除訂單：${target.customerName}（$${calcOrderTotal(target)}）→ 回收桶`);
            showToast('🗑️ 訂單已移到回收桶（更多 → 回收桶 可還原）');
          }
        } catch (err) {
          console.error("Delete order error:", err);
          showToast('❌ 刪除失敗，請檢查網路連線或權限設定');
        } finally {
          setConfirmDeleteId(null);
        }
      };

      const handleToggleTallyCheck = async (key) => {
        const updated = { ...tallyChecked, [key]: !tallyChecked[key] };
        setTallyChecked(updated);
        try {
          await withSyncTracking(dbRef('settings/tally').set(updated));
        } catch (err) {
          console.error("Tally sync error:", err);
        }
      };

      // ==========================================
      // [V2.1] Order List Upgrade Actions
      // ==========================================

      // 編輯訂單：只把「有變動的欄位」寫回雲端，避免蓋掉別人同時修改的其他欄位
      const handleSaveEditedOrder = async (original, edited) => {
        const changes = {};
        Object.keys(edited).forEach((key) => {
          if (JSON.stringify(edited[key]) !== JSON.stringify(original[key])) {
            changes[key] = edited[key];
          }
        });

        if (Object.keys(changes).length === 0) {
          showToast('沒有任何變更');
          setEditingOrder(null);
          return;
        }

        try {
          await withSyncTracking(dbRef(`orders/${original.id}`).update(changes));

          // 日誌保留「修改前」的值，之後可以在日誌裡一鍵還原
          const before = {};
          Object.keys(changes).forEach(k => { before[k] = original[k]; });
          const labels = Object.keys(changes).map(k => ORDER_FIELD_LABELS[k] || k);
          logAction('order_edit', 'order', original.id, `編輯訂單：${edited.customerName}（${labels.join('、')}）`, { before, after: changes });

          showToast(`✅ 訂單「${edited.customerName}」已更新並同步雲端`);
          setEditingOrder(null);
        } catch (err) {
          console.error("Edit order error:", err);
          showToast('❌ 儲存訂單失敗，請檢查權限或網路連線');
        }
      };

      // 讀取訂單 Excel（每個工作表 = 一筆訂購單）→ 先進預覽，不直接寫入
      const handleOrderFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsOrderParsing(true);
        const reader = new FileReader();

        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const drafts = parseOrderExcelWorkbook(workbook, shippingConfig.fees['7-11 取貨付款']);

            if (drafts.length === 0) {
              showToast('⚠️ 未能解析出有效訂單，請確認 Excel 格式');
            } else {
              setOrderImportDrafts(drafts);
              setIsOrderImportModalOpen(true);
            }
          } catch (err) {
            console.error("Order Excel import error:", err);
            showToast('❌ 解析 Excel 檔案失敗，請檢查檔案格式');
          } finally {
            setIsOrderParsing(false);
          }
        };

        reader.onerror = () => {
          setIsOrderParsing(false);
          showToast('❌ 讀取檔案失敗');
        };

        reader.readAsArrayBuffer(file);
        e.target.value = ''; // 允許重複選同一個檔案
      };

      // 確認匯入：以「附加」方式一次寫入雲端（不會覆蓋現有訂單）
      const handleConfirmOrderImport = async (selectedDrafts, statusKey = 'pending') => {
        if (selectedDrafts.length === 0) {
          showToast('請至少勾選一筆訂單');
          return;
        }
        if (!requireConnection('匯入訂單')) return;

        const importStatus = ORDER_IMPORT_STATUS[statusKey] || ORDER_IMPORT_STATUS.pending;

        setIsOrderImporting(true);
        try {
          const now = Date.now();
          const updates = {};

          // 依「品名」對應商品庫的款號：理貨清單是用 款號+品名+顏色+尺寸 合併的，
          // 手動建立訂單帶的是商品庫款號，匯入的訂單也要一致，同一件商品才會併成同一張卡片。
          const skuByName = new Map();
          products.forEach(p => {
            const key = String(p.name || '').trim().toLowerCase();
            if (key && p.sku && !skuByName.has(key)) skuByName.set(key, p.sku);
          });

          selectedDrafts.forEach((draft, i) => {
            const newKey = dbRef('orders').push().key;
            const { excelTotal, orderTimestamp, yearSource, ...orderData } = draft; // yearSource 只供預覽用，不寫入資料庫
            const baseTs = orderTimestamp || now; // [V2.4] 以工作表名稱推算的建單日期為準
            const linkedItems = orderData.items.map(item => {
              if (item.sku || isAdjustmentItem(item)) return item;
              const matchedSku = skuByName.get(String(item.name || '').trim().toLowerCase());
              return matchedSku ? { ...item, sku: matchedSku } : item;
            });
            updates[newKey] = {
              ...orderData,
              paymentStatus: importStatus.paymentStatus,     // [V2.8] 由使用者在預覽視窗指定
              shipmentStatus: importStatus.shipmentStatus,
              items: linkedItems,
              createdAt: new Date(baseTs).toLocaleString('zh-TW', { hour12: false }),
              timestamp: baseTs - i // 同一天的訂單維持 Excel 由上到下的順序
            };
          });

          await withSyncTracking(dbRef('orders').update(updates));
          logAction('order_import', 'order', '', `匯入 Excel 訂單 ${selectedDrafts.length} 筆（${importStatus.label}）：${summarizeNames(selectedDrafts.map(d => d.customerName))}`);
          showToast(`🎉 成功匯入 ${selectedDrafts.length} 筆訂單至雲端！`);
          setIsOrderImportModalOpen(false);
          setOrderImportDrafts([]);
        } catch (err) {
          console.error("Order batch import error:", err);
          showToast('❌ 匯入過程發生錯誤，請檢查權限或網路連線');
        } finally {
          setIsOrderImporting(false);
        }
      };

      // 匯出目前「篩選結果」的訂單 Excel（含商品明細）
      const handleExportOrdersExcel = () => {
        if (filteredOrders.length === 0) {
          showToast('目前沒有訂單可供匯出');
          return;
        }

        const exportData = buildOrdersExportRows(filteredOrders);

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '訂單列表');
        XLSX.writeFile(wb, `小豆苗訂單列表_${new Date().toISOString().slice(0,10)}.xlsx`);
        showToast(`📊 已匯出 ${filteredOrders.length} 筆訂單 Excel！`);
      };

      // ---------- [V2.2] 多選刪除 ----------
      const toggleSelectMode = () => {
        setSelectMode(prev => !prev);
        setSelectedOrderIds(new Set());
      };

      const toggleSelectOrder = (id) => {
        setSelectedOrderIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      };

      const handleSelectAllFiltered = () => {
        const ids = filteredOrders.map(o => o.id);
        const allSelected = ids.length > 0 && ids.every(id => selectedOrderIds.has(id));
        setSelectedOrderIds(allSelected ? new Set() : new Set(ids));
      };

      // 快速選取「由 Excel 匯入」的訂單（清理試匯入的資料用）
      const handleSelectExcelImported = () => {
        const ids = filteredOrders.filter(o => o.note === '由 Excel 檔案匯入').map(o => o.id);
        setSelectedOrderIds(new Set(ids));
        showToast(ids.length > 0 ? `已選取 ${ids.length} 筆 Excel 匯入的訂單` : '目前顯示的訂單中沒有 Excel 匯入的訂單');
      };

      const handleBatchDeleteConfirm = async () => {
        // 只刪「目前畫面上看得到、且有勾選」的訂單，避免刪到被篩選隱藏的資料
        const targets = filteredOrders.filter(o => selectedOrderIds.has(o.id));
        if (targets.length === 0) return;
        if (!requireConnection('批次刪除')) return;

        setIsBatchDeleting(true);
        try {
          const updates = {};
          targets.forEach(o => {
            updates[`orders/${o.id}`] = null;                 // null = 從訂單移除
            updates[`trash/orders/${o.id}`] = trashEntry(o);  // 同時放進回收桶（一次寫入，要嘛全成功、要嘛全不動）
          });
          await withSyncTracking(dbRoot().update(updates));
          logAction('order_batch_delete', 'order', '', `批次刪除 ${targets.length} 筆訂單 → 回收桶：${summarizeNames(targets.map(o => o.customerName))}`);
          showToast(`🗑️ 已移到回收桶：${targets.length} 筆訂單`);
          setSelectedOrderIds(new Set());
          setSelectMode(false);
          setConfirmBatchDelete(false);
        } catch (err) {
          console.error("Batch delete error:", err);
          showToast('❌ 批次刪除失敗，請檢查權限或網路連線');
        } finally {
          setIsBatchDeleting(false);
        }
      };

      // ---------- [V2.3] 商品庫多選刪除 ----------
      const toggleProductSelectMode = () => {
        setProductSelectMode(prev => !prev);
        setSelectedProductIds(new Set());
      };

      const toggleSelectProduct = (id) => {
        setSelectedProductIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      };

      const handleSelectAllFilteredProducts = () => {
        const ids = filteredProducts.map(p => p.id);
        const allSelected = ids.length > 0 && ids.every(id => selectedProductIds.has(id));
        setSelectedProductIds(allSelected ? new Set() : new Set(ids));
      };

      // 快速選取「最近一次批次匯入」的商品：同一次匯入的商品建檔時間完全相同
      const handleSelectLatestImportBatch = () => {
        const groups = new Map();
        filteredProducts.forEach(p => {
          if (!p.createdAt) return;
          if (!groups.has(p.createdAt)) groups.set(p.createdAt, []);
          groups.get(p.createdAt).push(p.id);
        });
        const batches = Array.from(groups.entries()).filter(([, ids]) => ids.length >= 2);
        if (batches.length === 0) {
          showToast('目前顯示的商品中找不到批次匯入的紀錄');
          return;
        }
        batches.sort((a, b) => (a[0] < b[0] ? 1 : -1)); // 建檔時間新的在前
        const [, ids] = batches[0];
        setSelectedProductIds(new Set(ids));
        showToast(`已選取最近一次匯入的 ${ids.length} 項商品`);
      };

      const handleProductBatchDeleteConfirm = async () => {
        // 只刪「目前畫面上看得到、且有勾選」的商品
        const targets = filteredProducts
          .filter(p => selectedProductIds.has(p.id))
          .map(p => products.find(raw => raw.id === p.id) || p); // 回收桶存原始資料，不含即時計算的欄位
        if (targets.length === 0) return;
        if (!requireConnection('批次刪除')) return;

        setIsProductBatchDeleting(true);
        try {
          const updates = {};
          targets.forEach(p => {
            updates[`products/${p.id}`] = null;                 // null = 從商品庫移除
            updates[`trash/products/${p.id}`] = trashEntry(p);  // 同時放進回收桶
          });
          await withSyncTracking(dbRoot().update(updates));                       // 一次寫入：要嘛全成功、要嘛全不動
          logAction('product_batch_delete', 'product', '', `批次刪除 ${targets.length} 項商品 → 回收桶：${summarizeNames(targets.map(p => p.name))}`);
          showToast(`🗑️ 已移到回收桶：${targets.length} 項商品`);
          setSelectedProductIds(new Set());
          setProductSelectMode(false);
          setConfirmProductBatchDelete(false);
        } catch (err) {
          console.error("Product batch delete error:", err);
          showToast('❌ 批次刪除失敗，請檢查權限或網路連線');
        } finally {
          setIsProductBatchDeleting(false);
        }
      };

      // ---------- [V2.7] 回收桶：還原 / 永久刪除 ----------
      const handleRestoreTrash = async (kind, item) => {
        const { id, deletedAt, deletedBy, ...data } = item; // kind: 'orders' | 'products'
        const isOrder = kind === 'orders';
        if (!requireConnection('還原')) return;

        // [V2.7.2] 還原前先比對：目前已有「相同的訂單 / 同名商品」就提醒，由使用者決定要不要還原
        const dup = isOrder ? findDuplicateOrder(item, orders) : findDuplicateProduct(item, products);
        if (dup) {
          const msg = isOrder
            ? `目前已經有一筆看起來相同的訂單：\n${dup.customerName}　$${calcOrderTotal(dup)}　${formatOrderStamp(dup)} 建立\n\n仍要還原嗎？（還原後會有兩筆）`
            : `目前已經有同名的商品：「${dup.name}」\n\n仍要還原嗎？（還原後會有兩個同名商品）`;
          if (!window.confirm(msg)) return;
        }

        try {
          await withSyncTracking(dbRoot().update({
            [`${kind}/${id}`]: cleanForDb(data),
            [`trash/${kind}/${id}`]: null
          }));
          logAction(isOrder ? 'order_restore' : 'product_restore', isOrder ? 'order' : 'product', id,
            `還原${isOrder ? '訂單' : '商品'}：${isOrder ? item.customerName : item.name}`);
          showToast('♻️ 已還原');
        } catch (err) {
          console.error("Restore error:", err);
          showToast('❌ 還原失敗，請檢查網路連線');
        }
      };

      const handlePurgeTrash = async (kind, item) => {
        const isOrder = kind === 'orders';
        const label = isOrder ? item.customerName : item.name;
        if (!window.confirm(`確定要永久刪除「${label}」嗎？\n這個動作無法復原。`)) return;
        try {
          await withSyncTracking(dbRoot().update({ [`trash/${kind}/${item.id}`]: null }));
          logAction(isOrder ? 'order_purge' : 'product_purge', isOrder ? 'order' : 'product', item.id, `永久刪除${isOrder ? '訂單' : '商品'}：${label}`);
          showToast('已永久刪除');
        } catch (err) {
          console.error("Purge error:", err);
          showToast('❌ 刪除失敗');
        }
      };

      const handlePurgeAllTrash = async () => {
        const total = trashOrders.length + trashProducts.length;
        if (total === 0) return;
        if (!requireConnection('清空回收桶')) return;
        if (!window.confirm(`確定要清空回收桶嗎？\n共 ${total} 筆資料會被永久刪除，無法復原。`)) return;
        try {
          await withSyncTracking(dbRoot().update({ trash: null }));
          logAction('trash_purge_all', 'system', '', `清空回收桶（${trashOrders.length} 筆訂單、${trashProducts.length} 項商品）`);
          showToast('🧹 回收桶已清空');
        } catch (err) {
          console.error("Purge all error:", err);
          showToast('❌ 清空失敗');
        }
      };

      // ---------- [v2.13.5] 還原JSON備份 ----------
      // selections: [{node, label, filename, data, count}]；password: 使用者重新輸入的登入密碼
      // 回傳 [{node, label, count}] 給 modal 顯示結果摘要；任何一步失敗都會 throw，modal 接住顯示錯誤訊息
      const handlePerformRestore = async ({ selections, password }) => {
        if (!selections || selections.length === 0) {
          throw new Error('沒有選擇要還原的節點');
        }

        // 1. 用 Firebase Auth 真的重新驗證密碼（不是前端自己比對），密碼錯誤會在這裡直接 throw
        try {
          const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
          await firebase.auth().currentUser.reauthenticateWithCredential(credential);
        } catch (err) {
          console.error('Reauth error:', err);
          throw new Error('密碼不正確，請重新輸入');
        }

        if (!requireConnection('還原備份')) {
          throw new Error('目前沒有網路連線，無法還原');
        }

        // 2. 動手寫入前，先把「現在」選到的這幾個節點的資料各自下載一份，當作還原前的還原點
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          for (const sel of selections) {
            const snapshot = await dbRef(sel.node).once('value');
            const currentData = snapshot.val() || {};
            const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `還原前備份_${sel.node}_${timestamp}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          console.error('Safety backup download error:', err);
          throw new Error('自動備份「還原前資料」失敗，為安全起見已取消這次還原，請確認後再試一次');
        }

        // 3. 合併寫入：update() 只會新增/覆蓋同名的 key，不會刪除節點裡沒被提到的其他既有資料
        const summary = [];
        try {
          for (const sel of selections) {
            await withSyncTracking(dbRef(sel.node).update(sel.data));
            summary.push({ node: sel.node, label: sel.label, count: sel.count });
          }
        } catch (err) {
          console.error('Restore write error:', err);
          throw new Error('部分或全部節點寫入失敗，請檢查網路連線或權限設定（還原前的備份已下載，資料不會遺失）');
        }

        logAction(
          'restore_json_backup',
          'system',
          '',
          `還原JSON備份（合併寫入）：${summary.map(s => `${s.label} ${s.count}筆`).join('、')}`
        );
        return summary;
      };


      const handleRevertOrderEdit = async (entry) => {
        const order = orders.find(o => o.id === entry.targetId);
        if (!order) {
          showToast('這張訂單已不存在（可能已在回收桶，請先還原訂單）');
          return;
        }
        if (!entry.before) return;
        const labels = Object.keys(entry.before).map(k => ORDER_FIELD_LABELS[k] || k);
        if (!window.confirm(`要把「${order.customerName}」的這些欄位還原到修改前嗎？\n${labels.join('、')}\n（之後又改過的內容會被蓋回去）`)) return;

        try {
          const current = {};
          Object.keys(entry.before).forEach(k => { current[k] = order[k]; }); // 還原前的值，也記進日誌，之後還能再改回來
          await withSyncTracking(dbRef(`orders/${entry.targetId}`).update(entry.before));
          logAction('order_edit_revert', 'order', entry.targetId, `還原修改：${order.customerName}（${labels.join('、')}）`, { before: current, after: entry.before });
          showToast('↩︎ 已還原到修改前');
        } catch (err) {
          console.error("Revert error:", err);
          showToast('❌ 還原失敗，請檢查網路連線');
        }
      };

      // ---------- [V2.12] 運費與折扣設定：儲存 ----------
      // [v2.14.0] 儲存公版訊息設定
      const handleSaveMessageTemplate = async (newTemplate) => {
        if (!requireConnection('儲存公版訊息')) return;
        setIsSavingMessageTemplate(true);
        try {
          await withSyncTracking(dbRef('settings/messageTemplate').set(cleanForDb(newTemplate)));
          logAction('settings_edit', 'system', '', `更新公版訊息設定（優惠規則 ${newTemplate.discounts.length} 條）`);
          showToast('✅ 公版訊息設定已更新');
          setIsMessageTemplateOpen(false);
        } catch (err) {
          console.error("Save message template error:", err);
          showToast('❌ 儲存失敗，請檢查網路連線');
        } finally {
          setIsSavingMessageTemplate(false);
        }
      };

      const handleSaveShippingConfig = async (newConfig) => {
        setIsSavingShippingConfig(true);
        try {
          await withSyncTracking(dbRef('settings/shipping').set(newConfig));
          logAction('settings_edit', 'system', '', `更新運費與折扣設定：${DELIVERY_METHODS.map(({ key, short }) => `${short}=$${newConfig.fees[key]}`).join('、')}；滿$${newConfig.freeShippingThreshold}${newConfig.freeShippingEnabled ? '免運' : '（未啟用）'}`);
          showToast('✅ 運費與折扣設定已更新');
          setIsShippingSettingsOpen(false);
        } catch (err) {
          console.error("Save shipping config error:", err);
          showToast('❌ 儲存失敗，請檢查網路連線');
        } finally {
          setIsSavingShippingConfig(false);
        }
      };

      // ---------- [黑名單 v2.12.5] ----------
      const handleAddBlacklist = async (entry) => {
        setIsSavingBlacklist(true);
        try {
          const ref = dbRef('blacklist').push();
          await withSyncTracking(ref.set({
            ...entry,
            createdAt: new Date().toLocaleString('zh-TW', { hour12: false }),
            timestamp: Date.now(),
            createdBy: userEmail,
          }));
          logAction('blacklist_create', 'system', ref.key, `加入黑名單：${entry.name || entry.phone || entry.ig || entry.line || '（未填資料）'}`);
          showToast('✅ 已加入黑名單');
          setIsBlacklistAddOpen(false);
        } catch (err) {
          console.error("Add blacklist error:", err);
          showToast('❌ 新增失敗，請檢查網路連線');
        } finally {
          setIsSavingBlacklist(false);
        }
      };

      const handleDeleteBlacklist = async (entry) => {
        const label = entry.name || entry.phone || entry.ig || entry.line || '（未填資料）';
        if (!window.confirm(`確定要將「${label}」從黑名單移除嗎？\n（黑名單移除不進回收桶，如需要可以再手動加回來）`)) return;
        try {
          await withSyncTracking(dbRef(`blacklist/${entry.id}`).remove());
          logAction('blacklist_delete', 'system', entry.id, `移除黑名單：${label}`);
          showToast('已移除黑名單');
        } catch (err) {
          console.error("Delete blacklist error:", err);
          showToast('❌ 移除失敗，請檢查網路連線');
        }
      };

      // ---------- [V2.2] 測試模式 ----------
      const handleToggleTestMode = () => {
        const url = new URL(window.location.href);
        if (IS_TEST_MODE) url.searchParams.delete('mode');
        else url.searchParams.set('mode', 'test');
        window.location.href = url.toString();
      };

      const handleResetTestData = async () => {
        if (!IS_TEST_MODE) return; // 安全鎖：只有測試模式才能整批清空
        if (!requireConnection('清空測試資料')) return;
        if (!window.confirm('確定要清空「測試模式」的所有資料嗎？\n（正式資料不會受影響）')) return;
        try {
          await db.ref('test').remove();
          showToast('🧹 測試資料已全部清空（商品庫會回到範例商品）');
        } catch (err) {
          console.error("Reset test data error:", err);
          showToast('❌ 清空失敗，請檢查 Firebase Rules 權限');
        }
      };

      const handleClearOrderFilters = () => {
        setSearchTerm('');
        setFilterPayment('all');
        setFilterShipment('all');
        setFilterDelivery('all');
        setFilterDate('all');
        setExpandedOrders({});
      };

      // [V2.6] 日期篩選：點同一個日期再點一次 = 取消；換日期時重置手動展開狀態
      const handleSelectDateFilter = (key) => {
        setFilterDate(prev => (key === 'all' || prev === key ? 'all' : key));
        setExpandedOrders({});
      };

      const handlePickDate = (value) => {
        if (!value) return;
        setFilterDate(value);
        setExpandedOrders({});
      };

      // [V2.6] 全部展開 / 全部收合（作用在目前顯示的訂單）
      const handleSetAllExpanded = (expanded) => {
        const next = {};
        filteredOrders.forEach(o => { next[o.id] = expanded; });
        setExpandedOrders(prev => ({ ...prev, ...next }));
      };

      // ==========================================
      // Product Library V5.1 Actions
      // ==========================================
      const handleOpenAddProductModal = () => {
        productImageSessionKeyRef.current = `new_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        setEditingProduct({
          id: null,
          sku: '',
          name: '',
          price: 0,
          sizes: 'S, M, L, XL',
          colors: '黑色, 白色',
          category: '服飾',
          note: '',
          status: 'active',
          pinned: false,
          imageUrl: ''
        });
        setIsProductModalOpen(true);
      };

      const handleOpenEditProductModal = (prod) => {
        setEditingProduct({ ...prod });
        setIsProductModalOpen(true);
      };

      const handleSaveProductModal = async (e) => {
        e.preventDefault();
        if (!editingProduct.name.trim()) {
          showToast('請輸入商品名稱！');
          return;
        }

        const category = inferCategoryFromTitle(editingProduct.name, editingProduct.category);
        const prodData = {
          sku: editingProduct.sku.trim(),
          name: editingProduct.name.trim(),
          price: Number(editingProduct.price) || 0,
          sizes: editingProduct.sizes.trim() || 'F',
          colors: editingProduct.colors.trim() || '預設',
          category,
          note: editingProduct.note.trim(),
          status: editingProduct.status || 'active',
          pinned: Boolean(editingProduct.pinned),
          imageUrl: editingProduct.imageUrl || '', // [商品圖片 v2.12.9]
          createdAt: editingProduct.createdAt || new Date().toISOString()
        };

        // [V2.8] 款號不能跟別的商品重複（款號是訂單、熱銷統計對應商品的依據）
        const skuKey = prodData.sku.toUpperCase();
        if (skuKey) {
          const clash = products.find(p => p.id !== editingProduct.id && String(p.sku || '').trim().toUpperCase() === skuKey);
          if (clash) {
            showToast(`款號 ${prodData.sku} 已被「${clash.name}」使用，請換一個`);
            return;
          }
        }

        try {
          if (editingProduct.id) {
            await withSyncTracking(dbRef(`products/${editingProduct.id}`).update(prodData));
            logAction('product_edit', 'product', editingProduct.id, `編輯商品：${prodData.name}`);
            showToast('已成功更新商品資料！');
          } else {
            const newRef = dbRef('products').push();
            await newRef.set(prodData);
            logAction('product_create', 'product', newRef.key, `新增商品：${prodData.name}（$${prodData.price}）`);
            showToast('🎉 新商品已新增至雲端庫！');
          }
          setIsProductModalOpen(false);
          setEditingProduct(null);
        } catch (err) {
          console.error("Save product error:", err);
          showToast('❌ 儲存商品失敗');
        }
      };

      const handleDuplicateProduct = async (prod) => {
        try {
          // 複製商品的款號：加上 _copy，若已被使用就繼續加 _copy2、_copy3…
          let copySku = '';
          if (prod.sku) {
            const used = new Set(products.map(p => String(p.sku || '').trim().toUpperCase()));
            let n = 1;
            copySku = `${prod.sku}_copy`;
            while (used.has(copySku.toUpperCase())) {
              n += 1;
              copySku = `${prod.sku}_copy${n}`;
            }
          }
          const dupData = {
            sku: copySku,
            name: `${prod.name} (副本)`,
            price: prod.price,
            sizes: prod.sizes,
            colors: prod.colors,
            category: prod.category,
            note: prod.note,
            status: 'active',
            imageUrl: prod.imageUrl || '', // [商品圖片 v2.12.9] 沿用原圖，不重新上傳
            createdAt: new Date().toISOString()
          };
          const newRef = dbRef('products').push();
          await newRef.set(dupData);
          logAction('product_create', 'product', newRef.key, `複製商品：${prod.name}`);
          showToast(`已成功複製商品：「${prod.name}」`);
        } catch (err) {
          console.error("Duplicate product error:", err);
        }
      };

      // ---------- [商品圖片 v2.12.9] ----------
      const handleProductImageUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = ''; // 清空 input，允許重複選同一個檔案
        if (!file || !editingProduct) return;

        if (!file.type.startsWith('image/')) {
          showToast('❌ 請選擇圖片檔案');
          return;
        }
        if (file.size > PRODUCT_IMAGE_MAX_RAW_MB * 1024 * 1024) {
          showToast(`❌ 圖片檔案過大，請選擇小於 ${PRODUCT_IMAGE_MAX_RAW_MB}MB 的圖片`);
          return;
        }
        if (!requireConnection('上傳商品圖片')) return;

        setIsUploadingProductImage(true);
        try {
          const blob = await compressImageFile(file);
          const groupKey = editingProduct.id || productImageSessionKeyRef.current;
          const folder = `${IS_TEST_MODE ? 'test/' : ''}products/${groupKey}`;

          const formData = new FormData();
          formData.append('file', blob, 'product.jpg');
          formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          formData.append('folder', folder);

          const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
          const data = await res.json();
          if (!res.ok || !data.secure_url) {
            throw new Error(data?.error?.message || '上傳失敗');
          }
          setEditingProduct((prev) => ({ ...prev, imageUrl: data.secure_url }));
          showToast('🖼️ 圖片已上傳');
        } catch (err) {
          console.error('Product image upload error:', err);
          showToast('❌ 圖片上傳失敗，請檢查網路連線後再試一次');
        } finally {
          setIsUploadingProductImage(false);
        }
      };

      const handleRemoveProductImage = () => {
        setEditingProduct((prev) => (prev ? { ...prev, imageUrl: '' } : prev));
      };

      const handleToggleArchiveProduct = async (prod) => {
        const nextStatus = prod.status === 'archived' ? 'active' : 'archived';
        try {
          await withSyncTracking(dbRef(`products/${prod.id}`).update({ status: nextStatus }));
          logAction('product_archive', 'product', prod.id, `${nextStatus === 'archived' ? '下架歸檔' : '重新上架'}：${prod.name}`);
          showToast(nextStatus === 'archived' ? '商品已下架歸檔' : '商品已重新上架');
        } catch (err) {
          console.error("Archive product error:", err);
        }
      };

      const handleDeleteProduct = async (prodId) => {
        if (!window.confirm('確定要刪除此商品嗎？\n（會移到回收桶，之後可以還原）')) return;
        const target = products.find(p => p.id === prodId);
        try {
          if (target) {
            await withSyncTracking(dbRoot().update({
              [`products/${target.id}`]: null,
              [`trash/products/${target.id}`]: trashEntry(target)
            }));
            logAction('product_delete', 'product', target.id, `刪除商品：${target.name}（$${target.price}）→ 回收桶`);
            showToast('🗑️ 商品已移到回收桶（更多 → 回收桶 可還原）');
          }
        } catch (err) {
          console.error("Delete product error:", err);
          showToast('❌ 刪除失敗，請檢查網路連線或權限設定');
        }
      };

      // Excel / CSV File Import Handler（[V2.1.1] 智慧歸納版）
      const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportFileName(file.name);
        const reader = new FileReader();

        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            if (!rawData || rawData.length === 0) {
              showToast('❌ 檔案內容空白或無有效資料');
              return;
            }

            // 先進預覽視窗，由視窗告訴使用者「認得哪些欄位、能匯入幾項」，
            // 就算欄位名稱認不得也不會只跳一句錯誤就結束。
            setImportRawRows(rawData);
            setIsImportModalOpen(true);
          } catch (err) {
            console.error('Import error:', err);
            showToast('❌ 讀取 Excel 檔案失敗');
          }
        };

        reader.onerror = () => showToast('❌ 讀取檔案失敗');
        reader.readAsArrayBuffer(file);
        e.target.value = '';
      };

      const handleCloseImportModal = () => {
        if (isProductImporting) return;
        setIsImportModalOpen(false);
        setImportRawRows([]);
      };

      const handleConfirmBatchImport = async () => {
        const toImport = parsedImportProducts.filter(p => p.willImport);
        if (toImport.length === 0) {
          showToast('沒有可匯入的新商品');
          return;
        }
        if (!requireConnection('匯入商品')) return;

        setIsProductImporting(true);
        try {
          const createdAt = new Date().toISOString();
          const updates = {};
          toImport.forEach(({ isExisting, willImport, ...prodData }) => {
            const newKey = dbRef('products').push().key;
            updates[newKey] = { ...prodData, createdAt, status: 'active' };
          });

          // 一次性寫入，要嘛全成功、要嘛全失敗
          await withSyncTracking(dbRef('products').update(updates));
          logAction('product_import', 'product', '', `匯入 Excel 商品 ${toImport.length} 項：${summarizeNames(toImport.map(p => p.name))}`);
          showToast(`🎉 成功匯入 ${toImport.length} 項商品！`);
          setIsImportModalOpen(false);
          setImportRawRows([]);
        } catch (err) {
          console.error("Batch import error:", err);
          showToast('❌ 匯入過程發生錯誤，請檢查權限或網路連線');
        } finally {
          setIsProductImporting(false);
        }
      };

      const handleExportProductsExcel = () => {
        if (enrichedProducts.length === 0) {
          showToast('目前沒有商品可供匯出');
          return;
        }

        const exportData = buildProductsExportRows(enrichedProducts);

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '商品庫與滯銷分析');
        XLSX.writeFile(wb, `小豆苗商品庫報表_${new Date().toISOString().slice(0,10)}.xlsx`);
        showToast('📊 已成功匯出商品庫 Excel 報表！');
      };

      // Filtered Product Library
      const filteredProducts = React.useMemo(() => {
        return enrichedProducts.filter(p => {
          const matchSearch = 
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.note.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.colors.toLowerCase().includes(productSearch.toLowerCase());

          const matchCategory = 
            productCategoryFilter === 'all' ? true :
            productCategoryFilter === '未分類' ? (!p.category || p.category === '未分類') :
            p.category === productCategoryFilter;

          const stagnant = getStagnantInfo(p);
          const matchStagnant = 
            productStagnantFilter === 'all' ? true :
            productStagnantFilter === 'active' ? stagnant.type === 'active' :
            productStagnantFilter === 'warning' ? stagnant.type === 'warning' :
            productStagnantFilter === 'critical' ? stagnant.type === 'critical' :
            productStagnantFilter === 'archived' ? p.status === 'archived' : true;

          return matchSearch && matchCategory && matchStagnant;
        });
      }, [enrichedProducts, productSearch, productCategoryFilter, productStagnantFilter]);

      const selectedProductVisibleCount = React.useMemo(() => {
        return filteredProducts.filter(p => selectedProductIds.has(p.id)).length;
      }, [filteredProducts, selectedProductIds]);

      const categoriesList = React.useMemo(() => {
        const set = new Set(['服飾', '鞋包配飾', '母嬰用品', '未分類']);
        enrichedProducts.forEach(p => {
          if (p.category) set.add(p.category);
        });
        return Array.from(set);
      }, [enrichedProducts]);

      // [V2.1.1] 商品匯入預覽：原始列 + 勾選選項 → 商品清單
      const parsedImportProducts = React.useMemo(() => {
        if (importRawRows.length === 0) return [];
        return buildImportProducts(importRawRows, importOptions, products, trashProducts.map(p => p.sku));
      }, [importRawRows, importOptions, products, trashProducts]);

      const importHeaders = React.useMemo(() => {
        return importRawRows.length > 0 ? Object.keys(importRawRows[0]) : [];
      }, [importRawRows]);

      // Filtered Orders for Tab 2
      const filteredOrders = React.useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return orders.filter(o => {
          const matchSearch = !q || (
            o.customerName.toLowerCase().includes(q) ||
            o.customerPhone.includes(searchTerm.trim()) ||
            o.customerLine.toLowerCase().includes(q) ||
            o.customerIg.toLowerCase().includes(q) ||
            o.storeName.toLowerCase().includes(q) ||
            (o.storeAddress || '').toLowerCase().includes(q) ||
            o.orderNo.toLowerCase().includes(q) ||
            o.note.toLowerCase().includes(q) ||
            o.items.some(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
          );

          const matchPayment = 
            filterPayment === 'all' ? true :
            filterPayment === 'paid' ? o.paymentStatus : !o.paymentStatus;

          const matchShipment = 
            filterShipment === 'all' ? true :
            filterShipment === 'shipped' ? o.shipmentStatus === 'shipped' : o.shipmentStatus === 'unshipped';

          const matchDelivery =
            filterDelivery === 'all' ? true : (o.deliveryMethod || '').includes(filterDelivery);

          const matchDate =
            filterDate === 'all' ? true : toDateKey(o.timestamp) === filterDate;

          return matchSearch && matchPayment && matchShipment && matchDelivery && matchDate;
        });
      }, [orders, searchTerm, filterPayment, filterShipment, filterDelivery, filterDate]);

      // [V2.1] 訂單列表上方的統計卡片（以全部訂單計算，不受篩選影響）
      const orderListStats = React.useMemo(() => computeOrderListStats(orders), [orders]);

      const filteredOrdersTotal = React.useMemo(() => {
        return filteredOrders.reduce((sum, o) => sum + calcOrderTotal(o), 0);
      }, [filteredOrders]);

      const selectedVisibleCount = React.useMemo(() => {
        return filteredOrders.filter(o => selectedOrderIds.has(o.id)).length;
      }, [filteredOrders, selectedOrderIds]);

      const selectedVisibleTotal = React.useMemo(() => {
        return filteredOrders.filter(o => selectedOrderIds.has(o.id)).reduce((s, o) => s + calcOrderTotal(o), 0);
      }, [filteredOrders, selectedOrderIds]);

      const hasActiveOrderFilter =
        searchTerm.trim() !== '' || filterPayment !== 'all' || filterShipment !== 'all' || filterDelivery !== 'all' || filterDate !== 'all';

      // [V2.6] 日期快捷鈕：有訂單的日期（最近 14 天有單的日子），選到較舊日期時也會顯示在最前面
      const orderDateChips = React.useMemo(() => {
        const counts = new Map();
        orders.forEach(o => {
          const key = toDateKey(o.timestamp);
          if (key) counts.set(key, (counts.get(key) || 0) + 1);
        });
        const keys = Array.from(counts.keys()).sort().reverse().slice(0, 14);
        if (filterDate !== 'all' && !keys.includes(filterDate)) keys.unshift(filterDate);
        return keys.map(key => ({ key, count: counts.get(key) || 0, label: formatDateChipLabel(key) }));
      }, [orders, filterDate]);

      // Existing order numbers (用來偵測 Excel 重複匯入)
      const existingOrderNos = React.useMemo(() => {
        return new Set(orders.map(o => o.orderNo).filter(Boolean));
      }, [orders]);

      // [V2.8] 回收桶裡的訂單單號（匯入預覽會提醒「回收桶有同單號」）
      const trashOrderNos = React.useMemo(() => {
        return new Set(trashOrders.map(o => o.orderNo).filter(Boolean));
      }, [trashOrders]);

      // Picking List Matrix
      const tallyMatrix = React.useMemo(() => computeTallyMatrix(orders), [orders]);

      // Export Orders CSV
      const handleExportCSV = () => {
        if (orders.length === 0) {
          showToast('目前沒有訂單可供匯出！');
          return;
        }

        const csvContent = buildOrdersCsv(orders);

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `小豆苗訂單報表_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('📊 已匯出 UTF-8 格式 CSV 報表！');
      };

      const stats = React.useMemo(() => computeAppStats(orders, enrichedProducts), [orders, enrichedProducts]);

      const navItems = [
        { id: 'add', label: '新增訂單', icon: IconPlus },
        { id: 'list', label: '訂單列表', icon: IconList },
        { id: 'tally', label: '理貨清單', icon: IconCheckSquare, badge: stats.unshippedCount },
        { id: 'products', label: '商品庫', icon: IconDatabase },
        { id: 'export', label: '更多', icon: IconMore }
      ];

      return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 md:pb-12 font-sans flex flex-col">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/90 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-sm transition-all animate-bounce flex items-center gap-2">
              <IconSparkles size={16} className="text-amber-400" />
              {toastMessage}
            </div>
          )}

          {/* [v2.13.5] 還原JSON備份 Modal */}
          {isRestoreModalOpen && (
            <RestoreBackupModal
              onConfirm={handlePerformRestore}
              onClose={() => setIsRestoreModalOpen(false)}
            />
          )}

          {/* [v2.14.0] 公版訊息：給客人的確認訊息 */}
          {messageOrder && (
            <OrderMessageModal
              order={messageOrder}
              template={messageTemplate}
              onClose={() => setMessageOrder(null)}
              showToast={showToast}
            />
          )}

          {/* [v2.14.0] 公版訊息設定 */}
          {isMessageTemplateOpen && (
            <MessageTemplateModal
              template={messageTemplate}
              isSaving={isSavingMessageTemplate}
              onSave={handleSaveMessageTemplate}
              onClose={() => setIsMessageTemplateOpen(false)}
            />
          )}

          {/* Delete Order Modal */}
          {confirmDeleteId && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-100 text-center space-y-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <IconTrash2 size={24} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">確定刪除此筆訂單？</h3>
                <p className="text-xs text-slate-500">訂單會先移到回收桶，之後可到「更多 → 回收桶」還原。</p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteOrderConfirm}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-md"
                  >
                    確定刪除
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* [V2.7] Trash + Log modals */}
          {isTrashOpen && (
            <TrashModal
              trashOrders={trashOrders}
              trashProducts={trashProducts}
              orders={orders}
              products={products}
              onRestore={handleRestoreTrash}
              onPurge={handlePurgeTrash}
              onPurgeAll={handlePurgeAllTrash}
              onClose={() => setIsTrashOpen(false)}
            />
          )}
          {isLogOpen && (
            <LogModal
              orders={orders}
              onRevert={handleRevertOrderEdit}
              onClose={() => setIsLogOpen(false)}
            />
          )}

          {/* [V2.12] Shipping Settings Modal */}
          {isShippingSettingsOpen && (
            <ShippingSettingsModal
              config={shippingConfig}
              isSaving={isSavingShippingConfig}
              onSave={handleSaveShippingConfig}
              onClose={() => setIsShippingSettingsOpen(false)}
            />
          )}

          {/* [黑名單 v2.12.5] */}
          {isBlacklistOpen && (
            <BlacklistModal
              blacklist={blacklist}
              onAdd={() => setIsBlacklistAddOpen(true)}
              onDelete={handleDeleteBlacklist}
              onClose={() => setIsBlacklistOpen(false)}
            />
          )}
          {isBlacklistAddOpen && (
            <BlacklistAddModal
              blacklist={blacklist}
              isSaving={isSavingBlacklist}
              onSave={handleAddBlacklist}
              onClose={() => setIsBlacklistAddOpen(false)}
            />
          )}

          {/* [商品圖片 v2.12.9] 大圖燈箱 */}
          {imageLightboxUrl && (
            <div
              className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setImageLightboxUrl('')}
            >
              <button
                type="button"
                onClick={() => setImageLightboxUrl('')}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
              >
                <IconX size={28} />
              </button>
              <img
                src={imageLightboxUrl}
                alt="商品大圖"
                className="max-w-full max-h-full rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* [V2.4] Product Picker Panel (bottom sheet) */}
          {isPickerPanelOpen && (
            <ProductPickerPanel
              products={quickPickData.allSorted}
              scores={quickPickData.scores}
              recent={quickPickData.recent}
              categories={categoriesList}
              initialSearch={pickerSearch}
              selectedId={selectedProductRef?.id}
              onSelect={handlePickProduct}
              onTogglePin={handleTogglePinProduct}
              onClose={() => setIsPickerPanelOpen(false)}
            />
          )}

          {/* [V2.3] Product Batch Delete Confirm Modal */}
          {confirmProductBatchDelete && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-100 text-center space-y-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <IconTrash2 size={24} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">確定刪除 {selectedProductVisibleCount} 項商品？</h3>
                <p className="text-xs text-slate-500">
                  商品會先<b className="text-emerald-700">移到回收桶</b>，之後可到「更多 → 回收桶」還原。
                  已建立的訂單不受影響，但刪除期間不能從商品庫快速帶入這些商品。
                  {IS_TEST_MODE ? '（目前是測試模式，只會刪到測試資料）' : '（目前是「正式資料」）'}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isProductBatchDeleting}
                    onClick={() => setConfirmProductBatchDelete(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={isProductBatchDeleting}
                    onClick={handleProductBatchDeleteConfirm}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-md"
                  >
                    {isProductBatchDeleting ? '刪除中...' : `確定刪除 ${selectedProductVisibleCount} 項`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* [V2.2] Batch Delete Confirm Modal */}
          {confirmBatchDelete && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-100 text-center space-y-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <IconTrash2 size={24} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">確定刪除 {selectedVisibleCount} 筆訂單？</h3>
                <p className="text-xs text-slate-500">
                  這些訂單合計 ${selectedVisibleTotal.toLocaleString()}。會先<b className="text-emerald-700">移到回收桶</b>，
                  之後可到「更多 → 回收桶」還原。
                  {IS_TEST_MODE ? '（目前是測試模式，只會刪到測試資料）' : '（目前是「正式資料」）'}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isBatchDeleting}
                    onClick={() => setConfirmBatchDelete(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={isBatchDeleting}
                    onClick={handleBatchDeleteConfirm}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-md"
                  >
                    {isBatchDeleting ? '刪除中...' : `確定刪除 ${selectedVisibleCount} 筆`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* [V2.1] Edit Order Modal */}
          {editingOrder && (
            <OrderEditModal
              order={editingOrder}
              onClose={() => setEditingOrder(null)}
              onSave={handleSaveEditedOrder}
            />
          )}

          {/* [V2.1] Order Excel Import Preview Modal */}
          {isOrderImportModalOpen && (
            <OrderImportPreviewModal
              drafts={orderImportDrafts}
              existingOrderNos={existingOrderNos}
              existingOrders={orders}
              trashOrderNos={trashOrderNos}
              isSaving={isOrderImporting}
              onClose={() => { if (!isOrderImporting) { setIsOrderImportModalOpen(false); setOrderImportDrafts([]); } }}
              onConfirm={handleConfirmOrderImport}
            />
          )}

          {/* Edit / Add Product Modal → modal-product.js */}
          <ProductEditModal
            pe={{ editingProduct, handleProductImageUpload, handleRemoveProductImage, handleSaveProductModal, isProductModalOpen, isUploadingProductImage, setEditingProduct, setImageLightboxUrl, setIsProductModalOpen }}
          />

          {/* Import Preview Modal → modal-product.js */}
          <ProductImportModal
            pi={{ handleCloseImportModal, handleConfirmBatchImport, importFileName, importHeaders, importOptions, importRawRows, isImportModalOpen, isProductImporting, parsedImportProducts, setImportOptions }}
          />

          {/* Header */}
          <header className="bg-emerald-600 text-white sticky top-0 z-40 shadow-md">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <IconShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold leading-tight flex items-center gap-2">
                    小豆苗訂單助手
                    <span className="text-[10px] sm:text-xs bg-emerald-700 text-emerald-100 px-2 py-0.5 rounded-full font-mono">v{APP_VERSION} RTDB</span>
                    {IS_TEST_MODE && (
                      <span className="text-[10px] sm:text-xs bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-bold">🧪 測試模式</span>
                    )}
                  </h1>
                  <p className="text-[11px] sm:text-xs text-emerald-100 opacity-90 hidden sm:flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`}></span>
                    Firebase 實時同步中 • 新加坡 Realtime Database 連線
                  </p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 bg-emerald-700/60 p-1.5 rounded-2xl border border-emerald-500/30">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold transition flex items-center gap-2 relative ${
                        isActive 
                          ? 'bg-white text-emerald-800 shadow-md' 
                          : 'text-emerald-100 hover:bg-emerald-600/60 hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                      {item.badge > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-amber-500 text-white' : 'bg-amber-400 text-slate-900'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Cloud Sync Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs bg-emerald-700/50 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <IconCloud size={16} className={pendingSyncCount > 0 ? "animate-bounce text-amber-300" : isSyncing ? "animate-bounce text-amber-300" : isConnected ? "text-emerald-200" : "text-amber-300"} />
                <span className="font-bold text-emerald-100 hidden sm:inline">
                  {pendingSyncCount > 0 ? `⏳ ${pendingSyncCount} 筆同步中` : isSyncing ? "連線中..." : isConnected ? "🟢 實時同步中" : "⚠️ 連線受阻"}
                </span>
              </div>
            </div>
          </header>

          {/* Main Container */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full">
            
            {/* [V2.2] Test Mode Banner */}
            {IS_TEST_MODE && (
              <div className="mb-4 bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-amber-900">
                  <span className="font-bold block">🧪 目前是測試模式</span>
                  這裡的資料存放在獨立區域，不會混進正式訂單。測試完可以一鍵清空。
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetTestData}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition flex items-center gap-1 whitespace-nowrap"
                  >
                    <IconTrash2 size={16} />
                    清空測試資料
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleTestMode}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition"
                  >
                    回到正式資料
                  </button>
                </div>
              </div>
            )}

            {/* [V2.5] Permission / Connection Banner */}
            {permissionDenied ? (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-xs sm:text-sm text-red-900 flex items-start gap-3">
                <IconAlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block text-red-800 mb-0.5">🔒 這個帳號沒有資料庫的存取權限</span>
                  目前登入：{user?.email}。請管理者確認 Firebase 規則裡的 UID 名單包含這個帳號，或改用有權限的帳號登入。
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="px-3 py-1.5 bg-white hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg text-xs transition"
                    >
                      登出
                    </button>
                  </div>
                </div>
              </div>
            ) : ((!isConnected && !isSyncing) || pendingSyncCount > 0) ? (
              <div className={`mb-4 rounded-2xl p-4 text-xs sm:text-sm flex items-start gap-3 border ${
                !isConnected ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}>
                <IconAlertTriangle size={20} className={`flex-shrink-0 mt-0.5 ${!isConnected ? 'text-amber-600' : 'text-sky-600'}`} />
                <div>
                  {!isConnected ? (
                    <>
                      <span className="font-bold block mb-0.5">📵 目前沒有網路連線</span>
                      這段期間新增或修改的資料會先<b>暫存在這支手機</b>，連上網路後會自動送出。
                      <b className="block mt-0.5">請先不要關閉這個網頁</b>，否則尚未送出的資料會遺失。
                      {pendingSyncCount > 0 && <span className="block mt-0.5">目前有 <b>{pendingSyncCount}</b> 筆尚未同步。</span>}
                    </>
                  ) : (
                    <>
                      <span className="font-bold block mb-0.5">⏳ 有 {pendingSyncCount} 筆資料正在同步</span>
                      請保持網頁開著，等待同步完成再關閉。
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {/* Tab 1: New Order */}
            {activeTab === 'add' && (
              <form onSubmit={handleSubmitNewOrder} className="space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 items-start">
                {/* [V2.8] 草稿已還原提示 */}
                {draftRestored && (
                  <div className="md:col-span-12 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-amber-900">
                    <span>📝 已恢復上次<b>還沒送出</b>的訂單內容，確認無誤後再送出。</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDiscardDraft}
                        className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg text-xs whitespace-nowrap"
                      >
                        清除草稿
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftRestored(false)}
                        className="px-3 py-1.5 text-amber-700 hover:text-amber-900 font-semibold text-xs whitespace-nowrap"
                      >
                        知道了
                      </button>
                    </div>
                  </div>
                )}

                {/* Left Column: Smart Parser & Customer Info */}
                <div className="md:col-span-5 space-y-4">
                  {/* Smart Text Parser */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                        <IconSparkles size={16} className="text-emerald-600" />
                        LINE / IG 對話智慧解析
                      </label>
                      <button
                        type="button"
                        onClick={handleParseLineText}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-emerald-700 transition flex items-center gap-1"
                      >
                        <IconSparkles size={12} />
                        解析文字
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={lineText}
                      onChange={(e) => setLineText(e.target.value)}
                      placeholder="請直接貼上對話，例如：姓名：陳小美，電話：0912345678，7-11 鑫旗艦門市..."
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white/90"
                    />
                  </div>

                  {/* Customer Information Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3.5">
                    <h2 className="text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
                      <span className="flex items-center gap-1.5">
                        <IconUser size={18} className="text-emerald-600" />
                        1. 顧客與物流資料
                      </span>
                      {liveBlacklistMatch.level !== 'none' && (
                        <span
                          className={
                            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold animate-pulse " +
                            (liveBlacklistMatch.level === 'strong'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700')
                          }
                          title={liveBlacklistMatch.hits.map((h) => (h.entry.name || h.entry.phone || h.entry.ig || h.entry.line || '（未填資料）') + (h.entry.reason ? `：${h.entry.reason}` : '')).join('、')}
                        >
                          <IconAlertTriangle size={12} />
                          {liveBlacklistMatch.level === 'strong' ? '黑名單' : '姓名相符'}
                        </span>
                      )}
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1 block">顧客姓名 *</label>
                        <input
                          type="text"
                          required
                          placeholder="例如：陳小美"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full text-xs sm:text-sm px-3 py-2 md:py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1 block">手機號碼</label>
                        <input
                          type="tel"
                          placeholder="0912345678"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full text-xs sm:text-sm px-3 py-2 md:py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* [V2.11] 只能用 LINE / IG 聯絡的客人：手機可以留空 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1 block">LINE ID / 暱稱</label>
                        <input
                          type="text"
                          placeholder="例如：mei_0912"
                          value={customerLine}
                          onChange={(e) => setCustomerLine(e.target.value)}
                          className="w-full text-xs sm:text-sm px-3 py-2 md:py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1 block">IG 帳號</label>
                        <input
                          type="text"
                          placeholder="例如：mei.shop"
                          value={customerIg}
                          onChange={(e) => setCustomerIg(e.target.value)}
                          className="w-full text-xs sm:text-sm px-3 py-2 md:py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 -mt-1.5">客人只能用 LINE 或 IG 聯絡時，手機號碼可以留空。</p>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {DELIVERY_METHODS.map(({ key: method }) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => handleSelectDeliveryMethod(method)}
                          className={`py-2 text-xs sm:text-sm font-semibold rounded-lg border transition ${
                            deliveryMethod === method
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>

                    {/* [v2.13.0] 門市名稱／地址拆成兩個獨立欄位；宅配到府時「門市名稱」留空即可 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1 block">
                          門市名稱{deliveryMethod === '宅配到府' && <span className="text-slate-400 font-normal">（選填）</span>}
                        </label>
                        <input
                          type="text"
                          placeholder={deliveryMethod === '宅配到府' ? '選填，例如收件人代稱' : '例如：世貿門市'}
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="w-full text-xs sm:text-sm px-3 py-2 md:py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1 block">
                          {deliveryMethod === '宅配到府' ? '宅配地址' : '門市地址'}{deliveryMethod !== '宅配到府' && <span className="text-slate-400 font-normal">（選填）</span>}
                        </label>
                        <input
                          type="text"
                          placeholder={deliveryMethod === '宅配到府' ? '請輸入完整宅配地址' : '例如：台北市信義區信義路五段5號1樓'}
                          value={storeAddress}
                          onChange={(e) => setStoreAddress(e.target.value)}
                          className="w-full text-xs sm:text-sm px-3 py-2 md:py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                        運費 ($)
                        {shippingFeeAuto && <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">自動</span>}
                      </label>
                      <input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => handleShippingFeeInput(Number(e.target.value))}
                        className="w-full text-xs sm:text-sm px-3 py-2 md:py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-600 mb-1 block">訂單備註</label>
                      <input
                        type="text"
                        placeholder="例如：急單、預購、面交"
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3 py-2 md:py-2 rounded-lg border border-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Product Selector & List */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h2 className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <IconShoppingBag size={18} className="text-emerald-600" />
                        2. 選擇商品與數量
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsPickerPanelOpen(true)}
                        className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition whitespace-nowrap"
                      >
                        📋 全部商品 ({quickPickData.allSorted.length})
                      </button>
                    </div>

                    {/* [V2.4] Search */}
                    <div className="relative">
                      <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="搜尋商品名稱或款號..."
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
                      />
                      {pickerSearch && (
                        <button type="button" onClick={() => setPickerSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <IconX size={14} />
                        </button>
                      )}
                    </div>

                    {pickerSearch.trim() ? (
                      /* Search results：手機顯示 5 筆、桌機 8 筆 */
                      <div className="space-y-2">
                        {pickerSearchResults.length === 0 ? (
                          <p className="text-center text-xs text-slate-400 py-4">找不到符合的商品</p>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
                              {pickerSearchResults.slice(0, 8).map((p, idx) => (
                                <QuickPickChip
                                  key={p.id}
                                  product={p}
                                  mobileHidden={idx >= 5}
                                  selected={selectedProductRef?.id === p.id}
                                  badge={p.pinned ? '📌' : ((quickPickData.scores[p.id] || 0) >= QUICK_PICK_MIN_SCORE ? '🔥' : '')}
                                  onSelect={handlePickProduct}
                                  onQuickAdd={handleQuickAddProduct}
                                />
                              ))}
                            </div>
                            {pickerSearchResults.length > 5 && (
                              <button
                                type="button"
                                onClick={() => setIsPickerPanelOpen(true)}
                                className={`w-full text-xs font-semibold text-emerald-700 py-1.5 ${pickerSearchResults.length <= 8 ? 'md:hidden' : ''}`}
                              >
                                共 {pickerSearchResults.length} 項符合，點此在完整清單中查看 ›
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      /* Quick section：手機只顯示 3～4 個，桌機顯示完整常用區 + 新品 */
                      <div className="space-y-3">
                        {quickPickData.quick.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] sm:text-xs font-bold text-slate-600">⚡ 常用（📌 釘選 + 🔥 近期熱銷）</span>
                              <span className="hidden sm:inline text-[10px] text-slate-400">依近期訂單自動排序</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
                              {quickPickData.quick.map(p => (
                                <QuickPickChip
                                  key={p.id}
                                  product={p}
                                  mobileHidden={!quickPickData.mobileIds.has(p.id)}
                                  selected={selectedProductRef?.id === p.id}
                                  badge={p.pinned ? '📌' : '🔥'}
                                  note={quickPickData.recent[p.id] > 0 ? `近${QUICK_PICK_RECENT_DAYS}天 ${quickPickData.recent[p.id]} 件` : ''}
                                  onSelect={handlePickProduct}
                                  onQuickAdd={handleQuickAddProduct}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {quickPickData.fresh.length > 0 && (
                          <div className="space-y-1.5">
                            <span
                              className={`text-[11px] sm:text-xs font-bold text-slate-600 ${
                                quickPickData.fresh.some(p => quickPickData.mobileIds.has(p.id)) ? '' : 'hidden md:block'
                              }`}
                            >
                              {quickPickData.quick.length === 0 ? '🆕 最新商品（還沒有足夠的訂單紀錄可排序）' : '🆕 新品'}
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
                              {quickPickData.fresh.map(p => (
                                <QuickPickChip
                                  key={p.id}
                                  product={p}
                                  mobileHidden={!quickPickData.mobileIds.has(p.id)}
                                  selected={selectedProductRef?.id === p.id}
                                  badge="🆕"
                                  onSelect={handlePickProduct}
                                  onQuickAdd={handleQuickAddProduct}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {quickPickData.quick.length === 0 && quickPickData.fresh.length === 0 && (
                          <p className="text-center text-xs text-slate-400 py-4">商品庫還沒有商品，請先到「商品庫」新增或匯入</p>
                        )}

                        {/* 手機：有被收起的商品時，提供「查看全部」入口 */}
                        {quickPickData.allSorted.length > quickPickData.mobileIds.size && (
                          <button
                            type="button"
                            onClick={() => setIsPickerPanelOpen(true)}
                            className="md:hidden w-full py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl"
                          >
                            查看全部 {quickPickData.allSorted.length} 項商品 ›
                          </button>
                        )}

                        <p className="hidden md:block text-[11px] text-slate-400">
                          其他商品請用搜尋，或點右上角「📋 全部商品」。單一規格的商品可按 <b className="text-emerald-600">＋</b> 直接加入。
                        </p>
                      </div>
                    )}

                    {/* Selected Item Editor */}
                    <div ref={itemEditorRef} className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/60 space-y-3">
                      {/* [v2.13.4] 上鎖不清空：同商品要連續輸入不同花色/尺寸時使用 */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsKeepFieldsLocked(v => !v)}
                          className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                            isKeepFieldsLocked
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          <span>{isKeepFieldsLocked ? '已上鎖不清空' : '上鎖不清空'}</span>
                          {isKeepFieldsLocked ? <IconLock size={14} /> : <IconUnlock size={14} />}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] sm:text-xs font-medium text-slate-500 block">商品款號</label>
                          <input
                            type="text"
                            placeholder="A01"
                            value={currentItem.sku}
                            onChange={(e) => setCurrentItem({ ...currentItem, sku: e.target.value })}
                            className="w-full text-xs sm:text-sm p-2 rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[11px] sm:text-xs font-medium text-slate-500 block">商品名稱 *</label>
                          <input
                            type="text"
                            placeholder="例如：韓系純棉 T 恤"
                            value={currentItem.name}
                            onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                            className="w-full text-xs sm:text-sm p-2 rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                      </div>

                      {/* [v2.13.4] 相似商品建議：手動輸入商品名稱、停頓後跟商品庫比對；點選後完整套用商品庫資料(比照從商品庫選取) */}
                      {nameSuggestions.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 space-y-1.5">
                          <p className="text-[11px] text-amber-700 font-medium">💡 商品庫有相似商品，點選可帶入完整商品資料：</p>
                          <div className="flex flex-wrap gap-1.5">
                            {nameSuggestions.map(({ product, score }) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => handleApplySuggestedProduct(product)}
                                className="px-2.5 py-1 text-xs font-medium bg-white border border-amber-300 rounded-lg text-amber-800 hover:bg-amber-100"
                              >
                                {product.name}{product.sku ? `（${product.sku}）` : ''} · {Math.round(score * 100)}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedProductRef && splitProductOptions(selectedProductRef.colors).length > 1 && (
                        <div>
                          <label className="text-[11px] sm:text-xs font-medium text-slate-500 block mb-1">顏色快捷點選</label>
                          <div className="flex flex-wrap gap-1.5">
                            {splitProductOptions(selectedProductRef.colors).map((clr) => (
                              <button
                                key={clr}
                                type="button"
                                onClick={() => setCurrentItem({ ...currentItem, color: clr })}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                                  currentItem.color === clr
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {clr}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] sm:text-xs font-medium text-slate-500 block">顏色款式</label>
                          <input
                            type="text"
                            placeholder="黑色 / 白色"
                            value={currentItem.color}
                            onChange={(e) => setCurrentItem({ ...currentItem, color: e.target.value })}
                            className="w-full text-xs sm:text-sm p-2 rounded-md border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] sm:text-xs font-medium text-slate-500 block">單價 ($)</label>
                          <input
                            type="number"
                            value={currentItem.price}
                            onChange={(e) => setCurrentItem({ ...currentItem, price: Math.max(0, Number(e.target.value)) })}
                            className="w-full text-xs sm:text-sm p-2 rounded-md border border-slate-200 bg-white"
                          />
                          {/* [v2.13.4] 單價比商品庫定價低時即時提醒，避免不小心改低價吃掉利潤 */}
                          {selectedProductRef && Number(currentItem.price) < Number(selectedProductRef.price || 0) && (
                            <p className="text-[11px] text-red-600 mt-1">⚠️ 比商品庫定價 ${selectedProductRef.price} 低，請確認金額</p>
                          )}
                        </div>
                      </div>


                      {/* Size Quick Select */}
                      <div>
                        <label className="text-[11px] sm:text-xs font-medium text-slate-500 block mb-1">尺寸快捷點選</label>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedProductRef ? splitProductOptions(selectedProductRef.sizes) : ['S', 'M', 'L', 'XL', 'F']).map((sz) => {
                            const cleanSz = sz.trim();
                            if (!cleanSz) return null;
                            const isSelected = currentItem.size === cleanSz;
                            return (
                              <button
                                key={cleanSz}
                                type="button"
                                onClick={() => setCurrentItem({ ...currentItem, size: cleanSz })}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${
                                  isSelected
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {cleanSz}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs sm:text-sm font-medium text-slate-600">購買數量</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrentItem(p => ({ ...p, qty: Math.max(1, p.qty - 1) }))}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold active:bg-slate-100"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={currentItem.qty}
                            onChange={(e) => setCurrentItem({ ...currentItem, qty: Math.max(1, Number(e.target.value)) })}
                            className="w-12 text-center text-xs sm:text-sm font-bold p-1 rounded-md border border-slate-200 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setCurrentItem(p => ({ ...p, qty: p.qty + 1 }))}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold active:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddItemToOrder}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1"
                      >
                        <IconPlus size={16} />
                        加入此訂單品項
                      </button>
                    </div>

                    {/* Added Items List */}
                    {orderItems.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-xs sm:text-sm font-bold text-slate-600 block">已加入商品 ({orderItems.length})</span>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {orderItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs sm:text-sm">
                              <div>
                                <span className="font-bold text-slate-800">{item.name}</span>
                                <span className="text-slate-500 ml-2">({item.color || '預設款式'}/{item.size})</span>
                                <div className="text-[11px] sm:text-xs text-slate-400">
                                  ${item.price} x {item.qty} = <span className="font-semibold text-emerald-600">${item.price * item.qty}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveOrderItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                              >
                                <IconTrash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary & Submit */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
                    <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">小計 ${currentOrderSubtotal} + 運費 ${shippingFee}</span>
                        <span className="text-xs sm:text-sm font-medium">訂單總金額</span>
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-emerald-400">${currentOrderTotal}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <IconCheck size={20} />
                      {isSubmittingOrder ? '送出中…請稍候（請勿重複按）' : '儲存並即時同步建立訂單'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tab 2: Order List (V2.6：手機版精簡 + 預設收合 + 日期篩選) */}
            {activeTab === 'list' && (
              <OrderListTab
                list={{
                  setMessageOrder,
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
                }}
              />
            )}

            {/* Tab 3: Picking List → tab-tally.js */}
            <TallyTab
              tally={{ activeTab, handleToggleTallyCheck, tallyChecked, tallyMatrix }}
            />

            {/* Tab 4: Upgraded Product Library V5.1 → tab-products.js */}
            <ProductsTab
              prod={{
                activeTab, categoriesList, enrichedProducts,
                filteredProducts, handleDeleteProduct, handleDuplicateProduct,
                handleExportProductsExcel, handleFileUpload, handleOpenAddProductModal,
                handleOpenEditProductModal, handleQuickSelectToOrder, handleSelectAllFilteredProducts,
                handleSelectLatestImportBatch, handleToggleArchiveProduct, productCategoryFilter,
                productSearch, productSelectMode, productStagnantFilter,
                productViewMode, products, selectedProductIds,
                selectedProductVisibleCount, setConfirmProductBatchDelete, setImageLightboxUrl,
                setProductCategoryFilter, setProductSearch, setProductStagnantFilter,
                setProductViewMode, toggleProductSelectMode, toggleSelectProduct
              }}
            />

            {/* Tab 5: Reports Dashboard & Export */}
            {activeTab === 'export' && (
              <MoreTab
                more={{
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
                }}
              />
            )}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 z-40 backdrop-blur-md bg-white/90">
            <div className="max-w-4xl mx-auto flex items-center py-2 px-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex-1 flex flex-col items-center gap-1 text-[11px] font-medium transition relative ${
                      isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                    {item.badge > 0 && (
                      <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      );
    }
