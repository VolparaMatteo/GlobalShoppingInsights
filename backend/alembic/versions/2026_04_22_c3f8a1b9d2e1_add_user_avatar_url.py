"""add_user_avatar_url

Revision ID: c3f8a1b9d2e1
Revises: a44dfb48a9a0
Create Date: 2026-04-22 16:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3f8a1b9d2e1"
down_revision: Union[str, Sequence[str], None] = "a44dfb48a9a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Aggiunge users.avatar_url (nullable) per self-service profile avatar."""
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("avatar_url", sa.String(length=255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("avatar_url")
