FROM node:20.19-slim

COPY package*.json ./
COPY nodemon.json ./
COPY babel.config.json ./

RUN npm install

COPY . .

CMD ["nodemon", "start"]
