FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# uploads dir must exist + be writable
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>{if(!r.ok)throw new Error(r.status)}).then(()=>process.exit(0)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
