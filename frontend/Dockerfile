FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, not
# read from the environment at runtime — the code that uses them runs in the
# visitor's browser, which cannot see this container's env. They therefore
# have to arrive as build args. Passing them at `docker run` has no effect.
#
# These must be URLs the *browser* can reach: localhost when developing,
# the public host when deployed.
ARG NEXT_PUBLIC_AUTH_SERVICE
ARG NEXT_PUBLIC_UTILS_SERVICE
ARG NEXT_PUBLIC_USER_SERVICE
ARG NEXT_PUBLIC_JOB_SERVICE
ARG NEXT_PUBLIC_PAYMENT_SERVICE

ENV NEXT_PUBLIC_AUTH_SERVICE=$NEXT_PUBLIC_AUTH_SERVICE \
    NEXT_PUBLIC_UTILS_SERVICE=$NEXT_PUBLIC_UTILS_SERVICE \
    NEXT_PUBLIC_USER_SERVICE=$NEXT_PUBLIC_USER_SERVICE \
    NEXT_PUBLIC_JOB_SERVICE=$NEXT_PUBLIC_JOB_SERVICE \
    NEXT_PUBLIC_PAYMENT_SERVICE=$NEXT_PUBLIC_PAYMENT_SERVICE \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as a non-root user; the standalone server needs no write access.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
