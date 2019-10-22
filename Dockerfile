FROM node:10-alpine

RUN apk update && apk upgrade

COPY src /src
COPY node_modules /src/node_modules
COPY package.json /src/package.json

EXPOSE 8765
CMD node /src/server.js
