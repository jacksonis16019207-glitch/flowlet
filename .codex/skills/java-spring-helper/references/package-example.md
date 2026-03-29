# Package Example

## 基本形

```text
com.flowlet
  └─ account
      ├─ application
      │   ├─ usecase
      │   └─ dto
      ├─ domain
      │   ├─ model
      │   ├─ repository
      │   └─ exception
      ├─ infrastructure
      │   ├─ jpa
      │   │   ├─ entity
      │   │   ├─ repository
      │   │   └─ mapper
      └─ presentation
          └─ api
              ├─ controller
              ├─ request
              ├─ response
              └─ advice
```

## 補足

- `application` はユースケース実行の責務を持つ。
- `domain` は業務ルールを持つ。
- `infrastructure` は永続化や外部依存を持つ。
- `presentation` は API 入出力を持つ。
- 共通化は急がず、機能単位で閉じた構成を優先する。
