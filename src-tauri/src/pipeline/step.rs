use crate::pipeline::context::DeployContext;
use async_trait::async_trait;

#[async_trait]
pub trait DeployStep: Send + Sync {
    async fn execute(&self, ctx: &DeployContext) -> Result<(), String>;
    fn name(&self) -> &str;
}
