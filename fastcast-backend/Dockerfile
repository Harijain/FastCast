# ──────────────────────────────────────────────
# Stage 1: Build the JAR
# ──────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom first for layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn clean package -DskipTests -q

# ──────────────────────────────────────────────
# Stage 2: Lean runtime image
# ──────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built jar
COPY --from=builder /app/target/*.jar app.jar

# Temp dir for HLS chunks (mapped to EC2 local disk)
RUN mkdir -p /fastcast-temp

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
