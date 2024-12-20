ARG SENTRY_AUTH_TOKEN_ARG

FROM node:20.10.0 AS dist
ARG SENTRY_AUTH_TOKEN_ARG
COPY package.json ./

RUN yarn install

COPY . ./
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN_ARG
RUN yarn build

FROM node:20.10.0 AS node_modules
COPY package.json yarn.lock ./

RUN yarn install --prod


FROM node:18-bullseye-slim

ARG PORT=9000

WORKDIR .

COPY --from=dist dist ./dist
COPY --from=node_modules node_modules ./node_modules
COPY src/config/db ./dist/src/config/db

EXPOSE $PORT

CMD [ "node", "dist/main" ]