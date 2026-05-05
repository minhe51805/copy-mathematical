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
# Gemini native SDK
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3-flash-preview
NEXT_PUBLIC_MODEL_NAME=Gemini

# Hoac OpenAI-compatible providers
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
OPENAI_MODEL=...
```

## Deploy day du tinh nang

Ung dung nay co route server `/api/chat` va `/api/export-variants`, vi vay ban deploy day du nen dung Vercel/Netlify/Render hoac mot server Node.js co bien moi truong `GEMINI_API_KEY` hoac `OPENAI_API_KEY`.

## Deploy GitHub Pages

Repo da co workflow `.github/workflows/pages.yml` de build static site vao `out/` va deploy len GitHub Pages.

Trong GitHub repo:

1. Vao `Settings -> Pages`.
2. Chon `Source: GitHub Actions`.
3. Push code len branch `master`.

GitHub Pages chi host static file, nen API chat khong chay truc tiep tren `github.io`.

`NEXT_PUBLIC_API_BASE_URL` phai la URL backend da deploy, vi du `https://ten-app.vercel.app`. Day khong phai OpenAI key. Khong dua `OPENAI_API_KEY` vao bien `NEXT_PUBLIC_*` vi no se bi dong goi vao JavaScript public.

Neu dat bien trong GitHub:

- `Settings -> Secrets and variables -> Actions -> Variables` voi ten `NEXT_PUBLIC_API_BASE_URL`, hoac
- `Settings -> Environments -> .env -> Environment variables` voi ten `NEXT_PUBLIC_API_BASE_URL`.

Sau khi doi bien, rerun workflow `Deploy to GitHub Pages` de build lai.
