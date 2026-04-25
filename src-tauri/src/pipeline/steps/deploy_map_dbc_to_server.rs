use crate::pipeline::{context::DeployContext, step::DeployStep};
use async_trait::async_trait;
use tracing::info;

pub struct DeployMapDbcToServer;

#[async_trait]
impl DeployStep for DeployMapDbcToServer {
    fn name(&self) -> &str {
        "Deploy Map Dbc To Server"
    }

    async fn execute(&self, ctx: &DeployContext) -> Result<(), String> {
        info!(server_path = %ctx.server_path.display(), "Deploying map to server");
        // TODO: Should make this case insensitive at some point
        let map_dbc = &ctx
            .noggit_projects_path
            .join(&ctx.project_name)
            .join("dbfilesclient/map.dbc");
        info!(input_path=%map_dbc.display(), "Map dbc path");
        let output_path = &ctx.server_path.join("env/dist/data/dbc/Map.dbc");
        info!(output_path = %output_path.display(), "Output path generated");
        std::fs::copy(&map_dbc, &output_path)
            .map_err(|e| format!("Failed to copy dbc to the server folder: {e}"))?;
        info!("Deployed map dbc successfully");

        Ok(())
    }
}
