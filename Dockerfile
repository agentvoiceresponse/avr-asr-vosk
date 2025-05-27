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

FROM node:16-alpine AS build

WORKDIR /usr/src/app

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node index.js index.js

USER node

CMD [ "node", "index.js" ]