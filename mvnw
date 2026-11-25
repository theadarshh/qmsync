#!/bin/sh
# ----------------------------------------------------------------------------
# Apache Maven Wrapper startup batch script, version 3.3.2
#
# Required ENV vars:
# ------------------
#   JAVA_HOME - location of a JDK home dir
# ----------------------------------------------------------------------------

set -e

if [ -z "$JAVA_HOME" ]; then
  JAVACMD=$(command -v java)
else
  JAVACMD="$JAVA_HOME/bin/java"
fi

if [ ! -x "$JAVACMD" ]; then
  echo "Error: JAVA_HOME is not set correctly, and no 'java' command was found on the PATH." >&2
  exit 1
fi

BASE_DIR=$(cd "$(dirname "$0")" && pwd)
WRAPPER_JAR="$BASE_DIR/.mvn/wrapper/maven-wrapper.jar"
WRAPPER_PROPERTIES="$BASE_DIR/.mvn/wrapper/maven-wrapper.properties"
WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

WRAPPER_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"

if [ ! -f "$WRAPPER_JAR" ]; then
  echo "Downloading Maven Wrapper..." >&2
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$WRAPPER_JAR" "$WRAPPER_URL"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$WRAPPER_JAR" "$WRAPPER_URL"
  else
    echo "Error: neither curl nor wget is available to download the Maven Wrapper." >&2
    exit 1
  fi
fi

exec "$JAVACMD" \
  -classpath "$WRAPPER_JAR" \
  "-Dmaven.multiModuleProjectDirectory=$BASE_DIR" \
  "-Dmaven.wrapper.properties=$WRAPPER_PROPERTIES" \
  $WRAPPER_LAUNCHER "$@"
