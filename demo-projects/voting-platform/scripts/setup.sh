#!/bin/bash

echo "=============================================="
echo "  Voting Platform - Cloudflare Setup Wizard  "
echo "=============================================="
echo ""

# Check for wrangler
if ! command -v wrangler &> /dev/null; then
    echo "Error: Wrangler CLI not found."
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
echo "Checking Cloudflare authentication..."
wrangler whoami &> /dev/null || { echo "Error: Not logged in to Cloudflare. Run 'wrangler login' first."; exit 1; }
echo "✓ Logged in to Cloudflare"
echo ""

echo ""
echo "--- Step 1: D1 Database ---"

# Check current database_id in wrangler.toml
DB_ID=$(grep "^database_id" wrangler.toml 2>/dev/null | cut -d'=' -f2 | tr -d ' "' || echo "")

if [ -z "$DB_ID" ] || [ "$DB_ID" = "YOUR_D1_DATABASE_ID" ]; then
    echo "Checking for existing D1 database..."
    EXISTING_DB=$(wrangler d1 list --json 2>/dev/null | grep -o '"name":"voting-platform","uuid":"[^"]*"' | grep -o '"uuid":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$EXISTING_DB" ]; then
        echo "✓ Using existing database: $EXISTING_DB"
        sed -i '' "s/database_id = \"YOUR_D1_DATABASE_ID\"/database_id = \"$EXISTING_DB\"/" wrangler.toml
    else
        echo "Creating D1 database..."
        CREATE_OUTPUT=$(wrangler d1 create voting-platform 2>&1)
        if echo "$CREATE_OUTPUT" | grep -q "database_id"; then
            NEW_DB_ID=$(echo "$CREATE_OUTPUT" | grep "database_id = " | awk -F'"' '{print $2}')
            sed -i '' "s/database_id = \"YOUR_D1_DATABASE_ID\"/database_id = \"$NEW_DB_ID\"/" wrangler.toml
            echo "✓ D1 database created: $NEW_DB_ID"
        else
            echo "✗ Failed to create database"
            echo "$CREATE_OUTPUT"
            exit 1
        fi
    fi
else
    echo "✓ D1 database already configured: $DB_ID"
fi

echo ""
echo "--- Step 2: KV Namespace ---"

KV_ID=$(grep "^id = " wrangler.toml | grep -v "account_id" | head -1 | cut -d'=' -f2 | tr -d ' "' || echo "")

if [ -z "$KV_ID" ] || [ "$KV_ID" = "YOUR_KV_NAMESPACE_ID" ]; then
    echo "Checking for existing KV namespace..."
    EXISTING_KV=$(wrangler kv namespace list --json 2>/dev/null | grep -i "GUEST_LOGBOOK" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$EXISTING_KV" ]; then
        echo "✓ Using existing KV namespace: $EXISTING_KV"
        sed -i '' "s/id = \"YOUR_KV_NAMESPACE_ID\"/id = \"$EXISTING_KV\"/" wrangler.toml
    else
        echo "Creating KV namespace..."
        CREATE_OUTPUT=$(wrangler kv namespace create GUEST_LOGBOOK 2>&1)
        if echo "$CREATE_OUTPUT" | grep -q "id = "; then
            NEW_KV_ID=$(echo "$CREATE_OUTPUT" | grep "id = " | awk -F'"' '{print $2}')
            sed -i '' "s/id = \"YOUR_KV_NAMESPACE_ID\"/id = \"$NEW_KV_ID\"/" wrangler.toml
            echo "✓ KV namespace created: $NEW_KV_ID"
        else
            echo "✗ Failed to create KV namespace"
            echo "$CREATE_OUTPUT"
            exit 1
        fi
    fi
else
    echo "✓ KV namespace already configured: $KV_ID"
fi

echo ""
echo "--- Step 3: Apply Database Schema ---"
read -p "Apply schema to remote database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler d1 execute voting-platform --remote --file=schema.sql 2>&1
    echo "✓ Schema applied"
fi

echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Edit wrangler.toml and set your account_id: wrangler whoami"
echo "  2. Deploy: pnpm build && pnpm deploy"
echo ""
echo "For local development:"
echo "  pnpm dev"
echo ""
