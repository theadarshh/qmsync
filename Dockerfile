# Build stage
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

COPY src/ src/
RUN ./mvnw clean package -DskipTests -B

# Runtime stage -- JRE only, no compiler, no Maven
FROM eclipse-temurin:21-jre AS runtime

RUN groupadd --system qmsync && useradd --system --gid qmsync --no-create-home qmsync

WORKDIR /app
COPY --from=build /workspace/target/qmsync.jar app.jar
RUN chown qmsync:qmsync app.jar

USER qmsync
EXPOSE 8080

# No HEALTHCHECK here -- docker-compose.yml's healthcheck against
# /actuator/health is the single readiness mechanism, deliberately.
ENTRYPOINT ["java", "-jar", "app.jar"]
