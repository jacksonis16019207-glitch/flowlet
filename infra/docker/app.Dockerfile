FROM node:22-alpine AS frontend-builder
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:25-jdk AS backend-builder
WORKDIR /workspace/backend/flowlet
COPY backend/flowlet/ ./
RUN chmod +x gradlew
COPY --from=frontend-builder /workspace/frontend/dist ./src/main/resources/static
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=backend-builder /workspace/backend/flowlet/build/libs/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
