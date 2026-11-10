#!/bin/bash
# Test script to register a new school user on staging with Vericant school
# Date: 2026-06-30

set -e

STAGING_URL="https://staging.guided.vericant.com"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-user-${TIMESTAMP}@vericant.com"
TEST_PASSWORD="TestPass123!"
TEST_NAME="Test User ${TIMESTAMP}"

echo "======================================"
echo "Staging Registration Test"
echo "======================================"
echo "Staging URL: ${STAGING_URL}"
echo "Test Email: ${TEST_EMAIL}"
echo "Test Name: ${TEST_NAME}"
echo ""

# Step 1: Get the list of schools to find Vericant school ID
echo "Step 1: Fetching schools list..."
SCHOOLS_RESPONSE=$(curl -s "${STAGING_URL}/api/schools" || echo '{"success":false}')

# Check if we can extract schools data
echo "Schools API response sample:"
echo "$SCHOOLS_RESPONSE" | head -c 500
echo ""

# Extract Vericant school info (assuming the API returns JSON with schools array)
VERICANT_SCHOOL_ID=$(echo "$SCHOOLS_RESPONSE" | grep -o '"id":"[^"]*","code":"vericant"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -z "$VERICANT_SCHOOL_ID" ]; then
    echo "ERROR: Could not find Vericant school ID in the response"
    echo "Full response:"
    echo "$SCHOOLS_RESPONSE"
    exit 1
fi

echo "Found Vericant school ID: ${VERICANT_SCHOOL_ID}"
echo ""

# Step 2: Register the new user
echo "Step 2: Registering new school admin..."
REGISTER_RESPONSE=$(curl -s -X POST "${STAGING_URL}/api/school/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_EMAIL}\",
        \"password\": \"${TEST_PASSWORD}\",
        \"name\": \"${TEST_NAME}\",
        \"schoolId\": \"${VERICANT_SCHOOL_ID}\"
    }")

echo "Registration API response:"
echo "$REGISTER_RESPONSE"
echo ""

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    echo "======================================"
    echo "✓ Registration SUCCESSFUL!"
    echo "======================================"
    echo ""
    echo "Test account details:"
    echo "  Email: ${TEST_EMAIL}"
    echo "  Password: ${TEST_PASSWORD}"
    echo "  Name: ${TEST_NAME}"
    echo "  School: Vericant"
    echo ""
    echo "Note: The account is pending approval and needs to be activated by a super admin."
    echo "You can activate it at: ${STAGING_URL}/school/users"
else
    echo "======================================"
    echo "✗ Registration FAILED"
    echo "======================================"
    echo "Full response:"
    echo "$REGISTER_RESPONSE"
    exit 1
fi
