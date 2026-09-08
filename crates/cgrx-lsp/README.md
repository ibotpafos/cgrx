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

# Запуск (стандартный LSP stdio transport)
cargo run -p cgrx-lsp -- --root /absolute/path/to/repository
```

## Конфигурация IDE

### VSCode

```json
{
  "name": "cgrx-lsp",
  "command": "cargo",
  "args": ["run", "-p", "cgrx-lsp", "--", "--root", "/absolute/path/to/repository"],
  "languageId": "rust"
}
```

### Neovim (lspconfig)

```lua
require'lspconfig'.cgrx_lsp.setup{
  cmd = { "cargo", "run", "-p", "cgrx-lsp", "--", "--root", "/absolute/path/to/repository" },
}
```

Сервер использует стандартное LSP framing `Content-Length`, загружает
revision-pinned CGRX graph для committed `HEAD`, а несохранённый текст открытых
документов извлекает заново из `didOpen`/`didChange`. Пути из графа возвращаются
как корректные `file://` URI; позиции и диапазоны кодируются в UTF-16, как
объявлено в server capabilities.

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

- `cgrx-cli` — загрузка revision-pinned runtime graph
- `cgrx-languages` — извлечение символов из исходного кода
- `cgrx-retrieval` — граф CGRX
- `lsp-server` — стандартный JSON-RPC/LSP stdio transport
- `url` — безопасное преобразование filesystem path ↔ file URI
- `serde`, `serde_json` — сериализация

## Лицензия

MIT
