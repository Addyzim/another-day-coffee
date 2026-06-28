/*
 * Another Day Coffee — Vue 3 frontend (static, no backend, no build step)
 * ----------------------------------------------------------------------
 * The menu lives in a static `menu.json` next to this file, so the whole
 * site is hosted for free on GitHub Pages — there is no server to run.
 *
 * Features: burger side menu (Menu / About Us / Contacts), EN/VI language
 * selector (auto-detects Vietnamese phones), a cart that sends table orders
 * to the manager's WhatsApp, and a hidden admin mode for editing the menu.
 *
 * ====================== THINGS TO CONFIGURE ============================
 *   CAFE.whatsapp : the manager's WhatsApp number in international format,
 *                   digits only (e.g. "84905123456"). Until set, the order
 *                   button will warn instead of opening WhatsApp.
 *   CAFE.logo     : path to a logo image (e.g. "./logo.png"). Leave "" for
 *                   text-only. Drop the file in the frontend/ folder.
 * ======================================================================
 *
 * Staff/admin access is hidden from visitors. Open it by adding STAFF_HASH
 * to the URL, e.g.  https://addyzim.github.io/the-corner-cafe/#staff-corner
 * (light obscurity, not real security — a static site can't truly hide it.)
 */

const { createApp } = Vue;

const REQUIRED = ["id", "category", "name", "price"];
const STAFF_HASH = "#staff-corner";

// ---- Café details (edit freely) -------------------------------------------
const CAFE = {
  name: "Another Day Coffee",
  logo: "",            // e.g. "./logo.png"
  whatsapp: "84937009465",  // digits only, international format
  tagline: { en: "Specialty coffee · Đà Nẵng", vi: "Cà phê đặc sản · Đà Nẵng" },
  menuNote: { en: "Oat milk available +10.000 ₫", vi: "Có sữa yến mạch +10.000 ₫" },
  about: {
    en: [
      "Another Day Coffee is a calm corner in Đà Nẵng for people who take their coffee seriously. We brew Vietnamese robusta & arabica the traditional way, pour proper Italian espresso, and slow-steep our cold brew for a clean, bright cup.",
      "Pull up a chair, order a cà phê muối or a flat white, and let the afternoon go by — there's always another day.",
    ],
    vi: [
      "Another Day Coffee là một góc bình yên ở Đà Nẵng dành cho những ai yêu cà phê thật sự. Chúng tôi pha cà phê Việt (robusta & arabica) theo cách truyền thống, chiết xuất espresso kiểu Ý chuẩn vị, và ủ lạnh cold brew cho ly cà phê trong trẻo.",
      "Hãy ngồi xuống, gọi một ly cà phê muối hay flat white, và để buổi chiều trôi qua — luôn còn một ngày nữa.",
    ],
  },
  highlights: [
    { icon: "M18 8h1a4 4 0 010 8h-1M6 1v3M10 1v3M14 1v3M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z",
      title: { en: "Vietnamese & Italian", vi: "Cà phê Việt & Ý" },
      text: { en: "Robusta, arabica, and proper espresso.", vi: "Robusta, arabica và espresso chuẩn vị." } },
    { icon: "M5 8c0-3 2-5 7-5s7 2 7 5M5 8h14M5 8c0 6 3 11 7 11s7-5 7-11",
      title: { en: "Slow cold brew", vi: "Cold brew ủ lạnh" },
      text: { en: "Steeped for a clean, bright cup.", vi: "Ủ chậm cho ly trong trẻo." } },
    { icon: "M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z",
      title: { en: "Fresh & seasonal", vi: "Tươi & theo mùa" },
      text: { en: "Teas, juices and yogurts made fresh.", vi: "Trà, nước ép và sữa chua tươi mỗi ngày." } },
  ],
  contact: {
    address: "352 Đ. Nguyễn Xiển, Ngũ Hành Sơn, Đà Nẵng 550000",
    phone: "",
    email: "",
    hours: [{ d: { en: "Every day", vi: "Mỗi ngày" }, h: "07:00 – 18:00" }],
    mapsUrl: "https://maps.app.goo.gl/oTRZu8dTrLxg1crd6",
  },
};

// ---- UI strings ------------------------------------------------------------
const STRINGS = {
  en: {
    menu: "Menu", about: "About Us", contact: "Contacts",
    adminOn: "Admin mode", adminOff: "Exit admin mode", all: "All",
    loading: "Brewing the menu…", loadError: "Could not load the menu. Please refresh and try again.",
    tryAgain: "Try again", empty: "Nothing here yet — check another category.",
    hours: "Opening hours", openMaps: "Open in Maps", add: "Add",
    order: "Your order", table: "Table number", note: "Note (optional)",
    send: "Send order via WhatsApp", viewOrder: "View order", items: "items", item: "item",
    total: "Total", emptyCart: "Your order is empty.", tablePh: "e.g. 5",
    notePh: "Any special requests?", footer: "See you another day",
    editHint: "Tap any name, price, or description to edit. Then Export .json and commit it to publish.",
    noWa: "Order channel not set up yet.", orderHi: "New order",
  },
  vi: {
    menu: "Thực đơn", about: "Về chúng tôi", contact: "Liên hệ",
    adminOn: "Quản trị", adminOff: "Thoát quản trị", all: "Tất cả",
    loading: "Đang pha thực đơn…", loadError: "Không tải được thực đơn. Vui lòng tải lại trang.",
    tryAgain: "Thử lại", empty: "Chưa có món nào — chọn mục khác nhé.",
    hours: "Giờ mở cửa", openMaps: "Mở bản đồ", add: "Thêm",
    order: "Đơn của bạn", table: "Số bàn", note: "Ghi chú (tuỳ chọn)",
    send: "Gửi đơn qua WhatsApp", viewOrder: "Xem đơn", items: "món", item: "món",
    total: "Tổng", emptyCart: "Đơn của bạn đang trống.", tablePh: "vd. 5",
    notePh: "Yêu cầu đặc biệt?", footer: "Hẹn gặp lại ngày mai",
    editHint: "Chạm vào tên, giá hoặc mô tả để sửa. Sau đó Export .json và commit để đăng.",
    noWa: "Kênh đặt hàng chưa được cài đặt.", orderHi: "Đơn mới",
  },
};

const NAV = [
  { key: "menu", icon: "M4 7h16M4 12h16M4 17h16" },
  { key: "about", icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8h0" },
  { key: "contact", icon: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.8.4 1.6.7 2.3a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.7-1.7a2 2 0 012.1-.5c.7.3 1.5.6 2.3.7a2 2 0 011.7 2z" },
];

createApp({
  data() {
    return {
      cafe: CAFE,
      nav: NAV,
      lang: "en",
      view: "menu",
      drawerOpen: false,
      staffUnlocked: false,

      items: [],
      activeCategory: "All",
      isAdmin: false,
      loading: true,
      error: "",
      toast: "",
      importing: false,

      cart: {},          // id -> qty
      cartOpen: false,
      tableNo: "",
      note: "",
    };
  },

  computed: {
    s() { return STRINGS[this.lang]; },
    categories() {
      const seen = [];
      for (const it of this.items) {
        if (it.category && !seen.includes(it.category)) seen.push(it.category);
      }
      return ["All", ...seen];
    },
    filteredItems() {
      if (this.activeCategory === "All") return this.items;
      return this.items.filter((it) => it.category === this.activeCategory);
    },
    cartLines() {
      return Object.entries(this.cart)
        .map(([id, qty]) => {
          const it = this.items.find((i) => String(i.id) === String(id));
          return it ? { ...it, qty } : null;
        })
        .filter(Boolean);
    },
    cartCount() { return Object.values(this.cart).reduce((a, b) => a + b, 0); },
    cartTotal() { return this.cartLines.reduce((s, l) => s + l.price * l.qty, 0); },
  },

  mounted() {
    this.detectLang();
    this.applyHash();
    window.addEventListener("hashchange", this.applyHash);
    this.fetchItems();
  },

  methods: {
    t(key) { return this.s[key] ?? key; },

    // Pick a localized value: strings pass through; {en,vi} objects resolve.
    L(val) {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        return val[this.lang] ?? val.en ?? "";
      }
      return val;
    },

    // Localized field of a menu item, with the other language as fallback.
    nameOf(item) {
      return this.lang === "vi" ? (item.name_vi || item.name) : item.name;
    },
    altNameOf(item) {
      const alt = this.lang === "vi" ? item.name : (item.name_vi || "");
      return alt && alt.trim().toLowerCase() !== this.nameOf(item).trim().toLowerCase() ? alt : "";
    },
    catLabel(cat) {
      if (cat === "All") return this.t("all");
      if (this.lang === "vi") {
        const hit = this.items.find((i) => i.category === cat && i.category_vi);
        if (hit) return hit.category_vi;
      }
      return cat;
    },

    money(value) {
      const n = Number(value) || 0;
      return new Intl.NumberFormat("vi-VN", {
        style: "currency", currency: "VND", maximumFractionDigits: 0,
      }).format(n);
    },

    showToast(msg) {
      this.toast = msg;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => (this.toast = ""), 2200);
    },


    // ----- language --------------------------------------------------------
    detectLang() {
      let saved = null;
      try { saved = localStorage.getItem("lang"); } catch (e) {}
      if (saved === "en" || saved === "vi") { this.lang = saved; return; }
      const sys = (navigator.language || "").toLowerCase();
      this.lang = sys.startsWith("vi") ? "vi" : "en";
    },
    setLang(lang) {
      this.lang = lang;
      try { localStorage.setItem("lang", lang); } catch (e) {}
    },

    // ----- nav / drawer ----------------------------------------------------
    applyHash() { if (window.location.hash === STAFF_HASH) this.staffUnlocked = true; },
    openDrawer() { this.drawerOpen = true; document.body.style.overflow = "hidden"; },
    closeDrawer() { this.drawerOpen = false; document.body.style.overflow = ""; },
    go(view) { this.view = view; this.closeDrawer(); window.scrollTo({ top: 0, behavior: "smooth" }); },
    enterAdmin() { this.isAdmin = true; this.go("menu"); this.showToast(this.t("adminOn")); },

    // ----- cart ------------------------------------------------------------
    addToCart(item) { this.cart[item.id] = (this.cart[item.id] || 0) + 1; },
    inc(id) { this.cart[id] = (this.cart[id] || 0) + 1; },
    dec(id) {
      const q = (this.cart[id] || 0) - 1;
      if (q <= 0) delete this.cart[id]; else this.cart[id] = q;
    },
    openCart() { this.cartOpen = true; document.body.style.overflow = "hidden"; },
    closeCart() { this.cartOpen = false; document.body.style.overflow = ""; },

    sendOrder() {
      if (!this.cartCount) return;
      const num = (this.cafe.whatsapp || "").replace(/[^0-9]/g, "");
      if (!num) { this.showToast(this.t("noWa")); return; }
      const lines = this.cartLines
        .map((l) => `• ${l.qty}× ${this.nameOf(l)} — ${this.money(l.price * l.qty)}`)
        .join("\n");
      let msg = `${this.t("orderHi")} — ${this.cafe.name}\n`;
      if (this.tableNo) msg += `${this.t("table")}: ${this.tableNo}\n`;
      msg += `\n${lines}\n\n${this.t("total")}: ${this.money(this.cartTotal)}`;
      if (this.note) msg += `\n${this.t("note")}: ${this.note}`;
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
    },

    // ----- data ------------------------------------------------------------
    normalizeRow(raw) {
      const lower = {};
      for (const k of Object.keys(raw)) lower[k.trim().toLowerCase()] = raw[k];
      const priceDigits = String(lower.price ?? "").replace(/[^0-9]/g, "");
      const row = {
        id: parseInt(lower.id, 10),
        category: String(lower.category ?? "Uncategorized").trim() || "Uncategorized",
        name: String(lower.name ?? "").trim(),
        price: parseInt(priceDigits, 10) || 0,
      };
      for (const f of ["name_vi", "category_vi", "description"]) {
        const v = lower[f];
        if (v != null && String(v).trim() !== "") row[f] = String(v).trim();
      }
      return row;
    },
    normalizeRows(rows) {
      const seen = new Set();
      const out = [];
      for (const raw of rows) {
        const row = this.normalizeRow(raw);
        if (!Number.isInteger(row.id) || !row.name) continue;
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        out.push(row);
      }
      return out;
    },

    async fetchItems() {
      this.loading = true;
      this.error = "";
      try {
        const res = await fetch(`./menu.json?t=${Date.now()}`);
        if (!res.ok) throw new Error(`Could not load menu (${res.status})`);
        const data = await res.json();
        this.items = this.normalizeRows(data.items || []);
      } catch (err) {
        this.error = this.t("loadError");
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    saveField(item, field, event) {
      let value = event.target.innerText.trim();
      if (field === "price") value = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
      if (String(item[field]) === String(value)) return;
      item[field] = value;
      this.showToast("Edited — Export to publish");
    },

    triggerImport() { this.$refs.fileInput.click(); },
    async handleImport(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.importing = true;
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const present = new Set((rows[0] ? Object.keys(rows[0]) : []).map((k) => k.trim().toLowerCase()));
        const missing = REQUIRED.filter((c) => !present.has(c));
        if (missing.length) throw new Error(`Missing column(s): ${missing.join(", ")}`);
        const items = this.normalizeRows(rows);
        if (!items.length) throw new Error("No valid rows found");
        this.items = items;
        this.activeCategory = "All";
        this.showToast(`Imported ${items.length} items — Export to publish`);
      } catch (err) {
        this.showToast("Import failed: " + err.message);
        console.error(err);
      } finally {
        this.importing = false;
        event.target.value = "";
      }
    },
    download(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    },
    exportJson() {
      const payload = { items: this.items.map((it) => this.normalizeRow(it)) };
      this.download(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), "menu.json");
      this.showToast("Downloaded menu.json — commit it to publish");
    },
    exportXlsx() {
      const header = ["id", "category", "category_vi", "name", "name_vi", "price", "description"];
      const rows = this.items.map((it) => this.normalizeRow(it));
      const ws = XLSX.utils.json_to_sheet(rows, { header });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "menu");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      this.download(new Blob([out], { type: "application/octet-stream" }), "menu.xlsx");
      this.showToast("Downloaded menu.xlsx");
    },
  },

  template: `
  <div class="flex flex-col min-h-screen" :class="cartCount > 0 ? 'pb-24' : ''">

    <!-- ===== Header ===== -->
    <header class="sticky top-0 z-30 glass-header">
      <div class="h-16 px-5 grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2">
        <button @click="openDrawer" aria-label="Menu"
                class="pill w-11 h-11 grid place-items-center rounded-full text-mocha-500 hover:bg-white/60">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <div class="flex items-center justify-center gap-2 min-w-0">
          <img v-if="cafe.logo" :src="cafe.logo" alt="" class="h-8 w-8 rounded-full object-cover" />
          <h1 class="font-display text-xl font-semibold text-mocha-600 truncate">{{ cafe.name }}</h1>
        </div>
        <div aria-hidden="true"></div>
      </div>
    </header>

    <!-- ===== Side drawer ===== -->
    <transition name="overlay">
      <div v-if="drawerOpen" @click="closeDrawer" class="fixed inset-0 z-40 bg-mocha-600/25 backdrop-blur-[2px]"></div>
    </transition>
    <transition name="drawer">
      <aside v-if="drawerOpen" class="fixed top-0 left-0 z-50 h-full w-72 max-w-[82%] glass flex flex-col shadow-2xl shadow-mocha-600/20">
        <div class="px-6 pt-7 pb-5 border-b border-white/40 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <img v-if="cafe.logo" :src="cafe.logo" alt="" class="h-9 w-9 rounded-full object-cover" />
              <p class="font-display text-2xl font-semibold text-mocha-600 leading-none truncate">{{ cafe.name }}</p>
            </div>
            <p class="text-xs text-mocha-400 mt-2 tracking-wide">{{ L(cafe.tagline) }}</p>
          </div>
          <button @click="closeDrawer" aria-label="Close"
                  class="pill w-9 h-9 grid place-items-center rounded-full text-mocha-400 hover:bg-white/60 -mr-1 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <!-- Language selector -->
        <div class="px-4 pt-4">
          <div class="flex gap-1 p-1 glass rounded-full text-sm">
            <button @click="setLang('en')" class="pill flex-1 rounded-full py-1.5 font-medium"
                    :class="lang === 'en' ? 'bg-mocha-500 text-white' : 'text-mocha-500'">English</button>
            <button @click="setLang('vi')" class="pill flex-1 rounded-full py-1.5 font-medium"
                    :class="lang === 'vi' ? 'bg-mocha-500 text-white' : 'text-mocha-500'">Tiếng Việt</button>
          </div>
        </div>

        <nav class="flex-1 p-3 pt-4 space-y-1">
          <button v-for="n in nav" :key="n.key" @click="go(n.key)"
                  class="pill w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium"
                  :class="view === n.key ? 'bg-mocha-500 text-white shadow-sm shadow-mocha-300/40' : 'text-mocha-500 hover:bg-white/60'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="n.icon"/></svg>
            {{ t(n.key) }}
          </button>
        </nav>

        <div v-if="staffUnlocked" class="p-3 border-t border-white/40">
          <button @click="isAdmin ? (isAdmin = false, closeDrawer()) : enterAdmin()"
                  class="pill w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium"
                  :class="isAdmin ? 'bg-blush-300 text-mocha-600' : 'text-mocha-500 hover:bg-white/60'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M19.4 15a1.6 1.6 0 00.3 1.8 2 2 0 11-2.8 2.8 1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 005 19.4a2 2 0 11-2.8-2.8 1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H1a2 2 0 110-4h.1A1.6 1.6 0 004.6 5a2 2 0 112.8-2.8 1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V1a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3 2 2 0 112.8 2.8 1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H23a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>
            </svg>
            {{ isAdmin ? t('adminOff') : t('adminOn') }}
          </button>
        </div>
      </aside>
    </transition>

    <!-- ===== Main ===== -->
    <main class="flex-1 w-full">
      <transition name="swap" mode="out-in" appear>

        <!-- ----- MENU ----- -->
        <section v-if="view === 'menu'" key="menu" class="px-5 py-5">
          <div class="-mr-5 pr-5 flex gap-2 overflow-x-auto no-scrollbar snap-x-mandatory pb-1">
            <button v-for="cat in categories" :key="cat" @click="activeCategory = cat"
                    class="pill shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                    :style="{ scrollSnapAlign: 'start' }"
                    :class="activeCategory === cat ? 'bg-mocha-500 text-white shadow-md shadow-mocha-300/40' : 'glass text-mocha-500 hover:bg-white/70'">
              {{ catLabel(cat) }}
            </button>
          </div>

          <div v-if="isAdmin" class="mt-4 glass rounded-2xl p-3 grid grid-cols-3 gap-2 text-sm">
            <button @click="triggerImport" class="pill rounded-xl py-2.5 font-semibold text-mocha-600 bg-sage-200 hover:bg-sage-300">{{ importing ? 'Importing…' : 'Import .xlsx' }}</button>
            <button @click="exportJson" class="pill rounded-xl py-2.5 font-semibold text-mocha-600 bg-lilac-200 hover:bg-lilac-300">Export .json</button>
            <button @click="exportXlsx" class="pill rounded-xl py-2.5 font-semibold text-mocha-600 bg-blush-200 hover:bg-blush-300">Export .xlsx</button>
            <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleImport" />
            <p class="col-span-3 text-mocha-400 text-xs text-center pt-1">{{ t('editHint') }}</p>
          </div>

          <div v-if="loading" class="text-center text-mocha-400 py-20 font-display text-lg">{{ t('loading') }}</div>
          <div v-else-if="error" class="text-center text-mocha-500 glass rounded-2xl p-6 my-8">
            {{ error }}
            <button @click="fetchItems" class="block mx-auto mt-3 text-mocha-600 font-semibold underline">{{ t('tryAgain') }}</button>
          </div>

          <transition v-else name="swap" mode="out-in">
            <div :key="activeCategory + lang" class="mt-4 space-y-3">
              <div v-if="filteredItems.length === 0" class="text-center text-mocha-400 py-20">{{ t('empty') }}</div>

              <article v-for="item in filteredItems" :key="item.id"
                       class="card glass rounded-2xl p-4 flex justify-between gap-4 shadow-sm shadow-mocha-300/20"
                       :class="!isAdmin && cart[item.id] ? 'selected-liquid' : ''">
                <div class="min-w-0 flex-1">
                  <span class="inline-block text-[10px] uppercase tracking-widest font-semibold text-mocha-400 mb-1.5">{{ catLabel(item.category) }}</span>
                  <h2 class="font-display text-lg font-medium text-mocha-600 leading-snug outline-none"
                      :contenteditable="isAdmin"
                      :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
                      @blur="saveField(item, 'name', $event)">{{ isAdmin ? item.name : nameOf(item) }}</h2>
                  <p v-if="!isAdmin && altNameOf(item)" class="text-sm text-mocha-400 mt-0.5 italic">{{ altNameOf(item) }}</p>
                  <p v-if="item.description" class="text-sm text-mocha-400 mt-1 leading-relaxed outline-none"
                     :contenteditable="isAdmin"
                     :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
                     @blur="saveField(item, 'description', $event)">{{ item.description }}</p>
                </div>
                <div class="shrink-0 flex flex-col items-end justify-between gap-2">
                  <span class="font-display font-semibold text-mocha-600 text-lg whitespace-nowrap outline-none"
                        :contenteditable="isAdmin"
                        :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
                        @blur="saveField(item, 'price', $event)">{{ isAdmin ? item.price : money(item.price) }}</span>
                  <div v-if="!isAdmin" class="mt-auto">
                    <button v-if="!cart[item.id]" @click="addToCart(item)"
                            class="pill text-xs font-semibold px-3.5 py-1.5 rounded-full bg-mocha-500 text-white hover:bg-mocha-600">+ {{ t('add') }}</button>
                    <div v-else class="flex items-center gap-1.5 glass rounded-full p-1">
                      <button @click="dec(item.id)" class="pill w-7 h-7 grid place-items-center rounded-full bg-white/70 text-mocha-600 text-lg leading-none">−</button>
                      <span class="text-sm font-semibold text-mocha-600 w-5 text-center">{{ cart[item.id] }}</span>
                      <button @click="inc(item.id)" class="pill w-7 h-7 grid place-items-center rounded-full bg-mocha-500 text-white text-lg leading-none">+</button>
                    </div>
                  </div>
                </div>
              </article>

              <p class="text-center text-mocha-400 text-xs pt-2">{{ L(cafe.menuNote) }}</p>
            </div>
          </transition>
        </section>

        <!-- ----- ABOUT ----- -->
        <section v-else-if="view === 'about'" key="about" class="px-5 py-6 space-y-4">
          <h2 class="font-display text-2xl font-semibold text-mocha-600 px-1">{{ t('about') }}</h2>
          <div class="glass rounded-2xl p-5 space-y-3 shadow-sm shadow-mocha-300/20">
            <p v-for="(p, i) in L(cafe.about)" :key="i" class="text-sm text-mocha-500 leading-relaxed">{{ p }}</p>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <div v-for="(h, i) in cafe.highlights" :key="i" class="card glass rounded-2xl p-4 flex items-center gap-4 shadow-sm shadow-mocha-300/20">
              <span class="shrink-0 w-11 h-11 grid place-items-center rounded-full bg-sage-200 text-mocha-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path :d="h.icon"/></svg>
              </span>
              <div>
                <h3 class="font-display text-base font-medium text-mocha-600">{{ L(h.title) }}</h3>
                <p class="text-sm text-mocha-400 leading-relaxed">{{ L(h.text) }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ----- CONTACT ----- -->
        <section v-else key="contact" class="px-5 py-6 space-y-4">
          <h2 class="font-display text-2xl font-semibold text-mocha-600 px-1">{{ t('contact') }}</h2>
          <div class="glass rounded-2xl p-5 space-y-4 shadow-sm shadow-mocha-300/20">
            <div class="flex items-start gap-3">
              <svg class="shrink-0 mt-0.5 text-mocha-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <p class="text-sm text-mocha-500 leading-relaxed">{{ cafe.contact.address }}</p>
            </div>
            <a v-if="cafe.contact.phone" :href="'tel:' + cafe.contact.phone.replace(/\\s/g,'')" class="flex items-center gap-3 group">
              <svg class="shrink-0 text-mocha-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.8.4 1.6.7 2.3a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.7-1.7a2 2 0 012.1-.5c.7.3 1.5.6 2.3.7a2 2 0 011.7 2z"/></svg>
              <span class="text-sm text-mocha-500 group-hover:text-mocha-600">{{ cafe.contact.phone }}</span>
            </a>
            <a v-if="cafe.contact.email" :href="'mailto:' + cafe.contact.email" class="flex items-center gap-3 group">
              <svg class="shrink-0 text-mocha-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>
              <span class="text-sm text-mocha-500 group-hover:text-mocha-600">{{ cafe.contact.email }}</span>
            </a>
          </div>

          <div class="glass rounded-2xl p-5 shadow-sm shadow-mocha-300/20">
            <h3 class="font-display text-base font-medium text-mocha-600 mb-3">{{ t('hours') }}</h3>
            <div v-for="(row, i) in cafe.contact.hours" :key="i" class="flex justify-between text-sm py-1.5 border-b border-white/40 last:border-0">
              <span class="text-mocha-400">{{ L(row.d) }}</span>
              <span class="text-mocha-600 font-medium">{{ row.h }}</span>
            </div>
          </div>

          <a :href="cafe.contact.mapsUrl" target="_blank" rel="noopener"
             class="pill block text-center bg-mocha-500 text-white font-semibold rounded-2xl py-3.5 shadow-md shadow-mocha-300/40 hover:bg-mocha-600">{{ t('openMaps') }}</a>
        </section>
      </transition>
    </main>

    <!-- ===== Footer ===== -->
    <footer class="text-center text-mocha-400 text-xs py-6">{{ cafe.name }} · {{ t('footer') }}</footer>

    <!-- ===== Floating order bar ===== -->
    <transition name="fade">
      <button v-if="cartCount > 0 && !cartOpen" @click="openCart"
              class="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md flex items-center justify-between px-5 py-3.5 rounded-2xl bg-mocha-500 text-white shadow-xl shadow-mocha-400/40">
        <span class="font-semibold">{{ t('viewOrder') }}</span>
        <span class="flex items-center gap-2 text-sm">
          <span class="bg-white/25 rounded-full px-2 py-0.5">{{ cartCount }} {{ cartCount === 1 ? t('item') : t('items') }}</span>
          <span class="font-semibold">{{ money(cartTotal) }}</span>
        </span>
      </button>
    </transition>

    <!-- ===== Cart sheet ===== -->
    <transition name="overlay">
      <div v-if="cartOpen" @click="closeCart" class="fixed inset-0 z-50 bg-mocha-600/30 backdrop-blur-[2px]"></div>
    </transition>
    <transition name="sheet">
      <div v-if="cartOpen" class="fixed bottom-0 left-0 right-0 z-[55] mx-auto w-full max-w-md">
        <div class="glass rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display text-xl font-semibold text-mocha-600">{{ t('order') }}</h2>
            <button @click="closeCart" aria-label="Close" class="pill w-9 h-9 grid place-items-center rounded-full text-mocha-400 hover:bg-white/60">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>

          <p v-if="cartLines.length === 0" class="text-center text-mocha-400 py-8">{{ t('emptyCart') }}</p>

          <div v-else class="space-y-3">
            <div v-for="l in cartLines" :key="l.id" class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-mocha-600 truncate">{{ nameOf(l) }}</p>
                <p class="text-xs text-mocha-400">{{ money(l.price) }}</p>
              </div>
              <div class="flex items-center gap-1.5 glass rounded-full p-1">
                <button @click="dec(l.id)" class="pill w-7 h-7 grid place-items-center rounded-full bg-white/70 text-mocha-600 text-lg leading-none">−</button>
                <span class="text-sm font-semibold text-mocha-600 w-5 text-center">{{ l.qty }}</span>
                <button @click="inc(l.id)" class="pill w-7 h-7 grid place-items-center rounded-full bg-mocha-500 text-white text-lg leading-none">+</button>
              </div>
              <span class="w-20 text-right font-display font-semibold text-mocha-600 text-sm">{{ money(l.price * l.qty) }}</span>
            </div>

            <div class="pt-3 space-y-3 border-t border-white/40">
              <div>
                <label class="block text-xs font-semibold text-mocha-500 mb-1">{{ t('table') }}</label>
                <input v-model="tableNo" type="text" inputmode="numeric" :placeholder="t('tablePh')"
                       class="w-full rounded-xl bg-white/70 border border-white/60 px-3 py-2.5 text-mocha-600 outline-none focus:border-mocha-400" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-mocha-500 mb-1">{{ t('note') }}</label>
                <input v-model="note" type="text" :placeholder="t('notePh')"
                       class="w-full rounded-xl bg-white/70 border border-white/60 px-3 py-2.5 text-mocha-600 outline-none focus:border-mocha-400" />
              </div>

              <div class="flex justify-between items-center pt-1">
                <span class="text-mocha-400">{{ t('total') }}</span>
                <span class="font-display text-xl font-semibold text-mocha-600">{{ money(cartTotal) }}</span>
              </div>

              <button @click="sendOrder"
                      class="pill w-full flex items-center justify-center gap-2 bg-mocha-500 text-white font-semibold rounded-2xl py-3.5 shadow-md shadow-mocha-300/40 hover:bg-mocha-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.4 5 5.1-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20zm4.6-6c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.5 6.5 0 01-1.9-1.2 7.2 7.2 0 01-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2A5.2 5.2 0 009 12.3 11.7 11.7 0 0013.5 16c.6.3 1.1.4 1.5.5a3.6 3.6 0 001.6.1c.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.4-.2z"/></svg>
                {{ t('send') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===== Toast ===== -->
    <transition name="fade">
      <div v-if="toast" class="fixed left-1/2 -translate-x-1/2 glass text-mocha-600 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-mocha-300/30 z-[60]"
           :class="cartCount > 0 ? 'bottom-24' : 'bottom-6'">{{ toast }}</div>
    </transition>
  </div>
  `,
}).mount("#app");
