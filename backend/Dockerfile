FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline
COPY src src
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S denguinho && adduser -S denguinho -G denguinho
WORKDIR /app
COPY --from=build /workspace/target/denguinho-api-*.jar app.jar
RUN mkdir -p /app/storage/private/couple-photos && chown -R denguinho:denguinho /app
USER denguinho
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

