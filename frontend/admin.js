/*
 * Another Day Coffee — Admin orders dashboard.
 *
 * Live list of incoming orders from Firestore. Admin signs in with the
 * email/password user you created in Firebase Authentication, then can View
 * order details and Close orders. A chime + badge announces new orders.
 *
 * Requires firebase-config.js to be filled in (see that file's instructions).
 */

const { createApp } = Vue;

createApp({
  data() {
    return {
      ready: false,        // firebase configured?
      user: null,
      email: "",
      password: "",
      authError: "",
      loggingIn: false,

      orders: [],          // open orders (realtime)
      closed: [],          // recently closed (realtime)
      tab: "open",         // 'open' | 'closed'
      expanded: {},        // id -> bool
      soundOn: true,
      _seen: 0,            // count to detect new arrivals
    };
  },

  computed: {
    list() { return this.tab === "open" ? this.orders : this.closed; },
    openCount() { return this.orders.length; },
  },

  mounted() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.projectId) { this.ready = false; return; }
    this.ready = true;
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    this.auth = firebase.auth();
    this.db = firebase.firestore();
    this.auth.onAuthStateChanged((u) => {
      this.user = u;
      if (u) this.subscribe();
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
      this.authError = "";
      this.loggingIn = true;
      try {
        await this.auth.signInWithEmailAndPassword(this.email.trim(), this.password);
      } catch (e) {
        this.authError = e.message || "Sign-in failed";
      } finally {
        this.loggingIn = false;
      }
    },
    logout() { this.auth.signOut(); },

    subscribe() {
      // Open orders, newest first — drives the live notifications.
      this.db.collection("orders").where("status", "==", "open")
        .onSnapshot((snap) => {
          const rows = [];
          snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
          rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          if (rows.length > this._seen && this._seen !== 0) this.announce();
          this._seen = rows.length;
          this.orders = rows;
        }, (e) => console.error(e));

      // Last 20 closed orders for reference.
      this.db.collection("orders").where("status", "==", "closed")
        .onSnapshot((snap) => {
          const rows = [];
          snap.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
          rows.sort((a, b) => (b.closedAt?.seconds || 0) - (a.closedAt?.seconds || 0));
          this.closed = rows.slice(0, 20);
        }, (e) => console.error(e));
    },

    announce() {
      // Title flash
      const orig = document.title;
      document.title = "🔔 New order!";
      setTimeout(() => (document.title = orig), 4000);
      // Chime
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
      this.db.collection("orders").doc(o.id).update({
        status: "closed",
        closedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch((e) => alert("Could not close order: " + e.message));
    },
    reopen(o) {
      this.db.collection("orders").doc(o.id).update({ status: "open" }).catch((e) => alert(e.message));
    },
  },

  template: `
  <div class="max-w-xl mx-auto min-h-screen px-4 py-5">

    <!-- Not configured -->
    <div v-if="!ready" class="mt-20 text-center">
      <h1 class="font-display text-2xl font-semibold mb-2">Orders dashboard</h1>
      <p class="text-mocha-400">Firebase isn't configured yet. Fill in <b>firebase-config.js</b> to enable live orders.</p>
    </div>

    <!-- Login -->
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

    <!-- Dashboard -->
    <div v-else>
      <header class="flex items-center justify-between mb-4">
        <div>
          <h1 class="font-display text-2xl font-semibold leading-none">Orders</h1>
          <p class="text-mocha-400 text-xs mt-1">{{ openCount }} open</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="soundOn = !soundOn" :title="soundOn ? 'Sound on' : 'Sound off'"
                  class="w-9 h-9 grid place-items-center rounded-full bg-white border border-stone-200">
            {{ soundOn ? '🔔' : '🔕' }}
          </button>
          <button @click="logout" class="text-sm text-mocha-500 px-3 py-1.5 rounded-full bg-white border border-stone-200">Sign out</button>
        </div>
      </header>

      <div class="flex gap-2 mb-4">
        <button @click="tab='open'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                :class="tab==='open' ? 'bg-mocha-500 text-white' : 'bg-white border border-stone-200 text-mocha-500'">
          Open <span v-if="openCount" class="ml-1 bg-white/25 rounded-full px-1.5">{{ openCount }}</span>
        </button>
        <button @click="tab='closed'" class="px-4 py-1.5 rounded-full text-sm font-medium"
                :class="tab==='closed' ? 'bg-mocha-500 text-white' : 'bg-white border border-stone-200 text-mocha-500'">
          Closed
        </button>
      </div>

      <p v-if="list.length === 0" class="text-center text-mocha-400 py-16">
        {{ tab === 'open' ? 'No open orders. New orders appear here instantly.' : 'No closed orders yet.' }}
      </p>

      <div class="space-y-3">
        <article v-for="o in list" :key="o.id" class="pop bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span v-if="o.table" class="text-xs font-bold bg-sage-200 text-mocha-600 rounded-full px-2.5 py-1">Table {{ o.table }}</span>
                <span class="text-xs text-mocha-400">{{ time(o.createdAt) }}</span>
              </div>
              <p class="font-display text-lg font-semibold mt-1">{{ money(o.total) }}</p>
            </div>
            <button @click="toggle(o.id)" class="text-sm text-mocha-500 underline">{{ expanded[o.id] ? 'Hide' : 'View' }}</button>
          </div>

          <div v-if="expanded[o.id]" class="mt-3 pt-3 border-t border-stone-100 space-y-1">
            <div v-for="(it,i) in o.items" :key="i" class="flex justify-between text-sm">
              <span class="text-mocha-600">{{ it.qty }}× {{ it.name }}<span v-if="it.name_vi" class="text-mocha-400"> · {{ it.name_vi }}</span></span>
              <span class="text-mocha-500">{{ money(it.price * it.qty) }}</span>
            </div>
            <p v-if="o.note" class="text-sm text-mocha-500 pt-2"><b>Note:</b> {{ o.note }}</p>
          </div>

          <div class="mt-3 flex gap-2">
            <button v-if="o.status==='open'" @click="closeOrder(o)"
                    class="flex-1 bg-mocha-500 hover:bg-mocha-600 text-white font-semibold rounded-xl py-2.5">Close order</button>
            <button v-else @click="reopen(o)"
                    class="flex-1 bg-white border border-stone-200 text-mocha-500 font-semibold rounded-xl py-2.5">Reopen</button>
          </div>
        </article>
      </div>
    </div>
  </div>
  `,
}).mount("#admin");
