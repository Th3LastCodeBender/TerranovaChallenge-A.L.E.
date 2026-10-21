DB_USER ?= ale
DB_NAME ?= terranova

all:
	docker compose up -d

visible:
	docker compose up

ps:
	docker compose ps

enter_db:
	docker compose exec db psql -U $(DB_USER) -d $(DB_NAME)

down:
	docker compose down

clean:
	docker compose down -v

re: clean
	$(MAKE) all

.PHONY: all visible down clean re
