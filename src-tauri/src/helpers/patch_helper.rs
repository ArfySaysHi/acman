use std::fs;
use std::path::{Path, PathBuf};
use wow_mpq::ArchiveBuilder;

fn add_directory(
    builder: ArchiveBuilder,
    base_path: &Path,
    current_path: &Path,
) -> Result<ArchiveBuilder, Box<dyn std::error::Error>> {
    let mut builder = builder;

    for entry in fs::read_dir(current_path)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            builder = add_directory(builder, base_path, &path)?;
        } else {
            let data = fs::read(&path)?;
            let relative_path = path.strip_prefix(base_path)?;
            let mpq_path = relative_path.to_string_lossy().replace("/", "\\");

            builder = builder.add_file_data(data, &mpq_path);
        }
    }

    Ok(builder)
}

pub fn path_to_mpq(input_dir: PathBuf, output_path: PathBuf) -> Result<(), String> {
    if !input_dir.is_dir() {
        return Err(format!(
            "Input path is not a directory: {}",
            input_dir.display()
        ));
    }
    let builder = ArchiveBuilder::new();
    let builder = add_directory(builder, &input_dir, &input_dir).map_err(|e| e.to_string())?;

    builder.build(&output_path).map_err(|e| e.to_string())?;

    Ok(())
}
