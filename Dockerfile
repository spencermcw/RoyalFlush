# Royal Flush dApp (BSC testnet build): Vite build of dApp/, served by static-base (Caddy) on $PORT.
# static-base is copied from spencermcw/spencermcw-site deploy/static-base at c4211b2.

# dApp/public (about 145 MB, mostly mp4 animations) is too big to upload with `railway up` from a
# slow link, so .railwayignore leaves it out and this stage downloads it from GitHub at a pinned
# commit. Bump MEDIA_SHA if anything under dApp/public changes.
FROM alpine:3.20 AS media
ARG MEDIA_SHA=dbe51665359cd8a0afa8f01e09618c3f7207c5e5
RUN apk add --no-cache curl tar \
 && set -o pipefail && mkdir /dl \
 && curl -fsSL "https://codeload.github.com/spencermcw/RoyalFlush/tar.gz/${MEDIA_SHA}" \
  | tar -xz -C /dl --strip-components=3 "RoyalFlush-${MEDIA_SHA}/dApp/public"

FROM node:18-slim AS build
WORKDIR /app/dApp
COPY dApp/package.json dApp/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY dApp/ ./
COPY --from=media /dl/ ./public/
# testnet mode: .env.testnet holds the BSC testnet (chain 97) contract addresses. The default
# (production) mode ships empty addresses.
RUN npx vite build --mode testnet

FROM caddy:2.10.2-alpine AS static-base
COPY deploy/static-base/Caddyfile /etc/caddy/Caddyfile
COPY deploy/static-base/defaults/ /etc/caddy/defaults/
ENV PORT=8080
EXPOSE 8080
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

FROM static-base
# Every chain call goes through the wallet's injected provider (ethers Web3Provider over
# window.ethereum), which runs in the extension and is not subject to the page's CSP, so
# connect-src stays 'self'. Without MetaMask, "Connect" runs @metamask/onboarding, which frames
# MetaMask's forwarder (fwd.metamask.io). Fonts are self-hosted. Hash routing: no SPA fallback.
ENV SITE_CSP="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self'; frame-src https://fwd.metamask.io; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
COPY --from=build /app/dApp/dist/ /srv/
