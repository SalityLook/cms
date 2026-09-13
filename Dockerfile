FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps ./apps
COPY themes ./themes
COPY plugins ./plugins
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG APP
RUN pnpm --filter @selftaught/${APP} build

FROM base AS runtime
ARG APP
ENV NODE_ENV=production
COPY --from=build /app/apps/${APP}/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
