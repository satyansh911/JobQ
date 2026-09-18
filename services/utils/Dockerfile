FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# `npm run build` reinstalls before compiling; deps are already present here.
RUN npx tsc -p tsconfig.json


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# The local-disk storage driver writes here; compose mounts a volume over it.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

EXPOSE 5001

CMD ["node", "dist/index.js"]
