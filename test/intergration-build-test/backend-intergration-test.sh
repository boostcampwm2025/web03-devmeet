#!/usr/bin/bash

URL=$1

if [ -z "$URL" ]; then
  echo "❌ 백엔드 URL을 확인해주세요"
  exit 1
fi

# 잘 빌드가 되었는지 확인하는 로직
for i in {1..30}; do
  echo "⏳ backend health 체크를 시도하고 있습니다. $i"
  if curl -sSf "$URL/api/health" > /dev/null; then
    echo "✅ 백엔드 헬스체크 완료"
    exit 0
  fi
  sleep 2
done

echo "❌ 백엔드 health 체크가 실패 하였습니다. ($URL)"
exit 1