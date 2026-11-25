@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.2
@REM
@REM Required ENV vars:
@REM   JAVA_HOME - location of a JDK home dir
@REM ----------------------------------------------------------------------------
@ECHO OFF

SET BASE_DIR=%~dp0
SET WRAPPER_JAR=%BASE_DIR%.mvn\wrapper\maven-wrapper.jar
SET WRAPPER_PROPERTIES=%BASE_DIR%.mvn\wrapper\maven-wrapper.properties
SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain
SET WRAPPER_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar

IF NOT EXIST "%WRAPPER_JAR%" (
  ECHO Downloading Maven Wrapper...
  powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
)

IF "%JAVA_HOME%"=="" (
  SET JAVA_EXE=java
) ELSE (
  SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
)

"%JAVA_EXE%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%BASE_DIR%" "-Dmaven.wrapper.properties=%WRAPPER_PROPERTIES%" %WRAPPER_LAUNCHER% %*
