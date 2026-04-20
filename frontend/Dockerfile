# ============================================================================
# GSI Frontend — development image (Vite dev server con HMR).
# La prod image (Nginx + build statico) verrà creata in Sprint 5.
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Install deps in layer cacheable.
COPY package.json package-lock.json ./
RUN npm ci

# Code (volume mount in dev sovrascriverà).
COPY . .

EXPOSE 5173

# --host 0.0.0.0 è necessario per esporre Vite fuori dal container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
