WORKTREES := 01_frontend:frontend 02_backend:backend 03_db:DataBase

all : setup

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

.PHONY: all setup status