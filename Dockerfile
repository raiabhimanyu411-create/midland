FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci

COPY shared ./shared
COPY client ./client
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci --omit=dev --workspace backend

COPY shared ./shared
COPY backend ./backend
COPY --from=build /app/client/dist ./client/dist
COPY client/src/i18n/locales/en.json ./client/src/i18n/locales/en.json

RUN mkdir -p /app/backend/uploads && chown -R node:node /app
USER node

EXPOSE 5001
CMD ["npm", "start"]
