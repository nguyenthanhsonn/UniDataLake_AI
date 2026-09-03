# Hướng dẫn Frontend - UniLake AI

Tài liệu này dành cho member làm frontend trong dự án UniLake AI.

---

## 1. Tổng quan

Frontend sử dụng **Next.js 15**, **React 19**, **TypeScript**, **TailwindCSS**, **ESLint 9 flat config**, **Prettier** và **pnpm**.

Mục tiêu frontend:

- Xây dựng dashboard quản trị dữ liệu.
- Cung cấp giao diện chatbot truy vấn dữ liệu bằng ngôn ngữ tự nhiên.
- Hiển thị biểu đồ, bảng số liệu, trạng thái pipeline và data governance.
- Đảm bảo UI dễ scan, responsive và đạt chuẩn accessibility cơ bản.

---

## 2. Cấu trúc thư mục

```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   └── styles/
│       └── globals.css
├── public/
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

Quy ước khi mở rộng:

```text
src/
├── app/                    # Route theo Next.js App Router
├── components/             # Component dùng lại
├── hooks/                  # Custom React hooks
├── lib/                    # API client, utils, helpers
├── types/                  # TypeScript shared types
├── constants/              # Constant dùng chung
└── styles/                 # Global CSS
```

---

## 3. Cài đặt

Từ thư mục `frontend/`:

```bash
pnpm install
```

Chạy dev server:

```bash
pnpm dev
```

Ứng dụng chạy tại:

[http://localhost:3000](http://localhost:3000)

---

## 4. Scripts quan trọng

| Script | Mục đích |
| :--- | :--- |
| `pnpm dev` | Chạy Next.js dev server |
| `pnpm build` | Build production |
| `pnpm start` | Chạy production server sau khi build |
| `pnpm lint` | Chạy ESLint, không cho warning |
| `pnpm lint:fix` | Tự sửa lỗi ESLint có thể fix |
| `pnpm format` | Format source bằng Prettier |
| `pnpm format:check` | Kiểm tra format |
| `pnpm type-check` | Chạy TypeScript check |
| `pnpm test` | Chạy Vitest |
| `pnpm lighthouse` | Chạy Lighthouse CI local |
| `pnpm check-all` | Type-check, lint, format check, build |

Trước khi mở PR:

```bash
pnpm check-all
pnpm test
```

---

## 5. TypeScript

Config chính: `frontend/tsconfig.json`

Project đang bật strict mode:

- `strict`
- `noUncheckedIndexedAccess`
- `noImplicitOverride`
- `noFallthroughCasesInSwitch`
- `forceConsistentCasingInFileNames`

Alias đang dùng:

```text
@/* -> src/*
@/components/* -> src/components/*
@/lib/* -> src/lib/*
@/hooks/* -> src/hooks/*
@/types/* -> src/types/*
@/constants/* -> src/constants/*
```

Ví dụ import:

```tsx
import { apiClient } from "@/lib/api-client";
import { DashboardCard } from "@/components/dashboard-card";
```

---

## 6. ESLint và Prettier

File cấu hình:

- `frontend/eslint.config.mjs`
- `frontend/.prettierrc`
- `frontend/.prettierignore`

ESLint kiểm tra:

- React rules.
- React Hooks rules.
- Accessibility với `jsx-a11y`.
- Import order.
- TypeScript rules.
- Next.js rules.
- TailwindCSS class order.

Prettier đang dùng:

- `printWidth: 100`
- `singleQuote: true`
- `semi: false`
- `trailingComma: es5`
- `prettier-plugin-tailwindcss`

Chạy tự sửa:

```bash
pnpm lint:fix
pnpm format
```

---

## 7. TailwindCSS

File cấu hình:

- `frontend/tailwind.config.ts`
- `frontend/postcss.config.mjs`
- `frontend/src/styles/globals.css`

Quy ước UI:

- Ưu tiên layout rõ ràng, dễ scan.
- Không lạm dụng gradient, shadow hoặc card lồng card.
- Button/icon/control phải có trạng thái hover/focus rõ ràng.
- Text không được tràn container ở mobile.
- Form field cần label hoặc accessible name.
- Dùng màu theo ngữ nghĩa: success, warning, error, info.

---

## 8. Next.js App Router

Route nằm trong `src/app`.

Ví dụ:

```text
src/app/dashboard/page.tsx       # /dashboard
src/app/chatbot/page.tsx         # /chatbot
src/app/data-governance/page.tsx # /data-governance
```

Quy ước:

- Component route chính đặt tên rõ ràng, ví dụ `DashboardPage`.
- Metadata có thể khai báo bằng `export const metadata`.
- Ưu tiên Server Component cho phần không cần state/browser APIs.
- Dùng Client Component chỉ khi cần `useState`, `useEffect`, event handler hoặc browser APIs.
- Không fetch API rải rác trong nhiều component nếu có thể gom vào `src/lib`.

---

## 9. API client

Khi bắt đầu gọi backend, nên tạo API client tập trung:

```text
src/lib/api-client.ts
```

Gợi ý pattern:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

Biến môi trường frontend public phải bắt đầu bằng `NEXT_PUBLIC_`.

---

## 10. Testing

Project đã cài Vitest. Hiện script `pnpm test` dùng `--passWithNoTests` để skeleton repo không fail khi chưa có test đầu tiên.

Khi thêm test:

```text
src/components/button.test.tsx
src/lib/api-client.test.ts
```

Chạy test:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

Nếu test React component cần DOM, thêm cấu hình Vitest/jsdom trước khi viết test UI phức tạp.

---

## 11. Lighthouse

Config: `frontend/.lighthouserc.json`

Hiện Lighthouse audit route:

```text
http://localhost:3000/
```

Chạy local:

```bash
pnpm build
pnpm lighthouse
```

Lighthouse cần Chrome/Chromium. Trên GitHub Actions, workflow frontend tự cài Chrome bằng `browser-actions/setup-chrome`.

Khi thêm route thật như `/dashboard`, `/chatbot`, `/data-governance`, cập nhật thêm URL vào `.lighthouserc.json`.

---

## 12. CI frontend

Workflow: `.github/workflows/ci-frontend.yml`

CI chạy khi PR/push vào `main` hoặc `develop` có thay đổi trong `frontend/**`.

Các bước CI:

1. Cài pnpm.
2. Cài Node.js 20.
3. Chạy `pnpm install --frozen-lockfile`.
4. Chạy `pnpm type-check`.
5. Chạy `pnpm lint`.
6. Chạy `pnpm format:check`.
7. Chạy `pnpm build`.
8. Chạy `pnpm lighthouse:ci`.

---

## 13. IDE setup

Repo không khóa team vào một IDE cụ thể. Cấu hình chung cho mọi IDE nằm ở:

- `.editorconfig`: indent, line ending, charset, final newline.
- `frontend/tsconfig.json`: TypeScript strict mode và path alias.
- `frontend/eslint.config.mjs`: ESLint rules.
- `frontend/.prettierrc`: Prettier rules.

Các IDE như Antigravity, WebStorm, Cursor hoặc VS Code chỉ cần đọc các file chuẩn này là có cùng rule format/lint.

### Antigravity / IDE khác

Khi mở project trong Antigravity hoặc IDE không phải VS Code:

1. Mở root repo `UniDataLake_AI`, không chỉ mở riêng thư mục `frontend`.
2. Đảm bảo IDE nhận `.editorconfig`.
3. Chọn TypeScript SDK từ `frontend/node_modules/typescript/lib` nếu IDE có hỏi.
4. Bật ESLint bằng config `frontend/eslint.config.mjs`.
5. Bật Prettier bằng config `frontend/.prettierrc`.
6. Chạy terminal trong `frontend/` khi dùng các lệnh `pnpm`.

Lệnh kiểm tra IDE đã đọc đúng config:

```bash
cd frontend
pnpm lint
pnpm format:check
pnpm type-check
```

### VS Code

Repo vẫn có cấu hình gợi ý riêng cho VS Code:

- `frontend/.vscode/settings.json`
- `frontend/.vscode/extensions.json`

Extension khuyến nghị:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Pretty TypeScript Errors
- TypeScript Next

Khi mở frontend trong VS Code, nên chọn workspace TypeScript SDK từ `frontend/node_modules/typescript/lib`.

---

## 14. Quy ước khi làm frontend

- Tạo branch theo dạng `feature/FE-...`, `fix/FE-...`, `chore/FE-...`.
- Commit theo Conventional Commits, ví dụ `feat(fe): add dashboard shell`.
- Component dùng lại đặt trong `src/components`.
- Logic gọi API hoặc transform dữ liệu đặt trong `src/lib`.
- Không để component quá lớn; tách khi file khó đọc hoặc có nhiều state.
- Không commit `.next`, `node_modules`, report Lighthouse hoặc cache TypeScript.
- Với UI thay đổi, PR nên có screenshot hoặc mô tả cách test thủ công.

---

## 15. Checklist trước khi mở PR frontend

- [ ] Đã chạy `pnpm install` sau khi pull nếu `pnpm-lock.yaml` thay đổi.
- [ ] Đã chạy `pnpm lint`.
- [ ] Đã chạy `pnpm format:check`.
- [ ] Đã chạy `pnpm type-check`.
- [ ] Đã chạy `pnpm build`.
- [ ] Đã chạy `pnpm test` nếu có sửa logic.
- [ ] Đã kiểm tra responsive nếu sửa UI.
- [ ] Không commit `.next`, `node_modules`, `.lighthouseci`, `*.tsbuildinfo`.
