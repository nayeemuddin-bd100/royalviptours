#!/usr/bin/env node

import http from 'http';

const BASE_URL = 'http://localhost:5000';
let authToken = '';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting E2E Tests for Travel Agent Workflow...\n');

  try {
    // Test 1: Login as travel agent
    console.log('1️⃣  Logging in as travel@test.com user...');
    let res = await request('POST', '/api/login', {
      email: 'travel@test.com',
      password: 'travel123',
    });
    if (res.status !== 200) {
      console.error('❌ Travel agent login failed:', res.data);
      process.exit(1);
    }
    authToken = res.data.accessToken;
    const userId = res.data.id;
    console.log(`✅ Travel agent login successful (ID: ${userId})\n`);

    // Test 3: Fetch quotes
    console.log('3️⃣  Fetching quotes for travel@test.com...');
    res = await request('GET', '/api/quotes');
    if (res.status !== 200) {
      console.error('❌ Failed to fetch quotes:', res.data);
      process.exit(1);
    }
    const quotes = res.data;
    console.log(`✅ Fetched ${quotes.length} quotes\n`);

    if (quotes.length === 0) {
      console.log('⚠️  No quotes found for travel@test.com');
    } else {
      console.log('Sample quote:');
      console.log(`  - ID: ${quotes[0].id?.slice(0, 8)}`);
      console.log(`  - Total: $${quotes[0].total}`);
      console.log(`  - Currency: ${quotes[0].currency}\n`);
    }

    // Test 4: Check agency profile
    console.log('4️⃣  Checking agency profile...');
    res = await request('GET', '/api/agency/profile');
    if (res.status !== 200) {
      console.error('❌ Failed to fetch agency profile:', res.data);
      process.exit(1);
    }
    const agency = res.data;
    console.log('✅ Agency profile retrieved');
    console.log(`  - Name: ${agency.legalName}`);
    console.log(`  - Country: ${agency.country}\n`);

    // Test 5: Check RFQs
    console.log('5️⃣  Checking RFQs...');
    res = await request('GET', '/api/rfqs');
    if (res.status !== 200) {
      console.error('❌ Failed to fetch RFQs:', res.data);
      process.exit(1);
    }
    const rfqs = res.data;
    console.log(`✅ Fetched ${rfqs.length} RFQs\n`);

    // Summary
    console.log('════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Agency: ${agency.legalName}`);
    console.log(`  - RFQs: ${rfqs.length}`);
    console.log(`  - Quotes: ${quotes.length}`);
    console.log('════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(runTests, 2000);
