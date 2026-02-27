"""max rep baseline

Revision ID: 0001_maxrep_baseline
Revises:
Create Date: 2026-02-25
"""

from alembic import op
import sqlalchemy as sa


revision = '0001_maxrep_baseline'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tenants',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('slug', sa.String(120), nullable=False),
        sa.Column('brand_name', sa.String(120), nullable=False),
        sa.Column('primary_color', sa.String(20), nullable=True),
        sa.Column('secondary_color', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_tenants_slug', 'tenants', ['slug'], unique=True)

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(120), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(16), nullable=False),
        sa.Column('height_cm', sa.Float(), nullable=False),
        sa.Column('weight_kg', sa.Float(), nullable=False),
        sa.Column('activity_level', sa.String(20), nullable=False),
        sa.Column('goal', sa.String(20), nullable=False),
        sa.Column('current_phase', sa.String(40), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table(
        'auth_sessions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_id', sa.String(120), nullable=False),
        sa.Column('family_id', sa.String(120), nullable=False),
        sa.Column('refresh_token_hash', sa.String(255), nullable=False),
        sa.Column('refresh_jti', sa.String(120), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_auth_sessions_session_id', 'auth_sessions', ['session_id'], unique=True)

    op.create_table(
        'tenant_memberships',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('current_session_id', sa.Integer(), sa.ForeignKey('auth_sessions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tier', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('provider', sa.String(20), nullable=False),
        sa.Column('provider_customer_id', sa.String(120), nullable=True),
        sa.Column('provider_subscription_id', sa.String(120), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'subscription_features',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tier', sa.String(20), nullable=False),
        sa.Column('feature_key', sa.String(80), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False),
    )

    op.create_table(
        'fitness_profiles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bmr', sa.Float(), nullable=False),
        sa.Column('tdee', sa.Float(), nullable=False),
        sa.Column('calorie_target', sa.Float(), nullable=False),
        sa.Column('protein_g', sa.Float(), nullable=False),
        sa.Column('carbs_g', sa.Float(), nullable=False),
        sa.Column('fats_g', sa.Float(), nullable=False),
        sa.Column('fiber_g', sa.Float(), nullable=False),
        sa.Column('water_ml', sa.Float(), nullable=False),
        sa.Column('roadmap', sa.String(800), nullable=False),
        sa.Column('workout_schedule', sa.String(800), nullable=False),
        sa.Column('meals_plan', sa.String(1500), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'daily_tracking',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('calories_consumed', sa.Float(), nullable=False),
        sa.Column('protein_g', sa.Float(), nullable=False),
        sa.Column('carbs_g', sa.Float(), nullable=False),
        sa.Column('fats_g', sa.Float(), nullable=False),
        sa.Column('water_ml', sa.Float(), nullable=False),
        sa.Column('meals_completed', sa.Integer(), nullable=False),
        sa.Column('workout_completed', sa.Boolean(), nullable=False),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('sleep_hours', sa.Float(), nullable=False),
        sa.Column('consistency_score', sa.Float(), nullable=False),
        sa.Column('streak_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('kind', sa.String(40), nullable=False),
        sa.Column('title', sa.String(120), nullable=False),
        sa.Column('message', sa.String(255), nullable=False),
        sa.Column('channel', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'trainer_threads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('member_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('trainer_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'trainer_messages',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('thread_id', sa.Integer(), sa.ForeignKey('trainer_threads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sender_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'pdf_reports',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('period_label', sa.String(60), nullable=False),
        sa.Column('file_path', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'billing_events',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='SET NULL'), nullable=True),
        sa.Column('provider', sa.String(20), nullable=False),
        sa.Column('event_id', sa.String(120), nullable=False),
        sa.Column('event_type', sa.String(120), nullable=False),
        sa.Column('payload', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_billing_events_event_id', 'billing_events', ['event_id'], unique=True)

    op.create_table(
        'revoked_tokens',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('jti', sa.String(120), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_revoked_tokens_jti', 'revoked_tokens', ['jti'], unique=True)


def downgrade() -> None:
    op.drop_table('revoked_tokens')
    op.drop_table('billing_events')
    op.drop_table('pdf_reports')
    op.drop_table('trainer_messages')
    op.drop_table('trainer_threads')
    op.drop_table('notifications')
    op.drop_table('daily_tracking')
    op.drop_table('fitness_profiles')
    op.drop_table('subscription_features')
    op.drop_table('subscriptions')
    op.drop_table('tenant_memberships')
    op.drop_table('auth_sessions')
    op.drop_table('users')
    op.drop_table('tenants')
