FROM node:18-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN npm install

ENV PORT 3000
EXPOSE $PORT

CMD ["node", "index.js"]
