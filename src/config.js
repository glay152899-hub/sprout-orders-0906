    // ==========================================
    // config.js — 版本號 / Firebase設定 / 常數設定值
    // ==========================================
    const APP_VERSION = '2.14.4';
    document.title = `Sprout 📱 小豆苗訂單助手 V${APP_VERSION} (Firebase RTDB 實時同步版)`;

    const firebaseConfig = {
      apiKey: "AIzaSyCr0o1O9GUOYyI-duVMJORX7Vz1fmAjTE0",
      authDomain: "sprout-order-management-system.firebaseapp.com",
      databaseURL: "https://sprout-order-management-system-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "sprout-order-management-system",
      storageBucket: "sprout-order-management-system.firebasestorage.app",
      messagingSenderId: "340151299674",
      appId: "1:340151299674:web:f80f24f3552dd2ef193263",
      measurementId: "G-841SEMJ8XB"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();
    const auth = firebase.auth(); // [V2.5] 登入驗證（電子郵件 / 密碼）

    // [V2.2] 測試模式：網址加上 ?mode=test，所有資料改存到 /test 底下，
    // 與正式訂單完全分開；測試完可一鍵清空，不會弄髒正式資料。
    const IS_TEST_MODE = new URLSearchParams(window.location.search).get('mode') === 'test';
    const dbRef = (path) => db.ref(IS_TEST_MODE ? `test/${path}` : path);
    const dbRoot = () => (IS_TEST_MODE ? db.ref('test') : db.ref()); // 目前模式的根節點（用於一次更新多個路徑）

    // ---- 下列常數原本散落在 utils.js 各處，統一搬到這裡管理 ----
    const DEFAULT_IMPORT_OPTIONS = {
      autoExtract: true,   // 智慧拆解名稱（-藏青90 → 顏色藏青 / 尺寸90）
      smartSort: true,     // 尺寸智慧排序
      autoCategory: true,  // 關鍵字分類推斷
      groupBySeries: true, // 歸納同系列規格（同品名合併成一個商品）
      skipExisting: true,  // 略過商品庫已有的同名商品，避免重複匯入
      importNote: false    // 匯入備註欄（訂購單格式的備註是「訂單備註」，預設不匯入）
    };

    const DELIVERY_METHODS = [
      { key: '7-11 取貨付款', short: '7-11' },
      { key: '全家取貨付款', short: '全家' },
      { key: '宅配到府', short: '宅配' }
    ];

    const DEFAULT_SHIPPING_CONFIG = {
      fees: { '7-11 取貨付款': 38, '全家取貨付款': 38, '宅配到府': 38 },
      freeShippingEnabled: true,
      freeShippingThreshold: 1800
    };

    const ADJUSTMENT_SKU = 'ADJ';

    // ---- [v2.14.0] 公版訊息：預設內容（資料庫沒有設定時使用，改過後存在 settings/messageTemplate）----
    // suffix 裡的 {顧客姓名} 會自動換成該訂單的客人名字；優惠規則只用來「算訊息裡顯示的金額」，不會改動訂單本身的總額。
    const DEFAULT_MESSAGE_TEMPLATE = {
      prefix: '訂購單',
      suffix: '確認款式尺寸無誤，再麻煩下單品項「{顧客姓名}」，預購週期2-3週不含假日，貨到直接出貨',
      discounts: [
        { id: 'd_default_2pcs', enabled: true, minQty: 2, percent: 95, label: '滿兩件95折' }
      ],
      customLines: [],
      showSubtotalWhenNoDiscount: true
    };

    // ---- [v2.13.5] 還原JSON備份：允許還原的節點清單 ----
    // 檔名對應 Firebase 路徑；只白名單這幾個，避免使用者選錯檔案把 test/demo_cart 這類非正式資料寫進正式路徑，
    // 或是把不相關的檔案內容誤寫進資料庫。key 是節點路徑，label 是畫面上顯示的名稱。
    const RESTORE_ALLOWED_NODES = [
      { key: 'orders', label: '訂單', filename: 'orders.json' },
      { key: 'products', label: '商品庫', filename: 'products.json' },
      { key: 'blacklist', label: '黑名單', filename: 'blacklist.json' },
      { key: 'settings', label: '設定（運費/折扣等）', filename: 'settings.json' },
      { key: 'trash', label: '回收桶', filename: 'trash.json' },
      { key: 'logs', label: '操作日誌', filename: 'logs.json' }
    ];

    const QUICK_PICK_HALF_LIFE_DAYS = 7;   // 權重減半所需天數
    const QUICK_PICK_RECENT_DAYS = 14;     // 畫面上顯示「近 N 天賣出幾件」
    const QUICK_PICK_SLOTS = 8;            // 常用區最多幾個（釘選 + 熱銷）
    const QUICK_PICK_MIN_SCORE = 0.25;     // 約等於「兩週內賣過 1 件」，低於此不算熱銷
    const QUICK_PICK_NEW_DAYS = 30;        // 建檔 30 天內算新品

    // ---- [v2.13.4] 新增訂單手動輸入商品名稱時的相似商品比對 ----
    // 純字元層級比對(Levenshtein)，抓的是「打錯字/打一半」這種情境，不是語意理解。
    // 比對門檻是依商品名稱長度動態決定容錯字數（見 utils.js 的 getRequiredCharMatches），
    // 不是固定百分比；這裡只保留「建議清單最多顯示幾筆」這個常數。
    const PRODUCT_NAME_SIMILARITY_MAX_RESULTS = 3; // 建議清單最多顯示幾筆

    const MOBILE_QUICK_MAX_ITEMS = 4;
    const MOBILE_QUICK_MAX_LINES = 6;
    const MOBILE_CHARS_PER_LINE = 15; // 手機一行大約能放的字數（含徽章）

    // ---- [商品圖片 v2.12.9] Cloudinary 設定 ----
    // 這個專案沒有信用卡無法用 Firebase Storage（新bucket須升級Blaze方案），改用 Cloudinary 免費方案。
    // 走 Unsigned Upload：cloud name / preset 名稱寫在前端是官方支援的用法，preset 本身可在 Cloudinary 後台設限制。
    const CLOUDINARY_CLOUD_NAME = 'wjppv7h9';
    const CLOUDINARY_UPLOAD_PRESET = 'legolas977';
    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const PRODUCT_IMAGE_MAX_DIMENSION = 1400; // 上傳前壓縮：長邊最大像素
    const PRODUCT_IMAGE_JPEG_QUALITY = 0.82;  // 上傳前壓縮：JPEG品質(0~1)
    const PRODUCT_IMAGE_MAX_RAW_MB = 20;      // 原始檔案超過這個大小直接拒絕(前端擋，Cloudinary端未設限)
