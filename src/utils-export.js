    // ==========================================
    // utils-export.js  (v2.14.2 Phase 2)
    // 匯出資料組裝與純統計計算（從 app-shell.js 原樣搬出，只改成純函式）
    // 只做「資料進、結果出」：不碰 state、Firebase、XLSX、下載、toast（這些仍留在 app-shell.js 的 handler）
    // 相依（全在 utils.js）：deriveStoreDisplay、isAdjustmentItem、calcOrderSubtotal、calcOrderTotal、getStagnantInfo、formatDate
    // ==========================================

    // 訂單列表 Excel 匯出的列資料（handleExportOrdersExcel 用）
    const buildOrdersExportRows = (orders) => {
      return orders.map(o => ({
        '單號': o.orderNo || '',
        '顧客姓名': o.customerName,
        '電話': o.customerPhone,
        'LINE': o.customerLine,
        'IG': o.customerIg,
        '配送方式': o.deliveryMethod,
        '門市名稱': deriveStoreDisplay(o).name,
        '地址': deriveStoreDisplay(o).address,
        '付款狀態': o.paymentStatus ? '已付款' : '未付款',
        '出貨狀態': o.shipmentStatus === 'shipped' ? '已出貨' : '待出貨',
        '商品明細': o.items.map(i =>
          isAdjustmentItem(i)
            ? `${i.name}(${i.price < 0 ? '折抵 -' : '調整 +'}$${Math.abs(i.price)})`
            : `${i.sku ? `[${i.sku}]` : ''}${i.name}(${i.color || '預設'}/${i.size}) x${i.qty}`
        ).join('；'),
        '商品小計': calcOrderSubtotal(o),
        '運費': o.shippingFee,
        '訂單總金額': calcOrderTotal(o),
        '備註': o.note || '',
        '建立時間': o.createdAt
      }));
    };

    // 商品庫 Excel 匯出的列資料（handleExportProductsExcel 用；傳入 enrichedProducts）
    const buildProductsExportRows = (products) => {
      return products.map(p => {
        const stagnant = getStagnantInfo(p);
        return {
          '商品款號': p.sku || '',
          '商品名稱': p.name || '',
          '分類': p.category || '未分類',
          '預設售價': p.price || 0,
          '尺寸選項': p.sizes || '',
          '顏色款式': p.colors || '',
          '銷售與滯銷狀態': stagnant.label,
          '建檔日期': formatDate(p.createdAt),
          '最近下單日期': formatDate(p.lastOrderedAt),
          '備註說明': p.note || ''
        };
      });
    };

    // 訂單 CSV 全文（含 BOM）（handleExportCSV 用）
    const buildOrdersCsv = (orders) => {
      let csvContent = '\uFEFF';
      csvContent += '訂單編號,顧客姓名,電話,LINE,IG,配送方式,門市名稱,地址,購買品項細項,商品小計,運費,訂單總金額,付款狀態,出貨狀態,備註事項,建立時間\n';

      orders.forEach(o => {
        const itemsDetail = o.items.map(i => `[${i.sku}]${i.name}-${i.color}/${i.size} x${i.qty}`).join('; ');
        const subtotal = calcOrderSubtotal(o);
        const total = calcOrderTotal(o);
        const storeParts = deriveStoreDisplay(o);

        const row = [
          o.id,
          `"${o.customerName.replace(/"/g, '""')}"`,
          `"${o.customerPhone}"`,
          `"${(o.customerLine || '').replace(/"/g, '""')}"`,
          `"${(o.customerIg || '').replace(/"/g, '""')}"`,
          `"${o.deliveryMethod}"`,
          `"${storeParts.name.replace(/"/g, '""')}"`,
          `"${storeParts.address.replace(/"/g, '""')}"`,
          `"${itemsDetail.replace(/"/g, '""')}"`,
          subtotal,
          o.shippingFee,
          total,
          o.paymentStatus ? '已付款' : '未付款',
          o.shipmentStatus === 'shipped' ? '已出貨' : '待出貨',
          `"${(o.note || '').replace(/"/g, '""')}"`,
          `"${o.createdAt}"`
        ];
        csvContent += row.join(',') + '\n';
      });
      return csvContent;
    };

    // 理貨清單彙總（tallyMatrix 的 useMemo 內容）
    const computeTallyMatrix = (orders) => {
      const map = {};

      orders.forEach(order => {
        if (order.shipmentStatus === 'shipped') return;

        order.items.forEach(item => {
          // [V2.1] 折抵 / 內退項目不是實體商品，不列入理貨清單
          if (isAdjustmentItem(item)) return;

          const key = `${item.sku || 'NOSKU'}_${item.name}_${item.color}_${item.size}`;
          if (!map[key]) {
            map[key] = {
              key,
              sku: item.sku,
              name: item.name,
              color: item.color,
              size: item.size,
              totalQty: 0,
              buyers: []
            };
          }
          map[key].totalQty += Number(item.qty || 1);
          map[key].buyers.push({
            orderId: order.id,
            customerName: order.customerName,
            qty: item.qty
          });
        });
      });

      return Object.values(map);
    };

    // 訂單列表統計卡（orderListStats 的 useMemo 內容）
    const computeOrderListStats = (orders) => {
      let unpaidCount = 0;
      let unshippedCount = 0;
      let readyToShipCount = 0;
      let receivedRevenue = 0;
      let pendingRevenue = 0;

      orders.forEach(o => {
        const total = calcOrderTotal(o);
        if (o.paymentStatus) {
          receivedRevenue += total;
        } else {
          unpaidCount += 1;
          pendingRevenue += total;
        }
        if (o.shipmentStatus !== 'shipped') {
          unshippedCount += 1;
          if (o.paymentStatus) readyToShipCount += 1; // 已付款、等著出貨
        }
      });

      return {
        total: orders.length,
        paidCount: orders.length - unpaidCount,
        unpaidCount,
        unshippedCount,
        readyToShipCount,
        receivedRevenue,
        pendingRevenue
      };
    };

    // 全域統計（stats 的 useMemo 內容；傳入 orders 與 enrichedProducts）
    const computeAppStats = (orders, enrichedProducts) => {
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + calcOrderTotal(o), 0);
      const totalItemsCount = orders.reduce((sum, o) => {
        // [V2.1] 折抵項目不算「賣出商品件數」
        return sum + o.items.reduce((s, i) => s + (isAdjustmentItem(i) ? 0 : i.qty), 0);
      }, 0);
      const unpaidCount = orders.filter(o => !o.paymentStatus).length;
      const unshippedCount = orders.filter(o => o.shipmentStatus !== 'shipped').length;

      const stagnantAlertCount = enrichedProducts.filter(p => {
        const inf = getStagnantInfo(p);
        return inf.isAlert;
      }).length;

      return { totalOrders, totalRevenue, totalItemsCount, unpaidCount, unshippedCount, stagnantAlertCount };
    };
