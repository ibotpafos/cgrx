# CGRX Subagent Acceptance Criteria

Каждая задача под-агента оценивается по критериям ниже. Задача считается выполненной, когда все обязательные критерии пройдены.

## Общие критерии (для всех задач)

- [ ] Код компилируется: `cargo check --locked --workspace`
- [ ] Форматирование: `cargo fmt --all -- --check`
- [ ] Линтер: `cargo clippy --locked --workspace --all-targets -- -D warnings`
- [ ] Тесты: `cargo test --locked --workspace` — 0 failed
- [ ] Основной чекаут не тронут (только worktree)
- [ ] Нет захардкоженных секретов, ключей, токенов
- [ ] Нет сетевых вызовов в рантайме (если не является фичей)
- [ ] Документация в `docs/` для новых тулов/фич

## Критерии по фичам

### Decision Memory (#41)
- [ ] `MemoryStore` хранит записи в `.cgrx/memory/decisions/<id>.json`
- [ ] `id` детерминирован (blake3 контента), дубликаты идемпотентны
- [ ] Integrity envelope — подделка падает на чтении
- [ ] TTL-чистка: `prune_expired(now, dry_run)` удаляет просроченные
- [ ] MCP-тулы `memory_record`/`memory_recall` в стиле существующих (bounded, snapshot-bound, llm_used=false)
- [ ] 10+ юнит-тестов (roundtrip, дубликаты, границы, TTL, фильтры, tamper)
- [ ] Документация в `docs/decision-memory.md`

### Daemon Watch (#42) — в main
- [ ] Команда `cgrx daemon --root --state [--once]` работает
- [ ] Измеряет свежесть (`refresh_us`, `changed`, `changed_paths`)
- [ ] Тихий idle (нет событий при неизменном дереве)
- [ ] Fail-closed при смене HEAD
- [ ] 28/28 cli-тестов зелёные

### SARIF Gates (#43)
- [ ] `cgrx check-gates --format sarif` выводит SARIF 2.1.0
- [ ] Маппинг уровней: PASS→note, WARN/INCONCLUSIVE→warning, FAIL→error
- [ ] Локации из coverage gaps (path + span где возможно)
- [ ] Нет молчаливого пасса при partial evidence
- [ ] Golden-тесты для всех 4 вердиктов
- [ ] Workflow example в `.github/workflows/`

### Test-Run Evidence (#44) — в main
- [ ] `TestRunRecord` сериализуется/десериализуется
- [ ] Точное совпадение rev+hash → аннотация `passed`/`failed`
- [ ] Неточное совпадение → поведение как раньше (`not_run`)
- [ ] `failed` побеждает `passed` при конфликте
- [ ] 9/9 новых тестов (positive + stale + mismatch)

### Hybrid Search (#45)
- [ ] Off by default (`CGRX_HYBRID` не установлен → structural lane пуст)
- [ ] Structural fingerprinting: name tokens + normalized body hash
- [ ] Гибридный score = RRF(BM25, exact, structural)
- [ ] Positive: находит переименованный/переписанный символ
- [ ] Negative: нет ложных срабатываний при разных именах+логике
- [ ] Бенчмарк BM25 vs hybrid на 3 запросах
- [ ] 25 тестов зелёные

### Security Gates (в работе)
- [ ] Детект секретов в working-tree diff (приватные ключи, токены, пароли)
- [ ] Allowlist-овой механизм для известных ложных срабатываний
- [ ] Аудит зависимостей по Cargo.lock (yanked/пустые версии)
- [ ] Проверка лицензий против allowlist
- [ ] MCP-тул `check_security_gates` (bounded, snapshot-bound, PASS/WARN/FAIL/INCONCLUSIVE, llm_used=false)
- [ ] Тесты positive + false-positive (оба frozen)

### Framework Packets (в работе)
- [ ] 2 фреймворка с frozen positive/negative фикстурами в `contracts/`
- [ ] Консервативное распознавание (роуты, ORM, DI — только где доказуемо)
- [ ] MCP-тул `check_framework_gates` в стиле существующих
- [ ] Тесты positive + false-positive

### Tool Presets (в работе)
- [ ] `CGRX_TOOLSET=minimal|standard|full` или `--toolset`
- [ ] minimal: только чтение/поиск
- [ ] standard: minimal + orient/expand/architecture
- [ ] full: все тулы
- [ ] По умолчанию standard
- [ ] Сервер сообщает активный preset в instructions

## Критерии качества кода

- [ ] Детерминизм: нет `rand`, `System.now()` в продакшен-пути (только в тестах)
- [ ] Fail-closed: неоднозначные случаи → abstention, не угадывание
- [ ] Bounded output: все массивы имеют `limit` (default + maximum)
- [ ] Snapshot-bound: результаты привязаны к конкретному снапшоту
- [ ] `llm_used=false` для всех детерминированных тулов
- [ ] Тесты: positive + negative + edge case
- [ ] Нет `unwrap()`/`expect()` на пользовательском вводе
- [ ] Ошибки типизированы, не паника

## Процедура приёмки

1. Под-агент выполняет задачу в worktree
2. Автоматически прогоняет `cargo fmt`, `cargo clippy`, `cargo test`
3. Создаёт PR с описанием изменений и результатами тестов
4. Наблюдатель (или ревьюер) проверяет CI и мержит при CLEAN
5. При конфликте с main — ребейз и повторная проверка
