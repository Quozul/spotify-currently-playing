FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build ./build
COPY .env.production ./

RUN npm ci --omit dev

EXPOSE 3000

CMD ["node", "--env-file=.env.production", "build/index.js"]
