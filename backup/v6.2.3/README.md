# GSC SQL Query Builder – Development Instructions

This project uses **Tailwind CSS** and **DaisyUI** for styling.

---

## Setup (One-time)

1. Make sure **Node.js** and **npm** are installed.
2. Install project dependencies:
   ```bash
   npm install
   ```

---

## 🛠 Development Commands

### Watch mode (auto-recompiles on save)

```bash
npx tailwindcss -i ./src/input.css -o ./src/output.css --watch
```
Use this while actively developing. It will rebuild the CSS automatically when changes are made.

---

### Production build (minified)
```bash
npx tailwindcss -i ./src/input.css -o ./src/output.css --minify
```
Use this before final delivery or deployment to generate a compressed CSS file.

---

## Notes

- The files `tailwind.config.js`, `package.json`, and `package-lock.json` must be included.
- The compiled CSS (`output.css`) is referenced in the HTML and needs to be regenerated when styles are updated.
- This is a **development version** — if you change Tailwind classes or UI layout, you must recompile the CSS using the commands above.
