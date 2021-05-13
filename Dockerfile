FROM node:16
LABEL maintainer="thotmail <parva@thotmail.ca>"

EXPOSE 8080

ENV NODE_ENV=production

WORKDIR /home/node/app

COPY . .

RUN npm ci --only=production

USER node

CMD [ "npm", "start" ]
