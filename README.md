# The Corner Café — Menu Site

A lightweight, mobile-first café menu app. The menu is a single static
JSON file — no database, no server, no build tools, no monthly bills. It is
hosted **100% free on GitHub Pages**.

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
