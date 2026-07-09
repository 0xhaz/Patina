"""Central config, env-driven. One place to confirm DashScope IDs / endpoints."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Qwen / DashScope (Singapore)
    dashscope_api_key: str = ""
    dashscope_base_url: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

    # Model IDs — confirm exact values in the Model Studio console.
    qwen_backbone_model: str = "qwen3.7-plus"
    qwen_ocr_model: str = "qwen-vl-ocr"
    qwen_flash_model: str = "qwen-flash"
    qwen_embed_model: str = "text-embedding-v4"

    # Database
    database_url: str = "postgresql://patina:patina@localhost:5433/patina"

    @property
    def has_key(self) -> bool:
        return bool(self.dashscope_api_key.strip())


settings = Settings()
