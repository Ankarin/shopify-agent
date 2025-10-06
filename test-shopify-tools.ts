import { ShopifyClient } from './src/lib/shopify/client';
import {
    createListProductsTool,
    createGetProductTool,
    createLookupOrderByEmailTool,
    createLookupOrderByNumberTool,
} from './src/tools/shopify';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || 'your-store.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_DOMAIN) {
    console.error('❌ Missing environment variables!');
    console.error('Please set SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN');
    process.exit(1);
}

const shopifyClient = new ShopifyClient({
    domain: SHOPIFY_DOMAIN,
    accessToken: SHOPIFY_ACCESS_TOKEN,
});

const tools = {
    listProducts: createListProductsTool(shopifyClient),
    getProduct: createGetProductTool(shopifyClient),
    lookupOrderByEmail: createLookupOrderByEmailTool(shopifyClient),
    lookupOrderByNumber: createLookupOrderByNumberTool(shopifyClient),
};

async function testListProducts() {
    console.log('\n🧪 Testing: listProducts');
    console.log('─'.repeat(50));

    try {
        console.log('Test 1: List 5 products');
        const result1 = await tools.listProducts.execute?.({ limit: 5 }, { toolCallId: 'test-1', messages: [] });
        if (!result1 || typeof result1 === 'symbol' || Symbol.asyncIterator in result1) {
            throw new Error('Unexpected result type');
        }
        console.log(`✅ Success! Found ${result1.length} products`);
        console.log('First product:', result1[0]);

        console.log('\nTest 2: List 20 products (default)');
        const result2 = await tools.listProducts.execute?.({ limit: 20 }, { toolCallId: 'test-2', messages: [] });
        if (!result2 || typeof result2 === 'symbol' || Symbol.asyncIterator in result2) {
            throw new Error('Unexpected result type');
        }
        console.log(`✅ Success! Found ${result2.length} products`);

        console.log('\nTest 3: List 1 product');
        const result3 = await tools.listProducts.execute?.({ limit: 1 }, { toolCallId: 'test-3', messages: [] });
        if (!result3 || typeof result3 === 'symbol' || Symbol.asyncIterator in result3) {
            throw new Error('Unexpected result type');
        }
        console.log(`✅ Success! Found ${result3.length} products`);

        return { success: true, productId: result1[0]?.id };
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        return { success: false };
    }
}

async function testGetProduct(productId?: string) {
    console.log('\n🧪 Testing: getProduct');
    console.log('─'.repeat(50));

    if (!productId) {
        console.log('⚠️  Skipped: No product ID available from listProducts');
        return { success: false };
    }

    try {
        console.log(`Test: Get product ${productId}`);
        const result = await tools.getProduct.execute?.({ productId }, { toolCallId: 'test-get-product', messages: [] });
        if (!result || typeof result === 'symbol' || Symbol.asyncIterator in result) {
            throw new Error('Unexpected result type');
        }
        console.log(`✅ Success! Product: ${result.title}`);
        console.log(`   Description: ${result.description?.substring(0, 100)}...`);
        console.log(`   Variants: ${result.variants.length}`);
        console.log(`   Images: ${result.images.length}`);
        console.log('   First variant:', result.variants[0]);

        return { success: true };
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        return { success: false };
    }
}

async function testLookupOrderByEmail() {
    console.log('\n🧪 Testing: lookupOrderByEmail');
    console.log('─'.repeat(50));

    const testEmail = process.env.TEST_EMAIL;

    if (!testEmail) {
        console.log('⚠️  Skipped: Set TEST_EMAIL environment variable to test');
        return { success: false };
    }

    try {
        console.log(`Test 1: Lookup orders for ${testEmail} (limit: 5)`);
        const result1 = await tools.lookupOrderByEmail.execute?.({
            email: testEmail,
            limit: 5,
        }, { toolCallId: 'test-email-1', messages: [] });
        if (!result1 || typeof result1 === 'symbol' || typeof result1 !== 'string') {
            throw new Error('Unexpected result type');
        }
        console.log(`✅ Success! Found orders`);
        console.log(result1.substring(0, 300) + '...');

        console.log('\nTest 2: Lookup most recent order (limit: 1)');
        const result2 = await tools.lookupOrderByEmail.execute?.({
            email: testEmail,
            limit: 1,
        }, { toolCallId: 'test-email-2', messages: [] });
        if (!result2 || typeof result2 === 'symbol' || typeof result2 !== 'string') {
            throw new Error('Unexpected result type');
        }
        console.log(`✅ Success! Found most recent order`);

        return { success: true };
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        return { success: false };
    }
}

async function testLookupOrderByNumber() {
    console.log('\n🧪 Testing: lookupOrderByNumber');
    console.log('─'.repeat(50));

    const testOrderNumber = process.env.TEST_ORDER_NUMBER;

    if (!testOrderNumber) {
        console.log('⚠️  Skipped: Set TEST_ORDER_NUMBER environment variable to test');
        return { success: false };
    }

    try {
        console.log(`Test: Lookup order ${testOrderNumber}`);
        const result = await tools.lookupOrderByNumber.execute?.({
            orderNumber: testOrderNumber,
        }, { toolCallId: 'test-order-number', messages: [] });
        if (!result || typeof result === 'symbol' || typeof result !== 'string') {
            throw new Error('Unexpected result type');
        }
        console.log(`✅ Success! Found order`);
        console.log(result.substring(0, 300) + '...');

        return { success: true };
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        return { success: false };
    }
}

async function runAllTests() {
    console.log('🚀 Starting Shopify Tools Test Suite');
    console.log('═'.repeat(50));
    console.log(`Domain: ${SHOPIFY_DOMAIN}`);
    console.log(`Access Token: ${SHOPIFY_ACCESS_TOKEN.substring(0, 10)}...`);

    const results = {
        listProducts: { success: false },
        getProduct: { success: false },
        lookupOrderByEmail: { success: false },
        lookupOrderByNumber: { success: false },
    };

    const listProductsResult = await testListProducts();
    results.listProducts = listProductsResult;

    const getProductResult = await testGetProduct(listProductsResult.productId);
    results.getProduct = getProductResult;

    const lookupOrderByEmailResult = await testLookupOrderByEmail();
    results.lookupOrderByEmail = lookupOrderByEmailResult;

    const lookupOrderByNumberResult = await testLookupOrderByNumber();
    results.lookupOrderByNumber = lookupOrderByNumberResult;

    console.log('\n📊 Test Results Summary');
    console.log('═'.repeat(50));
    console.log(`✅ listProducts: ${results.listProducts.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ getProduct: ${results.getProduct.success ? 'PASSED' : 'FAILED'}`);
    console.log(
        `${results.lookupOrderByEmail.success ? '✅' : '⚠️ '} lookupOrderByEmail: ${results.lookupOrderByEmail.success ? 'PASSED' : 'SKIPPED/FAILED'}`,
    );
    console.log(
        `${results.lookupOrderByNumber.success ? '✅' : '⚠️ '} lookupOrderByNumber: ${results.lookupOrderByNumber.success ? 'PASSED' : 'SKIPPED/FAILED'}`,
    );

    const totalTests = 4;
    const passedTests = Object.values(results).filter((r) => r.success).length;

    console.log('\n' + '═'.repeat(50));
    console.log(`📈 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed!');
    } else if (passedTests >= 2) {
        console.log('⚠️  Some tests skipped or failed (check optional env vars)');
    } else {
        console.log('❌ Critical tests failed!');
        process.exit(1);
    }
}

runAllTests().catch((error) => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
});
