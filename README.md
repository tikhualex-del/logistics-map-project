# logistics-map SaaS

Проект `logistics-map` — multi-tenant SaaS платформа для логистики. 

- Управление курьерами
- Интеграции с внешними CRM 
- Импорт заказов и отображение на карте
- Строительство простых маршрутов и поддержка курьеров

## Архитектура

### Стек
- Frontend: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 (частично)
- Backend: Next.js API routes + Node.js runtime
- БД: PostgreSQL + Prisma ORM
- State: Zustand (клиентский), server-first
- Auth: Cookie-based (`session_token`), собственная сессия в БД

### Мульти-тенантность
- Вся логика и доступы разделены по `companyId` и `userId`
- Основные модели: `Company`, `User`, `Membership`, `Session`, `Integration`, `IntegrationMapping`, `Warehouse`, `Order`

### Проектная структура
- `app/` страницы (Protected, admin, analytics, cabiner, couriers, routes, map, settings и др.)
- `server/` бизнес-логика и API, разделенные по доменам
- `lib/` общие утилиты (`http-client`, `observability`, `security`)
- `components/` UI-слои
- `store/` Zustand-хранилища
- `prisma/` схема и миграции

## Запуск проекта

1. Установить зависимости:

```bash
npm install
```

2. Сгенерировать Prisma (один раз и после миграций):

```bash
npx prisma generate
```

3. Запустить миграции:

```bash
npx prisma migrate dev
```

4. Запустить dev-сервер:

```bash
npm run dev
```

5. Открыть в браузере: `http://localhost:3000`

### Prod-сборка

```bash
npm run build
npm start
```

## Переменные окружения

В файле `.env` (или в CI/CD) задать:

- `DATABASE_URL=postgresql://...`
- `OPENAI_API_KEY=...` (если используется AI)
- `GOOGLE_AI_API_KEY=...` (если используется Google GenAI)

⚠️ ключи не должны быть доступны на клиенте

## Основные сценарии пользователя

1. Регистрация (`/register`)
2. Авторизация (`/login`)
3. `/settings` - onboarding / настройка компании
4. Конфигурация интеграций (retailCRM, др.)
5. Маппинг полей (`/integration-mappings`)
6. Создание/импорт складов и заказов
7. `/map` - отображение заказов
8. Построение маршрутов (`/routes`), работа курьеров

## UX правила (главное)
- Нет тупиков: пользователь видит, где он и что делать дальше
- Empty states: всегда текст + действие
- Ошибки: информативные, с новым шагом (не "Internal error")
- Fail-safe: без данных интеграции/координат не ломается

## Проверка готовности

1. + логин/регистрация работают
2. + создается компания/сессия
3. + интеграции можно привязать и сохранить
4. + создаются склады и заказы
5. + на `/map` заказы отображаются
6. + маршруты (метки, курьеры) строятся и сохраняются
7. + нет NPE при отсутствии данных
8. + запросы API возвращают корректные сообщения об ошибках

## Быстрые команды

- `npm run lint`
- `npm test` (если есть тесты)
- `npm run preview` (при необходимости)

---

#### Источники
Рекомендуется читать `CLAUDE.md` для проектных требований и `QUICK_FIX_GUIDE.md` для локальной поддержки разработки.
