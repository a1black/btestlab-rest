# Generate .env file
FROM alpine:latest AS env_build
WORKDIR /build
COPY private/ .
RUN [ ! -f jwt_secret.key ] \
    && apk update -q \
    && apk add -q openssl > /dev/null \
    && openssl rand -base64 -out jwt_secret.key 32
RUN cat <(echo -en "LOG_LEVEL=error\nSERVER_PORT=8080\nJWT_SECRET=") jwt_secret.key > dotenv

# End resul image
FROM node:lts-alpine

LABEL description="NodeJS server application that expose RESTful API to manage organization data"
LABEL license="MIT"
LABEL maintainer="Aleksey Chernyaev <a.chernyaev.work@gmail.com>"

ENV NODE_ENV=production
WORKDIR /home/node/app

COPY --from=env_build /build/dotenv .env
COPY bin/ bin/
COPY package*.json .
RUN npm install -g npm@latest &> /dev/null \
    && npm install --production --no-audit --no-fund --silent &> /dev/null
COPY src/ src/

EXPOSE 8080/tcp

USER node:node

CMD ["node", "bin/index.js"]