# Another Day Coffee — Menu Site

A lightweight, mobile-first café menu app with EN/VI language switching, a
WhatsApp table-ordering cart, and a hidden admin editor. The menu is a single
static JSON file — no database, no server, no build tools, no monthly bills.
Hosted **100% free on GitHub Pages**.

## Links

**Site**
- Live menu: <https://addyzim.github.io/the-corner-cafe/>
- Admin (orders + menu): <https://addyzim.github.io/the-corner-cafe/admin.html>

**GitHub**
- Repository: <https://github.com/Addyzim/the-corner-cafe>
- Deploy status (Actions): <https://github.com/Addyzim/the-corner-cafe/actions>
- Pages settings (custom domain): <https://github.com/Addyzim/the-corner-cafe/settings/pages>
- Personal access tokens: <https://github.com/settings/tokens>

**Firebase** (order database + admin sign-in) — project `another-day-cafe`
- Console: <https://console.firebase.google.com/project/another-day-cafe>
- Firestore (orders & menu): <https://console.firebase.google.com/project/another-day-cafe/firestore>
- Authentication (staff logins): <https://console.firebase.google.com/project/another-day-cafe/authentication/users>

**Cloudinary** (menu photo hosting)
- Dashboard: <https://console.cloudinary.com>
- Upload presets (`main_preset`): <https://console.cloudinary.com/settings/upload>

## Configure (top of `frontend/app.js`, the `CAFE` object)

- Orders go to the **admin dashboard** (see "Order dashboard" below), not to
  WhatsApp — the customer is never redirected out of the app.
- `CAFE.logo` — path to a logo image, e.g. `"./logo.png"` (drop the file in
  `frontend/`). Leave `""` for text-only.
- About / Contacts copy uses `{ en, vi }` fields; menu items support `name_vi`
  and `category_vi` columns for the Vietnamese names.

## Order dashboard (Firebase)

Live order notifications + an admin dashboard at **`/admin.html`**. Optional —
without it, orders still go to WhatsApp.

1. Create a free project at <https://console.firebase.google.com>.
2. Add a **Web app** (`</>`) and paste its config into `frontend/firebase-config.js`.
3. **Build → Firestore Database → Create database** (production mode).
4. **Build → Authentication → Sign-in method →** enable **Email/Password**, then
   **Users → Add user** to create your admin login.
5. In **Firestore → Rules**, paste:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /orders/{id} {
         // Anyone can place a well-formed order...
         allow create: if request.resource.data.status == 'open'
                       && request.resource.data.total is number
                       && request.resource.data.total >= 0
                       && request.resource.data.total < 100000000
                       && request.resource.data.items is list
                       && request.resource.data.items.size() <= 100;
         // ...but only signed-in staff can read or change them.
         allow read, update, delete: if request.auth != null;
       }
       // Lock everything else down by default.
       match /{document=**} { allow read, write: if false; }
     }
   }
   ```

   Anyone can place an order; only signed-in staff can read/close them. The size
   and total limits prevent obvious abuse of the public create path.
6. Open `/admin.html`, sign in, and watch orders arrive live (with a chime).

```
Cafeteria Site/
├── frontend/              <- this folder is what GitHub Pages serves
│   ├── index.html         Loads Vue 3, Tailwind, and SheetJS from a CDN
│   ├── app.js             The whole Vue app (state, methods, template)
│   └── menu.json          The menu data the site reads (the "database")
├── backend/               <- OPTIONAL: a FastAPI server, not used by Pages
│   ├── main.py            Keep it if you ever want a live API instead
│   ├── requirements.txt
│   └── menu.xlsx          Source spreadsheet for build_menu.py
├── build_menu.py          Regenerates frontend/menu.json from menu.xlsx
└── .github/workflows/     GitHub Action that deploys frontend/ to Pages
```

## Run it locally

Serve the `frontend` folder (the menu is fetched, so opening the file
directly with `file://` won't work):

```bash
cd frontend
python -m http.server 5500    # then open http://127.0.0.1:5500
```

That's the whole app — no backend needed.

## How to use it

- **Customers** see the menu. The category pills at the top filter items and
  scroll sideways on a phone.
- **Staff** tap **Admin** (top right). In admin mode (everything runs in the
  browser — nothing is sent anywhere) you can:
  - Tap any name, price, or description to edit it inline.
  - **Import .xlsx** to load a whole menu from a spreadsheet.
  - **Export menu.json** to download the file you commit to publish.
  - **Export .xlsx** to download a spreadsheet backup.

The import spreadsheet must have these columns: `id`, `category`, `name`,
`price`, `description`. Column order and capitalization don't matter, and a
price written as `75000`, `75.000`, or `75,000 ₫` is parsed correctly.
Prices are in Vietnamese Dong (VND) and shown as whole numbers (e.g. `75.000 ₫`).

## Updating the menu

The live menu is `frontend/menu.json`. To change it, pick whichever is easier:

**A. In the browser (no tools).** Open the site → **Admin** → edit / import →
**Export menu.json**. Replace `frontend/menu.json` in the repo with the
downloaded file and commit. (On github.com you can drag the file straight onto
the repo to commit it.)

**B. From the spreadsheet.** Edit `backend/menu.xlsx` in Excel, then run:

```bash
python build_menu.py
```

This regenerates `frontend/menu.json`. Commit it and push.

Either way, the GitHub Action redeploys automatically in ~30 seconds.

## How the free deploy works

The static `frontend/` folder is published to **GitHub Pages** by the workflow
in `.github/workflows/pages.yml` on every push to `main`. No server, no cost.

The `backend/` FastAPI app is **optional** and not part of the live site — it's
kept only in case you ever want a live API instead of the static JSON.

## Moving to your own domain (e.g. `anotherdaycoffee.com`)

GitHub Pages supports custom domains for free (you only pay the registrar for the
domain itself, ~$10–15/year). When you're ready:

1. **Buy the domain** from any registrar (Namecheap, Cloudflare, GoDaddy, …).
2. In the repo: **Settings → Pages → Custom domain**, enter the domain, **Save**.
   This commits a `CNAME` file to the repo automatically.
3. At the registrar's DNS, add the records GitHub shows you:
   - For an apex domain (`anotherdaycoffee.com`), four **A** records pointing to
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (and optionally AAAA records for IPv6).
   - For `www`, a **CNAME** record pointing to `addyzim.github.io`.
4. Wait for DNS to propagate (minutes to a few hours), then tick **Enforce HTTPS**
   (GitHub issues a free Let's Encrypt certificate).

The site already uses **relative asset paths**, so it works both at the current
`/the-corner-cafe/` subpath and at the root of a custom domain — no code changes
needed. Do **not** add a `CNAME` file manually before you own the domain; an
unconfigured one would break the current live URL.
