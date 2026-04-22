from pydantic import BaseModel


class ScrapingSettings(BaseModel):
    max_concurrent_requests: int = 5
    request_timeout_seconds: int = 30
    user_agent: str = "GSI-Bot/1.0"
    respect_robots_txt: bool = True


class DedupSettings(BaseModel):
    similarity_threshold: float = 0.85
    use_content_hash: bool = True
    use_semantic_similarity: bool = True


class BlacklistCreate(BaseModel):
    domain: str
    reason: str | None = None


class BlacklistResponse(BaseModel):
    id: int
    domain: str
    reason: str | None = None
    added_by: int | None = None

    model_config = {"from_attributes": True}
