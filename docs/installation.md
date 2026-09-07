# Установка и подключение CGRX

Один локальный MCP-сервер работает с разными Git-репозиториями.
Отдельный сервер на каждый проект не нужен. Версия: alpha.

## Одной командой

~~~sh
curl -fsSL https://raw.githubusercontent.com/ibotpafos/cgrx/v0.1.0-alpha.7/install.sh | sh
~~~

Путь: `$HOME/.local/bin/cgrx`. Установщик не использует sudo и не меняет
настройки клиентов или shell. На macOS Apple Silicon скачивает готовый архив,
проверяет SHA-256 и выполняет MCP initialize до замены бинарника. На Linux и
Intel macOS собирает закреплённый tag: заранее нужны rustup с Rust 1.89.0,
Git и C-компилятор. Установка системных зависимостей не автоматизирована.
SHA-256 проверяет соответствие опубликованному checksum, а не подпись автора.

Свой каталог или принудительная сборка:

~~~sh
curl -fsSL https://raw.githubusercontent.com/ibotpafos/cgrx/v0.1.0-alpha.7/install.sh | CGRX_INSTALL_DIR="$HOME/tools/bin" sh -s -- --source
~~~

Повтор команды обновляет бинарник; прежняя версия сохраняется рядом в
`cgrx.backup.XXXXXX` (точный путь печатается). При ошибке скачивания, checksum,
сборки или initialize действующий бинарник остаётся на месте. Параллельная
установка в тот же каталог отклоняется. После аварийного SIGKILL может остаться
`.cgrx-install.lock`: удаляйте только пустой lock-каталог через `rmdir`, убедившись,
что другой установщик не работает.

Для отката закройте MCP-клиенты, восстановите сохранённый бинарник через
`cp -p /точный/путь/cgrx.backup.XXXXXX "$HOME/.local/bin/cgrx"` и учтите раздел
об откате формата индекса ниже. Для обновления на будущий релиз используйте
команду из документации соответствующего tag, а не плавающую ветку main.

После этого подключите один MCP к каждому нужному клиенту по инструкции ниже.
Во всех примерах подключения замените `$HOME/.cargo/bin/cgrx` на
`$HOME/.local/bin/cgrx`, если использовали установщик одной командой.

Установите общий skill с рабочим процессом агента:

~~~sh
"$HOME/.local/bin/cgrx" skill install
~~~

Команда атомарно записывает `cgrx-code-discovery` в
`$HOME/.agents/skills`. Если в `$HOME/.codex/AGENTS.md` остался старый
управляемый блок `cgrx-agent`, сохраняется
`AGENTS.md.cgrx-backup` и удаляется только этот блок. Остальные правила не
меняются. Codex обнаруживает skill автоматически; если он не появился,
перезапустите Codex.

## Из исходников

Нужны Git, Rust 1.89.0 через rustup и C-компилятор.
На macOS: xcode-select --install. На Debian/Ubuntu: пакет build-essential.

~~~sh
git clone https://github.com/ibotpafos/cgrx.git
cd cgrx
git checkout v0.1.0-alpha.7
cargo install --locked --path crates/cgrx-cli
~~~

По умолчанию бинарник окажется в $HOME/.cargo/bin/cgrx.
При нестандартном CARGO_HOME используйте его каталог bin.
Cargo скачивает зависимости при установке; сам MCP-сервер не использует сетевые API.
Локально проверяется macOS Apple Silicon, Linux — в CI.
Нативная Windows пока не поддерживается из-за Unix API.

## Готовый бинарник: macOS Apple Silicon

Из [релиза](https://github.com/ibotpafos/cgrx/releases/tag/v0.1.0-alpha.7)
скачайте cgrx-v0.1.0-alpha.7-aarch64-apple-darwin.tar.gz и SHA256SUMS.
В каталоге со скачанными файлами:

~~~sh
shasum -a 256 -c SHA256SUMS
tar -xzf cgrx-v0.1.0-alpha.7-aarch64-apple-darwin.tar.gz
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

Использование агентом описано в устанавливаемом
[`cgrx-code-discovery` skill](agent-usage.md). Пустой граф при неполном
покрытии не доказывает отсутствие связей.

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

В alpha.7 используется extraction revision 28. При возврате к старому бинарнику
старый движок может отклонить уже обновлённый индекс. Сначала закройте все
MCP-соединения, использующие репозиторий. В корне каждого затронутого Git worktree
сохраните только производный индекс в отдельном каталоге:

~~~sh
state=$(git rev-parse --git-path cgrx/managed) || exit 1
backup="${state}.before-downgrade-$(date +%Y%m%dT%H%M%S)"
test ! -e "$backup" && test -d "$state" && mv "$state" "$backup"
~~~

Затем выберите сохранённый старый бинарник и переподключите MCP. Индекс будет
построен заново; исходники и Git-история остаются на месте. Повторите для каждого
репозитория, открытого новой версией. Не перемещайте индекс при активном сервере.

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

## Пагинация покрытия

`check_index_coverage` возвращает не более 100 gap-записей на область по
умолчанию. Передайте `limit` от 1 до 500 и `offset` от 0. Для продолжения
используйте `next_offset`, пока `has_more` имеет значение `true`.
`coverage_gap_count` всегда содержит полное число известных пробелов, а
`returned` — размер текущей страницы. `coverage_summary` содержит компактные
счётчики по типам; `scope_summary` считает статусы проверенных областей отдельно
от `summary` точных путей. Это ограничивает расход токенов, но не превращает
`partial` в доказательство полноты.
