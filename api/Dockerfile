FROM node:20-alpine
WORKDIR /app
ENV NODE_OPTIONS=--dns-result-order=ipv4first

COPY package.json ./
COPY api/package.json ./api/
RUN npm install --prefix api

COPY database ./database
COPY api ./api
COPY uploads ./uploads

WORKDIR /app/api
ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts && npx tsx src/index.ts"]
