# Project: logistics-map SaaS

## 0. О проекте

Это multi-tenant SaaS платформа для логистики.

Позволяет компаниям:
- подключать внешние CRM (например retailCRM)
- получать и хранить заказы
- работать со складами
- визуализировать заказы на карте
- запускать базовую логистику без разработки

Главная цель продукта:
👉 довести клиента до первого результата (заказы на карте)

Главный принцип:
👉 не идеальный продукт, а ДОСТАТОЧНО хороший, чтобы продать первому клиенту


---

## 1. Tech Stack

Frontend:
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4 (частично)
- Inline styles (разрешены, не рефакторить без причины)

Backend:
- Next.js API routes
- Node.js runtime

Database:
- PostgreSQL
- Prisma ORM

State:
- Zustand (client state)
- Server-first подход (предпочтительно)

Auth:
- Кастомная система сессий (НЕ NextAuth)
- Cookie: `session_token`
- Модель Session в БД

Integrations:
- retailCRM
- HTTP client (retry, timeout, circuit breaker)

AI:
- OpenAI SDK
- Google GenAI

Validation:
- Zod

---

## 2. Архитектура

### Multi-tenant (КРИТИЧНО)

Все данные привязаны к:
- companyId
- userId

Основные модели:
- Company
- User
- Membership
- Session
- Integration
- IntegrationMapping
- Warehouse
- Order

👉 Любое изменение должно учитывать изоляцию компаний

---

### Auth

- Cookie-based (`session_token`)
- Middleware защищает:
  - `/map`
  - `/settings`
- Сессии хранятся в БД

❗ НЕ использовать NextAuth

---

### Основной user flow (НЕ ЛОМАТЬ)

1. Register
2. Login
3. `/settings` (launch dashboard)
4. Integrations
5. Mappings
6. Warehouses
7. Orders
8. Map

👉 Это критический путь продукта

---

## 3. Структура проекта


app/
(protected)/
settings/ # onboarding и настройки
map/ # основной value (карта)
orders/
warehouses/
api/ # backend endpoints

server/
integrations/
auth/
services/

lib/
http-client
logging
errors

prisma/
schema.prisma

store/
Zustand

types/
shared types


---

## 4. Команды

```bash
npm install
npm run dev
npm run build
npm start
npm run lint

Prisma:

npx prisma generate
npx prisma migrate dev
npx prisma studio
5. Environment
DATABASE_URL=postgresql://...

OPENAI_API_KEY=...
GOOGLE_AI_API_KEY=...

❗ Никогда не выносить ключи на клиент

6. Правила разработки
Главный принцип

👉 Каждое изменение должно приближать продукт к продаже

Если задача не влияет на:

onboarding
UX
стабильность
first value

❌ НЕ делать

7. UX правила (КРИТИЧНО)
1. Нет тупиков

Пользователь ВСЕГДА понимает:

где он
что делать дальше
2. Empty states

Нельзя:
❌ пустые экраны

Всегда:

объяснение
кнопка действия
3. First Value Fast

Цель:
👉 максимально быстро показать результат (карта)

4. Ошибки

Каждая ошибка должна отвечать:

что произошло
что делать дальше

Пример:

❌ "Internal error"
✅ "Не удалось подключить CRM. Проверь API ключ."

5. Onboarding

Onboarding должен:

вести пользователя шаг за шагом
не требовать объяснений
не требовать разработчика
8. Fail-safe логика

Система НЕ должна ломаться если:

нет интеграции
нет заказов
нет координат
API вернул ошибку

👉 всегда fallback

Пример:

нет интеграции → можно создать заказ вручную
нет координат → карта не падает
9. Код правила
изменения точечные
не переписывать большие куски
не ломать существующую логику
prefer simple solution
10. Чего нельзя делать

❌ Микросервисы
❌ Сложные абстракции
❌ Рефакторинг ради рефакторинга
❌ Оптимизация "на будущее"
❌ Переписывание UI без причины

11. Definition of Done

Фича готова, если:

пользователь понимает что делать
нет тупиков
есть понятные ошибки
можно пройти без разработчика
12. Главная цель

👉 Продать доступ первой компании
👉 Клиент сам начинает пользоваться
👉 Без помощи разработчика

13. Приоритеты
UX
Надёжность
Простота
Скорость
14. Если сомневаешься

Всегда выбирай:

👉 более простое решение
👉 более понятный UX
👉 меньше кода