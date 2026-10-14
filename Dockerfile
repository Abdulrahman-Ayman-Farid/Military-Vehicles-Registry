# syntax=docker/dockerfile:1

# ---------- Stage 1: builder ----------
# Build the Angular SPA from source. Node 20 Alpine matches the project's
# toolchain (Angular 18, @angular/build:application builder).
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the manifest first to leverage Docker layer caching for dependencies.
# NOTE: This project has no lockfile (no package-lock.json / yarn.lock), so we
# use `npm install` rather than `npm ci`.
# We pass --legacy-peer-deps because package.json pins typescript ~5.8.2 while
# @angular/compiler-cli@18.2.0 (an Angular 18 peer) requires typescript >=5.4
# <5.6. This is a known peer dependency conflict in Angular 18 projects using
# newer TypeScript versions; --legacy-peer-deps tells npm to ignore peer
# dependency resolution errors and install anyway.
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy the full source tree and run the production build.
# `ng build` (default configuration: production) emits static assets to ./dist.
COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
# Serve the compiled static assets with nginx. Alpine keeps the image small;
# curl is installed so the HEALTHCHECK directive has a probe tool available.
FROM nginx:1.27-alpine AS runtime

# Install curl for the container HEALTHCHECK (Alpine ships wget, but curl gives
# us -fsS fail-fast semantics that integrate cleanly with Docker's probe).
RUN apk add --no-cache curl

# Custom nginx server block:
#   - listens on port 3000 (matches angular.json serve options)
#   - serves static files from /usr/share/nginx/html
#   - exposes /health returning 200 'ok' (no app-level health endpoint exists;
#     this is a static SPA, so nginx itself is the health authority)
#   - try_files fallback to /index.html for client-side SPA routing
RUN printf '%s\n' \
    'server {' \
    '    listen 3000;' \
    '    server_name _;' \
    '' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '' \
    '    # Health endpoint for Docker HEALTHCHECK and orchestrator probes.' \
    '    location = /health {' \
    '        return 200 "ok";' \
    '        add_header Content-Type text/plain;' \
    '    }' \
    '' \
    '    # SPA fallback: serve static assets when present, otherwise defer to' \
    '    # index.html so Angular router can handle client-side routes.' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '}' \
    > /etc/nginx/conf.d/default.conf

# Copy the compiled Angular build output into the nginx document root.
COPY --from=builder /app/dist /usr/share/nginx/html

# Fix ownership of nginx runtime directories BEFORE dropping privileges.
# The nginx:1.27-alpine image ships with /var/cache/nginx/* and /var/run
# owned by root. When nginx starts as the non-root `nginx` user it must be
# able to create its temp directories and write its PID file, otherwise it
# fails with:
#   nginx: [emerg] mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)
# The nginx entrypoint script also needs write access to /etc/nginx/conf.d
# to template default.conf at startup. All chown operations MUST run while
# still root (i.e. before the USER directive below).
#
# PID file relocation:
# On Alpine, /run is a tmpfs that is freshly mounted at container start. Even
# though we chown /var/run (a symlink to /run) below, /run is a separate mount
# point owned by root at runtime, so the nginx user cannot write its PID file
# there and fails with:
#   nginx: [emerg] open() "/run/nginx.pid" failed (13: Permission denied)
# The default /etc/nginx/nginx.conf sets `pid /var/run/nginx.pid;`. We override
# it to `pid /var/cache/nginx/nginx.pid;` — /var/cache/nginx is already owned
# by the nginx user (chowned below), so the PID file can be written there.
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    sed -i 's|pid.*|pid /var/cache/nginx/nginx.pid;|' /etc/nginx/nginx.conf && \
    chown -R nginx:nginx /var/cache/nginx /var/run /etc/nginx/conf.d

# Runtime metadata.
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Drop privileges: the nginx:1.27-alpine image ships with a non-root `nginx`
# user. Running as non-root aligns with container security best practices.
USER nginx

# Health probe hits the /health endpoint served by nginx. curl -fsS fails fast
# on non-2xx responses or connection errors, signaling Docker to restart the
# container if nginx becomes unresponsive.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
