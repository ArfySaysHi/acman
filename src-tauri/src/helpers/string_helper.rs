use regex::Regex;
use std::sync::OnceLock;

static ANSI_RE: OnceLock<Regex> = OnceLock::new();

pub fn strip_ansi(s: &str) -> String {
    let re = ANSI_RE.get_or_init(|| Regex::new(r"\x1b\[[0-?]*[ -/]*[@-~]").unwrap());
    re.replace_all(s, "").into_owned()
}
