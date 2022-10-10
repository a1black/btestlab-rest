# Generate access token secret
FROM alpine:latest AS secret_build
WORKDIR /build
COPY private/ .
RUN if [ ! -f jwt_secret.key ] \
    ;then \
        apk update -q \
            && apk add -q openssl > /dev/null \
            && openssl rand 32 | openssl enc -A -base64 -out jwt_secret.key \
    ;fi

# End resul image
FROM node:lts-alpine

LABEL description="NodeJS server application that expose RESTful API to manage organization data"
LABEL license="MIT"
LABEL maintainer="Aleksey Chernyaev <a.chernyaev.work@gmail.com>"

ENV NODE_ENV=production
WORKDIR /home/node/app

COPY --from=secret_build /build/jwt_secret.key private/
COPY bin/ bin/
COPY package*.json .
RUN npm install -g npm@latest &> /dev/null \
    && npm install --production --no-audit --no-fund --silent &> /dev/null
COPY src/ src/
RUN echo -en "LOG_LEVEL=error\nSERVER_PORT=8080\n" .env

EXPOSE 8080/tcp

USER node:node

CMD ["node", "bin/index.js"]
