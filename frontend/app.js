/*
 * Cafeteria Menu — Vue 3 frontend (static, no backend, no build step)
 * -------------------------------------------------------------------
 * The menu lives in a static `menu.json` next to this file, so the whole
 * site is hosted for free on GitHub Pages — there is no server to run.
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

createApp({
  // ----- state -------------------------------------------------------------
  data() {
    return {
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
      // "All" first, then unique categories in the order they appear.
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
      this._toastTimer = setTimeout(() => (this.toast = ""), 2000);
    },

    // Normalize a raw row (from JSON or a spreadsheet) into the canonical shape.
    normalizeRow(raw) {
      // Map keys case-insensitively to the canonical column names.
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
        if (!Number.isInteger(row.id) || !row.name) continue; // drop blanks
        if (seen.has(row.id)) continue;                        // de-dupe ids
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

    toggleAdmin() {
      this.isAdmin = !this.isAdmin;
      this.showToast(this.isAdmin ? "Admin mode on" : "Admin mode off");
    },

    // Fired on blur of an editable field. Updates the in-memory item only;
    // use "Export menu.json" to persist changes.
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

    // Parse an uploaded .xlsx fully in the browser with SheetJS.
    async handleImport(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.importing = true;
      try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Verify the required columns are present (case-insensitive).
        const present = new Set(
          (rows[0] ? Object.keys(rows[0]) : []).map((k) => k.trim().toLowerCase())
        );
        const missing = COLUMNS.filter((c) => !present.has(c));
        if (missing.length) {
          throw new Error(`Missing column(s): ${missing.join(", ")}`);
        }

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
        event.target.value = ""; // allow re-uploading the same file
      }
    },

    // Trigger a browser download of the given blob.
    download(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },

    // Export the current menu as menu.json — commit this to publish.
    exportJson() {
      const payload = { items: this.items.map((it) => this.normalizeRow(it)) };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      this.download(blob, "menu.json");
      this.showToast("Downloaded menu.json — commit it to publish");
    },

    // Export an .xlsx backup you can edit in Excel.
    exportXlsx() {
      const rows = this.items.map((it) => this.normalizeRow(it));
      const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "menu");
      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      this.download(
        new Blob([out], { type: "application/octet-stream" }),
        "menu.xlsx"
      );
      this.showToast("Downloaded menu.xlsx");
    },
  },

  // ----- template ----------------------------------------------------------
  template: `
  <div class="flex flex-col min-h-screen">

    <!-- Header -->
    <header class="sticky top-0 z-20 glass-header px-5 pt-6 pb-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Little steaming coffee cup mark -->
          <span class="text-2xl" aria-hidden="true">☕</span>
          <div>
            <h1 class="font-display text-2xl font-semibold leading-none tracking-tight text-mocha-600">
              The Corner Café
            </h1>
            <p class="text-mocha-400 text-xs mt-1 tracking-wide">Specialty coffee · fresh bites</p>
          </div>
        </div>
        <button
          @click="toggleAdmin"
          class="pill text-xs font-semibold px-4 py-2 rounded-full glass"
          :class="isAdmin ? 'text-white bg-mocha-500/90' : 'text-mocha-500'">
          {{ isAdmin ? 'Done' : 'Admin' }}
        </button>
      </div>

      <!-- Category pills: horizontal scroll on small screens -->
      <nav class="mt-4 -mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar snap-x-mandatory">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="activeCategory = cat"
          class="pill shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
          :style="{ scrollSnapAlign: 'start' }"
          :class="activeCategory === cat
            ? 'bg-mocha-500 text-white shadow-md shadow-mocha-300/40'
            : 'glass text-mocha-500 hover:bg-white/70'">
          {{ cat }}
        </button>
      </nav>
    </header>

    <!-- Admin toolbar -->
    <div v-if="isAdmin" class="mx-4 mt-4 glass rounded-2xl p-3 grid grid-cols-3 gap-2 text-sm">
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

    <!-- Main content -->
    <main class="flex-1 px-4 py-5">

      <div v-if="loading" class="text-center text-mocha-400 py-20 font-display text-lg">Brewing the menu…</div>

      <div v-else-if="error" class="text-center text-mocha-500 glass rounded-2xl p-6 my-8">
        {{ error }}
        <button @click="fetchItems" class="block mx-auto mt-3 text-mocha-600 font-semibold underline">
          Try again
        </button>
      </div>

      <div v-else-if="filteredItems.length === 0" class="text-center text-mocha-400 py-20">
        Nothing here yet — check another category.
      </div>

      <!-- Menu cards (staggered entrance + smooth filtering) -->
      <transition-group v-else name="list" tag="div" class="relative space-y-3">
        <article
          v-for="(item, i) in filteredItems"
          :key="item.id"
          class="card rise glass rounded-2xl p-4 flex justify-between gap-4 shadow-sm shadow-mocha-300/20"
          :style="{ animationDelay: (i * 45) + 'ms' }">
          <div class="min-w-0 flex-1">
            <span class="inline-block text-[10px] uppercase tracking-widest font-semibold text-mocha-400 mb-1.5">
              {{ item.category }}
            </span>
            <h2
              class="font-display text-lg font-medium text-mocha-600 leading-snug outline-none"
              :contenteditable="isAdmin"
              :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
              @blur="saveField(item, 'name', $event)">{{ item.name }}</h2>
            <p
              class="text-sm text-mocha-400 mt-1 leading-relaxed outline-none"
              :contenteditable="isAdmin"
              :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
              @blur="saveField(item, 'description', $event)">{{ item.description }}</p>
          </div>
          <div class="shrink-0 text-right self-center">
            <span
              class="font-display font-semibold text-mocha-600 text-lg whitespace-nowrap outline-none"
              :contenteditable="isAdmin"
              :class="isAdmin ? 'border-b border-dashed border-mocha-300 focus:border-mocha-500' : ''"
              @blur="saveField(item, 'price', $event)">{{ isAdmin ? item.price : money(item.price) }}</span>
          </div>
        </article>
      </transition-group>
    </main>

    <!-- Footer -->
    <footer class="text-center text-mocha-400 text-xs py-5">
      Made with care ·
      <span v-if="!isAdmin" @click="toggleAdmin" class="underline cursor-pointer hover:text-mocha-500">staff login</span>
      <span v-else>editing live</span>
    </footer>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="toast"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 glass text-mocha-600 text-sm font-medium px-5 py-2.5 rounded-full shadow-lg shadow-mocha-300/30 z-30">
        {{ toast }}
      </div>
    </transition>
  </div>
  `,
}).mount("#app");
