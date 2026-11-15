DEV_COMPOSE := docker compose -f docker-compose.yml -f docker-compose.dev.yml
OWNER := $(shell id -u):$(shell id -g)
GPU_COMPOSE := $(DEV_COMPOSE) -f docker-compose.gpu.yml
PROD_GPU_COMPOSE := docker compose -f docker-compose.yml -f docker-compose.gpu.yml
NO_LLM = $(shell $(DEV_COMPOSE) config --services 2>/dev/null | grep -vx ollama)

all : up

all_gpu:
	$(PROD_GPU_COMPOSE) up -d --build --wait

dev:
	$(DEV_COMPOSE) up -d --build

dev_restart:
	$(DEV_COMPOSE) restart frontend backend

up:
	docker compose up -d --build --wait

down:
	$(DEV_COMPOSE) down

migration:
	@test -n "$(name)" || { echo "Uso: make migration name=nome_della_migration"; exit 1; }
	$(DEV_COMPOSE) exec backend sh -c 'pnpm exec prisma migrate dev --create-only --name $(name); status=$$?; chown -R $(OWNER) prisma; exit $$status'

migrate:
	$(DEV_COMPOSE) exec backend sh -c 'pnpm exec prisma migrate dev && npx prisma generate; status=$$?; chown -R $(OWNER) prisma lib/generated; exit $$status'

migrate_status:
	$(DEV_COMPOSE) exec backend pnpm exec prisma migrate status

dev_gpu:
	$(GPU_COMPOSE) up -d --build

llm_pull:
	$(DEV_COMPOSE) exec ollama ollama pull $${OLLAMA_MODEL:-qwen3:8b}

clean:
	@echo "Stai per cancellare i volumi, questo significa dati db. (Ollama e i modelli restano)"
	@echo "Premi Invio per continuare o Ctrl+C per annullare."
	@read confirm
	$(DEV_COMPOSE) rm -sfv $(NO_LLM)
	docker volume ls -q --filter label=com.docker.compose.project=terranova \
		| grep -vx terranova_ollama_models | xargs -r docker volume rm

fclean:
	@echo "Stai per cancellare TUTTO, volumi e container (tranne Ollama e i modelli)"
	@echo "Premi Invio per continuare o Ctrl+C per annullare."
	@read confirm
	$(DEV_COMPOSE) rm -sfv $(NO_LLM)
	docker volume ls -q --filter label=com.docker.compose.project=terranova \
		| grep -vx terranova_ollama_models | xargs -r docker volume rm
	docker container prune -f --filter "label!=com.docker.compose.service=ollama"
	docker image prune -af
	docker builder prune -af
	docker network prune -f

re: down all

ps:
	docker compose ps

logs:
	docker compose logs -f

db:
	docker compose exec db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

.PHONY: all all_gpu dev dev_restart up down clean re ps logs db fclean migration migrate migrate_status dev_gpu llm_pull
