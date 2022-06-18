FROM node:lts-alpine AS app_build
ENV NODE_ENV=production
WORKDIR /build
COPY package*.json .
RUN 'npm install -g npm@latest &> /dev/null \
    && npm install --production --no-audit --no-fund --silent &> /dev/null'

FROM alpine:latest AS env_build
WORKDIR /build
COPY private/ private/
RUN /bin/ash -c '[ ! -f private/JWT_SECRET.key ] \
    && apk update -q \
    && apk add -q openssl > /dev/null \
    && openssl rand -base64 -out private/JWT_SECRET.key 32'
RUN /bin/ash -c 'cat <(echo -en "LOG_LEVEL=error\nSERVER_PORT=8080\nJWT_SECRET=") private/JWT_SECRET.key > dotenv'

FROM node:lts-alpine

LABEL description="NodeJS server application that expose RESTful API to manage organization data"
LABEL license="MIT"
LABEL maintainer="Aleksey Chernyaev <a.chernyaev.work@gmail.com>"

ENV NODE_ENV=production

WORKDIR /home/node/app
COPY --from=app_build /build/node_modules/ node_modules/
COPY --from=env_build /build/dotenv .env
COPY bin/index.js bin/index.js
COPY src/ src/

EXPOSE 8080/tcp

USER node:node

CMD ["node", "bin/index.js"]