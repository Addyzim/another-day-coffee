/*
 * Another Day Coffee — Admin dashboard.
 *
 *  • Orders : live incoming orders (chime on new), View / Close / Reopen.
 *  • Menu   : add / edit / delete items, prices, EN/VI names, categories,
 *             descriptions, availability, and photo upload (Cloudinary).
 *             Saved to Firestore -> appears on the live site instantly.
 *
 * UI is bilingual EN/VI (toggle in the header, remembered in localStorage).
 * Requires firebase-config.js filled in, Firestore + Auth (Email/Password)
 * enabled, and an admin user created.
 */

const { createApp } = Vue;

// ---- UI strings (EN / VI). Functions take runtime args. ----
const T = {
  en: {
    admin: "Admin", signOut: "Sign out",
    staffSignIn: "Staff sign-in", email: "Email", password: "Password",
    signInBtn: "Sign in", signingIn: "Signing in…", signInFailed: "Sign-in failed",
    notConfiguredTitle: "Admin dashboard",
    notConfiguredBody: "Firebase isn't configured. Fill in firebase-config.js.",
    soundOn: "Sound on", soundOff: "Sound off",
    orders: "Orders", menuTab: "Menu",
    open: "Open", closed: "Closed",
    noOpen: "No open orders. New ones appear here instantly.",
    noClosed: "No closed orders yet.",
    table: "Table", view: "View", hide: "Hide", note: "Note",
    closeOrder: "Close order", reopen: "Reopen",
    searchOrders: "Search orders (number, table, item)…",
    searchMenu: "Search menu (name, category)…",
    noResults: "Nothing found.", clearSearch: "Clear",
    newOrderTitle: "🔔 New order!",
    addItem: "+ Add item", importFromRepo: "Import from menu.json",
    exportMenu: "⬇ Export menu (Excel)", importFile: "⬆ Upload file", importing: "Importing…",
    emptyMenu: "Menu is empty. Add an item or import from menu.json.",
    hidden: "hidden", edit: "Edit",
    newItemTitle: "New item", editTitle: "Edit",
    uploadPhoto: "Upload photo", uploadingLabel: (p) => "Uploading " + p + "%",
    orPasteUrl: "or paste a URL manually",
    imgPlaceholder: "https://… or images/name.jpg", removePhoto: "Remove photo",
    nameEn: "Name (EN)", nameVi: "Name (VI)", catEn: "Category (EN)", catVi: "Category (VI)",
    priceVnd: "Price (VND)", orderField: "Order", description: "Description",
    available: "Available (show to guests)",
    cancel: "Cancel", save: "Save", saving: "Saving…",
    enterName: "Enter a name",
    confirmDelete: (n) => `Delete “${n}”?`,
    cloudinaryNotSet: "Cloudinary isn't set up. Fill cloudName and uploadPreset in firebase-config.js.",
    notImage: "That's not an image.",
    uploadFailed: (s, m) => `Upload failed [${s}]: ${m}`,
    networkFail: "Network error — upload failed.",
    confirmSeed: "Import items from menu.json into the database? (items with the same id are overwritten)",
    importedN: (n) => `Imported ${n} items.`,
    importFailed: (e) => `Import failed: ${e}`,
    noItemsInFile: 'No items in the file (expected { "items": [...] }).',
    confirmImport: (n) => `Import ${n} items? Items with the same id will be overwritten.`,
    saveFailed: (e) => `Save failed: ${e}`,
    closeFailed: (e) => `Could not close order: ${e}`,
  },
  vi: {
    admin: "Quản trị", signOut: "Đăng xuất",
    staffSignIn: "Đăng nhập nhân viên", email: "Email", password: "Mật khẩu",
    signInBtn: "Đăng nhập", signingIn: "Đang đăng nhập…", signInFailed: "Đăng nhập thất bại",
    notConfiguredTitle: "Bảng quản trị",
    notConfiguredBody: "Chưa cấu hình Firebase. Điền vào firebase-config.js.",
    soundOn: "Bật âm thanh", soundOff: "Tắt âm thanh",
    orders: "Đơn hàng", menuTab: "Thực đơn",
    open: "Đang mở", closed: "Đã đóng",
    noOpen: "Chưa có đơn nào. Đơn mới sẽ hiện ở đây ngay lập tức.",
    noClosed: "Chưa có đơn đã đóng.",
    table: "Bàn", view: "Xem", hide: "Ẩn", note: "Ghi chú",
    closeOrder: "Đóng đơn", reopen: "Mở lại",
    searchOrders: "Tìm đơn (số, bàn, món)…",
    searchMenu: "Tìm món (tên, danh mục)…",
    noResults: "Không tìm thấy.", clearSearch: "Xóa",
    newOrderTitle: "🔔 Đơn mới!",
    addItem: "+ Thêm món", importFromRepo: "Nhập từ menu.json",
    exportMenu: "⬇ Tải thực đơn (Excel)", importFile: "⬆ Tải tệp lên", importing: "Đang nhập…",
    emptyMenu: "Thực đơn trống. Thêm món hoặc nhập từ menu.json.",
    hidden: "ẩn", edit: "Sửa",
    newItemTitle: "Món mới", editTitle: "Chỉnh sửa",
    uploadPhoto: "Tải ảnh lên", uploadingLabel: (p) => "Đang tải " + p + "%",
    orPasteUrl: "hoặc dán URL thủ công",
    imgPlaceholder: "https://… hoặc images/ten.jpg", removePhoto: "Xóa ảnh",
    nameEn: "Tên (EN)", nameVi: "Tên (VI)", catEn: "Danh mục (EN)", catVi: "Danh mục (VI)",
    priceVnd: "Giá (VND)", orderField: "Thứ tự", description: "Mô tả",
    available: "Hiển thị (cho khách xem)",
    cancel: "Hủy", save: "Lưu", saving: "Đang lưu…",
    enterName: "Nhập tên món",
    confirmDelete: (n) => `Xóa “${n}”?`,
    cloudinaryNotSet: "Chưa cấu hình Cloudinary. Điền cloudName và uploadPreset vào firebase-config.js.",
    notImage: "Đây không phải hình ảnh.",
    uploadFailed: (s, m) => `Tải lên thất bại [${s}]: ${m}`,
    networkFail: "Mất kết nối — tải lên thất bại.",
    confirmSeed: "Nhập các món từ menu.json vào cơ sở dữ liệu? (các món trùng id sẽ bị ghi đè)",
    importedN: (n) => `Đã nhập ${n} món.`,
    importFailed: (e) => `Nhập thất bại: ${e}`,
    noItemsInFile: 'Tệp không có món nào (cần định dạng { "items": [...] }).',
    confirmImport: (n) => `Nhập ${n} món? Các món trùng id sẽ bị ghi đè.`,
    saveFailed: (e) => `Lưu thất bại: ${e}`,
    closeFailed: (e) => `Không thể đóng đơn: ${e}`,
  },
};

function initialLang() {
  const saved = localStorage.getItem("adc_admin_lang");
  if (saved === "en" || saved === "vi") return saved;
  return (navigator.language || "").toLowerCase().startsWith("vi") ? "vi" : "en";
}

createApp({
  data() {
    return {
      lang: initialLang(),
      ready: false,
      user: null,
      email: "",
      password: "",
      authError: "",
      loggingIn: false,

      section: "orders",   // 'orders' | 'menu'

      // Orders
      orders: [],
      closed: [],
      tab: "open",
      expanded: {},
      soundOn: true,
      _seen: 0,
      search: "",

      // Menu
      menu: [],
      editing: null,       // item being added/edited (form model)
      saving: false,
      uploading: false,
      uploadPct: 0,
    };
  },

  watch: {
    lang(v) { localStorage.setItem("adc_admin_lang", v); },
    section() { this.search = ""; },
    tab() { this.search = ""; },
  },

  computed: {
    list() { return this.tab === "open" ? this.orders : this.closed; },
    openCount() { return this.orders.length; },
    nextId() { return this.menu.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0) + 1; },
    filteredList() {
      const q = this.search.trim().toLowerCase();
      if (!q) return this.list;
      return this.list.filter((o) => {
        const hay = [
          o.orderNo, o.table, o.note,
          ...(o.items || []).flatMap((it) => [it.name, it.name_vi]),
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      });
    },
    filteredMenu() {
      const q = this.search.trim().toLowerCase();
      if (!q) return this.menu;
      return this.menu.filter((it) =>
        [it.name, it.name_vi, it.category, it.category_vi]
          .filter(Boolean).join(" ").toLowerCase().includes(q));
    },
  },

  mounted() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId) { this.ready = false; return; }
    this.ready = true;
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    // Images are stored via Cloudinary / the repo (frontend/images/), not
    // Firebase Storage (Storage needs the paid Blaze plan).
    this.auth.onAuthStateChanged((u) => {
      this.user = u;
      if (u) { this.subscribeOrders(); this.subscribeMenu(); }
    });
    // Browsers block audio until the user interacts with the page. Create one
    // shared AudioContext and unlock it on the first click/keypress so the
    // new-order chime can actually play later (it fires from a Firestore
    // callback, which is NOT a user gesture and would stay suspended).
    const unlock = () => {
      try {
        if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this._audioCtx.state === "suspended") this._audioCtx.resume();
      } catch (e) {}
      this.askNotify();   // ask for OS-notification permission on a user gesture
      if (this._audioCtx && this._audioCtx.state === "running") {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    // Keep the audio context alive when returning to the tab so the chime
    // still fires reliably.
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this._audioCtx && this._audioCtx.state === "suspended") {
        this._audioCtx.resume().catch(() => {});
      }
    });
  },

  methods: {
    t(key, ...args) {
      const v = (T[this.lang] || T.en)[key];
      return typeof v === "function" ? v(...args) : v;
    },
    money(v) {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(v) || 0);
    },
    time(ts) {
      const d = ts && ts.toDate ? ts.toDate() : new Date();
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },

    async login() {
      this.authError = ""; this.loggingIn = true;
      try { await this.auth.signInWithEmailAndPassword(this.email.trim(), this.password); }
      catch (e) { this.authError = e.message || this.t("signInFailed"); }
      finally { this.loggingIn = false; }
    },
    logout() { this.auth.signOut(); },

    // ----- Orders ----------------------------------------------------------
    subscribeOrders() {
      this.db.collection("orders").where("status", "==", "open").onSnapshot((snap) => {
        const rows = []; snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        if (rows.length > this._seen && this._seen !== 0) this.announce(rows[0]);
        this._seen = rows.length;
        this.orders = rows;
      }, (e) => console.error(e));

      this.db.collection("orders").where("status", "==", "closed").onSnapshot((snap) => {
        const rows = []; snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.closedAt?.seconds || 0) - (a.closedAt?.seconds || 0));
        this.closed = rows.slice(0, 20);
      }, (e) => console.error(e));
    },
    askNotify() {
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    },
    announce(order) {
      const orig = document.title;
      document.title = this.t("newOrderTitle");
      setTimeout(() => (document.title = orig), 4000);
      // OS notification — shows (and dings) even when the tab is in the
      // background or the browser window is minimized on desktop.
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          const parts = [];
          if (order && order.orderNo) parts.push(order.orderNo);
          if (order && order.table) parts.push(this.t("table") + " " + order.table);
          if (order && order.total != null) parts.push(this.money(order.total));
          const n = new Notification(this.t("newOrderTitle"), {
            body: parts.join(" · "),
            tag: "adc-order",
            requireInteraction: false,
          });
          n.onclick = () => { window.focus(); n.close(); };
        }
      } catch (e) {}
      if (!this.soundOn) return;
      try {
        if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = this._audioCtx;
        if (ctx.state === "suspended") ctx.resume();
        // Two short beeps so it's noticeable in a busy café.
        const beep = (start, freq) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine"; o.frequency.value = freq;
          g.gain.setValueAtTime(0.001, start);
          g.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
          o.start(start); o.stop(start + 0.45);
        };
        const t0 = ctx.currentTime;
        beep(t0, 880);
        beep(t0 + 0.25, 1175);
      } catch (e) {}
    },
    toggle(id) { this.expanded[id] = !this.expanded[id]; },
    closeOrder(o) {
      this.db.collection("orders").doc(o.id).update({ status: "closed", closedAt: firebase.firestore.FieldValue.serverTimestamp() })
        .catch((e) => alert(this.t("closeFailed", e.message)));
    },
    reopen(o) { this.db.collection("orders").doc(o.id).update({ status: "open" }).catch((e) => alert(e.message)); },

    // ----- Menu ------------------------------------------------------------
    subscribeMenu() {
      this.db.collection("menu").onSnapshot((snap) => {
        const rows = []; snap.forEach((d) => rows.push(d.data()));
        rows.sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0));
        this.menu = rows;
      }, (e) => console.error(e));
    },
    newItem() {
      const id = this.nextId;
      this.editing = { id, category: "", category_vi: "", name: "", name_vi: "", price: 0, description: "", image: "", available: true, order: id, _isNew: true };
    },
    editItem(it) { this.editing = { ...it }; },
    cancelEdit() { this.editing = null; },
    async saveItem() {
      const it = this.editing;
      if (!it.name || !it.name.trim()) { alert(this.t("enterName")); return; }
      this.saving = true;
      try {
        const id = Number(it.id);
        await this.db.collection("menu").doc(String(id)).set({
          id,
          category: (it.category || "Uncategorized").trim(),
          category_vi: (it.category_vi || "").trim(),
          name: it.name.trim(),
          name_vi: (it.name_vi || "").trim(),
          price: parseInt(String(it.price).replace(/[^0-9]/g, ""), 10) || 0,
          description: (it.description || "").trim(),
          image: it.image || "",
          available: it.available !== false,
          order: it.order ?? id,
        });
        this.editing = null;
      } catch (e) { alert(this.t("saveFailed", e.message)); }
      finally { this.saving = false; }
    },
    deleteItem(it) {
      if (!confirm(this.t("confirmDelete", it.name))) return;
      this.db.collection("menu").doc(String(it.id)).delete().catch((e) => alert(e.message));
    },
    uploadImage(e) {
      const file = e.target.files[0];
      if (!file) return;
      const cfg = window.CLOUDINARY || {};
      if (!cfg.cloudName || !cfg.uploadPreset) {
        alert(this.t("cloudinaryNotSet"));
        e.target.value = ""; return;
      }
      if (!file.type.startsWith("image/")) { alert(this.t("notImage")); e.target.value = ""; return; }
      this.uploading = true; this.uploadPct = 0;
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", cfg.uploadPreset);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) this.uploadPct = Math.round((ev.loaded / ev.total) * 100);
      };
      xhr.onload = () => {
        this.uploading = false; e.target.value = "";
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          this.editing.image = res.secure_url;
        } else {
          let msg = xhr.responseText;
          try { msg = JSON.parse(xhr.responseText).error.message; } catch (_) {}
          alert(this.t("uploadFailed", xhr.status, msg));
        }
      };
      xhr.onerror = () => { this.uploading = false; e.target.value = ""; alert(this.t("networkFail")); };
      xhr.send(data);
    },
    async seedFromJson() {
      if (!confirm(this.t("confirmSeed"))) return;
      this.saving = true;
      try {
        const res = await fetch(`./menu.json?t=${Date.now()}`);
        const data = await res.json();
        const items = data.items || [];
        const batch = this.db.batch();
        items.forEach((it, i) => {
          const id = Number(it.id) || (i + 1);
          batch.set(this.db.collection("menu").doc(String(id)), {
            id,
            category: it.category || "Uncategorized",
            category_vi: it.category_vi || "",
            name: it.name || "",
            name_vi: it.name_vi || "",
            price: parseInt(String(it.price).replace(/[^0-9]/g, ""), 10) || 0,
            description: it.description || "",
            image: it.image || "",
            available: true,
            order: id,
          });
        });
        await batch.commit();
        alert(this.t("importedN", items.length));
      } catch (e) { alert(this.t("importFailed", e.message)); }
      finally { this.saving = false; }
    },
    // Map the in-memory menu to clean, ordered rows (shared by export & repo file).
    menuRows() {
      return [...this.menu]
        .sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0))
        .map((it) => ({
          id: Number(it.id),
          category: it.category || "",
          category_vi: it.category_vi || "",
          name: it.name || "",
          name_vi: it.name_vi || "",
          price: parseInt(String(it.price).replace(/[^0-9]/g, ""), 10) || 0,
          description: it.description || "",
          image: it.image || "",
          available: it.available !== false,
          order: Number(it.order ?? it.id) || 0,
        }));
    },
    // Download the whole current menu as an Excel file (easier for staff to edit).
    exportMenu() {
      const rows = this.menuRows();
      if (typeof XLSX === "undefined") {  // fallback to JSON if the lib didn't load
        const blob = new Blob([JSON.stringify({ items: rows }, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "menu.json"; a.click();
        URL.revokeObjectURL(a.href); return;
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Menu");
      XLSX.writeFile(wb, "menu.xlsx");
    },
    // Import a menu file the staff edited offline (.xlsx / .csv / .json);
    // overwrites items with the same id.
    async importMenuFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      e.target.value = "";
      try {
        let items;
        const isJson = /\.json$/i.test(file.name) || file.type === "application/json";
        if (isJson) {
          const parsed = JSON.parse(await file.text());
          items = Array.isArray(parsed) ? parsed : (parsed.items || []);
        } else {
          if (typeof XLSX === "undefined") { alert(this.t("importFailed", "XLSX")); return; }
          const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          items = XLSX.utils.sheet_to_json(ws);
        }
        if (!items.length) { alert(this.t("noItemsInFile")); return; }
        if (!confirm(this.t("confirmImport", items.length))) return;
        this.saving = true;
        const batch = this.db.batch();
        items.forEach((it, i) => {
          const id = Number(it.id) || (i + 1);
          batch.set(this.db.collection("menu").doc(String(id)), {
            id,
            category: it.category || "Uncategorized",
            category_vi: it.category_vi || "",
            name: it.name || "",
            name_vi: it.name_vi || "",
            price: parseInt(String(it.price).replace(/[^0-9]/g, ""), 10) || 0,
            description: it.description || "",
            image: it.image || "",
            available: it.available !== false,
            order: Number(it.order ?? id) || id,
          });
        });
        await batch.commit();
        alert(this.t("importedN", items.length));
      } catch (err) { alert(this.t("importFailed", err.message)); }
      finally { this.saving = false; }
    },
  },

  template: `
  <div class="max-w-xl lg:max-w-6xl mx-auto min-h-screen px-4 sm:px-6 py-5">

    <!-- Language toggle (sign-in / not-configured screens only) -->
    <div v-if="!user" class="flex justify-end mb-2">
      <div class="inline-flex rounded-full bg-white border border-stone-200 overflow-hidden text-xs font-semibold">
        <button @click="lang='en'" :class="lang==='en' ? 'bg-mocha-500 text-white' : 'text-mocha-500'" class="px-3 py-1">EN</button>
        <button @click="lang='vi'" :class="lang==='vi' ? 'bg-mocha-500 text-white' : 'text-mocha-500'" class="px-3 py-1">VI</button>
      </div>
    </div>

    <div v-if="!ready" class="mt-20 text-center">
      <h1 class="font-display text-2xl font-semibold mb-2">{{ t('notConfiguredTitle') }}</h1>
      <p class="text-mocha-400">{{ t('notConfiguredBody') }}</p>
    </div>

    <div v-else-if="!user" class="mt-16 max-w-sm mx-auto bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
      <h1 class="font-display text-2xl font-semibold text-center mb-1">Another Day Coffee</h1>
      <p class="text-mocha-400 text-sm text-center mb-5">{{ t('staffSignIn') }}</p>
      <form @submit.prevent="login" class="space-y-3">
        <input v-model="email" type="email" :placeholder="t('email')" autocomplete="username"
               class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5 outline-none focus:border-mocha-400" />
        <input v-model="password" type="password" :placeholder="t('password')" autocomplete="current-password"
               class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5 outline-none focus:border-mocha-400" />
        <p v-if="authError" class="text-red-500 text-xs">{{ authError }}</p>
        <button type="submit" :disabled="loggingIn"
                class="w-full bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5 disabled:opacity-60">
          {{ loggingIn ? t('signingIn') : t('signInBtn') }}
        </button>
      </form>
    </div>

    <div v-else>
      <header class="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
        <div class="flex items-center gap-2 min-w-0">
          <svg viewBox="0 0 24 24" class="h-8 w-8 text-mocha-500 shrink-0" fill="currentColor" aria-hidden="true">
            <ellipse cx="12" cy="12" rx="6.4" ry="9.4" transform="rotate(32 12 12)"/>
            <path d="M12 3.6 C 8.6 8, 15.4 16, 12 20.4" transform="rotate(32 12 12)" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <h1 class="font-display text-xl sm:text-2xl font-semibold leading-none truncate">Another Day Coffee</h1>
          <span class="text-mocha-400 font-medium whitespace-nowrap">· {{ t('admin') }}</span>
        </div>
        <div class="flex items-center gap-2 ml-auto">
          <div class="inline-flex rounded-full bg-white border border-stone-200 overflow-hidden text-xs font-semibold">
            <button @click="lang='en'" :class="lang==='en' ? 'bg-mocha-500 text-white' : 'text-mocha-500'" class="px-2.5 py-1">EN</button>
            <button @click="lang='vi'" :class="lang==='vi' ? 'bg-mocha-500 text-white' : 'text-mocha-500'" class="px-2.5 py-1">VI</button>
          </div>
          <button v-if="section==='orders'" @click="soundOn = !soundOn" :title="soundOn ? t('soundOn') : t('soundOff')"
                  class="w-9 h-9 grid place-items-center rounded-full bg-white border border-stone-200">{{ soundOn ? '🔔' : '🔕' }}</button>
          <button @click="logout" class="text-sm text-mocha-500 px-3 py-1.5 rounded-full bg-white border border-stone-200 whitespace-nowrap">{{ t('signOut') }}</button>
        </div>
      </header>

      <!-- Section switch -->
      <div class="flex gap-2 mb-4">
        <button @click="section='orders'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                :class="section==='orders' ? 'bg-mocha-500 text-white' : 'bg-white border border-stone-200 text-mocha-500'">
          {{ t('orders') }} <span v-if="openCount" class="ml-1 bg-white/25 rounded-full px-1.5">{{ openCount }}</span>
        </button>
        <button @click="section='menu'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                :class="section==='menu' ? 'bg-mocha-500 text-white' : 'bg-white border border-stone-200 text-mocha-500'">{{ t('menuTab') }}</button>
      </div>

      <!-- ================= ORDERS ================= -->
      <div v-if="section==='orders'">
        <div class="flex flex-wrap items-center gap-2 mb-4">
          <button @click="tab='open'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                  :class="tab==='open' ? 'bg-mocha-400 text-white' : 'bg-white border border-stone-200 text-mocha-500'">{{ t('open') }}</button>
          <button @click="tab='closed'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                  :class="tab==='closed' ? 'bg-mocha-400 text-white' : 'bg-white border border-stone-200 text-mocha-500'">{{ t('closed') }}</button>
          <div class="relative ml-auto w-full sm:w-72">
            <input v-model="search" :placeholder="t('searchOrders')"
                   class="w-full rounded-full bg-white border border-stone-200 pl-4 pr-8 py-1.5 text-sm outline-none focus:border-mocha-400" />
            <button v-if="search" @click="search=''" :title="t('clearSearch')"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-mocha-300 hover:text-mocha-500">✕</button>
          </div>
        </div>
        <p v-if="filteredList.length === 0" class="text-center text-mocha-400 py-16">
          {{ search ? t('noResults') : (tab === 'open' ? t('noOpen') : t('noClosed')) }}
        </p>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start">
          <article v-for="o in filteredList" :key="o.id" class="pop bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span v-if="o.orderNo" class="text-xs font-bold font-mono bg-mocha-500 text-white rounded-full px-2.5 py-1">{{ o.orderNo }}</span>
                  <span v-if="o.table" class="text-xs font-bold bg-sage-200 text-mocha-600 rounded-full px-2.5 py-1">{{ t('table') }} {{ o.table }}</span>
                  <span class="text-xs text-mocha-400">{{ time(o.createdAt) }}</span>
                </div>
                <p class="font-display text-lg font-semibold mt-1">{{ money(o.total) }}</p>
              </div>
              <button @click="toggle(o.id)" class="text-sm text-mocha-500 underline">{{ expanded[o.id] ? t('hide') : t('view') }}</button>
            </div>
            <div v-if="expanded[o.id]" class="mt-3 pt-3 border-t border-stone-100 space-y-1">
              <div v-for="(it,i) in o.items" :key="i" class="flex justify-between text-sm">
                <span class="text-mocha-600">{{ it.qty }}× {{ it.name }}<span v-if="it.name_vi" class="text-mocha-400"> · {{ it.name_vi }}</span><span v-if="it.milk" class="text-amber-700"> · {{ it.milk }}</span></span>
                <span class="text-mocha-500">{{ money(it.price * it.qty) }}</span>
              </div>
              <p v-if="o.note" class="text-sm text-mocha-500 pt-2"><b>{{ t('note') }}:</b> {{ o.note }}</p>
            </div>
            <div class="mt-3 flex gap-2">
              <button v-if="o.status==='open'" @click="closeOrder(o)" class="flex-1 bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5">{{ t('closeOrder') }}</button>
              <button v-else @click="reopen(o)" class="flex-1 bg-white border border-stone-200 text-mocha-500 font-semibold rounded-xl py-2.5">{{ t('reopen') }}</button>
            </div>
          </article>
        </div>
      </div>

      <!-- ================= MENU ================= -->
      <div v-else>
        <div class="flex flex-wrap gap-2 mb-4">
          <button @click="newItem" class="flex-1 bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5">{{ t('addItem') }}</button>
          <button v-if="menu.length===0" @click="seedFromJson" :disabled="saving"
                  class="bg-sage-200 text-mocha-600 font-semibold rounded-xl px-4 py-2.5">{{ t('importFromRepo') }}</button>
        </div>
        <div class="flex flex-wrap gap-2 mb-4">
          <button @click="exportMenu" :disabled="menu.length===0"
                  class="flex-1 bg-white border border-stone-200 text-mocha-600 font-semibold rounded-xl py-2.5 disabled:opacity-50">{{ t('exportMenu') }}</button>
          <label class="flex-1 cursor-pointer bg-white border border-stone-200 text-mocha-600 font-semibold rounded-xl py-2.5 text-center">
            <span>{{ saving ? t('importing') : t('importFile') }}</span>
            <input type="file" accept=".xlsx,.xls,.csv,.json,application/json" @change="importMenuFile" :disabled="saving" class="hidden" />
          </label>
        </div>

        <div v-if="menu.length" class="relative mb-4">
          <input v-model="search" :placeholder="t('searchMenu')"
                 class="w-full rounded-full bg-white border border-stone-200 pl-4 pr-8 py-2 text-sm outline-none focus:border-mocha-400" />
          <button v-if="search" @click="search=''" :title="t('clearSearch')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-mocha-300 hover:text-mocha-500">✕</button>
        </div>

        <p v-if="menu.length===0" class="text-center text-mocha-400 py-12">{{ t('emptyMenu') }}</p>
        <p v-else-if="filteredMenu.length===0" class="text-center text-mocha-400 py-12">{{ t('noResults') }}</p>

        <div class="grid gap-2 lg:grid-cols-2 items-start">
          <div v-for="it in filteredMenu" :key="it.id" class="bg-white rounded-2xl shadow-sm border border-stone-100 p-3 flex items-center gap-3"
               :class="it.available === false ? 'opacity-50' : ''">
            <div class="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-stone-100 grid place-items-center">
              <img v-if="it.image" :src="it.image" alt="" class="w-full h-full object-cover" />
              <span v-else class="text-mocha-300 text-lg">☕</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-mocha-600 truncate">{{ it.name }} <span v-if="it.name_vi" class="text-mocha-400 text-sm">· {{ it.name_vi }}</span></p>
              <p class="text-xs text-mocha-400 truncate">{{ it.category }} · {{ money(it.price) }}<span v-if="it.available===false"> · {{ t('hidden') }}</span></p>
            </div>
            <button @click="editItem(it)" class="text-sm text-mocha-500 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200">{{ t('edit') }}</button>
            <button @click="deleteItem(it)" class="text-sm text-red-400 px-2 py-1.5">✕</button>
          </div>
        </div>
      </div>

      <!-- ===== Edit / add modal ===== -->
      <div v-if="editing" class="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center" @click.self="cancelEdit">
        <div class="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display text-xl font-semibold">{{ editing._isNew ? t('newItemTitle') : t('editTitle') }}</h2>
            <button @click="cancelEdit" class="w-9 h-9 grid place-items-center rounded-full text-mocha-400">✕</button>
          </div>

          <!-- Image -->
          <div class="flex items-center gap-3 mb-4">
            <div class="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-100 grid place-items-center">
              <img v-if="editing.image" :src="editing.image" alt="" class="w-full h-full object-cover" />
              <span v-else class="text-mocha-300 text-2xl">☕</span>
            </div>
            <div class="flex-1">
              <label class="block">
                <span class="text-sm font-semibold text-mocha-500">{{ uploading ? t('uploadingLabel', uploadPct) : t('uploadPhoto') }}</span>
                <input type="file" accept="image/*" @change="uploadImage" :disabled="uploading" class="block w-full text-xs mt-1" />
              </label>
              <details class="mt-2">
                <summary class="text-[11px] text-mocha-400 cursor-pointer">{{ t('orPasteUrl') }}</summary>
                <input v-model="editing.image" :placeholder="t('imgPlaceholder')" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400 text-sm" />
              </details>
              <button v-if="editing.image" @click="editing.image=''" class="text-xs text-red-400 mt-1">{{ t('removePhoto') }}</button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <label class="block"><span class="text-xs font-semibold text-mocha-500">{{ t('nameEn') }}</span>
                <input v-model="editing.name" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">{{ t('nameVi') }}</span>
                <input v-model="editing.name_vi" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">{{ t('catEn') }}</span>
                <input v-model="editing.category" list="cats" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">{{ t('catVi') }}</span>
                <input v-model="editing.category_vi" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <datalist id="cats"><option v-for="c in [...new Set(menu.map(m=>m.category))]" :key="c" :value="c"></option></datalist>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">{{ t('priceVnd') }}</span>
                <input v-model="editing.price" inputmode="numeric" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">{{ t('orderField') }}</span>
                <input v-model="editing.order" inputmode="numeric" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
            </div>
            <label class="block"><span class="text-xs font-semibold text-mocha-500">{{ t('description') }}</span>
              <textarea v-model="editing.description" rows="2" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400"></textarea></label>
            <label class="flex items-center gap-2"><input type="checkbox" v-model="editing.available" /><span class="text-sm text-mocha-500">{{ t('available') }}</span></label>
          </div>

          <div class="flex gap-2 mt-5">
            <button @click="cancelEdit" class="flex-1 bg-stone-100 text-mocha-500 font-semibold rounded-xl py-2.5">{{ t('cancel') }}</button>
            <button @click="saveItem" :disabled="saving || uploading" class="flex-1 bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5 disabled:opacity-60">{{ saving ? t('saving') : t('save') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
}).mount("#admin");
