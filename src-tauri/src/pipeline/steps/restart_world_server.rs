use crate::pipeline::{context::DeployContext, step::DeployStep};
use async_trait::async_trait;
use std::process::Command;
use tracing::info;

pub struct RestartWorldserver;

#[async_trait]
impl DeployStep for RestartWorldserver {
    fn name(&self) -> &str {
        "Restart Worldserver"
    }

    async fn execute(&self, ctx: &DeployContext) -> Result<(), String> {
        info!("Restarting worldserver");

        let output = Command::new("docker")
            .args(["compose", "restart", "ac-worldserver"])
            .current_dir(&ctx.server_path)
            .output()
            .map_err(|e| format!("Failed to invoke docker compose: {e}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Docker restart failed: {stderr}"));
        }

        info!("Worldserver restarted successfully");
        Ok(())
    }
}
