use crate::{
    helpers::docker::dbc_name_map,
    pipeline::{context::DeployContext, step::DeployStep},
};
use async_trait::async_trait;
use bollard::body_full;
use bollard::query_parameters::UploadToContainerOptionsBuilder;
use bytes::Bytes;
use futures_util::TryFutureExt;
use tracing::info;

pub struct DeployDbcToServerStep;

#[async_trait]
impl DeployStep for DeployDbcToServerStep {
    fn name(&self) -> &str {
        "Deploy Dbc To Server"
    }

    async fn execute(&self, ctx: &DeployContext) -> Result<(), String> {
        info!(server_path = %ctx.server_path.display(), "Deploying dbcs to server");
        let dbc_dir = &ctx
            .noggit_projects_path
            .join(&ctx.project_name)
            .join("dbfilesclient/");
        info!(input_path=%dbc_dir.display(), "DBC dir path");

        let dbc_reader =
            std::fs::read_dir(dbc_dir).map_err(|e| format!("Failed to read directory: {e}"))?;
        let dbc_paths: Vec<std::path::PathBuf> = dbc_reader
            .map(|file| file.map_err(|e| format!("Failed to read directory entry: {e}")))
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .map(|entry| entry.path())
            .filter(|path| {
                path.extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| ext.eq_ignore_ascii_case("dbc"))
                    .unwrap_or(false)
            })
            .collect();
        let name_map = dbc_name_map();

        let mut builder = tar::Builder::new(Vec::new());

        for path in dbc_paths {
            let file_name = path.file_name().ok_or("Failed to get file name")?;

            if let Some(hash_name) = file_name.to_str().and_then(|f| name_map.get(f)) {
                builder
                    .append_path_with_name(&path, hash_name)
                    .map_err(|e| format!("Failed to append renamed path to tar: {e}"))?;
            } else {
                builder
                    .append_path_with_name(&path, file_name)
                    .map_err(|e| format!("Failed to append path to tar: {e}"))?;
            }
        }

        let tarball = builder
            .into_inner()
            .map_err(|e| format!("Failed to build tar: {e}"))?;

        let options = UploadToContainerOptionsBuilder::new()
            .path("/azerothcore/env/dist/data/dbc/")
            .build();

        ctx.docker
            .upload_to_container(
                "ac-worldserver",
                Some(options),
                body_full(Bytes::from(tarball)),
            )
            .map_err(|e| format!("Failed to upload to ac-worldserver, in your docker-compose.yml is your client data volume marked with :ro?: {e}"))
            .await?;
        info!("Deployed map dbc successfully");

        Ok(())
    }
}
