FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN python3 -m venv /opt/scamshield-venv \
    && /opt/scamshield-venv/bin/pip install --no-cache-dir -r ml_service/requirements.txt
ENV PATH="/opt/scamshield-venv/bin:$PATH"

RUN npm install -g corepack@latest \
    && corepack pnpm install \
    && corepack pnpm run build

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
