FROM node:24-alpine as base

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

FROM base as dev
RUN pnpm install
COPY . .
EXPOSE 5000
CMD ["pnpm", "dev"]

FROM base as production
RUN pnpm ci --only=production
COPY . .
RUN pnpm run build

# Clean up
RUN rm -rf src tsconfig.json nodemon.json

USER node
EXPOSE 5000
CMD ["pnpm", "start"]