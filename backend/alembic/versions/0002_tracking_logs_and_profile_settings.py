"""tracking logs and profile settings

Revision ID: 0002_track_profile
Revises: 0001_maxrep_baseline
Create Date: 2026-02-28
"""

from alembic import op
import sqlalchemy as sa


revision = '0002_track_profile'
down_revision = '0001_maxrep_baseline'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('photo_url', sa.String(length=500), nullable=True))
    op.add_column('users', sa.Column('weekday_sleep_hours', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('weekend_sleep_hours', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        'custom_food_items',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('calories_per_unit', sa.Float(), nullable=False),
        sa.Column('protein_per_unit', sa.Float(), nullable=False),
        sa.Column('carbs_per_unit', sa.Float(), nullable=False),
        sa.Column('fats_per_unit', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_custom_food_items_tenant_id', 'custom_food_items', ['tenant_id'])
    op.create_index('ix_custom_food_items_user_id', 'custom_food_items', ['user_id'])

    op.create_table(
        'meal_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('meal_type', sa.String(length=40), nullable=False),
        sa.Column('food_name', sa.String(length=120), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('calories', sa.Float(), nullable=False),
        sa.Column('protein_g', sa.Float(), nullable=False),
        sa.Column('carbs_g', sa.Float(), nullable=False),
        sa.Column('fats_g', sa.Float(), nullable=False),
        sa.Column('source', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_meal_logs_tenant_id', 'meal_logs', ['tenant_id'])
    op.create_index('ix_meal_logs_user_id', 'meal_logs', ['user_id'])
    op.create_index('ix_meal_logs_date', 'meal_logs', ['date'])

    op.create_table(
        'workout_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tenant_id', sa.Integer(), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('category', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('sets', sa.Integer(), nullable=True),
        sa.Column('reps', sa.Integer(), nullable=True),
        sa.Column('duration_minutes', sa.Float(), nullable=True),
        sa.Column('calories_burned_kcal', sa.Float(), nullable=False),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_workout_logs_tenant_id', 'workout_logs', ['tenant_id'])
    op.create_index('ix_workout_logs_user_id', 'workout_logs', ['user_id'])
    op.create_index('ix_workout_logs_date', 'workout_logs', ['date'])


def downgrade() -> None:
    op.drop_index('ix_workout_logs_date', table_name='workout_logs')
    op.drop_index('ix_workout_logs_user_id', table_name='workout_logs')
    op.drop_index('ix_workout_logs_tenant_id', table_name='workout_logs')
    op.drop_table('workout_logs')

    op.drop_index('ix_meal_logs_date', table_name='meal_logs')
    op.drop_index('ix_meal_logs_user_id', table_name='meal_logs')
    op.drop_index('ix_meal_logs_tenant_id', table_name='meal_logs')
    op.drop_table('meal_logs')

    op.drop_index('ix_custom_food_items_user_id', table_name='custom_food_items')
    op.drop_index('ix_custom_food_items_tenant_id', table_name='custom_food_items')
    op.drop_table('custom_food_items')

    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'weekend_sleep_hours')
    op.drop_column('users', 'weekday_sleep_hours')
    op.drop_column('users', 'photo_url')
