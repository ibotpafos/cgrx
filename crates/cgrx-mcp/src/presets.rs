//! Toolset presets for the CGRX MCP server.
//!
//! Three presets control which tools are exposed to the client:
//!
//! | Preset    | Tools                                                                                     |
//! |-----------|-------------------------------------------------------------------------------------------|
//! | `minimal` | Read/search only: `status`, `search_graph`, `get_outline`, `trace_path`, `find_usages`,   |
//! |           | `get_code_snippet`, `check_index_coverage`, `check_framework_gates`                           |
//! | `standard`|`minimal` + `orient`, `expand`, `get_architecture` (default)                               |
//! | `full`    | All tools including `scan_risks`, `check_change_gates`, `check_repository_gates`,          |
//! |           | `ingest_runtime_evidence`, `find_similar`, `suggest_refactors`, `check_framework_gates`   |

use serde::Deserialize;
use std::str::FromStr;

/// The set of tools exposed by the MCP server.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Toolset {
    /// Read/search tools only.
    Minimal,
    /// `minimal` + orient/expand/architecture.
    Standard,
    /// All tools.
    Full,
}

impl Default for Toolset {
    fn default() -> Self {
        Self::Standard
    }
}

impl Toolset {
    /// All tool names included in this preset.
    #[must_use]
    pub const fn names(self) -> &'static [&'static str] {
        match self {
            Self::Minimal => &[
                "status",
                "search_graph",
                "get_outline",
                "trace_path",
                "find_usages",
                "get_code_snippet",
                "check_index_coverage",
                "check_framework_gates",
                "check_security_gates",
            ],
            Self::Standard => &[
                "status",
                "search_graph",
                "get_outline",
                "trace_path",
                "find_usages",
                "get_code_snippet",
                "check_index_coverage",
                "orient",
                "expand",
                "get_architecture",
                "check_framework_gates",
                "check_security_gates",
            ],
            Self::Full => &[
                "status",
                "search_graph",
                "get_outline",
                "trace_path",
                "find_usages",
                "get_code_snippet",
                "check_index_coverage",
                "orient",
                "expand",
                "get_architecture",
                "scan_risks",
                "check_change_gates",
                "check_repository_gates",
                "ingest_runtime_evidence",
                "find_similar",
                "suggest_refactors",
                "check_framework_gates",
                "check_security_gates",
            ],
        }
    }

    /// Returns `true` if the given tool is enabled in this preset.
    #[must_use]
    pub fn allows(self, tool: &str) -> bool {
        self.names().contains(&tool)
    }

    /// Human-readable label for the preset.
    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Minimal => "minimal",
            Self::Standard => "standard",
            Self::Full => "full",
        }
    }
}

impl FromStr for Toolset {
    type Err = String;

    fn from_str(input: &str) -> Result<Self, Self::Err> {
        match input.trim().to_ascii_lowercase().as_str() {
            "minimal" => Ok(Self::Minimal),
            "standard" => Ok(Self::Standard),
            "full" => Ok(Self::Full),
            other => Err(format!("unknown toolset preset: {other}")),
        }
    }
}

impl<'de> Deserialize<'de> for Toolset {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let input = String::deserialize(deserializer)?;
        Self::from_str(&input).map_err(serde::de::Error::custom)
    }
}

impl std::fmt::Display for Toolset {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.label())
    }
}

/// Parse a [`Toolset`] from an environment variable or CLI argument, falling back
/// to a default when unset.
///
/// The `env_first` argument is checked first (e.g. `CGRX_TOOLSET`); if it is
/// unset or empty, `cli_value` (e.g. `--toolset standard`) is used. If neither
/// is provided, the default is `Standard`.
#[must_use]
pub fn resolve_toolset(env_value: Option<&str>, cli_value: Option<&str>) -> Toolset {
    if let Some(raw) = env_value {
        let value = raw.trim();
        if !value.is_empty() {
            return Toolset::from_str(value).unwrap_or_else(|error| {
                eprintln!("warning: {error}; falling back to standard");
                Toolset::Standard
            });
        }
    }
    if let Some(raw) = cli_value {
        return raw.parse().unwrap_or_else(|error| {
            eprintln!("warning: {error}; falling back to standard");
            Toolset::Standard
        });
    }
    Toolset::default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_is_standard() {
        assert_eq!(Toolset::default(), Toolset::Standard);
    }

    #[test]
    fn minimal_is_read_only() {
        let names = Toolset::Minimal.names();
        assert!(names.contains(&"status"));
        assert!(names.contains(&"search_graph"));
        assert!(names.contains(&"get_outline"));
        assert!(names.contains(&"trace_path"));
        assert!(names.contains(&"find_usages"));
        assert!(names.contains(&"get_code_snippet"));
        assert!(names.contains(&"check_index_coverage"));
        assert_eq!(names.len(), 9);
    }

    #[test]
    fn standard_includes_minimal_plus_navigation() {
        let names = Toolset::Standard.names();
        for minimal in Toolset::Minimal.names() {
            assert!(names.contains(minimal), "missing {minimal} in standard");
        }
        assert!(names.contains(&"orient"));
        assert!(names.contains(&"expand"));
        assert!(names.contains(&"get_architecture"));
        assert_eq!(names.len(), 12);
    }

    #[test]
    fn full_includes_everything() {
        let names = Toolset::Full.names();
        for standard in Toolset::Standard.names() {
            assert!(names.contains(standard), "missing {standard} in full");
        }
        assert!(names.contains(&"scan_risks"));
        assert!(names.contains(&"check_change_gates"));
        assert!(names.contains(&"check_repository_gates"));
        assert!(names.contains(&"ingest_runtime_evidence"));
        assert!(names.contains(&"find_similar"));
        assert!(names.contains(&"suggest_refactors"));
        assert_eq!(names.len(), 18);
    }

    #[test]
    fn allows_respects_preset() {
        assert!(Toolset::Minimal.allows("status"));
        assert!(!Toolset::Minimal.allows("scan_risks"));
        assert!(!Toolset::Minimal.allows("orient"));

        assert!(Toolset::Standard.allows("orient"));
        assert!(!Toolset::Standard.allows("scan_risks"));

        assert!(Toolset::Full.allows("scan_risks"));
        assert!(Toolset::Full.allows("suggest_refactors"));
    }

    #[test]
    fn parse_case_insensitive() {
        assert_eq!("minimal".parse::<Toolset>().unwrap(), Toolset::Minimal);
        assert_eq!("STANDARD".parse::<Toolset>().unwrap(), Toolset::Standard);
        assert_eq!("  full  ".parse::<Toolset>().unwrap(), Toolset::Full);
    }

    #[test]
    fn parse_invalid() {
        assert!("bogus".parse::<Toolset>().is_err());
        assert!("".parse::<Toolset>().is_err());
    }

    #[test]
    fn resolve_prefers_env_over_cli() {
        assert_eq!(
            resolve_toolset(Some("minimal"), Some("full")),
            Toolset::Minimal
        );
    }

    #[test]
    fn resolve_falls_back_to_cli() {
        assert_eq!(resolve_toolset(None, Some("full")), Toolset::Full);
    }

    #[test]
    fn resolve_defaults_to_standard() {
        assert_eq!(resolve_toolset(None, None), Toolset::Standard);
        assert_eq!(resolve_toolset(Some(""), None), Toolset::Standard);
    }

    #[test]
    fn resolve_invalid_env_falls_back() {
        assert_eq!(resolve_toolset(Some("bogus"), None), Toolset::Standard);
    }

    #[test]
    fn label_matches_name() {
        assert_eq!(Toolset::Minimal.label(), "minimal");
        assert_eq!(Toolset::Standard.label(), "standard");
        assert_eq!(Toolset::Full.label(), "full");
    }

    #[test]
    fn deserialize_from_string() {
        let t: Toolset = serde_json::from_str("\"minimal\"").unwrap();
        assert_eq!(t, Toolset::Minimal);
    }
}
