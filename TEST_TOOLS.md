# Shopify Tools Test Suite

This test suite validates all Shopify API integrations and tools.

## Prerequisites

1. Shopify store with Admin API access
2. Valid Shopify Access Token with appropriate permissions
3. Environment variables configured

## Setup

### Required Environment Variables

Create or update your `.env.local` file:

```bash
# Required for all tests
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx

# Optional - for order lookup tests
TEST_EMAIL=customer@example.com
TEST_ORDER_NUMBER=#1001
```

### Required Shopify API Permissions

Your access token needs these permissions:
- `read_products` - For product queries
- `read_orders` - For order queries
- `read_customers` - For customer email lookups

## Running Tests

### Run all tests:
```bash
bun run test:tools
```

### Run with specific environment:
```bash
SHOPIFY_DOMAIN=mystore.myshopify.com SHOPIFY_ACCESS_TOKEN=shpat_xxx bun run test:tools
```

## What Gets Tested

### 1. ✅ listProducts
- List 5 products
- List 20 products (default)
- List 1 product
- Validates: product IDs, titles, descriptions, pricing

### 2. ✅ getProduct
- Fetch specific product by ID
- Validates: variants, images, inventory
- Uses product ID from listProducts test

### 3. ⚠️ lookupOrderByEmail (requires TEST_EMAIL)
- Lookup orders with limit of 5
- Lookup most recent order (limit 1)
- Validates: order formatting, tracking info

### 4. ⚠️ lookupOrderByNumber (requires TEST_ORDER_NUMBER)
- Lookup specific order by number
- Validates: order details, line items

## Expected Output

```
🚀 Starting Shopify Tools Test Suite
═════════════════════════════════════════════════
Domain: evolvepro.myshopify.com
Access Token: shpat_xxx...

🧪 Testing: listProducts
──────────────────────────────────────────────────
Test 1: List 5 products
✅ Success! Found 5 products
...

📊 Test Results Summary
═════════════════════════════════════════════════
✅ listProducts: PASSED
✅ getProduct: PASSED
⚠️  lookupOrderByEmail: SKIPPED/FAILED
⚠️  lookupOrderByNumber: SKIPPED/FAILED

═════════════════════════════════════════════════
📈 Overall: 2/4 tests passed
⚠️  Some tests skipped or failed (check optional env vars)
```

## Troubleshooting

### "Missing environment variables"
- Ensure SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN are set

### "Shopify GraphQL error: 401"
- Access token is invalid or expired
- Regenerate token from Shopify Admin

### "Shopify GraphQL error: 403"
- Access token lacks required permissions
- Update app permissions in Shopify Admin

### "No products found"
- Store has no products
- Check if products are published

### Tests skipped for orders
- Set TEST_EMAIL with a valid customer email
- Set TEST_ORDER_NUMBER with an existing order (e.g., #1001)

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Test Shopify Tools
  run: bun run test:tools
  env:
    SHOPIFY_DOMAIN: ${{ secrets.SHOPIFY_DOMAIN }}
    SHOPIFY_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ACCESS_TOKEN }}
```

## Notes

- Tests are read-only and safe to run against production
- Order tests are optional but recommended
- First two tests (products) should always pass if credentials are valid
- Test suite exits with code 1 if critical tests fail
