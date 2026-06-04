FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?sslmode=disable
ENV DIRECT_URL=postgresql://build:build@127.0.0.1:5432/build?sslmode=disable
RUN npx prisma generate

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_DOCS_ENABLED
ARG NEXT_PUBLIC_BETTER_AUTH_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GEMINI_API_KEY
ARG GROQ_API_KEY
ARG STORAGE_ENDPOINT
ARG STORAGE_BUCKET
ARG STORAGE_ACCESS_KEY
ARG STORAGE_SECRET_KEY

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_DOCS_ENABLED=${NEXT_PUBLIC_API_DOCS_ENABLED}
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV GROQ_API_KEY=${GROQ_API_KEY}
ENV STORAGE_ENDPOINT=${STORAGE_ENDPOINT}
ENV STORAGE_BUCKET=${STORAGE_BUCKET}
ENV STORAGE_ACCESS_KEY=${STORAGE_ACCESS_KEY}
ENV STORAGE_SECRET_KEY=${STORAGE_SECRET_KEY}

RUN npm run build

FROM base AS migrator
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL=postgresql://migrate:migrate@127.0.0.1:5432/migrate?sslmode=disable
ENV DIRECT_URL=postgresql://migrate:migrate@127.0.0.1:5432/migrate?sslmode=disable
RUN npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runner
LABEL org.opencontainers.image.title="markify"
LABEL org.opencontainers.image.url="https://e2526-wads-b4bc-03.csbihub.id"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3024
ENV NODE_ENV=production
ENV PORT=3024
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]