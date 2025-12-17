#!/usr/bin/bash

URL=$1

if [ -z "$URL" ]; then
  echo "❌ 프론트엔드 URL이 비어 있습니다."
  exit 1
fi

for i in {1..30}; do
  echo "⏳ frontend health 체크를 시도하고 있습니다. $i"
  if curl -sSf "$URL" > /dev/null; then
    echo "✅ 프론트엔드 헬스체크 완료"
    exit 0
  fi
  sleep 2
done

echo "❌ 프론트엔드 health 체크가 실패 하였습니다. ($URL)"
exit 1