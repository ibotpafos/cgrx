# CGRX LSP Bridge

Language Server Protocol (LSP) сервер для CGRX, обеспечивающий IDE-интеграцию через `textDocument/definition` и `textDocument/references`.

## Обзор

`cgrx-lsp` — это LSP-сервер, работающий через stdio, который использует граф CGRX для предоставления навигации по коду в IDE. Сервер поддерживает:

- `textDocument/definition` — переход к определению символа
- `textDocument/references` — поиск всех ссылок на символ
- `textDocument/didOpen`, `didChange`, `didClose` — синхронизация документов

## Архитектура

```
┌─────────────┐     stdio/JSON-RPC     ┌─────────────┐
│   IDE       │ ◄──────────────────────► │  cgrx-lsp   │
│  (VSCode,   │                          │   server    │
│  Neovim...) │                          └──────┬──────┘
└─────────────┘                                 │
                                                │ использует
                                                ▼
                                        ┌───────────────┐
                                        │  CGRX Graph   │
                                        │  (BaseGraph)  │
                                        └───────────────┘
```

## Модули

| Модуль | Описание |
|--------|----------|
| `protocol.rs` | Типы LSP-протокола (запросы, ответы, уведомления) |
| `lsp.rs` | Реализация LSP-сервера, обработка запросов |
| `main.rs` | Точка входа, stdio-транспорт |

## Сборка и запуск

```bash
# Сборка
cargo build -p cgrx-lsp

# Запуск (stdio)
cargo run -p cgrx-lsp
```

## Конфигурация IDE

### VSCode

```json
{
  "name": "cgrx-lsp",
  "command": "cargo",
  "args": ["run", "-p", "cgrx-lsp"],
  "languageId": "rust"
}
```

### Neovim (lspconfig)

```lua
require'lspconfig'.cgrx_lsp.setup{
  cmd = { "cargo", "run", "-p", "cgrx-lsp" },
}
```

## Тесты

```bash
# Все тесты
cargo test -p cgrx-lsp

# Только unit-тесты
cargo test -p cgrx-lsp --lib

# Только integration-тесты (mock LSP client)
cargo test -p cgrx-lsp --test mock_client
```

## Зависимости

- `cgrx-core` — основные типы CGRX
- `cgrx-languages` — извлечение символов из исходного кода
- `cgrx-retrieval` — граф CGRX
- `cgrx-store` — хранение графа
- `serde`, `serde_json` — сериализация

## Лицензия

MIT
