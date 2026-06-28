/*
 * The Corner Café — Vue 3 frontend (static, no backend, no build step)
 * -------------------------------------------------------------------
 * The menu lives in a static `menu.json` next to this file, so the whole
 * site is hosted for free on GitHub Pages — there is no server to run.
 *
 * Sections (via the burger side menu): Menu, About Us, Contacts.
 *
 * Staff/admin access is hidden from regular visitors. To open it, add the
 * secret fragment below to the URL, e.g.
 *     https://addyzim.github.io/the-corner-cafe/#staff-corner
 * Then "Admin mode" appears in the side menu. (This is light obscurity, not
 * real security — a static site can't truly hide it — but it keeps the admin
 * tools out of customers' way. Change STAFF_HASH to your own secret.)
 *
 * Admin mode runs entirely in the browser:
 *   - Tap any name/price/description to edit it (kept in memory).
 *   - Import .xlsx        -> parsed in-browser with SheetJS.
 *   - Export menu.json    -> downloads the file you commit to publish.
 *   - Export .xlsx        -> a spreadsheet backup you can edit in Excel.
 *
 * To publish edits: replace `frontend/menu.json` in the repo with the
 * exported file and push. GitHub Pages updates in ~30s.
 */

const { createApp } = Vue;

// The required spreadsheet columns, in canonical order.
const COLUMNS = ["id", "category", "name", "price", "description"];

// Secret URL fragment that reveals the admin tools. Change this to your own.
const STAFF_HASH = "#staff-corner";

// Café details shown in the About / Contacts sections — edit freely.
const CAFE = {
  name: "The Corner Café",
  tagline: "Specialty coffee · fresh bites",
  about: [
    "The Corner Café began with a simple idea: a calm neighbourhood spot where every cup is made with care. We roast in small batches, bake fresh each morning, and serve it all in a room that feels like a quiet escape from the rush.",
    "Whether you're here for a slow morning coffee, a quick lunch, or an afternoon treat, you'll find honest ingredients, friendly faces, and a menu that shifts gently with the seasons.",
  ],
  highlights: [
    { icon: "M18 8h1a4 4 0 010 8h-1M6 1v3M10 1v3M14 1v3M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z", title: "Small-batch coffee", text: "Roasted in-house, brewed to order." },
    { icon: "M3 3h18v4H3zM6 7v14M18 7v14M6 13h12", title: "Baked fresh daily", text: "Pastries from our morning oven." },
    { icon: "M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z", title: "Seasonal menu", text: "Honest ingredients, in season." },
  ],
  contact: {
    address: "12 Nguyễn Huệ, District 1, Hồ Chí Minh City",
    phone: "+84 28 1234 5678",
    email: "hello@thecornercafe.vn",
    hours: [
      { d: "Monday – Friday", h: "7:00 – 21:00" },
      { d: "Saturday – Sunday", h: "8:00 – 22:00" },
    ],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=12+Nguyen+Hue+District+1+Ho+Chi+Minh+City",
  },
};

// Side-menu navigation (Feather-style icon paths).
const NAV = [
  { key: "menu", label: "Menu", icon: "M4 7h16M4 12h16M4 17h16" },
  { key: "about", label: "About Us", icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5M12 8h0" },
  { key: "contact", label: "Contacts", icon: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.8.4 1.6.7 2.3a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.7-1.7a2 2 0 012.1-.5c.7.3 1.5.6 2.3.7a2 2 0 011.7 2z" },
];

createApp({
  // ----- state -------------------------------------------------------------
  data() {
    return {
      cafe: CAFE,
      nav: NAV,
      view: "menu",         // 'menu' | 'about' | 'contact'
      drawerOpen: false,
      staffUnlocked: false, // true once the secret URL fragment is used

      items: [],            // all menu items, loaded from menu.json
      activeCategory: "All",
      isAdmin: false,       // toggles inline editing + import/export UI
      loading: true,
      error: "",
      toast: "",            // brief status message
      importing: false,
    };
  },

  // ----- derived values ----------------------------------------------------
  computed: {
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
  },

  // ----- lifecycle ---------------------------------------------------------
  mounted() {
    this.applyHash();
    window.addEventListener("hashchange", this.applyHash);
    this.fetchItems();
  },

  // ----- methods -----------------------------------------------------------
  methods: {
    money(value) {
      const n = Number(value) || 0;
      // Vietnamese Dong: no decimals, dot thousands separator, ₫ suffix.
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(n);
    },

    showToast(msg) {
      this.toast = msg;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => (this.toast = ""), 2200);
    },

    // Reveal the admin tools when the secret fragment is present.
    applyHash() {
      if (window.location.hash === STAFF_HASH) this.staffUnlocked = true;
    },

    // ----- navigation / drawer ---------------------------------------------
    openDrawer() {
      this.drawerOpen = true;
      document.body.style.overflow = "hidden";
    },
    closeDrawer() {
      this.drawerOpen = false;
      document.body.style.overflow = "";
    },
    go(view) {
      this.view = view;
      this.closeDrawer();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    enterAdmin() {
      this.isAdmin = true;
      this.go("menu");
      this.showToast("Admin mode on");
    },

    // ----- normalization ----------------------------------------------------
    normalizeRow(raw) {
      const lower = {};
      for (const k of Object.keys(raw)) lower[k.trim().toLowerCase()] = raw[k];
      const priceDigits = String(lower.price ?? "").replace(/[^0-9]/g, "");
      return {
        id: parseInt(lower.id, 10),
        category: String(lower.category ?? "Uncategorized").trim() || "Uncategorized",
        name: String(lower.name ?? "").trim(),
        price: parseInt(priceDigits, 10) || 0,
        description: String(lower.description ?? "").trim(),
      };
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
        // Cache-bust so a freshly pushed menu shows up without a hard refresh.
        const res = await fetch(`./menu.json?t=${Date.now()}`);
        if (!res.ok) throw new Error(`Could not load menu (${res.status})`);
        const data = await res.json();
        this.items = this.normalizeRows(data.items || []);
      } catch (err) {
        this.error = "Could not load the menu. Please refresh and try again.";
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    // Inline edit (admin). Updates the in-memory item only; Export to persist.
    saveField(item, field, event) {
      let value = event.target.innerText.trim();
      if (field === "price") {
        value = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
      }
      if (String(item[field]) === String(value)) return;
      item[field] = value;
      this.showToast("Edited — remember to Export to publish");
    },

    triggerImport() {
      this.$refs.fileInput.click();
    },

    async handleImport(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.importing = true;
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const present = new Set(
          (rows[0] ? Object.keys(rows[0]) : []).map((k) => k.trim().toLowerCase())
        );
        const missing = COLUMNS.filter((c) => !present.has(c));
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
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    exportJson() {
      const payload = { items: this.items.map((it) => this.normalizeRow(it)) };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      this.download(blob, "menu.json");
      this.showToast("Downloaded menu.json — commit it to publish");
    },
    exportXlsx() {
      const rows = this.items.map((it) => this.normalizeRow(it));
      const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "menu");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      this.download(new Blob([out], { type: "application/octet-stream" }), "menu.xlsx");
      this.showToast("Downloaded menu.xlsx");
    },
  },

  // ----- template ----------------------------------------------------------
  template: `
  <div class="flex flex-col min-h-screen">

    <!-- ===== Header ===== -->
    <header class="sticky top-0 z-30 glass-header">
      <div class="h-16 px-3 grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <button
          @click="openDrawer"
          aria-label="Open menu"
          class="pill w-11 h-11 grid place-items-center rounded-full text-mocha-500 hover:bg-white/60">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <div class="text-center leading-none">
          <h1 class="font-display text-xl font-semibold text-mocha-600">{{ cafe.name }}</h1>
        </div>
        <div aria-hidden="true"></div>
      </div>
    </header>

    <!-- ===== Side drawer ===== -->
    <transition name="overlay">
      <div v-if="drawerOpen" @click="closeDrawer"
           class="fixed inset-0 z-40 bg-mocha-600/25 backdrop-blur-[2px]"></div>
    </transition>
    <transition name="drawer">
      <aside v-if="drawerOpen"
             class="fixed top-0 left-0 z-50 h-full w-72 max-w-[82%] glass flex flex-col shadow-2xl shadow-mocha-600/20">
        <div class="px-6 pt-7 pb-5 border-b border-white/40 flex items-start justify-between">
          <div>
            <p class="font-display text-2xl font-semibold text-mocha-600 leading-none">{{ cafe.name }}</p>
            <p class="text-xs text-mocha-400 mt-2 tracking-wide">{{ cafe.tagline }}</p>
          </div>
          <button @click="closeDrawer" aria-label="Close menu"
                  class="pill w-9 h-9 grid place-items-center rounded-full text-mocha-400 hover:bg-white/60 -mr-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        <nav class="flex-1 p-3 space-y-1">
          <button v-for="n in nav" :key="n.key" @click="go(n.key)"
                  class="pill w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium"
                  :class="view === n.key ? 'bg-mocha-500 text-white shadow-sm shadow-mocha-300/40' : 'text-mocha-500 hover:bg-white/60'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="n.icon"/></svg>
            {{ n.label }}
          </button>
        </nav>

        <div v-if="staffUnlocked" class="p-3 border-t border-white/40">
          <button @click="isAdmin ? (isAdmin = false, closeDrawer()) : enterAdmin()"
                  class="pill w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium"
                  :class="isAdmin ? 'bg-blush-300 text-mocha-600' : 'text-mocha-500 hover:bg-white/60'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 005 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 003 14.6H3a2 2 0 110-4h.1A1.6 1.6 0 004.6 5l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 0010 3.4V3a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v0a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>
            </svg>
            {{ isAdmin ? 'Exit admin mode' : 'Admin mode' }}
          </button>
        </div>
      </aside>
    </transition>

    <!-- ===== Main (one section at a time, cross-faded) ===== -->
    <main class="flex-1 w-full">
      <transition name="swap" mode="out-in" appear>

        <!-- ----- MENU ----- -->
        <section v-if="view === 'menu'" key="menu" class="px-4 py-5">
          <!-- Category pills -->
          <div class="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar snap-x-mandatory pb-1">
            <button v-for="cat in categories" :key="cat" @click="activeCategory = cat"
                    class="pill shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
                    :style="{ scrollSnapAlign: 'start' }"
                    :class="activeCategory === cat
                      ? 'bg-mocha-500 text-white shadow-md shadow-mocha-300/40'
                      : 'glass text-mocha-500 hover:bg-white/70'">
              {{ cat }}
            </button>
          </div>

          <!-- Admin toolbar -->
          <div v-if="isAdmin" class="mt-4 glass rounded-2xl p-3 grid grid-cols-3 gap-2 text-sm">
            <button @click="triggerImport" class="pill rounded-xl py-2.5 font-semibold text-mocha-600 bg-sage-200 hover:bg-sage-300">
              {{ importing ? 'Importing…' : 'Import .xlsx' }}
            </button>
            <button @click="exportJson" class="pill rounded-xl py-2.5 font-semibold text-mocha-600 bg-lilac-200 hover:bg-lilac-300">
              Export .json
            </button>
            <button @click="exportXlsx" class="pill rounded-xl py-2.5 font-semibold text-mocha-600 bg-blush-200 hover:bg-blush-300">
              Export .xlsx
            </button>
            <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleImport" />
            <p class="col-span-3 text-mocha-400 text-xs text-center pt-1">
              Tap any name, price, or description to edit. Then <b>Export .json</b> and commit it to publish.
            </p>
          </div>

          <!-- States -->
          <div v-if="loading" class="text-center text-mocha-400 py-20 font-display text-lg">Brewing the menu…</div>
          <div v-else-if="error" class="text-center text-mocha-500 glass rounded-2xl p-6 my-8">
            {{ error }}
            <button @click="fetchItems" class="block mx-auto mt-3 text-mocha-600 font-semibold underline">Try again</button>
          </div>

          <!-- Cards: clean fade out/in on category change -->
          <transition v-else name="swap" mode="out-in">
            <div :key="activeCategory" class="mt-4 space-y-3">
              <div v-if="filteredItems.length === 0" class="text-center text-mocha-400 py-20">
                Nothing here yet — check another category.
              </div>
              <article v-for="item in filteredItems" :key="item.id"
                       class="card glass rounded-2xl p-4 flex justify-between gap-4 shadow-sm shadow-mocha-300/20">
                <div class="min-w-0 flex-1">
                  <span class="inline-block text-[10px] uppercase tracking-widest font-semibold text-mocha-400 mb-1.5">
                    {{ item.category }}
                  </span>
                  <h2 class="font-display text-lg font-medium text-mocha-600 leading-snug outline-none"
                      :contenteditable="isAdmin"
                      :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
                      @blur="saveField(item, 'name', $event)">{{ item.name }}</h2>
                  <p class="text-sm text-mocha-400 mt-1 leading-relaxed outline-none"
                     :contenteditable="isAdmin"
                     :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
                     @blur="saveField(item, 'description', $event)">{{ item.description }}</p>
                </div>
                <div class="shrink-0 text-right self-center">
                  <span class="font-display font-semibold text-mocha-600 text-lg whitespace-nowrap outline-none"
                        :contenteditable="isAdmin"
                        :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
                        @blur="saveField(item, 'price', $event)">{{ isAdmin ? item.price : money(item.price) }}</span>
                </div>
              </article>
            </div>
          </transition>
        </section>

        <!-- ----- ABOUT ----- -->
        <section v-else-if="view === 'about'" key="about" class="px-4 py-6 space-y-4">
          <h2 class="font-display text-2xl font-semibold text-mocha-600 px-1">About Us</h2>
          <div class="glass rounded-2xl p-5 space-y-3 shadow-sm shadow-mocha-300/20">
            <p v-for="(p, i) in cafe.about" :key="i" class="text-sm text-mocha-500 leading-relaxed">{{ p }}</p>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <div v-for="(h, i) in cafe.highlights" :key="i"
                 class="card glass rounded-2xl p-4 flex items-center gap-4 shadow-sm shadow-mocha-300/20">
              <span class="shrink-0 w-11 h-11 grid place-items-center rounded-full bg-sage-200 text-mocha-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path :d="h.icon"/></svg>
              </span>
              <div>
                <h3 class="font-display text-base font-medium text-mocha-600">{{ h.title }}</h3>
                <p class="text-sm text-mocha-400 leading-relaxed">{{ h.text }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ----- CONTACT ----- -->
        <section v-else key="contact" class="px-4 py-6 space-y-4">
          <h2 class="font-display text-2xl font-semibold text-mocha-600 px-1">Contacts</h2>
          <div class="glass rounded-2xl p-5 space-y-4 shadow-sm shadow-mocha-300/20">
            <div class="flex items-start gap-3">
              <svg class="shrink-0 mt-0.5 text-mocha-400" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <p class="text-sm text-mocha-500 leading-relaxed">{{ cafe.contact.address }}</p>
            </div>
            <a :href="'tel:' + cafe.contact.phone.replace(/\\s/g,'')" class="flex items-center gap-3 group">
              <svg class="shrink-0 text-mocha-400" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.8.4 1.6.7 2.3a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.7-1.7a2 2 0 012.1-.5c.7.3 1.5.6 2.3.7a2 2 0 011.7 2z"/></svg>
              <span class="text-sm text-mocha-500 group-hover:text-mocha-600">{{ cafe.contact.phone }}</span>
            </a>
            <a :href="'mailto:' + cafe.contact.email" class="flex items-center gap-3 group">
              <svg class="shrink-0 text-mocha-400" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>
              <span class="text-sm text-mocha-500 group-hover:text-mocha-600">{{ cafe.contact.email }}</span>
            </a>
          </div>

          <div class="glass rounded-2xl p-5 shadow-sm shadow-mocha-300/20">
            <h3 class="font-display text-base font-medium text-mocha-600 mb-3">Opening hours</h3>
            <div v-for="(row, i) in cafe.contact.hours" :key="i"
                 class="flex justify-between text-sm py-1.5 border-b border-white/40 last:border-0">
              <span class="text-mocha-400">{{ row.d }}</span>
              <span class="text-mocha-600 font-medium">{{ row.h }}</span>
            </div>
          </div>

          <a :href="cafe.contact.mapsUrl" target="_blank" rel="noopener"
             class="pill block text-center bg-mocha-500 text-white font-semibold rounded-2xl py-3.5 shadow-md shadow-mocha-300/40 hover:bg-mocha-600">
            Open in Maps
          </a>
        </section>
      </transition>
    </main>

    <!-- ===== Footer ===== -->
    <footer class="text-center text-mocha-400 text-xs py-6">
      {{ cafe.name }} · Fresh, every day
    </footer>

    <!-- ===== Toast ===== -->
    <transition name="fade">
      <div v-if="toast"
           class="fixed bottom-6 left-1/2 -translate-x-1/2 glass text-mocha-600 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-mocha-300/30 z-[60]">
        {{ toast }}
      </div>
    </transition>
  </div>
  `,
}).mount("#app");
