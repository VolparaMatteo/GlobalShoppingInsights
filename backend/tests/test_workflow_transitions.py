"""Test completo della state machine del workflow articoli.

Copre:
- Consistenza tra WORKFLOW_TRANSITIONS e TRANSITION_ROLES
- Happy path (admin percorre l'intero workflow)
- Ruolo insufficiente rifiutato
- Transizioni invalide (skip non consentiti)
- Modalità force=true (bypass + controllo ruolo)
- GET /transitions restituisce solo transizioni permesse all'utente
- Persistenza dello status nel DB
"""

from __future__ import annotations

from app.api.articles import TRANSITION_ROLES, WORKFLOW_TRANSITIONS


# ======================================================================
# Sanity check sulle mappe
# ======================================================================


def test_every_workflow_transition_has_role_entry() -> None:
    """Ogni (from, to) in WORKFLOW_TRANSITIONS deve avere voce in TRANSITION_ROLES."""
    missing = []
    for source, targets in WORKFLOW_TRANSITIONS.items():
        for target in targets:
            if (source, target) not in TRANSITION_ROLES:
                missing.append((source, target))
    assert not missing, f"Transizioni senza ruoli autorizzati: {missing}"


def test_every_role_entry_has_workflow_transition() -> None:
    """Ogni chiave (from, to) in TRANSITION_ROLES deve esistere in WORKFLOW_TRANSITIONS."""
    orphans = []
    for (source, target) in TRANSITION_ROLES:
        if source not in WORKFLOW_TRANSITIONS or target not in WORKFLOW_TRANSITIONS[source]:
            orphans.append((source, target))
    assert not orphans, f"TRANSITION_ROLES con transizioni non definite: {orphans}"


# ======================================================================
# Happy path
# ======================================================================


def test_admin_can_walk_the_full_workflow(client, user_factory, headers_for, article_factory) -> None:
    user_factory(role="admin", email="adm@test.com")
    h = headers_for("adm@test.com")
    a = article_factory(status="imported")

    steps = ["screened", "in_review", "approved", "scheduled", "publishing", "published"]
    for next_status in steps:
        r = client.post(
            f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": next_status}
        )
        assert r.status_code == 200, f"Fallito a → {next_status}: {r.text}"

    final = client.get(f"/api/v1/articles/{a.id}", headers=h)
    assert final.json()["status"] == "published"


# ======================================================================
# Ruoli
# ======================================================================


def test_contributor_can_screen_imported(client, user_factory, headers_for, article_factory) -> None:
    user_factory(role="contributor", email="con@test.com")
    h = headers_for("con@test.com")
    a = article_factory(status="imported")

    r = client.post(f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": "screened"})
    assert r.status_code == 200


def test_contributor_cannot_approve(client, user_factory, headers_for, article_factory) -> None:
    """in_review → approved richiede reviewer o admin."""
    user_factory(role="contributor", email="con@test.com")
    h = headers_for("con@test.com")
    a = article_factory(status="in_review")

    r = client.post(f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": "approved"})
    assert r.status_code == 403
    assert "Insufficient" in r.json()["detail"]


def test_editor_cannot_approve(client, user_factory, headers_for, article_factory) -> None:
    """Editor NON è in TRANSITION_ROLES per in_review→approved (solo reviewer/admin)."""
    user_factory(role="editor", email="ed@test.com")
    h = headers_for("ed@test.com")
    a = article_factory(status="in_review")

    r = client.post(f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": "approved"})
    assert r.status_code == 403


def test_reviewer_can_approve(client, user_factory, headers_for, article_factory) -> None:
    user_factory(role="reviewer", email="rev@test.com")
    h = headers_for("rev@test.com")
    a = article_factory(status="in_review")

    r = client.post(f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": "approved"})
    assert r.status_code == 200


def test_only_admin_can_trigger_publishing(client, user_factory, headers_for, article_factory) -> None:
    """scheduled → publishing è admin-only."""
    user_factory(role="editor", email="ed@test.com")
    user_factory(role="reviewer", email="rev@test.com")

    for email in ("ed@test.com", "rev@test.com"):
        a = article_factory(status="scheduled")
        h = headers_for(email)
        r = client.post(
            f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": "publishing"}
        )
        assert r.status_code == 403, f"{email} NON dovrebbe poter pubblicare"


def test_readonly_cannot_change_status_at_all(client, user_factory, headers_for, article_factory) -> None:
    """Un read_only non è in nessun TRANSITION_ROLES."""
    user_factory(role="read_only", email="ro@test.com")
    h = headers_for("ro@test.com")
    a = article_factory(status="imported")

    r = client.post(f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": "screened"})
    assert r.status_code == 403


# ======================================================================
# Transizioni invalide
# ======================================================================


def test_cannot_skip_workflow_directly(client, user_factory, headers_for, article_factory) -> None:
    """imported → approved (salta screened/in_review) → rifiutato."""
    user_factory(role="admin", email="adm@test.com")
    h = headers_for("adm@test.com")
    a = article_factory(status="imported")

    r = client.post(f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": "approved"})
    assert r.status_code == 400
    assert "Cannot transition" in r.json()["detail"]


def test_cannot_go_backwards_from_published(client, user_factory, headers_for, article_factory) -> None:
    """Dopo published non c'è nessuna transizione definita (stato terminale)."""
    user_factory(role="admin", email="adm@test.com")
    h = headers_for("adm@test.com")
    a = article_factory(status="published")

    r = client.post(f"/api/v1/articles/{a.id}/status", headers=h, json={"new_status": "scheduled"})
    assert r.status_code == 400


# ======================================================================
# Force mode
# ======================================================================


def test_force_bypass_with_admin(client, user_factory, headers_for, article_factory) -> None:
    """Admin con force=true può saltare direttamente a un qualsiasi status valido."""
    user_factory(role="admin", email="adm@test.com")
    h = headers_for("adm@test.com")
    a = article_factory(status="imported")

    r = client.post(
        f"/api/v1/articles/{a.id}/status?force=true",
        headers=h,
        json={"new_status": "published"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "published"


def test_force_rejected_for_contributor(client, user_factory, headers_for, article_factory) -> None:
    user_factory(role="contributor", email="con@test.com")
    h = headers_for("con@test.com")
    a = article_factory(status="imported")

    r = client.post(
        f"/api/v1/articles/{a.id}/status?force=true",
        headers=h,
        json={"new_status": "published"},
    )
    assert r.status_code == 403
    assert "editor" in r.json()["detail"].lower()


def test_force_rejects_invalid_status(client, user_factory, headers_for, article_factory) -> None:
    user_factory(role="admin", email="adm@test.com")
    h = headers_for("adm@test.com")
    a = article_factory(status="imported")

    r = client.post(
        f"/api/v1/articles/{a.id}/status?force=true",
        headers=h,
        json={"new_status": "garbage"},
    )
    assert r.status_code == 400
    assert "Invalid status" in r.json()["detail"]


# ======================================================================
# GET /transitions
# ======================================================================


def test_transitions_admin_sees_all(client, user_factory, headers_for, article_factory) -> None:
    user_factory(role="admin", email="adm@test.com")
    h = headers_for("adm@test.com")
    a = article_factory(status="in_review")

    r = client.get(f"/api/v1/articles/{a.id}/transitions", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["from"] == "in_review"
    assert set(body["allowed"]) == {"approved", "rejected", "screened"}


def test_transitions_contributor_sees_empty_when_out_of_scope(
    client, user_factory, headers_for, article_factory,
) -> None:
    """Contributor su in_review: nessuna transizione disponibile per quel ruolo."""
    user_factory(role="contributor", email="con@test.com")
    h = headers_for("con@test.com")
    a = article_factory(status="in_review")

    r = client.get(f"/api/v1/articles/{a.id}/transitions", headers=h)
    assert r.status_code == 200
    assert r.json()["allowed"] == []


def test_transitions_contributor_sees_screened_when_imported(
    client, user_factory, headers_for, article_factory,
) -> None:
    user_factory(role="contributor", email="con@test.com")
    h = headers_for("con@test.com")
    a = article_factory(status="imported")

    r = client.get(f"/api/v1/articles/{a.id}/transitions", headers=h)
    assert r.status_code == 200
    # Contributor è autorizzato solo per imported→screened
    assert set(r.json()["allowed"]) == {"screened"}


# ======================================================================
# Persistenza
# ======================================================================


def test_status_change_persists_in_db(
    client, user_factory, headers_for, article_factory, db,
) -> None:
    from app.models.article import Article

    user_factory(role="admin", email="adm@test.com")
    h = headers_for("adm@test.com")
    a = article_factory(status="imported")
    article_id = a.id

    client.post(
        f"/api/v1/articles/{article_id}/status", headers=h, json={"new_status": "screened"}
    )

    db.expire_all()
    refreshed = db.query(Article).filter(Article.id == article_id).first()
    assert refreshed is not None
    assert refreshed.status == "screened"
