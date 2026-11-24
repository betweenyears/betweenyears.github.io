# Between Years — website

Product site for the Between Years app (three-year diary). Plain HTML/CSS/JS, no build step.

- `index.html` — product introduction
- `privacy.html` — privacy policy (draft — review before publishing)
- `support.html` — FAQ and contact
- `css/style.css`, `js/main.js`
- `assets/fonts/` — Playfair Display, Inter, Newsreader (SIL OFL, licences included)
- `assets/img/` — app icons; `screens/` for real screenshots later

## Before publishing

Search for `TODO` and fill in:

1. TestFlight public link → set `BETA_URL` in `js/main.js` (every "Join the beta" button uses it)
2. Support email → `privacy.html`, `support.html`

## Preview

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080

## Deploy

Any static host works: GitHub Pages, Netlify, Cloudflare Pages. Upload the folder as is.
