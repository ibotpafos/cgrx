# Установка и подключение CGRX

Один локальный MCP-сервер работает с разными Git-репозиториями.
Отдельный сервер на каждый проект не нужен. Версия: alpha.

## Из исходников

Нужны Git, Rust 1.89.0 через rustup и C-компилятор.
На macOS: xcode-select --install. На Debian/Ubuntu: пакет build-essential.

~~~sh
git clone https://github.com/ibotpafos/cgrx.git
cd cgrx
git checkout v0.1.0-alpha.2
cargo install --locked --path crates/cgrx-cli
~~~

По умолчанию бинарник окажется в $HOME/.cargo/bin/cgrx.
При нестандартном CARGO_HOME используйте его каталог bin.
Cargo скачивает зависимости при установке; сам MCP-сервер не использует сетевые API.
Локально проверяется macOS Apple Silicon, Linux — в CI.
Нативная Windows пока не поддерживается из-за Unix API.

## Готовый бинарник: macOS Apple Silicon

Из [релиза](https://github.com/ibotpafos/cgrx/releases/tag/v0.1.0-alpha.2)
скачайте cgrx-v0.1.0-alpha.2-aarch64-apple-darwin.tar.gz и SHA256SUMS.
В каталоге со скачанными файлами:

~~~sh
shasum -a 256 -c SHA256SUMS
tar -xzf cgrx-v0.1.0-alpha.2-aarch64-apple-darwin.tar.gz
mkdir -p "$HOME/.local/bin"
install -m 755 cgrx "$HOME/.local/bin/cgrx"
~~~

После ручной установки используйте $HOME/.local/bin/cgrx вместо
$HOME/.cargo/bin/cgrx в примерах. Архив не подписан Developer ID и
не нотарифицирован Apple.

## Codex

Для CLI OpenAI Codex:

~~~sh
codex mcp add cgrx -- "$HOME/.cargo/bin/cgrx" serve --multi-repo
codex mcp list
~~~

Если запись cgrx уже существует, измените её вместо создания дубликата.
Альтернатива — добавить в ~/.codex/config.toml:

~~~toml
[mcp_servers.cgrx]
command = "/absolute/path/to/cgrx"
args = ["serve", "--multi-repo"]
~~~

Замените command реальным абсолютным путём. Не полагайтесь на разворачивание
тильды или shell-переменных внутри TOML. Перезапустите MCP-соединение/клиент.
Для hosted ChatGPT web этой локальной настройки недостаточно.

[Официальная документация Codex MCP](https://developers.openai.com/codex/mcp/).

## OpenCode

Объедините следующую запись с существующим глобальным
~/.config/opencode/opencode.json или проектным opencode.json.
Не заменяйте остальные настройки.

~~~json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "cgrx": {
      "type": "local",
      "command": ["/absolute/path/to/cgrx", "serve", "--multi-repo"],
      "enabled": true
    }
  }
}
~~~

Перезапустите OpenCode.
[Официальная документация](https://opencode.ai/docs/mcp-servers/).

## Первый запрос

Передавайте абсолютный корень Git worktree **в каждом вызове**. Для status:

~~~json
{"repo": "/absolute/path/to/project", "paths_or_scope": ["src"]}
~~~

Затем search_graph:

~~~json
{"repo": "/absolute/path/to/project", "query": "target", "limit": 10}
~~~

Нужен репозиторий с существующим коммитом HEAD. Изменённые/новые файлы
обновляются в рабочем представлении. Первый запрос на большой базе может
быть долгим. Индекс создаётся автоматически в Git metadata.
repo должен указывать на корень, а не на подкаталог.

Добавьте агенту [правило использования](agent-usage.md): discovery/trace,
точные фрагменты и проверка coverage. Пустой граф при неполном покрытии
не доказывает отсутствие связей.

## Проверка без клиента

Из клона исходников, с Python 3:

~~~sh
python3 scripts/smoke_mcp.py "$HOME/.cargo/bin/cgrx"
~~~

Скрипт проверяет initialize, tools/list и trace_path на временном репозитории.
Самостоятельный cgrx serve --multi-repo ожидает JSON-RPC на stdin:
отсутствие приветствия в терминале нормально.

## Обновление и удаление

Выберите опубликованный tag, повторите cargo install с --force, затем
перезапустите MCP-клиенты. При ручной замене сохраните старый бинарник для отката.
Изменения формата индекса обнаруживаются движком.

Логи выключены по умолчанию. CGRX_USAGE_LOG=/absolute/path/to/usage.jsonl
в окружении сервера включает локальную диагностику; каталог должен существовать.
Не публикуйте рабочие индексы и логи без проверки.
CGRX_GIT задаёт путь к Git executable, по умолчанию Git берётся из PATH.

Отключите запись MCP в клиентах. Для установки через Cargo:

~~~sh
cargo uninstall cgrx-cli
~~~

При ручной установке удалите только установленный вами файл cgrx.
Не удаляйте весь каталог .git. Удаление индекса потребует повторной индексации.

## Области поиска и покрытия

В `scope`, `paths_or_scope` и `check_index_coverage.scopes` можно передавать:

- `.` или `./` — весь репозиторий;
- `src`, `src/` или `./src` — сам путь и его потомки;
- `src/main.rs` — конкретный файл;
- `src/*.rs` — glob одного уровня; `src/**` — рекурсивный glob.

Те же правила действуют для `scope.exclude`: исключение `src/private`
не исключает соседний каталог `src/private-other`. Поле
`check_index_coverage.paths` по-прежнему предназначено для точных путей файлов.
Область поиска не отменяет лимиты индекса: `partial` и обрезанный обход
означают, что выводы о полноте требуют дополнительной проверки исходников.
