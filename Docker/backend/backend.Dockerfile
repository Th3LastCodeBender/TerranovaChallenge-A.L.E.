FROM node:24-alpine
WORKDIR /app

RUN apk add --no-cache openssl
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable pnpm && chown node:node /app

USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .
RUN DATABASE_URL="postgresql://finto:finto@localhost/finto" pnpm exec prisma generate
RUN pnpm exec next build

EXPOSE 8080
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec next start -H 0.0.0.0 -p 8080"]