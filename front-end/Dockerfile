FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
# Em dev, vamos rodar "npm ci" na subida, mas manter isto acelera builds sem volume
RUN npm ci

COPY . .
EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0","--","--port","5173"]
