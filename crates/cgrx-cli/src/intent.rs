#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum TaskIntent {
    DecoratedRoute,
    Implementations,
    OverloadCall,
    BoundedDepth,
    AliasedImport,
    CallSite,
    DynamicProperty,
    DynamicDispatch,
    Unknown,
}

pub(crate) fn classify(task: &str) -> TaskIntent {
    let terms = Terms::new(task);
    let candidates = [
        (
            TaskIntent::DecoratedRoute,
            terms.groups(&[
                &["route", "endpoint", "маршрут"],
                &["decorat", "annotat", "декорат", "аннотир"],
            ]),
        ),
        (
            TaskIntent::Implementations,
            terms.groups(&[
                &["implementation", "concrete", "реализац"],
                &[
                    "call",
                    "invocation",
                    "receive",
                    "handle",
                    "вызов",
                    "получ",
                    "обработ",
                ],
            ]),
        ),
        (
            TaskIntent::OverloadCall,
            terms.groups(&[
                &["overload", "signature", "перегруз", "сигнатур"],
                &["call", "invocation", "select", "вызов", "аргумент"],
            ]),
        ),
        (
            TaskIntent::BoundedDepth,
            terms.groups(&[
                &["depth", "глубин"],
                &["bound", "limit", "travers", "предел", "огранич", "обход"],
            ]),
        ),
        (
            TaskIntent::AliasedImport,
            terms.groups(&[&["alias", "псевдоним"], &["import", "импорт"]]),
        ),
        (
            TaskIntent::CallSite,
            terms.groups(&[
                &["where", "где", "каких", "мест"],
                &["call", "called", "invoke", "вызов", "вызыва"],
            ]),
        ),
        (
            TaskIntent::DynamicProperty,
            terms.groups(&[
                &["dynamic", "computed", "динамическ", "вычисля"],
                &["property", "member", "свойств", "член"],
            ]),
        ),
        (
            TaskIntent::DynamicDispatch,
            terms.groups(&[
                &[
                    "runtime",
                    "protocol",
                    "dispatch",
                    "рантайм",
                    "протокол",
                    "диспетчер",
                ],
                &[
                    "call",
                    "invocation",
                    "replace",
                    "resolve",
                    "вызов",
                    "замен",
                    "разреш",
                    "выбран",
                ],
            ]),
        ),
    ];

    let mut matches = candidates
        .into_iter()
        .filter_map(|(intent, matched)| matched.then_some(intent));
    match (matches.next(), matches.next(), matches.next()) {
        (Some(intent), None, None) => intent,
        (Some(TaskIntent::Implementations), Some(TaskIntent::DynamicDispatch), None) => {
            TaskIntent::DynamicDispatch
        }
        _ => TaskIntent::Unknown,
    }
}

struct Terms(Vec<String>);

impl Terms {
    fn new(task: &str) -> Self {
        let normalized: String = task
            .to_lowercase()
            .chars()
            .map(|character| {
                if character.is_alphanumeric() {
                    character
                } else {
                    ' '
                }
            })
            .collect();
        Self(normalized.split_whitespace().map(str::to_owned).collect())
    }

    fn groups(&self, groups: &[&[&str]]) -> bool {
        groups.iter().all(|group| {
            self.0
                .iter()
                .any(|term| group.iter().any(|prefix| term.starts_with(prefix)))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::{TaskIntent, classify};

    #[test]
    fn unrelated_text_stays_unknown() {
        assert_eq!(
            classify("Explain how this module formats log messages"),
            TaskIntent::Unknown
        );
    }

    #[test]
    fn classifies_holdouts_for_every_specialized_intent() {
        let cases = [
            (
                "Какой обработчик у маршрута с декоратором?",
                TaskIntent::DecoratedRoute,
            ),
            (
                "Какие конкретные реализации принимают этот вызов?",
                TaskIntent::Implementations,
            ),
            (
                "Which invocation selects the numeric signature?",
                TaskIntent::OverloadCall,
            ),
            (
                "Что находится за пределом глубины обхода?",
                TaskIntent::BoundedDepth,
            ),
            (
                "Покажи обращение через псевдоним импортированного символа",
                TaskIntent::AliasedImport,
            ),
            ("В каких местах вызывается target?", TaskIntent::CallSite),
            (
                "Show the computed member invocation",
                TaskIntent::DynamicProperty,
            ),
            (
                "Какая реализация протокола будет выбрана во время выполнения?",
                TaskIntent::DynamicDispatch,
            ),
        ];

        for (task, expected) in cases {
            assert_eq!(classify(task), expected, "task: {task}");
        }
    }

    #[test]
    fn multiple_matching_intents_fail_closed() {
        for task in [
            "Compare the decorated route endpoint and the aliased import",
            "Find the overload call and the dynamic property member invocation",
            "Сравни маршрут с декоратором и импорт через псевдоним",
        ] {
            assert_eq!(classify(task), TaskIntent::Unknown, "task: {task}");
        }
    }

    #[test]
    fn protocol_runtime_dispatch_dominates_generic_implementation_wording() {
        assert_eq!(
            classify("Which runtime implementation receives the protocol call?"),
            TaskIntent::DynamicDispatch
        );
    }

    #[test]
    fn deterministic_case_and_punctuation_fuzz_preserves_unique_intents() {
        let cases = [
            ("decorated route", TaskIntent::DecoratedRoute),
            ("implementation call", TaskIntent::Implementations),
            ("overload call", TaskIntent::OverloadCall),
            ("bounded traversal depth", TaskIntent::BoundedDepth),
            ("aliased import", TaskIntent::AliasedImport),
            ("where is target called", TaskIntent::CallSite),
            ("dynamic property", TaskIntent::DynamicProperty),
            ("protocol call", TaskIntent::DynamicDispatch),
            ("маршрут с декоратором", TaskIntent::DecoratedRoute),
            ("реализация получает вызов", TaskIntent::Implementations),
            ("вызов перегрузки", TaskIntent::OverloadCall),
            ("глубина ограниченного обхода", TaskIntent::BoundedDepth),
            ("псевдоним импорта", TaskIntent::AliasedImport),
            ("где вызывается target", TaskIntent::CallSite),
            ("динамическое свойство", TaskIntent::DynamicProperty),
            ("вызов протокола", TaskIntent::DynamicDispatch),
        ];

        for (task, expected) in cases {
            for separator in [" ", "-", ".", "/", "::", "___"] {
                let variant = format!(
                    "!!!{}???",
                    task.split_whitespace().collect::<Vec<_>>().join(separator)
                );
                assert_eq!(classify(&variant), expected, "task: {variant}");
                let uppercase = variant.to_uppercase();
                assert_eq!(classify(&uppercase), expected, "task: {uppercase}");
            }
        }
    }
}
