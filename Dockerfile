FROM node:26-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:26-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
LABEL org.opencontainers.image.source="https://github.com/Mango-Teknusa-Inovasi/MangoTek-Edu"
LABEL org.opencontainers.image.licenses="MIT"
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node
EXPOSE 3000
CMD ["npm","start"]
