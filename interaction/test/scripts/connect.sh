#!/bin/bash
PORT=9999
# 用法: ./connect.sh <node_id> <connect_id1,connect_id2,...> <node_type>
if [[ $# -ge 2 ]]; then
  NODE_ID=$1
  CONNECT_IDS=$2
  NODE_TYPE=${3:-thought}
  curl -s -X POST -H "Content-Type: application/json" -d '{"node_id":'"$NODE_ID"',"connect_ids":['"$CONNECT_IDS"'],"node_type":"'"$NODE_TYPE"'"}' "http://localhost:$PORT/connect"
  echo
else
  echo "用法: $0 <node_id> <connect_id1,connect_id2,...> [node_type]"
  echo "示例: $0 1 2,3 thought"
fi 