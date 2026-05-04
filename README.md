# AI Math Chat

Chat UI ho tro Markdown, cong thuc toan hoc va xuat noi dung ra file Word.

## Chay local

```bash
npm install
npm run dev
```

Mo `http://localhost:3000`.

Can tao `.env.local`:

```env
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
OPENAI_MODEL=...
```

## Deploy day du tinh nang

Ung dung nay co route server `/api/chat` va `/api/export-variants`, vi vay ban deploy day du nen dung Vercel/Netlify/Render hoac mot server Node.js co bien moi truong `OPENAI_API_KEY`.

## Deploy GitHub Pages

Repo da co workflow `.github/workflows/pages.yml` de build static site vao `out/` va deploy len GitHub Pages.

Trong GitHub repo:

1. Vao `Settings -> Pages`.
2. Chon `Source: GitHub Actions`.
3. Push code len branch `master`.

GitHub Pages chi host static file, nen API chat khong chay truc tiep tren `github.io`. Neu muon giao dien tren GitHub Pages goi backend rieng, tao repository variable `NEXT_PUBLIC_API_BASE_URL` tro den backend do.
