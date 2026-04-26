use crate::pipeline::context::DeployContext;
use crate::pipeline::step::DeployStep;
use async_trait::async_trait;
use tracing::info;

pub struct DeployNoggitProjectToClientStep;

#[async_trait]
impl DeployStep for DeployNoggitProjectToClientStep {
    fn name(&self) -> &str {
        "Deploy Noggit Project To Client"
    }

    async fn execute(&self, ctx: &DeployContext) -> Result<(), String> {
        info!(project = %ctx.client_path.display(), "Deploying to client");
        let patch_path = std::env::temp_dir().join(&ctx.patch_name);
        let output_path = &ctx.client_path.join(format!("Data/{}", &ctx.patch_name));
        std::fs::copy(&patch_path, output_path).map_err(|e| {
            format!("Failed to copy the patch from the temporary directory to the client: {e}")
        })?;
        std::fs::remove_file(&patch_path)
            .map_err(|e| format!("Failed to cleanup the temporary patch file: {e}"))?;
        info!("Deployed patch to client");

        Ok(())
    }
}
