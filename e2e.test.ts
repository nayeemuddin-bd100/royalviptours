/**
 * E2E Tests for Role-Based Registration System
 * Tests:
 * 1. User Registration - Create new accounts
 * 2. Travel Agency Request - Apply for travel agent role
 * 3. Supplier Request - Apply for transport supplier role
 * 4. Admin Approval - Admin approves/rejects requests
 * 5. Role Update - User gets new role after approval
 */

const BASE_URL = "http://localhost:5000";

// Helper function to make API requests
async function apiRequest(method: string, path: string, body?: any, token?: string) {
  const headers: any = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return { status: response.status, data };
}

// Test data
const testUsers = {
  normalUser: {
    name: "John Normal",
    email: `normal-${Date.now()}@test.com`,
    password: "password123",
    passwordConfirm: "password123",
  },
  travelAgent: {
    name: "Jane Travel Agent",
    email: `agent-${Date.now()}@test.com`,
    password: "password123",
    passwordConfirm: "password123",
  },
  supplier: {
    name: "Bob Supplier",
    email: `supplier-${Date.now()}@test.com`,
    password: "password123",
    passwordConfirm: "password123",
  },
  admin: {
    email: "e2e-admin-test@test.com",
    password: "testadmin123",
  },
};

let tokens = {
  normalUser: "",
  travelAgent: "",
  supplier: "",
  admin: "",
};

let userIds = {
  normalUser: "",
  travelAgent: "",
  supplier: "",
};

let requestIds = {
  agencyRequest: "",
  supplierRequest: "",
};

// ===== TEST 1: User Registration =====
async function testRegistration() {
  console.log("\n🔐 TEST 1: User Registration");
  console.log("==============================");

  // Register normal user 1
  console.log("\n📝 Registering first normal user...");
  let { status, data } = await apiRequest("POST", "/api/register", testUsers.normalUser);
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Registered: ${testUsers.normalUser.email}`);
  console.log(`   User role: ${data.role}`);
  console.log(`   Expected role: user`);
  if (data.role !== "user") {
    console.error(`   ❌ Wrong role! Expected 'user', got '${data.role}'`);
    return false;
  }
  tokens.normalUser = data.accessToken;
  userIds.normalUser = data.id;

  // Register travel agent user
  console.log("\n📝 Registering second normal user (for agency role)...");
  ({ status, data } = await apiRequest("POST", "/api/register", testUsers.travelAgent));
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Registered: ${testUsers.travelAgent.email}`);
  console.log(`   User role: ${data.role}`);
  tokens.travelAgent = data.accessToken;
  userIds.travelAgent = data.id;

  // Register supplier user
  console.log("\n📝 Registering third normal user (for supplier role)...");
  ({ status, data } = await apiRequest("POST", "/api/register", testUsers.supplier));
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Registered: ${testUsers.supplier.email}`);
  console.log(`   User role: ${data.role}`);
  tokens.supplier = data.accessToken;
  userIds.supplier = data.id;

  console.log("\n✅ Registration test passed!");
  return true;
}

// ===== TEST 2: Travel Agency Role Request =====
async function testTravelAgencyRequest() {
  console.log("\n🏢 TEST 2: Travel Agency Role Request");
  console.log("=========================================");

  console.log("\n📋 Travel agent user applying for travel_agent role...");
  let { status, data } = await apiRequest(
    "POST",
    "/api/role-requests",
    { requestType: "travel_agent" },
    tokens.travelAgent
  );
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Role request created`);
  console.log(`   Request ID: ${data.id}`);
  console.log(`   Request type: ${data.requestType}`);
  console.log(`   Status: ${data.status}`);
  requestIds.agencyRequest = data.id;

  // Verify request appears in user's current request
  console.log("\n✅ Verifying user can see their request...");
  ({ status, data } = await apiRequest(
    "GET",
    "/api/role-requests/my-request",
    undefined,
    tokens.travelAgent
  ));
  console.log(`   Status: ${status}`);
  if (!data || data.requestType !== "travel_agent") {
    console.error(`   ❌ Failed to retrieve user's request`);
    return false;
  }
  console.log(`   ✅ User request visible`);

  // Try to apply for another role (should fail)
  console.log("\n✅ Testing single active request constraint...");
  ({ status, data } = await apiRequest(
    "POST",
    "/api/role-requests",
    { requestType: "hotel" },
    tokens.travelAgent
  ));
  console.log(`   Status: ${status}`);
  if (status === 200) {
    console.error(`   ❌ Should have failed! User can't have multiple pending requests`);
    return false;
  }
  console.log(`   ✅ Correctly blocked second request: ${data.message}`);

  console.log("\n✅ Travel agency request test passed!");
  return true;
}

// ===== TEST 3: Supplier Role Request =====
async function testSupplierRequest() {
  console.log("\n🚐 TEST 3: Supplier Role Request");
  console.log("==================================");

  console.log("\n📋 Supplier user applying for transport role...");
  let { status, data } = await apiRequest(
    "POST",
    "/api/role-requests",
    { requestType: "transport" },
    tokens.supplier
  );
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Role request created`);
  console.log(`   Request ID: ${data.id}`);
  console.log(`   Request type: ${data.requestType}`);
  console.log(`   Status: ${data.status}`);
  requestIds.supplierRequest = data.id;

  console.log("\n✅ Supplier request test passed!");
  return true;
}

// ===== TEST 4: Admin Views Pending Requests =====
async function testAdminViewRequests() {
  console.log("\n👨‍💼 TEST 4: Admin Views Pending Requests");
  console.log("========================================");

  // Login as admin
  console.log("\n🔑 Admin logging in...");
  let { status, data } = await apiRequest("POST", "/api/login", {
    email: testUsers.admin.email,
    password: testUsers.admin.password,
  });
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Admin login failed: ${data.message}`);
    return false;
  }
  tokens.admin = data.accessToken;
  console.log(`   ✅ Admin logged in`);

  console.log("\n📋 Admin viewing all role requests...");
  ({ status, data } = await apiRequest(
    "GET",
    "/api/admin/role-requests",
    undefined,
    tokens.admin
  ));
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed to fetch requests: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Retrieved ${data.length} requests`);

  const agencyReq = data.find((r: any) => r.id === requestIds.agencyRequest);
  const supplierReq = data.find((r: any) => r.id === requestIds.supplierRequest);

  if (!agencyReq) {
    console.error(`   ❌ Agency request not found in admin view`);
    return false;
  }
  console.log(`   ✅ Found agency request: ${agencyReq.requestType} (${agencyReq.status})`);

  if (!supplierReq) {
    console.error(`   ❌ Supplier request not found in admin view`);
    return false;
  }
  console.log(`   ✅ Found supplier request: ${supplierReq.requestType} (${supplierReq.status})`);

  console.log("\n✅ Admin view test passed!");
  return true;
}

// ===== TEST 5: Admin Approves Agency Request =====
async function testAdminApprove() {
  console.log("\n✅ TEST 5: Admin Approves Agency Request");
  console.log("==========================================");

  console.log("\n👍 Admin approving agency request...");
  let { status, data } = await apiRequest(
    "POST",
    `/api/admin/role-requests/${requestIds.agencyRequest}/approve`,
    {},
    tokens.admin
  );
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed to approve: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Request approved`);

  // Verify user's role has been updated
  console.log("\n🔍 Verifying travel agent's role was updated...");
  ({ status, data } = await apiRequest("GET", "/api/user", undefined, tokens.travelAgent));
  console.log(`   Status: ${status}`);
  console.log(`   User role: ${data.role}`);
  console.log(`   Expected: travel_agent`);
  if (data.role !== "travel_agent") {
    console.error(`   ❌ Role not updated! Still '${data.role}'`);
    return false;
  }
  console.log(`   ✅ User role successfully updated to travel_agent`);

  console.log("\n✅ Admin approval test passed!");
  return true;
}

// ===== TEST 6: Admin Rejects Supplier Request =====
async function testAdminReject() {
  console.log("\n❌ TEST 6: Admin Rejects Supplier Request");
  console.log("==========================================");

  console.log("\n👎 Admin rejecting supplier request with note...");
  let { status, data } = await apiRequest(
    "POST",
    `/api/admin/role-requests/${requestIds.supplierRequest}/reject`,
    { rejectionNote: "Incomplete supplier information. Please provide more details." },
    tokens.admin
  );
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed to reject: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Request rejected with note`);

  // Verify supplier can see rejection note
  console.log("\n👀 Supplier viewing rejection...");
  ({ status, data } = await apiRequest(
    "GET",
    "/api/role-requests/my-request",
    undefined,
    tokens.supplier
  ));
  console.log(`   Status: ${status}`);
  console.log(`   Request status: ${data.status}`);
  console.log(`   Rejection note: "${data.rejectionNote}"`);
  if (data.status !== "rejected") {
    console.error(`   ❌ Status not updated to rejected`);
    return false;
  }
  console.log(`   ✅ Rejection visible to supplier`);

  // Delete the rejected request so supplier can apply again
  console.log("\n🗑️ Supplier deleting rejected request...");
  ({ status, data } = await apiRequest(
    "DELETE",
    `/api/role-requests/${requestIds.supplierRequest}`,
    undefined,
    tokens.supplier
  ));
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed to delete: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Rejected request deleted`);

  // Verify supplier can now apply for a new role
  console.log("\n📝 Supplier reapplying with different role...");
  ({ status, data } = await apiRequest(
    "POST",
    "/api/role-requests",
    { requestType: "hotel" },
    tokens.supplier
  ));
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed to submit new request: ${data.message}`);
    return false;
  }
  console.log(`   ✅ New request submitted (hotel role)`);
  requestIds.supplierRequest = data.id;

  console.log("\n✅ Admin rejection test passed!");
  return true;
}

// ===== TEST 7: User Cancels Request =====
async function testCancelRequest() {
  console.log("\n🚫 TEST 7: User Cancels Request");
  console.log("================================");

  console.log("\n🗑️ Supplier canceling their pending request...");
  let { status, data } = await apiRequest(
    "DELETE",
    `/api/role-requests/${requestIds.supplierRequest}`,
    undefined,
    tokens.supplier
  );
  console.log(`   Status: ${status}`);
  if (status !== 200) {
    console.error(`   ❌ Failed to cancel: ${data.message}`);
    return false;
  }
  console.log(`   ✅ Request canceled`);

  // Verify request is gone
  console.log("\n🔍 Verifying request was deleted...");
  ({ status, data } = await apiRequest(
    "GET",
    "/api/role-requests/my-request",
    undefined,
    tokens.supplier
  ));
  console.log(`   Status: ${status}`);
  if (data !== null) {
    console.error(`   ❌ Request still exists!`);
    return false;
  }
  console.log(`   ✅ No active request for supplier`);

  console.log("\n✅ Cancel request test passed!");
  return true;
}

// ===== MAIN TEST RUNNER =====
async function runAllTests() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║     Role-Based Registration System - E2E Tests                 ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  const tests = [
    { name: "Registration", fn: testRegistration },
    { name: "Travel Agency Request", fn: testTravelAgencyRequest },
    { name: "Supplier Request", fn: testSupplierRequest },
    { name: "Admin Views Requests", fn: testAdminViewRequests },
    { name: "Admin Approves", fn: testAdminApprove },
    { name: "Admin Rejects", fn: testAdminReject },
    { name: "Cancel Request", fn: testCancelRequest },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(`\n💥 Test crashed: ${error}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Print summary
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║                      TEST SUMMARY                              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
    if (result.passed) passed++;
    else failed++;
  }

  console.log(`\n📊 Total: ${passed} passed, ${failed} failed out of ${results.length} tests\n`);

  return failed === 0;
}

// Run tests
runAllTests().then((success) => {
  process.exit(success ? 0 : 1);
});
