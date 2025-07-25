#!/bin/bash

# 删除 id 为 10~15 的 thought 节点
for id in {1..3}; do
  curl -s -X POST -H "Content-Type: application/json" -d "{\"id\": $id}" "http://localhost:9999/delete"
  echo
done
