# QMSync frontend: Vite development server (Milestone 1).
# Runs as the unprivileged "node" user. Dependencies install in their own layer so rebuilds stay fast.
FROM node:22-alpine

WORKDIR /app
RUN chown node:node /app
USER node

# package-lock.json is optional until the first local install generates it:
# with a lockfile the install is reproducible (npm ci), without one npm resolves versions (npm install).
COPY --chown=node:node package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

COPY --chown=node:node . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
