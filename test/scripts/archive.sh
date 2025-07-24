#!/bin/bash
PORT=9999
for id in {1..9}; do
  curl -s -X POST -H "Content-Type: application/json" -d "{\"id\": $id}" "http://localhost:$PORT/archive"
  echo
done