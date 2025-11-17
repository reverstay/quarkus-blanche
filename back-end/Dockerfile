## Build stage (compila com Maven + JDK 21)
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copia POM primeiro para cache de dependências
COPY pom.xml .
RUN mvn -B -U -e -C dependency:go-offline

# Copia fontes
COPY src ./src

# Build (formato padrão do Quarkus 3: quarkus-app/)
RUN mvn -B -U -e clean package -DskipTests

## Runtime stage (JRE 21 enxuto)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copia TODA a estrutura que o Quarkus precisa
COPY --from=build /build/target/quarkus-app/quarkus-run.jar /app/quarkus-run.jar
COPY --from=build /build/target/quarkus-app/lib/         /app/lib/
COPY --from=build /build/target/quarkus-app/app/         /app/app/
COPY --from=build /build/target/quarkus-app/quarkus/     /app/quarkus/

EXPOSE 8080
ENV QUARKUS_HTTP_HOST=0.0.0.0
ENV QUARKUS_HTTP_PORT=8080

CMD ["java", "-jar", "/app/quarkus-run.jar"]
