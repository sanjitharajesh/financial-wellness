FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ENV REACT_APP_API_URL=https://backend-production-d4f2.up.railway.app
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
