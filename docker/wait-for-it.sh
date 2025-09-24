#!/usr/bin/env bash
# wait-for-it.sh

TIMEOUT=15
QUIET=0
HOST=127.0.0.1
PORT=5432

log() {
  if [ $QUIET -ne 1 ]; then
    echo "$@"
  fi
}

usage() {
  echo "Usage: $0 [--host HOST] [--port PORT] [--timeout TIMEOUT] [--quiet] [-- COMMAND]"
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    --host)
      HOST="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --quiet)
      QUIET=1
      shift 1
      ;;
    --)
      shift
      break
      ;;
    *)
      usage
  esac
done

log "Waiting for $HOST:$PORT to be available..."

for i in $(seq $TIMEOUT); do
  nc -z $HOST $PORT > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    log "$HOST:$PORT is available after $i seconds."
    exec "$@"
    exit 0
  fi
  sleep 1
done

log "Timeout after $TIMEOUT seconds: $HOST:$PORT is not available."
exit 1
