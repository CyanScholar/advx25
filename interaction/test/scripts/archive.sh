#!/bin/bash
PORT=9999
AUTO_ELIMINATE=${1:-true}
# 设置自动消除开关
curl -s -X POST -H "Content-Type: application/json" -d '{"value":'"$AUTO_ELIMINATE"'}' "http://localhost:$PORT/auto_eliminate"
echo "auto_eliminate set to $AUTO_ELIMINATE"
for id in {1..9}; do
  curl -s -X POST -H "Content-Type: application/json" -d '{"id":'"$id"'}' "http://localhost:$PORT/archive"
  echo
done