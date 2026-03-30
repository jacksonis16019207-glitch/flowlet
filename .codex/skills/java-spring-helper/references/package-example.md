# Package Example

## 基本形

```text
com.flowlet
  ├─ application
  │   └─ service
  ├─ account
  │   ├─ domain
  │   │   ├─ model
  │   │   ├─ repository
  │   │   └─ exception
  │   └─ service
  ├─ presentation
  │   └─ account
  │       ├─ controller
  │       └─ dto
  └─ infrastructure
      └─ jpa
          └─ account
              ├─ entity
              ├─ repository
              └─ mapper
```

## 補足

- `account/service` は単一ドメイン処理の責務を持つ。
- `application/service` は複数ドメイン処理の責務を持つ。
- `domain` は業務ルールを持つ。
- `presentation` は API 入出力を持つ。
- `infrastructure` は永続化や外部依存を持つ。
- DTO は `presentation/<機能>/dto` にまとめる。

