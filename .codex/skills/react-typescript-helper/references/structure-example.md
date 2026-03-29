# Structure Example

## 基本形

```text
src
  ├─ pages
  │   ├─ dashboard
  │   │   └─ DashboardPage.tsx
  │   └─ accounts
  │       └─ AccountListPage.tsx
  ├─ features
  │   ├─ account
  │   │   ├─ api
  │   │   ├─ components
  │   │   ├─ forms
  │   │   ├─ hooks
  │   │   └─ types
  │   └─ scheduled-payment
  │       ├─ api
  │       ├─ components
  │       ├─ forms
  │       ├─ hooks
  │       └─ types
  └─ shared
      ├─ components
      ├─ lib
      ├─ hooks
      ├─ styles
      └─ utils
```

## 補足

- `pages` は画面の組み立てに専念する。
- `features` は機能単位で UI、API、型、フォームを閉じる。
- `shared` は本当に共通化できるものだけを置く。
- API クライアントは `shared/lib` に置き、機能別 API は `features/*/api` に置く。
