WORKTREES := app/01_frontend:frontend app/02_backend:backend app/03_db:DataBase

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

clean_trees:
	git worktree prune && git worktree list

up:
	docker compose up -d --build --wait

down:
	docker compose down

clean:
	@echo "Chiusura container e cancellazione volumi..." && sleep 5 &&	docker compose down -v

fclean:
	docker system prune -af

re: down all

ps:
	docker compose ps

logs:
	docker compose logs -f

db:
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

.PHONY: all setup status clean_trees up down re ps logs db fclean
