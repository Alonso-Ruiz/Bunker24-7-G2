# Backend Spring Boot (skeleton) — Instrucciones

Este directorio es un lugar seguro para crear un backend Spring Boot separado del frontend. No tocará el código del frontend (carpeta raíz `src/` etc.) si sigues estos pasos.

Resumen de la estrategia
- Crearemos un proyecto Spring Boot con type Maven (incluye `mvnw` / `mvnw.cmd`) usando Spring Initializr (start.spring.io). Esto evita depender de una instalación global de Maven: usarás el wrapper incluido en el proyecto (`mvnw.cmd` en Windows).
- El backend quedará en `project\backend`.
- Te doy comandos de PowerShell para descargar el ZIP generado, descomprimirlo y ejecutar el servidor con el wrapper.

Requisitos previos en tu máquina (Windows)
- JDK 17+ instalado (JAVA_HOME configurado y `java -version` muestra 17 o superior).
- PowerShell (la terminal que usas está bien).

Pasos (PowerShell desde `C:\Users\Usuario\Desktop\project`)
1) Ir a la carpeta del proyecto (si no estás ahí):
```powershell
cd "C:\Users\Usuario\Desktop\project"
```

2) Descargar y descomprimir un proyecto Spring Boot generado por Spring Initializr usando `Invoke-WebRequest`.
- Este comando crea una carpeta `backend` con un proyecto Maven listo (incluye `mvnw`/`mvnw.cmd`).

```powershell
# Cambia groupId/artifactId/packageName si lo deseas
$uri = 'https://start.spring.io/starter.zip?type=maven-project&language=java&packaging=jar&javaVersion=17&groupId=com.example&artifactId=backend&name=backend&packageName=com.example.backend&dependencies=web,data-jpa,postgresql'
Invoke-WebRequest -Uri $uri -OutFile backend.zip
Expand-Archive -Path backend.zip -DestinationPath .
Remove-Item backend.zip
```

Notas:
- La query pide las dependencias: `web` (REST), `data-jpa` (JPA/Hibernate) y `postgresql` (driver). Puedes quitar o agregar dependencias según lo que necesites.
- El ZIP generado por start.spring.io incluye `mvnw`, `mvnw.cmd` y la carpeta `.mvn/wrapper` — esto te permite ejecutar Maven sin instalarlo globalmente.

3) Entrar a la carpeta del backend y ejecutar el servidor usando el *Maven Wrapper* (Windows):
```powershell
cd .\backend
# Ejecutar la app (usa el wrapper incluido)
.\mvnw.cmd spring-boot:run
```
- Si `mvnw.cmd` no tiene permisos de ejecución, ejecuta:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
.\mvnw.cmd spring-boot:run
```

4) Si prefieres compilar y ejecutar el JAR:
```powershell
.\mvnw.cmd -DskipTests package
java -jar target\backend-0.0.1-SNAPSHOT.jar
```

Configurar conexión a la base de datos (opcional — si usarás Postgres/Supabase)
- Para usar la base de datos Postgres (por ejemplo Supabase), configura las siguientes variables de entorno o edita `src/main/resources/application.properties` / `application.yml`.

Ejemplo de `application.properties` usando variables de entorno:
```
spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}

spring.jpa.hibernate.ddl-auto=none
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

En PowerShell (session temporal) puedes exportar variables así:
```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://<host>:5432/<database>'
$env:SPRING_DATASOURCE_USERNAME = '<user>'
$env:SPRING_DATASOURCE_PASSWORD = '<password>'
# Luego en la misma terminal ejecutas .\mvnw.cmd spring-boot:run
```

Consejo sobre Supabase:
- Supabase ofrece acceso directo a Postgres. En el dashboard de Supabase > Settings > Database encontrarás la connection string para psql/JDBC. Usa esa URL (transformándola a formato `jdbc:postgresql://host:port/dbname`) y las credenciales apropiadas.
- Alternativa: si no quieres conectar directamente a Postgres, puedes dejar la lógica de datos en Supabase y que el backend consuma la API REST de Supabase o el client de Supabase. En ese caso no necesitas `data-jpa` ni driver Postgres.

Buenas prácticas para no romper tu proyecto frontend
- Mantén el backend en la carpeta `backend/`. No muevas archivos del frontend ni modifiques `package.json` a menos que quieras integrar scripts que lancen frontend y backend en paralelo.
- Si quieres ejecutar frontend y backend juntos localmente, puedes abrir dos terminales: una en la raíz (`npm run dev`) y otra en `backend` (`.\mvnw.cmd spring-boot:run`).

Si tienes problemas con Maven (descarga/ejecución)
- El método propuesto usa el Maven Wrapper incluido en el ZIP que se descarga desde start.spring.io; no requiere que tengas Maven globalmente.
- Si el wrapper falla porque tu conexión bloquea descargas, la alternativa es instalar Maven localmente y ejecutar `mvn` en lugar de `mvnw.cmd`.

Siguientes sugerencias que puedo hacer por ti
- Puedo crear el proyecto `backend` por ti (descargando el ZIP) si me das permiso para ejecutar comandos en esta sesión — o puedo guiarte paso a paso mientras ejecutas los comandos en tu terminal.
- Puedo añadir un ejemplo de controlador REST y una entidad JPA (fichero Java) dentro de `backend/src/main/java/...` si quieres un punto de partida.
- Puedo añadir un script npm en `package.json` para arrancar frontend y backend en paralelo (por ejemplo usando `concurrently`) si lo deseas.

Dime qué prefieres:
- Que te guíe para ejecutar los comandos en tu terminal ahora (te doy exactamente qué copiar/pegar), o
- Que genere un controlador/entidad ejemplo dentro de `backend` y te muestre cómo probarlo localmente.

Cambios añadidos en este repositorio (lista rápida):

- Se añadió un controlador REST de muestra `HealthController` en `src/main/java/com/example/backend/controller/HealthController.java` con endpoints `/api/health` y `/api/hello` para comprobar que el backend arranca y responde.
- Se añadió `WebConfig` en `src/main/java/com/example/backend/config/WebConfig.java` para permitir CORS desde `http://localhost:5173` (Vite dev server).
- Se eliminaron las dependencias y la configuración de JPA/DB para permitir que el backend arranque sin base de datos (si quieres volver a usar JPA/DB, ver la sección "Volver a activar la BD" más abajo).
- `backend/.env.example` permanece como plantilla para cuando decidas conectar a Supabase/Postgres.

Volver a activar la BD (opcional)

Si más adelante quieres usar JPA con Supabase/Postgres o H2 en desarrollo, sigue uno de estos caminos:

1) Conectar a Supabase (Postgres)
	- Añade de nuevo en `pom.xml` la dependencia `spring-boot-starter-data-jpa` y el driver `org.postgresql:postgresql`.
	- Configura las variables de entorno `SPRING_DATASOURCE_URL` (jdbc:postgresql://...), `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` o edita `application.properties`.

2) Usar H2 en memoria para desarrollo
	- Añade la dependencia `com.h2database:h2` en `pom.xml` y crea/usa `application-dev.properties` (ya existe en el repo como ejemplo).
	- Arranca con el perfil `dev`: `\.\mvnw.cmd -Dspring-boot.run.profiles=dev spring-boot:run`.

Estas opciones las puedo aplicar por ti si quieres.

Pasos recomendados para arrancar ahora (PowerShell en la raíz del proyecto):

1) Abrir una terminal PowerShell en `C:\Users\Usuario\Desktop\project` y exportar las variables con tus credenciales de Supabase (transforma la URL si es necesario):

```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://<host>:5432/<database>'
$env:SPRING_DATASOURCE_USERNAME = '<user>'
$env:SPRING_DATASOURCE_PASSWORD = '<password>'
```

2) Entrar al backend y ejecutar con el wrapper:

```powershell
cd .\backend
.\mvnw.cmd spring-boot:run
```

3) Probar en el navegador o con curl:

GET http://localhost:8080/api/health
GET http://localhost:8080/api/hello

Notas:
- Si prefieres no conectar a Supabase aún, dime y te agrego H2 en `pom.xml` y configuración `application.properties` para arrancar con una BD en memoria durante desarrollo.


