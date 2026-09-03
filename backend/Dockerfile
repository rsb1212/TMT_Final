# ── Build stage ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Install Maven once
RUN apk add --no-cache maven

# 1) Warm the local Maven repo with just the POM so subsequent code changes
#    don't force a full re-download of dependencies.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline || true

# 2) Now copy the sources and build.
COPY src ./src
RUN mvn -B -q clean package -DskipTests \
 && cp target/test-management-tool-*.jar app.jar

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# curl is used by HEALTHCHECK; tini provides proper PID-1 signal handling
# so Spring Boot's graceful shutdown actually fires on `docker stop`.
RUN apk add --no-cache curl tini

# Non-root user + writable dirs
RUN addgroup -g 1001 appgroup \
 && adduser -u 1001 -G appgroup -D appuser \
 && mkdir -p /app/uploads /app/logs \
 && chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/app.jar /app/app.jar

USER appuser

EXPOSE 8080

# JVM tuning for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -fsS http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]

