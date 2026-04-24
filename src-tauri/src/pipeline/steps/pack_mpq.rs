use crate::helpers::mpq;
use crate::pipeline::{context::DeployContext, step::DeployStep};
use async_trait::async_trait;
use tracing::info;

pub struct PackMpqStep;

#[async_trait]
impl DeployStep for PackMpqStep {
    fn name(&self) -> &str {
        "Pack MPQ"
    }

    async fn execute(&self, ctx: &DeployContext) -> Result<(), String> {
        info!(project = %ctx.project_name, "Packing MPQ");

        let input_path = ctx.noggit_projects_path.join(&ctx.project_name);
        let output_path = std::env::temp_dir().join(&ctx.patch_name);
        info!(output = %output_path.display(), "MPQ packing location");

        let output = mpq::pack_directory(input_path, output_path);
        info!("MPQ packed successfully");

        output
    }
}
