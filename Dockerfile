# Install dependencies only when needed
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG SPOTIFY_SECRET
ARG VITE_SPOTIFY_ID
ARG VITE_API_BASE
ARG VITE_REDIRECT_URI
RUN npm run build

# Production image, copy all the files and run next
FROM nginx:1.23-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx /etc/nginx

ENV PORT 80
EXPOSE $PORT
