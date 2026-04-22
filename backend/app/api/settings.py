from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.database import get_db
from app.models.blacklist import BlockedDomain
from app.models.user import User
from app.models.wordpress import WPConfig
from app.schemas.common import MessageResponse
from app.schemas.settings import BlacklistCreate, BlacklistResponse, DedupSettings, ScrapingSettings
from app.schemas.wordpress import WPConfigResponse, WPConfigUpdate
from app.utils import audit
from app.utils.encryption import encrypt

router = APIRouter(prefix="/settings", tags=["settings"])

# In-memory settings for scraping/dedup (persisted in a real app via DB or file)
_scraping_settings = ScrapingSettings()
_dedup_settings = DedupSettings()


@router.get("/wordpress", response_model=WPConfigResponse)
def get_wp_config(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(["admin"])),
):
    config = db.query(WPConfig).filter(WPConfig.id == 1).first()
    if not config:
        return WPConfigResponse()
    return WPConfigResponse(
        wp_url=config.wp_url,
        wp_username=config.wp_username,
        has_password=bool(config.wp_app_password_encrypted),
        default_author_id=config.default_author_id,
        last_sync_at=config.last_sync_at,
    )


@router.patch("/wordpress", response_model=WPConfigResponse)
def update_wp_config(
    body: WPConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    config = db.query(WPConfig).filter(WPConfig.id == 1).first()
    if not config:
        config = WPConfig(id=1)
        db.add(config)
    changed: list[str] = []
    if body.wp_url is not None and body.wp_url != config.wp_url:
        config.wp_url = body.wp_url
        changed.append("wp_url")
    if body.wp_username is not None and body.wp_username != config.wp_username:
        config.wp_username = body.wp_username
        changed.append("wp_username")
    if body.wp_app_password is not None:
        config.wp_app_password_encrypted = encrypt(body.wp_app_password)
        changed.append("wp_app_password")
    if body.default_author_id is not None and body.default_author_id != config.default_author_id:
        config.default_author_id = body.default_author_id
        changed.append("default_author_id")
    if changed:
        audit.emit(
            db,
            user_id=current_user.id,
            action="wp_config.update",
            entity="wp_config",
            metadata={"fields": changed},
        )
    db.commit()
    db.refresh(config)
    return WPConfigResponse(
        wp_url=config.wp_url,
        wp_username=config.wp_username,
        has_password=bool(config.wp_app_password_encrypted),
        default_author_id=config.default_author_id,
        last_sync_at=config.last_sync_at,
    )


@router.post("/wordpress/test", response_model=MessageResponse)
def test_wp_connection(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(["admin"])),  # noqa: PT019
):
    config = db.query(WPConfig).filter(WPConfig.id == 1).first()
    if not config or not config.wp_url:
        raise HTTPException(status_code=400, detail="WordPress not configured")
    return MessageResponse(message="Connection test placeholder - configure WP first")


# --- Blacklist ---
@router.get("/blacklist", response_model=list[BlacklistResponse])
def list_blacklist(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(["admin"])),
):
    return db.query(BlockedDomain).order_by(BlockedDomain.domain).all()


@router.post("/blacklist", response_model=BlacklistResponse, status_code=201)
def add_blacklist(
    body: BlacklistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    if db.query(BlockedDomain).filter(BlockedDomain.domain == body.domain).first():
        raise HTTPException(status_code=400, detail="Domain already blocked")
    blocked = BlockedDomain(domain=body.domain, reason=body.reason, added_by=current_user.id)
    db.add(blocked)
    db.commit()
    db.refresh(blocked)
    return blocked


@router.delete("/blacklist/{domain_id}", response_model=MessageResponse)
def remove_blacklist(
    domain_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(["admin"])),
):
    blocked = db.query(BlockedDomain).filter(BlockedDomain.id == domain_id).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="Domain not found")
    db.delete(blocked)
    db.commit()
    return MessageResponse(message="Domain removed from blacklist")


# --- Scraping settings ---
@router.get("/scraping", response_model=ScrapingSettings)
def get_scraping_settings(
    _current_user: User = Depends(require_role(["admin"])),
):
    return _scraping_settings


@router.patch("/scraping", response_model=ScrapingSettings)
def update_scraping_settings(
    body: ScrapingSettings,
    _current_user: User = Depends(require_role(["admin"])),
):
    global _scraping_settings
    _scraping_settings = body
    return _scraping_settings


# --- Dedup settings ---
@router.get("/dedup", response_model=DedupSettings)
def get_dedup_settings(
    _current_user: User = Depends(require_role(["admin"])),
):
    return _dedup_settings


@router.patch("/dedup", response_model=DedupSettings)
def update_dedup_settings(
    body: DedupSettings,
    _current_user: User = Depends(require_role(["admin"])),
):
    global _dedup_settings
    _dedup_settings = body
    return _dedup_settings
