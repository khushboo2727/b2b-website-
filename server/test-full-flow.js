
const BASE_URL = 'http://127.0.0.1:5000/api';

// Utilities
const log = (msg, type = 'INFO') => console.log(`[${type}] ${msg}`);
const fail = (msg) => { console.error(`[FAIL] ${msg}`); process.exit(1); };
const pass = (msg) => console.log(`[PASS] ${msg}`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const randomString = () => Math.random().toString(36).substring(7);

async function waitForServer(retries = 10, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            await fetch(BASE_URL.replace('/api', '')); // Ping root or valid endpoint
            log('Server is UP.');
            return true;
        } catch (e) {
            log(`Waiting for server... (${i + 1}/${retries})`);
            await sleep(delay);
        }
    }
    return false;
}

async function runTests() {
    log('Starting Full Website System Test...');

    if (!(await waitForServer())) {
        fail('Server is not reachable after multiple attempts. Please ensure "npm run dev" is running in the server directory without errors.');
    }

    // 1. ADMIN CREATION (Should Fail)
    log('Test 1: Admin Registration Restriction');
    const adminRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Admin Attack',
            email: `admin_${randomString()}@test.com`,
            password: 'password123',
            role: 'admin'
        })
    });
    if (adminRes.status === 400) {
        pass('Admin registration blocked as expected (Validation Error).');
    } else {
        log(`Admin Reg Status: ${adminRes.status}`);
        const txt = await adminRes.text();
        // It might succeed if I missed something, but schema says enum ['buyer', 'seller']
        if (adminRes.ok) fail('Security Alert: Admin role was allowed via public API!');
        else pass('Admin registration failed (likely validation).');
    }


    // 2. SELLER REGISTRATION (Should Succeed)
    log('Test 2: Seller Registration');
    const sellerEmail = `seller_${randomString()}@test.com`;
    const sellerRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Seller',
            email: sellerEmail,
            password: 'password123',
            role: 'seller',
            companyName: 'Test Seller Co'
        })
    });

    let sellerToken;
    if (sellerRes.ok) {
        const data = await sellerRes.json();
        sellerToken = data.token;
        pass(`Seller Registered: ${sellerEmail}`);
    } else {
        const txt = await sellerRes.text();
        fail(`Seller Reg Failed: ${txt}`);
    }

    // Need a product for leads
    log('Test 2.1: Create Product (for Seller)');
    // Login first? Register returns token.
    const prodRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
            title: 'Test Fiber',
            category: 'Textiles',
            description: 'High quality fiber',
            price: 100,
            specifications: { minimumOrderQuantity: 10 }
        })
    });
    let productId;
    if (prodRes.ok) {
        const p = await prodRes.json();
        productId = p._id;
        pass('Product Created successfully.');
    } else {
        console.log(await prodRes.text());
        fail('Product creation failed.');
    }


    // 3. BUYER REGISTRATION (Unverified)
    log('Test 3: Unverified Buyer Registration');
    const buyerEmail = `buyer_${randomString()}@test.com`;
    const buyerRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Buyer',
            email: buyerEmail,
            password: 'password123',
            role: 'buyer'
        })
    });

    let buyerToken;
    if (buyerRes.ok) {
        const data = await buyerRes.json();
        buyerToken = data.token;
        pass(`Buyer Registered: ${buyerEmail}`);
    } else {
        fail('Buyer Reg Failed');
    }


    // 4. LEAD LIMIT CHECK (Unverified)
    log('Test 4: Lead Limits (Unverified = Max 3)');

    // Send 3 leads
    for (let i = 1; i <= 3; i++) {
        const res = await fetch(`${BASE_URL}/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${buyerToken}`
            },
            body: JSON.stringify({
                productId,
                message: `Inquiry ${i}`,
                buyerContact: { name: 'Buyer', email: buyerEmail },
                quantity: 100,
                // New fields
                importProduct: 'Fiber',
                annualVolume: '1000',
                targetPriceRange: '10-20',
                lastImportCountry: 'India',
                frequency: 'Monthly'
            })
        });
        if (res.ok) pass(`Lead ${i} sent.`);
        else fail(`Lead ${i} failed: ${await res.text()}`);
    }

    // Send 4th lead (Should Fail)
    const limitRes = await fetch(`${BASE_URL}/leads`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${buyerToken}`
        },
        body: JSON.stringify({
            productId,
            message: 'Inquiry 4 (Should Fail)',
            buyerContact: { name: 'Buyer', email: buyerEmail },
            importProduct: 'Fiber'
        })
    });

    if (limitRes.status === 403) {
        pass('4th Lead Blocked (Limit Reached) [CORRECT]');
    } else {
        fail(`4th Lead was NOT blocked! Status: ${limitRes.status}`);
    }


    // 5. VERIFICATION FLOW
    log('Test 5: Buyer Verification Flow');
    // Update Profile with matching domain
    // We need a buyer with email matching a real old domain. 
    // Register new verified buyer candidate
    const verifiedEmail = `admin_${randomString()}@niryatbusiness.com`; // Matches niryatbusiness.com
    const vUserRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Verified Candidate',
            email: verifiedEmail,
            password: 'password123',
            role: 'buyer'
        })
    });
    const vData = await vUserRes.json();
    const vToken = vData.token;

    // Update Profile to trigger verification
    log(`Attempting verification for ${verifiedEmail} with domain niryatbusiness.com`);
    const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${vToken}`
        },
        body: JSON.stringify({
            domainName: 'niryatbusiness.com'
        })
    });

    const vUser = await updateRes.json();
    if (vUser.verified && vUser.status === 'approved') {
        pass('Buyer Verified Successfully! (Domain Age > 6mo + Email Match)');
    } else {
        fail(`Verification Failed. Verified: ${vUser.verified}, Status: ${vUser.status}`);
    }

    // 6. UNLIMITED LEADS CHECK
    log('Test 6: Verified Buyer Unlimited Leads');
    // Send 4 leads
    for (let i = 1; i <= 4; i++) {
        const res = await fetch(`${BASE_URL}/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${vToken}`
            },
            body: JSON.stringify({
                productId,
                message: `Verified Inquiry ${i}`,
                buyerContact: { name: 'V Buyer', email: verifiedEmail },
                importProduct: 'Test',
                frequency: 'Yearly'
            })
        });
        if (!res.ok) fail(`Verified Lead ${i} blocked! Status: ${res.status}`);
    }
    pass('Verified Buyer sent > 3 leads successfully.');

    log('ALL SYSTEM TESTS PASSED.');
}

runTests().catch(err => {
    console.error('Test Script Error:', err);
});
