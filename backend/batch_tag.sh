#!/bin/bash
# Batch tag all untagged conversations via API
# Usage: ./batch_tag.sh

set -e

API_BASE="http://localhost:8000"

echo "Fetching untagged conversation IDs..."

# Get all conversation IDs that don't have tags
UNTAGGED_IDS=$(PGPASSWORD=catsyphon_dev_password psql -h localhost -p 5433 -U catsyphon -d catsyphon -t -c "
SELECT id FROM conversations WHERE tags::text = '{}' AND message_count >= 2;
")

TOTAL=$(echo "$UNTAGGED_IDS" | grep -c '[a-f0-9]' || echo 0)
echo "Found $TOTAL untagged conversations with 2+ messages"

if [ "$TOTAL" -eq 0 ]; then
    echo "No conversations to tag."
    exit 0
fi

CURRENT=0
FAILED=0

for ID in $UNTAGGED_IDS; do
    CURRENT=$((CURRENT + 1))
    ID_CLEAN=$(echo "$ID" | tr -d ' ')

    echo -n "[$CURRENT/$TOTAL] Tagging $ID_CLEAN... "

    RESPONSE=$(curl -s -X POST "$API_BASE/conversations/$ID_CLEAN/tag" -w "\n%{http_code}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "OK"
    else
        echo "FAILED ($HTTP_CODE)"
        FAILED=$((FAILED + 1))
    fi

    # Small delay to avoid rate limiting
    sleep 0.5
done

echo ""
echo "=== Summary ==="
echo "Total: $TOTAL"
echo "Successful: $((TOTAL - FAILED))"
echo "Failed: $FAILED"
