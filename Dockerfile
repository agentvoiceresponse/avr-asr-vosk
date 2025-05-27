# Use Node.js 16 for better ffi-napi compatibility
FROM node:16-bullseye AS development

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci && npm cache clean --force

###################
# BUILD FOR PRODUCTION
###################

FROM node:16-bullseye AS build

WORKDIR /usr/src/app

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node index.js index.js

USER node

CMD [ "node", "index.js" ]

###################
# PRODUCTION - Use same base image (Debian) for compatibility
###################

FROM node:16-bullseye-slim AS production

WORKDIR /usr/src/app

# Install only runtime dependencies needed for vosk
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Copy built node_modules and application files from build stage
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/index.js ./index.js
COPY --chown=node:node --from=build /usr/src/app/package*.json ./

USER node

CMD [ "node", "index.js" ]