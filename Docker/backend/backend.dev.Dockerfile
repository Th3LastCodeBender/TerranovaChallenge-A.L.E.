FROM node:24-alpine
RUN apk add --no-cache openssl && corepack enable pnpm \
 && mkdir -p /app/node_modules /app/.next && chown -R node:node /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
USER node
WORKDIR /app