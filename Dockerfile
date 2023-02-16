FROM node:latest

WORKDIR /app

COPY . .

RUN npm install && npm cache clean --force && npm rebuild

CMD ["npm", "run", "dev"]