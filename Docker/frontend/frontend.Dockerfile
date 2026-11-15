FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN NODE_OPTIONS="--no-network-family-autoselection --dns-result-order=ipv4first" npm install

COPY . .
RUN npm run build

FROM nginx:alpine AS final
COPY --from=build /app/dist/wikigame/browser /usr/share/nginx/html
EXPOSE 80