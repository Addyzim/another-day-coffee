/*
 * Another Day Coffee — Admin dashboard.
 *
 *  • Orders : live incoming orders (chime on new), View / Close / Reopen.
 *  • Menu   : add / edit / delete items, prices, EN/VI names, categories,
 *             descriptions, availability, and image upload (Firebase Storage).
 *             Saved to Firestore -> appears on the live site instantly.
 *
 * Requires firebase-config.js filled in, Firestore + Auth (Email/Password)
 * enabled, an admin user created, and (for image upload) Storage enabled.
 */

const { createApp } = Vue;

createApp({
  data() {
    return {
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

      // Menu
      menu: [],
      editing: null,       // item being added/edited (form model)
      saving: false,
      uploading: false,
      uploadPct: 0,
    };
  },

  computed: {
    list() { return this.tab === "open" ? this.orders : this.closed; },
    openCount() { return this.orders.length; },
    nextId() { return this.menu.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0) + 1; },
  },

  mounted() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId) { this.ready = false; return; }
    this.ready = true;
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    try { this.storage = firebase.storage(); } catch (e) { this.storage = null; }
    this.auth.onAuthStateChanged((u) => {
      this.user = u;
      if (u) { this.subscribeOrders(); this.subscribeMenu(); }
    });
  },

  methods: {
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
      catch (e) { this.authError = e.message || "Sign-in failed"; }
      finally { this.loggingIn = false; }
    },
    logout() { this.auth.signOut(); },

    // ----- Orders ----------------------------------------------------------
    subscribeOrders() {
      this.db.collection("orders").where("status", "==", "open").onSnapshot((snap) => {
        const rows = []; snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        if (rows.length > this._seen && this._seen !== 0) this.announce();
        this._seen = rows.length;
        this.orders = rows;
      }, (e) => console.error(e));

      this.db.collection("orders").where("status", "==", "closed").onSnapshot((snap) => {
        const rows = []; snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.closedAt?.seconds || 0) - (a.closedAt?.seconds || 0));
        this.closed = rows.slice(0, 20);
      }, (e) => console.error(e));
    },
    announce() {
      const orig = document.title;
      document.title = "🔔 New order!";
      setTimeout(() => (document.title = orig), 4000);
      if (!this.soundOn) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = "sine"; o.frequency.value = 880;
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        o.start(); o.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    },
    toggle(id) { this.expanded[id] = !this.expanded[id]; },
    closeOrder(o) {
      this.db.collection("orders").doc(o.id).update({ status: "closed", closedAt: firebase.firestore.FieldValue.serverTimestamp() })
        .catch((e) => alert("Could not close order: " + e.message));
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
      if (!it.name || !it.name.trim()) { alert("Введите название"); return; }
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
      } catch (e) { alert("Save failed: " + e.message); }
      finally { this.saving = false; }
    },
    deleteItem(it) {
      if (!confirm(`Удалить «${it.name}»?`)) return;
      this.db.collection("menu").doc(String(it.id)).delete().catch((e) => alert(e.message));
    },
    async uploadImage(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (!this.storage) { alert("Storage не подключён. Включите Storage в Firebase консоли."); return; }
      this.uploading = true; this.uploadPct = 0;
      try {
        const safe = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const ref = this.storage.ref().child(`menu/${this.editing.id}-${Date.now()}-${safe}`);
        const task = ref.put(file, { contentType: file.type });
        await new Promise((res, rej) => task.on("state_changed",
          (s) => { this.uploadPct = Math.round((s.bytesTransferred / s.totalBytes) * 100); },
          rej, res));
        this.editing.image = await ref.getDownloadURL();
      } catch (err) { alert("Upload failed: " + err.message); }
      finally { this.uploading = false; e.target.value = ""; }
    },
    async seedFromJson() {
      if (!confirm("Импортировать позиции из menu.json в базу? (существующие с теми же id перезапишутся)")) return;
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
        alert("Импортировано позиций: " + items.length);
      } catch (e) { alert("Import failed: " + e.message); }
      finally { this.saving = false; }
    },
  },

  template: `
  <div class="max-w-xl mx-auto min-h-screen px-4 py-5">

    <div v-if="!ready" class="mt-20 text-center">
      <h1 class="font-display text-2xl font-semibold mb-2">Admin dashboard</h1>
      <p class="text-mocha-400">Firebase isn't configured. Fill in <b>firebase-config.js</b>.</p>
    </div>

    <div v-else-if="!user" class="mt-20 max-w-sm mx-auto bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
      <h1 class="font-display text-2xl font-semibold text-center mb-1">Another Day Coffee</h1>
      <p class="text-mocha-400 text-sm text-center mb-5">Staff sign-in</p>
      <form @submit.prevent="login" class="space-y-3">
        <input v-model="email" type="email" placeholder="Email" autocomplete="username"
               class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5 outline-none focus:border-mocha-400" />
        <input v-model="password" type="password" placeholder="Password" autocomplete="current-password"
               class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5 outline-none focus:border-mocha-400" />
        <p v-if="authError" class="text-red-500 text-xs">{{ authError }}</p>
        <button type="submit" :disabled="loggingIn"
                class="w-full bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5 disabled:opacity-60">
          {{ loggingIn ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>

    <div v-else>
      <header class="flex items-center justify-between mb-4">
        <h1 class="font-display text-2xl font-semibold leading-none">Admin</h1>
        <div class="flex items-center gap-2">
          <button v-if="section==='orders'" @click="soundOn = !soundOn" :title="soundOn ? 'Sound on' : 'Sound off'"
                  class="w-9 h-9 grid place-items-center rounded-full bg-white border border-stone-200">{{ soundOn ? '🔔' : '🔕' }}</button>
          <button @click="logout" class="text-sm text-mocha-500 px-3 py-1.5 rounded-full bg-white border border-stone-200">Sign out</button>
        </div>
      </header>

      <!-- Section switch -->
      <div class="flex gap-2 mb-4">
        <button @click="section='orders'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                :class="section==='orders' ? 'bg-mocha-500 text-white' : 'bg-white border border-stone-200 text-mocha-500'">
          Orders <span v-if="openCount" class="ml-1 bg-white/25 rounded-full px-1.5">{{ openCount }}</span>
        </button>
        <button @click="section='menu'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                :class="section==='menu' ? 'bg-mocha-500 text-white' : 'bg-white border border-stone-200 text-mocha-500'">Menu</button>
      </div>

      <!-- ================= ORDERS ================= -->
      <div v-if="section==='orders'">
        <div class="flex gap-2 mb-4">
          <button @click="tab='open'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                  :class="tab==='open' ? 'bg-mocha-400 text-white' : 'bg-white border border-stone-200 text-mocha-500'">Open</button>
          <button @click="tab='closed'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                  :class="tab==='closed' ? 'bg-mocha-400 text-white' : 'bg-white border border-stone-200 text-mocha-500'">Closed</button>
        </div>
        <p v-if="list.length === 0" class="text-center text-mocha-400 py-16">
          {{ tab === 'open' ? 'No open orders. New ones appear here instantly.' : 'No closed orders yet.' }}
        </p>
        <div class="space-y-3">
          <article v-for="o in list" :key="o.id" class="pop bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span v-if="o.orderNo" class="text-xs font-bold font-mono bg-mocha-500 text-white rounded-full px-2.5 py-1">{{ o.orderNo }}</span>
                  <span v-if="o.table" class="text-xs font-bold bg-sage-200 text-mocha-600 rounded-full px-2.5 py-1">Table {{ o.table }}</span>
                  <span class="text-xs text-mocha-400">{{ time(o.createdAt) }}</span>
                </div>
                <p class="font-display text-lg font-semibold mt-1">{{ money(o.total) }}</p>
              </div>
              <button @click="toggle(o.id)" class="text-sm text-mocha-500 underline">{{ expanded[o.id] ? 'Hide' : 'View' }}</button>
            </div>
            <div v-if="expanded[o.id]" class="mt-3 pt-3 border-t border-stone-100 space-y-1">
              <div v-for="(it,i) in o.items" :key="i" class="flex justify-between text-sm">
                <span class="text-mocha-600">{{ it.qty }}× {{ it.name }}<span v-if="it.name_vi" class="text-mocha-400"> · {{ it.name_vi }}</span><span v-if="it.milk" class="text-amber-700"> · {{ it.milk }}</span></span>
                <span class="text-mocha-500">{{ money(it.price * it.qty) }}</span>
              </div>
              <p v-if="o.note" class="text-sm text-mocha-500 pt-2"><b>Note:</b> {{ o.note }}</p>
            </div>
            <div class="mt-3 flex gap-2">
              <button v-if="o.status==='open'" @click="closeOrder(o)" class="flex-1 bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5">Close order</button>
              <button v-else @click="reopen(o)" class="flex-1 bg-white border border-stone-200 text-mocha-500 font-semibold rounded-xl py-2.5">Reopen</button>
            </div>
          </article>
        </div>
      </div>

      <!-- ================= MENU ================= -->
      <div v-else>
        <div class="flex gap-2 mb-4">
          <button @click="newItem" class="flex-1 bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5">+ Добавить позицию</button>
          <button v-if="menu.length===0" @click="seedFromJson" :disabled="saving"
                  class="bg-sage-200 text-mocha-600 font-semibold rounded-xl px-4 py-2.5">Импорт из menu.json</button>
        </div>

        <p v-if="menu.length===0" class="text-center text-mocha-400 py-12">Меню пустое. Добавь позицию или импортируй из menu.json.</p>

        <div class="space-y-2">
          <div v-for="it in menu" :key="it.id" class="bg-white rounded-2xl shadow-sm border border-stone-100 p-3 flex items-center gap-3"
               :class="it.available === false ? 'opacity-50' : ''">
            <div class="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-stone-100 grid place-items-center">
              <img v-if="it.image" :src="it.image" alt="" class="w-full h-full object-cover" />
              <span v-else class="text-mocha-300 text-lg">☕</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-mocha-600 truncate">{{ it.name }} <span v-if="it.name_vi" class="text-mocha-400 text-sm">· {{ it.name_vi }}</span></p>
              <p class="text-xs text-mocha-400 truncate">{{ it.category }} · {{ money(it.price) }}<span v-if="it.available===false"> · скрыто</span></p>
            </div>
            <button @click="editItem(it)" class="text-sm text-mocha-500 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200">Изм.</button>
            <button @click="deleteItem(it)" class="text-sm text-red-400 px-2 py-1.5">✕</button>
          </div>
        </div>
      </div>

      <!-- ===== Edit / add modal ===== -->
      <div v-if="editing" class="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center" @click.self="cancelEdit">
        <div class="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display text-xl font-semibold">{{ editing._isNew ? 'Новая позиция' : 'Редактировать' }}</h2>
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
                <span class="text-sm font-semibold text-mocha-500">{{ uploading ? 'Загрузка ' + uploadPct + '%' : 'Загрузить фото' }}</span>
                <input type="file" accept="image/*" @change="uploadImage" :disabled="uploading" class="block w-full text-xs mt-1" />
              </label>
              <button v-if="editing.image" @click="editing.image=''" class="text-xs text-red-400 mt-1">Убрать фото</button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <label class="block"><span class="text-xs font-semibold text-mocha-500">Название (EN)</span>
                <input v-model="editing.name" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">Название (VI)</span>
                <input v-model="editing.name_vi" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">Категория (EN)</span>
                <input v-model="editing.category" list="cats" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">Категория (VI)</span>
                <input v-model="editing.category_vi" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <datalist id="cats"><option v-for="c in [...new Set(menu.map(m=>m.category))]" :key="c" :value="c"></option></datalist>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">Цена (VND)</span>
                <input v-model="editing.price" inputmode="numeric" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
              <label class="block"><span class="text-xs font-semibold text-mocha-500">Порядок</span>
                <input v-model="editing.order" inputmode="numeric" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400" /></label>
            </div>
            <label class="block"><span class="text-xs font-semibold text-mocha-500">Описание</span>
              <textarea v-model="editing.description" rows="2" class="w-full rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 mt-1 outline-none focus:border-mocha-400"></textarea></label>
            <label class="flex items-center gap-2"><input type="checkbox" v-model="editing.available" /><span class="text-sm text-mocha-500">Доступно (показывать гостям)</span></label>
          </div>

          <div class="flex gap-2 mt-5">
            <button @click="cancelEdit" class="flex-1 bg-stone-100 text-mocha-500 font-semibold rounded-xl py-2.5">Отмена</button>
            <button @click="saveItem" :disabled="saving || uploading" class="flex-1 bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5 disabled:opacity-60">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
}).mount("#admin");
