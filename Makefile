WORKTREES := app/01_frontend:frontend app/02_backend:backend app/03_db:DataBase
DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml

all : setup up

setup:
	@git fetch --quiet origin || echo "Fetch fallito, qualcosa non va?"
	@for wt in $(WORKTREES); do \
		dir=$${wt%%:*}; \
		branch=$${wt##*:}; \
		if [ -e "$$dir/.git" ]; then \
		 	echo "$$dir: già presente"; \
		else \
			git worktree add "$$dir" "$$branch" || exit 1; \
		fi; \
	done

status:
	@for wt in $(WORKTREES); do \
		dir=$${wt%%:*}; \
		echo "== $$dir"; \
		git -C "$$dir" status --branch; \
	done

pull:
	git -C app/01_frontend pull
	git -C app/02_backend pull
	git -C app/03_db pull

dev: setup
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

dev_restart:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml restart frontend backend

clean_trees:
	git worktree prune && git worktree list

up:
	docker compose up -d --build --wait

down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

clean:
	@echo "Stai per cancellare i volumi, questo significa dati db."
	@echo "Premi Invio per continuare o Ctrl+C per annullare."
	@read confirm
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

fclean:
	@echo "Stai per cancellare TUTTO, volumi e container"
	@echo "Premi Invio per continuare o Ctrl+C per annullare."
	@read confirm
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
	docker system prune -af

re: down all

ps:
	docker compose ps

logs:
	docker compose logs -f

db:
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

.PHONY: all dev dev_restart setup status pull clean_trees up down clean re ps logs db fclean
