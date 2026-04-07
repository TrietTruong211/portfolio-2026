FROM node:20-alpine

RUN npm i -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter api build

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
