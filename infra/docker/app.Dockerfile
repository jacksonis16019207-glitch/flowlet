# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS frontend-builder
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:25-jdk AS backend-builder
WORKDIR /workspace/backend/flowlet
COPY backend/flowlet/gradlew ./
COPY backend/flowlet/gradle ./gradle
COPY backend/flowlet/build.gradle ./
COPY backend/flowlet/settings.gradle ./
RUN --mount=type=cache,target=/root/.gradle ./gradlew dependencies --no-daemon > /dev/null || true
COPY backend/flowlet/ ./
RUN chmod +x gradlew
COPY --from=frontend-builder /workspace/frontend/dist ./src/main/resources/static
RUN --mount=type=cache,target=/root/.gradle ./gradlew bootJar --no-daemon

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=backend-builder /workspace/backend/flowlet/build/libs/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
