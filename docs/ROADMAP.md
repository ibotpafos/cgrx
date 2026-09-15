# CGRX Roadmap — Постоянное улучшение

## Видение
CGRX должен стать **незаменимым инструментом** для AI coding agents, который:
- Ускоряет разработку в 3-5 раз
- Находит баги до код-ревью
- Предлагает оптимальные рефакторинги
- Понимает архитектуру за секунды
- Работает offline без API ключей

## Конкурентные преимущества (уже реализовано)

### vs CodeQL
- ✅ **Локальный запуск** — не требует GitHub, работает offline
- ✅ **MCP сервер** — нативная интеграция с AI agents
- ✅ **Мгновенный ответ** — нет очередей, нет лимитов
- ✅ **7 языков** — Rust, Go, Java, TypeScript, Python, C, Kotlin

### vs Sourcegraph
- ✅ **Offline** — не требует облачного хостинга
- ✅ **Model-free** — не использует LLM для анализа
- ✅ **Evidence-based** — каждый ответ подтверждён доказательствами
- ✅ **Gate система** — автоматические quality gates

### vs Cursor/Copilot
- ✅ **Structural understanding** — не просто текст, а граф вызовов
- ✅ **Cross-file tracing** — трассировка через весь проект
- ✅ **Architecture analysis** — пакетные границы, циклы, coupling
- ✅ **Deterministic** — одинаковый input = одинаковый output

## Приоритеты улучшений

### P0 — Немедленные улучшения (1-2 дня)

#### 1. Расширение языковой поддержки
**Цель:** 10+ языков к концу месяца

| Язык | Статус | Сложность | Влияние |
|------|--------|-----------|---------|
| C++ | ✅ | Средняя | Высокое (game dev, systems) |
| C# | ✅ | Средняя | Высокое (.NET ecosystem) |
| Ruby | ✅ | Низкая | Среднее (Rails community) |
| PHP | ⏳ | Низкая | Среднее (web backend) |
| Swift | ⏳ | Средняя | Среднее (iOS/macOS) |
| Scala | ⏳ | Средняя | Низкое (JVM niche) |
| Clojure | ⏳ | Низкая | Низкое (Lisp niche) |
| Elixir | ⏳ | Низкая | Низкое (Phoenix niche) |

**Реализация:**
- Каждый язык: 200-300 строк parser + 50 строк pack.rs + frozen fixtures
- Паттерн: tree-sitter grammar → extract CALLS/IMPORTS/REFERENCE
- Время: 2-4 часа на язык

#### 2. Улучшение search_graph
**Проблема:** Нет fuzzy search, нет regex support

**Решение:**
- Добавить `fuzzy: true` параметр
- Поддержка regex в query
- Ранжирование по relevancy (exact > prefix > fuzzy)

#### 3. Больше gate типов
**Цель:** Покрыть все common CI checks

| Gate | Описание | Статус |
|------|----------|--------|
| check_test_coverage | Покрытие тестами | ⏳ |
| check_performance | Performance benchmarks | ⏳ |
| check_dependencies | Dependency freshness | ⏳ |
| check_documentation | Doc completeness | ⏳ |
| check_accessibility | A11y compliance | ⏳ |

### P1 — Среднесрочные улучшения (1-2 недели)

#### 4. Streaming/pagination
**Проблема:** Большие монорепо возвращают truncated results

**Решение:**
- Cursor-based pagination для orient/expand
- Streaming для get_architecture
- Configurable limits через MCP args

#### 5. Interactive code exploration
**Новые инструменты:**

| Инструмент | Описание |
|------------|----------|
| `explain_symbol` | Объяснение что делает функция (LLM-free) |
| `suggest_tests` | Предложение тест cases на основе usage patterns |
| `find_similar_patterns` | Поиск похожих паттернов в кодовой базе |
| `dependency_graph` | Визуализация зависимостей между модулями |
| `impact_analysis` | Что сломается при изменении X |

#### 6. Git integration
**Новые возможности:**
- `git blame` integration — кто и когда менял код
- `git history` analysis — как код эволюционировал
- `pr_review` — автоматическое ревью PR
- `conflict_prediction` — предсказание merge конфликтов

### P2 — Долгосрочные улучшения (1-3 месяца)

#### 7. Team features
- Shared index — одна индексация на всю команду
- Collaborative annotations — общие заметки на код
- Knowledge base — накопленная мудрость о кодовой базе
- Onboarding assistant — помощь новым разработчикам

#### 8. IDE integration
- VS Code extension
- JetBrains plugin
- Neovim integration
- Emacs package

#### 9. CI/CD integration
- GitHub Actions
- GitLab CI
- Jenkins plugin
- CircleCI orb

#### 10. Advanced analysis
- Dead code detection
- Unused dependency detection
- Security vulnerability scanning (SAST)
- Performance bottleneck detection
- Memory leak detection patterns

## Метрики успеха

### Количественные
- **Языки:** 7 → 15+ (Q4 2026)
- **Инструменты:** 19 → 30+ (Q4 2026)
- **Время ответа:** < 100ms для 95% запросов
- **Покрытие:** 90%+ тестов для каждого языка

### Качественные
- **Developer satisfaction:** NPS > 50
- **Adoption rate:** 1000+ active users (Q1 2027)
- **Community contributions:** 50+ external PRs
- **Enterprise adoption:** 10+ компаний

## Технические принципы

### 1. Evidence-based
Каждый ответ должен быть подтверждён:
- Source code reference
- Call graph path
- Test coverage data
- Git history

### 2. Deterministic
Одинаковый input = одинаковый output:
- No LLM in analysis pipeline
- No random sampling
- No heuristic guessing
- Pure graph algorithms

### 3. Offline-first
Работает без интернета:
- No API keys required
- No cloud dependencies
- No telemetry
- Full local processing

### 4. Agent-native
Создан для AI agents:
- MCP protocol
- Structured responses
- Bounded outputs
- Resumable sessions

## Ближайшие действия

### Сегодня
1. Добавить C++ поддержку (2-3 часа)
2. Улучшить search_graph с fuzzy matching
3. Добавить check_test_coverage gate

### Эта неделя
1. Добавить C#, Ruby, PHP
2. Реализовать streaming для orient
3. Добавить explain_symbol инструмент

### Этот месяц
1. 10+ языков
2. 25+ инструментов
3. CI/CD integration
4. VS Code extension (beta)

## Ресурсы

### Документация
- `docs/COMPETITIVE.md` — сравнение с конкурентами
- `docs/security-gates.md` — security gate документация
- `docs/framework-gates.md` — framework gate документация
- `docs/tool-presets.md` — tool presets документация

### Исходный код
- `crates/cgrx-languages/` — language parsers
- `crates/cgrx-mcp/` — MCP server
- `crates/cgrx-cli/` — CLI and runtime
- `crates/cgrx-core/` — core algorithms

### Тесты
- `tests/` — integration tests
- `fixtures/` — test fixtures
- `contracts/` — API contracts
