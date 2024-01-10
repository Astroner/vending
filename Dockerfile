FROM node:18-alpine
WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]