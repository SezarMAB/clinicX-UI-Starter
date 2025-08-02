# Testing Tenant Switching

## Prerequisites
1. Make sure the backend is running on `http://localhost:8080`
2. Make sure the frontend is running on `http://localhost:4200`
3. Have at least 2 tenants configured in your backend

## Test Steps

### 1. Login and Check Initial State
1. Navigate to `http://localhost:4200`
2. Login with a user that has access to multiple tenants
3. Open browser Developer Tools (F12)
4. Check the Console for:
   - "Fetched user tenants:" log with array of tenants
   - No errors related to tenant fetching

### 2. Test Tenant Switcher UI
1. Look for the tenant switcher button in the header (shows business icon + tenant name)
2. Click on it to open the dropdown
3. Verify:
   - All accessible tenants are listed
   - Current tenant has a check mark
   - Each tenant shows name, specialty badge, and role

### 3. Test Switching Tenants
1. Click on a different tenant in the dropdown
2. Watch the Console for:
   - "Tenant switch successful:" log
   - No errors
3. Verify:
   - Success snackbar appears: "Switched to [Tenant Name]"
   - Page redirects to dashboard
   - Tenant switcher now shows the new tenant name
   - API calls now include the new tenant ID in X-Tenant-ID header

### 4. Test Error Handling
1. To simulate an error, temporarily change the backend URL in the code
2. Try switching tenants
3. Verify:
   - Error snackbar appears: "Failed to switch tenant. Please try again."
   - App doesn't crash
   - User can still use the app

### 5. Verify Persistence
1. After switching tenants, refresh the page
2. Verify:
   - User remains logged in
   - The selected tenant is maintained
   - Tenant information is correctly loaded

## API Verification

### Check Network Tab
When switching tenants, you should see:
1. `POST http://localhost:8080/api/auth/switch-tenant?tenantId=TENANT_ID`
2. Response should include the new token or success status
3. Subsequent API calls should include `X-Tenant-ID: TENANT_ID` header

### Manual API Test
You can test the API directly:
```bash
curl -X 'POST' \
  'http://localhost:8080/api/auth/switch-tenant?tenantId=YOUR_TENANT_ID' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d ''
```

## Common Issues

### 1. CORS Errors
- Make sure backend allows frontend origin
- Check proxy configuration in `proxy.conf.json`

### 2. 401 Unauthorized
- Token might be expired
- Try logging out and logging in again

### 3. Empty Tenant List
- Check backend logs
- Verify user has tenants assigned in the backend
- Check the API response in Network tab

### 4. Switching Doesn't Work
- Check Console for errors
- Verify the tenant ID is correct
- Check backend logs for errors

## Debug Information

To enable more detailed logging:
1. Open browser console
2. Set localStorage: `localStorage.setItem('debug', 'true')`
3. Refresh the page
4. Try switching tenants again