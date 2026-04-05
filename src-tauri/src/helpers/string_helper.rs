use regex::Regex;

pub fn strip_ansi(s: &str) -> String {
    let re = Regex::new(r"\x1b\[[0-?]*[ -/]*[@-~]").unwrap();
    re.replace_all(s, "").into_owned()
}
