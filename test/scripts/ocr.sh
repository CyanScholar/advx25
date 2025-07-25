#!/bin/bash

PORT=9999
IMG_DIR="../images"
TYPE="thought"
TOPIC="焦虑"

for IMG_PATH in "$IMG_DIR"/*.{png,jpg,jpeg}; do
  if [[ -f "$IMG_PATH" ]]; then
    echo "上传: $IMG_PATH"
    curl -s -X POST \
      -F "file=@$IMG_PATH" \
      -F "type=$TYPE" \
      -F "topic_name=$TOPIC" \
      http://localhost:$PORT/ocr
    echo -e "\n---"
  fi

done 