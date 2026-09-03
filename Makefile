.PHONY: db-upgrade db-downgrade db-migrate db-current db-history db-reset

db-upgrade: ## Apply all pending migrations
	cd backend && alembic upgrade head

db-downgrade: ## Roll back the latest migration
	cd backend && alembic downgrade -1

db-migrate: ## Generate a migration, usage: make db-migrate MSG="add users table"
	cd backend && alembic revision --autogenerate -m "$(MSG)"

db-current: ## Show current migration revision
	cd backend && alembic current

db-history: ## Show migration history
	cd backend && alembic history --verbose

db-reset: ## Drop all migration state and re-apply migrations; use only in local dev
	cd backend && alembic downgrade base && alembic upgrade head
