#!/bin/bash

# 测试数据文件
FILE="../test_data.text"
PORT=9999
n=0
while IFS= read -r line || [ -n "$line" ]; do
  if [[ -z "$line" ]]; then
    continue
  fi
  n=$((n+1))
  echo "[POST $n] $line"
  curl -s -X POST -H "Content-Type: application/json" -d "$line" "http://localhost:$PORT/post"
  echo -e "\n---"
done < "$FILE"
echo "共发送 $n 条 POST 请求。"
