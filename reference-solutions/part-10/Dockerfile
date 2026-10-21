FROM node:24.15.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci
COPY server server
COPY client client
COPY setup.mjs restore-grants.mjs ./
RUN npm run build

FROM node:24.15.0-bookworm-slim AS api
WORKDIR /app
COPY --from=build --chown=node:node /app /app
USER node
CMD ["node","server/dist/main.js"]

FROM nginx:1.30.6-alpine AS web
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
