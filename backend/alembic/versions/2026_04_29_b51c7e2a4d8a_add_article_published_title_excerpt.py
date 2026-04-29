"""add_article_published_title_excerpt

Revision ID: b51c7e2a4d8a
Revises: c3f8a1b9d2e1
Create Date: 2026-04-29 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b51c7e2a4d8a"
down_revision: Union[str, Sequence[str], None] = "c3f8a1b9d2e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Aggiunge articles.published_title e articles.published_excerpt.

    Servono per pubblicare su WordPress una versione riformulata di titolo
    e contenuto (estratto), evitando di replicare il testo originale per
    ragioni legali/copyright. La pubblicazione finale aggiunge una CTA al
    link dell'articolo sorgente.
    """
    with op.batch_alter_table("articles", schema=None) as batch_op:
        batch_op.add_column(sa.Column("published_title", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("published_excerpt", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("articles", schema=None) as batch_op:
        batch_op.drop_column("published_excerpt")
        batch_op.drop_column("published_title")
