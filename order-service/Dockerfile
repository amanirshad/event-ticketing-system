FROM node:18-slim
WORKDIR /app
COPY package.json package.json
RUN npm install --production
COPY . .
CMD ["node","src/app.js"]
