#!/usr/bin/env bash
# Test Mortech API with different parameter combinations and report how many
# rates (<results> blocks) each response contains.
#
# Usage:
#   export MORTECH_CUSTOMER_ID=05lsta01
#   export MORTECH_THIRD_PARTY_NAME=LoanStarMortgage
#   export MORTECH_LICENSE_KEY=your-license-key
#   export MORTECH_EMAIL=Contact@theloanstar.com
#   ./scripts/test-mortech-direct-variations.sh
#
# Or source your .env and run (ensure Mortech vars are set there).

set -e
BASE_URL="${MORTECH_BASE_URL:-https://thirdparty.mortech-inc.com/mpg/servlet/mpgThirdPartyServlet}"
CUSTOMER_ID="${MORTECH_CUSTOMER_ID:?Set MORTECH_CUSTOMER_ID}"
THIRD_PARTY="${MORTECH_THIRD_PARTY_NAME:?Set MORTECH_THIRD_PARTY_NAME}"
LICENSE="${MORTECH_LICENSE_KEY:?Set MORTECH_LICENSE_KEY}"
EMAIL="${MORTECH_EMAIL_ADDRESS:-$MORTECH_EMAIL}"

if [ -z "$EMAIL" ]; then
  echo "Set MORTECH_EMAIL_ADDRESS or MORTECH_EMAIL"
  exit 1
fi

# Count <results in XML (one per product/rate block)
count_results() {
  grep -o '<results ' <<< "$1" | wc -l
}

call_mortech() {
  local label="$1"
  shift
  local res
  res=$(curl -s -G "$BASE_URL" \
    --data-urlencode "request_id=1" \
    --data-urlencode "customerId=$CUSTOMER_ID" \
    --data-urlencode "thirdPartyName=$THIRD_PARTY" \
    --data-urlencode "licenseKey=$LICENSE" \
    --data-urlencode "emailAddress=$EMAIL" \
    "$@" \
    -H "Accept: application/xml, text/xml" \
    -H "User-Agent: LoanApp/1.0")
  local n
  n=$(count_results "$res")
  if echo "$res" | grep -q '<errorNum>0</errorNum>'; then
    echo "OK   [$label] rates count: $n"
  else
    echo "ERR  [$label] (check response)"
  fi
}

echo "Mortech direct API – variation tests (rates = number of <results>)"
echo "---"

# 1) Baseline (your original single-rate call)
call_mortech "Baseline (75024, 225k value, 150k loan, FICO 740, 30yr fixed)" \
  --data-urlencode "propertyZip=75024" \
  --data-urlencode "appraisedvalue=225000" \
  --data-urlencode "loan_amount=150000" \
  --data-urlencode "fico=740" \
  --data-urlencode "loanpurpose=Purchase" \
  --data-urlencode "proptype=Single Family" \
  --data-urlencode "occupancy=Primary" \
  --data-urlencode "loanProduct1=30 year fixed"

# 2) Different ZIP
call_mortech "Different ZIP (90210)" \
  --data-urlencode "propertyZip=90210" \
  --data-urlencode "appraisedvalue=500000" \
  --data-urlencode "loan_amount=400000" \
  --data-urlencode "fico=740" \
  --data-urlencode "loanpurpose=Purchase" \
  --data-urlencode "proptype=Single Family" \
  --data-urlencode "occupancy=Primary" \
  --data-urlencode "loanProduct1=30 year fixed"

# 3) Refinance
call_mortech "Refinance (75024)" \
  --data-urlencode "propertyZip=75024" \
  --data-urlencode "appraisedvalue=225000" \
  --data-urlencode "loan_amount=150000" \
  --data-urlencode "fico=740" \
  --data-urlencode "loanpurpose=Refinance" \
  --data-urlencode "proptype=Single Family" \
  --data-urlencode "occupancy=Primary" \
  --data-urlencode "loanProduct1=30 year fixed"

# 4) Lower FICO
call_mortech "Lower FICO (680)" \
  --data-urlencode "propertyZip=75024" \
  --data-urlencode "appraisedvalue=225000" \
  --data-urlencode "loan_amount=150000" \
  --data-urlencode "fico=680" \
  --data-urlencode "loanpurpose=Purchase" \
  --data-urlencode "proptype=Single Family" \
  --data-urlencode "occupancy=Primary" \
  --data-urlencode "loanProduct1=30 year fixed"

# 5) 15-year product
call_mortech "15 year fixed" \
  --data-urlencode "propertyZip=75024" \
  --data-urlencode "appraisedvalue=225000" \
  --data-urlencode "loan_amount=150000" \
  --data-urlencode "fico=740" \
  --data-urlencode "loanpurpose=Purchase" \
  --data-urlencode "proptype=Single Family" \
  --data-urlencode "occupancy=Primary" \
  --data-urlencode "loanProduct1=15 year fixed"

echo "---"
echo "Done. Each line shows whether the response had 1 or more rate blocks."
