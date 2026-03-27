# 🔧 Quick Fix Guide

## Issue #1: Protect Admin Endpoints

### Current Code (VULNERABLE)
```typescript
// app/api/admin/users/route.ts
export async function GET() {
  const users = await prisma.user.findMany(); // ❌ NO PROTECTION
  return NextResponse.json({ success: true, data: result });
}
```

### Fixed Code
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/require-session";
import { isAdminEmail } from "@/server/admin/admin-access";
import { getUserFromSession } from "@/server/auth/getUserFromSession";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await getUserFromSession(session.userId);
    
    if (!isAdminEmail(user.email)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
```

### Files to Fix (All Admin Endpoints)
- `app/api/admin/users/route.ts`
- `app/api/admin/companies/[id]/route.ts`
- `app/api/admin/companies/route.ts`
- `app/api/admin/integrations/route.ts`

---

## Issue #2: Remove Debug Logs

### Current Code
```typescript
// app/api/map/orders/route.ts
console.log("PERF retailOrders count:", result.orders.length);
console.log("PERF retailOrders load ms:", Date.now() - requestStartedAt);
console.log("GEOCODING DB CACHE HIT:", {...});

// app/api/route-ai/plan/route.ts
console.log("AI REQUEST FROM COMPANY:", session.companyId);
```

### Fixed Code
```typescript
import { logDebug } from "@/lib/observability/logger";

// Only in dev/debug mode
if (process.env.DEBUG_LOGS === "true") {
  logDebug({
    event: "perf.retail_orders",
    count: result.orders.length,
    durationMs: Date.now() - requestStartedAt,
  });
}
```

### Files to Check
- `app/api/map/orders/route.ts` - Lines with PERF logs
- `app/api/route-ai/plan/route.ts` - Line with AI REQUEST log
- Check all admin endpoints for console.log

---

## Issue #3: Create Multi-Tenant Access Helper

### New Helper Function

Create: `server/auth/require-company-resource.ts`

```typescript
import { prisma } from "@/lib/prisma";

export async function requireResourceBelongsToCompany(
  resourceCompanyId: string,
  sessionCompanyId: string,
  resourceType: string = "Resource"
) {
  if (resourceCompanyId !== sessionCompanyId) {
    throw new Error(`${resourceType} not found (forbidden)`);
  }
}

// Usage in endpoints:
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  const { id } = await context.params;
  
  const order = await prisma.order.findUnique({ where: { id } });
  
  // ✅ Verify order belongs to user's company
  await requireResourceBelongsToCompany(
    order!.companyId,
    session.companyId,
    "Order"
  );
  
  // Now safe to proceed
  await prisma.order.delete({ where: { id } });
}
```

---

## Issue #4: Standardize Error Handling

### Use Existing Error Handler

The project already has: `lib/api/api-error-handler.ts`

**Before (inconsistent):**
```typescript
catch (error: any) {
  console.error("Error:", error);
  return NextResponse.json({
    success: false,
    message: error?.message,
    error: String(error), // ❌ Exposes internals
  }, { status: 500 });
}
```

**After (consistent):**
```typescript
import { handleApiError } from "@/lib/api/api-error-handler";

try {
  // ... endpoint logic
} catch (error) {
  return handleApiError(error);
}
```

---

## Estimated Time to Fix

| Issue | Time | Priority |
|-------|------|----------|
| Admin endpoint protection | 30-45 min | 🔴 CRITICAL |
| Remove debug logs | 15-30 min | 🔴 CRITICAL |
| Add access helper | 20-30 min | 🟡 HIGH |
| Standardize error handling | 45 min - 1h | 🟡 HIGH |

**Total:** ~2-2.5 hours for all Priority 1 items

---

## Testing Checklist After Fixes

- [ ] Non-admin user cannot access /api/admin endpoints (404 or 403)
- [ ] Admin user can access /api/admin endpoints
- [ ] User from Company A cannot see Company B's resources
- [ ] No debug logs appear in production console
- [ ] Error responses don't leak sensitive information
- [ ] All endpoints still work as expected

