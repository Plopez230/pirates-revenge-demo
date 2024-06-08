FROM node:latest

WORKDIR /pirates/

COPY . .

RUN npm install three vite

CMD ["npx", "vite", "--host", "0.0.0.0"]