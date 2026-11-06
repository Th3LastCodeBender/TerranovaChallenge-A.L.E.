FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL="postgresql://finto:finto@localhost/finto" npx prisma generate
RUN npx next build

EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0 -p 8080"]