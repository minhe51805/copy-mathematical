# AI Math Chat

Chat UI ho tro Markdown, cong thuc toan hoc, upload file, Math Studio va xuat noi dung ra Word.

## Chay local

```bash
npm install
npm run dev
```

Mo `http://localhost:3000`.

Can tao `.env.local`:

```env
AI_GATEWAY_PRIMARY_URL=https://gateway.ai-sketchscape.com
AI_GATEWAY_PRIMARY_KEY=org_your_gateway_key_here
AI_GATEWAY_MODEL=gemini-2.5-flash

# Tuy chon neu muon uu tien mot provider gateway
AI_GATEWAY_PROVIDER=
AI_GATEWAY_GENERATE_PATH=
AI_GATEWAY_ASYNC=true
AI_GATEWAY_SYNC_TIMEOUT_MS=35000
AI_GATEWAY_ASYNC_TIMEOUT_MS=90000

# Tuy chon neu muon tach model theo tung tinh nang
AI_GATEWAY_CHAT_MODEL=
AI_GATEWAY_EXPORT_MODEL=
AI_GATEWAY_FORMULA_MODEL=

NEXT_PUBLIC_MODEL_NAME=Gemini
```

Tat ca luong goi model (`/api/chat`, `/api/export-variants`, `/api/recognize-formula`) di qua AI Gateway bang `x-api-key`. App se goi `/v1/vertex/generate` truoc va fallback sang `/v1/gemini/generate`. Chat va export dung async polling mac dinh de tranh loi Cloudflare 524 khi request lau. Mac dinh app cho async request doi toi 90 giay; neu tai lieu lon van bi timeout, hay chia yeu cau thanh tung phan nho hon hoac tach thanh flow background job co man hinh trang thai.

## Teacher Research

Teacher Studio co research sub-agent nhe: khi giao vien hoi cac cau kieu "tim them nguon", "tra cuu", "cap nhat", "dan chung", "tai lieu tham khao", backend se tu chay search, dua ket qua vao prompt va yeu cau AI tra loi kem trich dan `[S1]`, `[S2]`.

```env
TEACHER_RESEARCH_ENABLED=true
TEACHER_RESEARCH_SEARCH_PROVIDER=auto
TEACHER_RESEARCH_MAX_QUERIES=2
TEACHER_RESEARCH_MAX_RESULTS=8

# Khuyen nghi neu muon search tot va mien phi/local:
TEACHER_RESEARCH_SEARXNG_URL=http://localhost:8080

# Tuy chon provider co API key:
TEACHER_RESEARCH_TAVILY_API_KEY=
TEACHER_RESEARCH_BRAVE_API_KEY=
```

Neu khong cau hinh SearXNG/Tavily/Brave, app van thu Wikipedia va DuckDuckGo Instant Answer lam fallback nhe hon. De chay SearXNG local:

```bash
docker run -d -p 8080:8080 --name teacher-searxng searxng/searxng
```

## Deploy day du tinh nang

Ung dung nay co route server, vi vay ban deploy day du nen dung Vercel/Netlify/Render hoac mot server Node.js co bien moi truong `AI_GATEWAY_PRIMARY_URL` va `AI_GATEWAY_PRIMARY_KEY`.

## Deploy GitHub Pages

Repo da co workflow `.github/workflows/pages.yml` de build static site vao `out/` va deploy len GitHub Pages.

Trong GitHub repo:

1. Vao `Settings -> Pages`.
2. Chon `Source: GitHub Actions`.
3. Push code len branch `master`.

GitHub Pages chi host static file, nen API chat khong chay truc tiep tren `github.io`.

`NEXT_PUBLIC_API_BASE_URL` phai la URL backend da deploy, vi du `https://ten-app.vercel.app`. Day khong phai API key. Khong dua `AI_GATEWAY_PRIMARY_KEY` vao bien `NEXT_PUBLIC_*` vi no se bi dong goi vao JavaScript public.

Neu dat bien trong GitHub:

- `Settings -> Secrets and variables -> Actions -> Variables` voi ten `NEXT_PUBLIC_API_BASE_URL`, hoac
- `Settings -> Environments -> .env -> Environment variables` voi ten `NEXT_PUBLIC_API_BASE_URL`.

Sau khi doi bien, rerun workflow `Deploy to GitHub Pages` de build lai.
