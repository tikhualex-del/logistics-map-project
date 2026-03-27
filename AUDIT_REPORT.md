# 🔐 Аудит проекта logistics-map SaaS

**Дата:** 27 марта 2026  
**Статус:** ⚠️ НАЙДЕНЫ КРИТИЧЕСКИЕ ПРОБЛЕМЫ

---

## 📊 Результаты аудита

| Область | Статус | Комментарий |
|---------|--------|-----------|
| Multi-tenant изоляция (DB) | ✅ Хорошо | Schema правильная, все связи через companyId |
| Auth & Session управление | ✅ Хорошо | Cookie-based, requireSession работает |
| Role-based access control | ✅ Хорошо | Правильно реализовано для пользовательских endpoints |
| **Admin endpoints security** | 🔴 КРИТИЧНО | **НЕ ЗАЩИЩЕНЫ** от доступа неадминов |
| API multi-tenant проверки | ⚠️ Средне | Требует проверки каждого endpoint |
| Logging/Observability | ⚠️ Средне | console.log зашифрованные данные, нужно аудитировать |
| Error handling | ⚠️ Средне | Есть фрагментированный подход, нет глобальной обработки |
| Configuration & Secrets | ⚠️ Средне | Нужна проверка .env файлов |
| Rate limiting | ✅ Хорошо | Реализован для login endpoint |
| Security headers | ✅ Хорошо | Установлены в next.config.ts |

---

## 🔴 КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 1. **Admin endpoints полностью открыты для всех пользователей**

**Файлы:** 
- [app/api/admin/users/route.ts](app/api/admin/users/route.ts)
- [app/api/admin/companies/[id]/route.ts](app/api/admin/companies/[id]/route.ts)
- [app/api/admin/integrations/route.ts](app/api/admin/integrations/route.ts)

**Проблема:**
```typescript
// ❌ УЯЗВИМО - нет проверки admin статуса
export async function GET() {
  const users = await prisma.user.findMany(); // Любой может получить всех пользователей!
  return NextResponse.json({ success: true, data: result });
}
```

**Риск:**
- Любой аутентифицированный пользователь может получить информацию о всех пользователях
- Любой может посмотреть компании, интеграции, справочные данные
- Нарушение принципа least privilege
- **Уязвимость: Information Disclosure (CWE-200)**

**Решение:**
```typescript
import { isAdminEmail } from "@/server/admin/admin-access";
import { requireSession } from "@/server/auth/require-session";

export async function GET() {
  const session = await requireSession();
  const user = await getUserFromSession(session.userId);
  
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ 
      success: false, 
      message: "Forbidden" 
    }, { status: 403 });
  }
  
  // ... основной код
}
```

---

## ⚠️ ВЫСОКИЕ ПРОБЛЕМЫ

### 2. **Функция `isAdminEmail` определена но не используется**

**Файл:** [server/admin/admin-access.ts](server/admin/admin-access.ts)

**Проблема:**
```typescript
export function isAdminEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return getAllowedAdminEmails().includes(normalizedEmail);
}
// ^ Определена но НЕ используется нигде в admin endpoints!
```

**Действие:** Необходимо использовать эту функцию во ВСЕХ admin endpoints

---

### 3. **Недостаточные проверки multi-tenant изоляции в некоторых endpoints**

**Проблема:**
- У многих endpoints есть проверка `session.companyId`, но не все
- Нет единого паттерна для проверки принадлежности ресурсов компании

**Пример (хороший):**
```typescript
export async function GET() {
  const session = await requireSession();
  const orders = await getOrdersByCompanyId(session.companyId); // ✅ Правильно
}
```

**Рекомендация:** Создать helper функцию для проверки доступа к ресурсам:
```typescript
export async function requireResourceBelongsToCompany(
  resourceCompanyId: string,
  sessionCompanyId: string
) {
  if (resourceCompanyId !== sessionCompanyId) {
    throw new Error("Forbidden");
  }
}
```

---

### 4. **Логирование потенциально чувствительных данных**

**Файлы:**
- [app/api/map/orders/route.ts](app/api/map/orders/route.ts#L275) - `console.log("PERF retailOrders count"...)`
- [app/api/route-ai/plan/route.ts](app/api/route-ai/plan/route.ts#L119) - `console.log("AI REQUEST FROM COMPANY"...)`

**Проблема:**
```typescript
console.log("PERF retailOrders count:", result.orders.length);
console.log("AI REQUEST FROM COMPANY:", session.companyId);
```

**Риск:**
- Логи могут попадать в production и содержать метаданные
- If logs aren't properly sanitized в production, может быть утечка данных

**Решение:** Использовать центральный logger с разными уровнями:
```typescript
logDebug({ event: "perf.orders", count: result.orders.length }); // Только в dev
```

---

## 📋 СРЕДНИЕ ПРОБЛЕМЫ

### 5. **Нет глобальной обработки ошибок в API**

**Проблема:**
- Каждый endpoint ловит ошибки по-своему
- Нет единого формата для ошибок
- Некоторые endpoints выставляют детальные ошибки в production

**Пример:**
```typescript
catch (error: any) {
  return NextResponse.json({
    success: false,
    message: error?.message || "Failed to load company",
    error: String(error), // ❌ Выставляет полный error в production!
  }, { status: 500 });
}
```

**Решение:** Использовать централизованный error handler (уже есть [lib/api/api-error-handler.ts](lib/api/api-error-handler.ts))

---

### 6. **Отсутствие валидации прав доступа для PATCH/PUT/DELETE операций**

**Проблема:**
- `requireMinRole()` вызывается, но базовая проверка sesion может быть недостаточной
- Нет проверки, что пользователь может удалить/обновить конкретный ресурс

**Например, что если:**
```
User A из Company A пытается обновить Order компании B через PUT /api/orders/[id]?
```

---

## ✅ ПОЛОЖИТЕЛЬНЫЕ МОМЕНТЫ

### 1. Database schema правильно спроектирована для multi-tenant

```prisma
model Company {
  id String @id
  memberships Membership[]
  sessions Session[]
  warehouses Warehouse[]
  integrations Integration[]
  orders Order[]
}
```

Все модели связаны через `companyId` - хорошая база для изоляции.

### 2. Auth middleware правильно защищает маршруты

```typescript
const PROTECTED_PATHS = ["/map", "/settings", "/admin"];
// Перенаправляет на /login если нет session_token
```

### 3. Role-based access control реализован правильно

```typescript
requireMinRole(session, "dispatcher"); // Проверка ролей работает
```

### 4. Security headers установлены

```typescript
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### 5. Rate limiting для login endpoint

[lib/security/login-rate-limit.ts](lib/security/login-rate-limit.ts) - хорошая практика

---

## 🛠️ РЕКОМЕНДАЦИИ ПО ПРИОРИТЕТАМ

### Priority 1 - НЕМЕДЛЕННО (этот спринт)
- [ ] Защитить все `/api/admin/*` endpoints с `isAdminEmail` проверкой
- [ ] Добавить валидацию принадлежности ресурса компании для DELETE/PATCH операций
- [ ] Аудитировать логирование - убрать sensitive данные из конcole.log

### Priority 2 - Скоро (следующий спринт)
- [ ] Создать центральный API error handler и использовать везде
- [ ] Добавить `requireResourceBelongsToCompany` helper функцию
- [ ] Прекратить использование `console.error/log` напрямую - использовать logger

### Priority 3 - Планировать (планирование)
- [ ] Реализовать audit logging для всех операций с чувствительными данными
- [ ] Добавить API rate limiting для всех endpoints (не только login)
- [ ] Регулярные security audits (ежемесячно или перед release)

---

## 📝 ФАЙЛЫ ДЛЯ ПРОВЕРКИ

Нужна дополнительная проверка:

1. **Environment файлы** (.env, .env.local) - на предмет exposed ключей
2. **Integration credentials** - как они шифруются? (credentialsEncryptedJson)
3. **Cron endpoints** - нужна проверка авторизации:
   - [app/api/cron/import-orders/route.ts](app/api/cron/import-orders/route.ts)
4. **RetailCRM webhook** - нужна валидация signature:
   - [app/api/retailcrm/orders/route.ts](app/api/retailcrm/orders/route.ts)
5. **Route-AI endpoints** - проверка авторизации:
   - [app/api/route-ai/plan/route.ts](app/api/route-ai/plan/route.ts)

---

## 🔗 Связанные файлы проекта

- Database schema: [prisma/schema.prisma](prisma/schema.prisma)
- Auth система: [server/auth/](server/auth/)
- API layer: [app/api/](app/api/)
- Admin panel: [server/admin/admin-access.ts](server/admin/admin-access.ts)
- Middleware: [middleware.ts](middleware.ts)

---

## 💬 Заключение

**Проект имеет хорошую базовую архитектуру для multi-tenant SaaS**, но **требует срочного внимания к security на admin endpoints**.

Основной риск: утечка информации о компаниях, пользователях и интеграциях из-за открытых admin endpoints.

**Рекомендуемое время на исправление:** 3-4 часа (Priority 1 исправления).
