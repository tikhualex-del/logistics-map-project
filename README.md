# logistics-map SaaS

## О проекте

`logistics-map-project` — это MVP-ориентированная multi-tenant SaaS платформа для логистики, построенная на Next.js. Система позволяет компаниям:

- подключать внешние CRM (в том числе `retailcrm`);
- импортировать заказы, хранить их историю и статус;
- создавать склады, маршруты и управлять курьерами;
- визуализировать заказы на карте (Yandex/2GIS/Google placeholder);
- использовать AI-планировщик маршрутов через Sberbank GigaChat.

### Для кого

- продуктовые команды и логистические операторы, ищущие быстрый PoC;
- компании, которым нужна простая CRM-логистика с картографией и API в одном приложении.

### Бизнес-задача

Свести рабочий поток от получения заказов (CRM) до визуализации и простого маршрутизации курьеров через единый интерфейс. Фокус на скорости вывода в работу (first value) и fail-safe работе при отсутствии данных.

### Основной пользовательский сценарий

1. Регистрация (`/register`): создаётся `Company`, `User`, `Membership` с ролью `owner`.
2. Логин (`/login`): получает сессионный токен `session_token` в куки.
3. `/settings`: onboarding, проверка readiness и настройка ключевых сущностей.
4. Подключение интеграции (`/settings/integrations`) с `retailcrm`.
5. Добавление маппинга (`/settings/mappings`) для статусов/типов доставки/складов.
6. Создание склада (`/settings/warehouses`) и заказов (`/settings/orders`) вручную или import.
7. `/map`: выгрузка заказов из retailcrm, геокодинг, карты и визуализация.
8. `route-ai`: AI-планирование маршрута.

### Что реализовано

- Учет мульти-тенантности через `companyId`, `userId`.
- Аутентификация с сессиями в БД (`Session` table).
- Защита маршрутов через middleware (`/map`, `/settings`, `/admin`).
- Интеграции и маппинги (хранение JSON-мэппингов).
- Импорт и upsert заказов (`Order`, `IntegrationMapping`).
- Гибкая логика геокодинга с кэшем (`GeocodeCache` / Yandex геокодер).
- Критерии готовности и состояния пустых экранов.

### Что похоже на в разработке

- AI-планировщик `route-ai/plan` реализован через GigaChat и выглядит прототипным.
- `GoogleMap` компонент пока placeholder и не подключает API.
- AI-сервис `server/ai/ai-planner.service.ts` пустой.

## Основные возможности (реальные)

1. Авторизация и сессии
   - POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
   - cookie `session_token` (HttpOnly, sameSite=lax, secure в prod).
   - Промежуточный middleware требует `session_token` на `/map`, `/settings`, `/admin`.

2. Компании и пользователи
   - `Company`, `User`, `Membership` (role `owner`, `admin`, `dispatcher`, `viewer`).
   - Работает `requireMinRole` для прав доступа.

3. Интеграции
   - CRUD через `/api/integrations`; провайдеры `retailcrm` + Meta.
   - `integrationMappings` на `/api/integration-mappings`.
   - Валидация на стороне API + транзакции.
   - Шифрование credentials через `ENCRYPTION_SECRET`.

4. Заказы
   - `/api/orders` get/post
   - `/api/map/orders` fetch из default `retailcrm` integration, геокодирование, маппинг статус/тип.
   - `/api/retailcrm/import-orders` импорт из `retailcrm` по дате.
   - Также cron endpoint `/api/cron/import-orders`.

5. Склады
   - `/api/warehouses` get/post.

6. Настройки
   - `/api/settings/general` get/put; сохраняет `mapProvider`/`distanceUnit` в `Company`.

7. Карты
   - UI в `/map` поддержка 3 провайдеров `yandex`,`2gis`,`google`.
   - 2GIS работает с API через `@2gis/mapgl`.
   - Yandex через `ymaps` (основная реализация).
   - Google пока плейсхолдер.

8. Геокодинг
   - В `server/geocoding/nominatim.ts` реализован большой fallback через Yandex geocoder API.
   - Кэш результатов в `GeocodeCache`.

9. AI-route
   - `/api/route-ai/plan` требует `GIGACHAT_AUTH_KEY`, работает с Sberbank GigaChat.

10. Сервисные саджеты
    - `/api/cron/cleanup-sessions`, `/api/cron/import-orders`.
    - Лимит частоты логина `LoginRateLimit` + `login-rate-limit-maintenance`.

11. Upload map status icons
    - `/api/map-status-icons/upload` (png/svg/webp/jpg до 2MB).

## Технологический стек

- Framework: Next.js 16 (App Router)
- Language: TypeScript 5
- React 19
- Package manager: npm (поддерживается pnpm/yarn)
- Frontend: next/font, inline CSS, Tailwind CSS v4 (в проекте есть, но мало используется)
- Backend: Next.js API routes + server components.
- Database: PostgreSQL.
- ORM: Prisma 7 + Prisma Client.
- Map providers: Yandex, 2GIS, (Google placeholder).
- Auth: Cookie-based sessions (`session_token`), custom.
- State management: локальный React state + Zustand (есть store/routesStore.ts)
- API style: REST API routes + JSON responses
- Deployment: Next.js plus standard Node.js.
- Lint: eslint + eslint-config-next.

## Требования для запуска

- Node.js >= 18 (рекомендуется 20)
- npm (или pnpm/yarn) и `npm install`
- PostgreSQL
- переменные окружения (см. ниже)
- доступ к внешним API:
  - Yandex geocoder (проверка по адресу)
  - возможно внешняя CRM RetailCRM
  - GigaChat API для route-ai (если используются сценарии AI)
  - локальные cron-токи для задач

## Быстрый старт

1. Клонировать репозиторий:

```bash
git clone <repo> logistics-map-project
cd logistics-map-project
```

2. Установить зависимости:

```bash
npm install
```

3. Настроить `.env` (пример ниже).

4. Запустить PostgreSQL и сделать миграции:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Запустить приложение:

```bash
npm run dev
```

6. Открыть: `http://localhost:3000`.

7. Проверить:
   - `/register` и `/login`;
   - `/settings` (overview);
   - `/map` (отображение заказов).

## Переменные окружения

### database
- `DATABASE_URL` (обязательно): postgres connection string.

### auth/session
- `ENCRYPTION_SECRET` (обязательно): AES-256-CBC ключ для шифрования credentials.
- `NODE_ENV` (optional): `production` / `development`.
- `APP_NAME` (optional): для logging (default `crm-app`).
- `ADMIN_EMAILS` (optional): csv (например `admin@example.com`) список разрешённых админов.
- `CRON_SECRET` (optional, но для cron нужно): заголовок `x-cron-secret` для доступа `/api/cron/*`.

### интеграции
- `YANDEX_GEOCODER_API_KEY` (обязательно для geocoding в `/api/map/orders`).
- `GIGACHAT_AUTH_KEY` (обязательно при использовании `/api/route-ai/plan`).
- `GIGACHAT_SCOPE` (необязательно, default `GIGACHAT_API_PERS`).

### карты
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` (обязательно для отображения YandexMap).
- `NEXT_PUBLIC_2GIS_MAPS_API_KEY` (обязательно для отображения TwoGisMap).
- (Google мап ключа нет, компонент placeholder).

### внешний AI
- (присутствует зависимость `openai`, но не используется в коде) `OPENAI_API_KEY` / `GOOGLE_AI_API_KEY` — присутствуют в CLAUDE.md и package, но код явно не вызывает.

### misc
- `SESSION_TOKEN` не в env, а в куках.

> Примечание: нет `.env.example` в репозитории. Нужно добавить.

## Скрипты проекта

Из `package.json`:

- `dev` - `next dev` (локальная разработка)
- `build` - `next build` (production сборка)
- `start` - `next start` (запуск продового собранного приложения)
- `lint` - `eslint` (статический анализ)

## Структура проекта

```
app/
  layout.tsx
  page.tsx
  login/page.tsx
  register/page.tsx
  (protected)/
    layout.tsx
    settings/
      page.tsx
      integrations/page.tsx
      mappings/page.tsx
      orders/page.tsx
      warehouses/page.tsx
      general/page.tsx
    map/page.tsx
  admin/...
  api/...
components/
  map/ (YandexMap, TwoGisMap, GoogleMap)
  layout/, routes/, delivery/ ...
lib/
  api, http, observability, security
prisma/
  schema.prisma, migrations
server/
  auth/, integrations/, orders/, settings/, geocoding/, route-ai/, admin/
store/
  routesStore.ts

```

### Ключевые зоны

- `app/api/...`: REST API endpoints.
- `server/auth`: сервисы авторизации, сессии, роль.
- `server/integrations`: создание и чтение интеграций, шифр.
- `app/(protected)/map`: визуализация и логика маршрутов.
- `app/(protected)/settings`: onboarding, проверка и CRUD.
- `components/map`: map provider abstraction.
- `lib/http/http-client.ts`: retry/circuit breaker для внешних запросов.

## Архитектура проекта

1. Клиент (`app/*`, `components/*`) вызывает API через fetch на те же origin.
2. Middleware (`middleware.ts`) проверяет `session_token` для защищённых роутов.
3. Серверные API route handlers вызывают `requireSession` -> проверка сессии и membership.
4. Данные идут через `Prisma` к PostgreSQL:
   - Users/Companies/Sessions/Memberships
   - Integrations/IntegrationMappings
   - Orders/Warehouses/GeocodeCache/LoadUnits
5. Интеграции:
   - RetailCRM: `server/integrations/retailcrm-client.service.ts` -> API запрос `retailcrm`.
   - Credentials хранятся зашифрованными в `Integration.credentialsEncryptedJson`.
6. Геокодинг:
   - `/api/map/orders` использует `geocodeAddressWithNominatim` -> Yandex Geocoder.
   - Кэш: `GeocodeCache` + in-memory `geocodeCache`.
7. Карты:
   - mapProvider в company settings (`yandex`, `2gis`, `google`).
   - для Yandex и 2GIS ключи `NEXT_PUBLIC_*`.
   - Google Map пока плейсхолдер.

Схема запроса:

`UI (React fetch) -> API route -> requireSession -> service -> prisma/db/integration -> response -> UI`

## Доменные сущности

- User: id, email, fullName, passwordHash, isActive
- Company: name, timezone, currency, distanceUnit, mapProvider
- Membership: userId, companyId, role + soft-status
- Session: token, expiresAt, userId, companyId
- Integration: provider, baseUrl, credentialsEncryptedJson, isDefault
- IntegrationMapping: orderStatusMapJson, deliveryTypeMapJson, warehouseMapJson, courierMapJson, mapStatusConfigJson
- Warehouse: companyId, address, coordinates
- Order: externalId, status, deliveryType, address, coordinates, warehouseId, integrationId
- GeocodeCache: addressKey -> lat, lon, precision
- CompanyLoadUnit + CourierCapacityRule + ItemLoadMapping: логика расчёта загрузки

## Страницы и сценарии

- `/register`: ввод name/email/password -> POST `/api/auth/register`, автоматический логин
- `/login`: POST `/api/auth/login` и редирект на `next` или `/settings`
- `/settings`: overview и onboarding steps (integrations, mappings, warehouses, orders)
- `/settings/integrations`: CRUD `Integration`, тест `POST /api/integrations/test-connection`, set-default, deactivate, delete
- `/settings/mappings`: CRUD `IntegrationMapping` (пусковой для нормализации)
- `/settings/warehouses`: CRUD складов
- `/settings/orders`: просмотр и создание заказов (постинг `/api/orders`)
- `/map`: отображение заказов + AI / routing инструменты
- `/admin`: доступно только admin email из переменной / default список

## API и серверная логика

### Auth
- POST `/api/auth/register` – создание пользователя + company + membership
- POST `/api/auth/login` – логин, rate limit, создание `Session`
- POST `/api/auth/logout` – удаление session, сброс cookie
- GET `/api/auth/me` – текущее user/company и role

### Integrations
- GET `/api/integrations`
- POST `/api/integrations`
- POST `/api/integrations/test` (тест нового провайдера)
- POST `/api/integrations/test-connection` (проверка default)
- POST `/api/integrations/:id/set-default`
- POST `/api/integrations/:id/deactivate`
- DELETE `/api/integrations/:id`
- POST `/api/integrations/import-orders` -> импорт retailcrm

### Mapping
- GET `/api/integration-mappings`
- POST `/api/integration-mappings`

### Warehouses
- GET `/api/warehouses`
- POST `/api/warehouses`

### Orders
- GET `/api/orders`
- POST `/api/orders`

### Map
- GET `/api/map/orders` (RetailCRM + geocode + mapStatusConfig)

### Settings
- GET `/api/settings/general`
- PUT `/api/settings/general`

### Cron
- POST `/api/cron/import-orders` (x-cron-secret required)
- POST `/api/cron/cleanup-sessions` (x-cron-secret required)

### AI
- GET `/api/route-ai/plan`
- POST `/api/route-ai/plan` (требует `GIGACHAT_AUTH_KEY`)

### Map status icons
- POST `/api/map-status-icons/upload`

### Auth middleware
- `middleware.ts` проверяет сессию на `/map`, `/settings`, `/admin`.
- Использует заголовки REQUEST_ID/CORRELATION_ID из `lib/observability/request-trace`.

## Авторизация и безопасность

- Сессии хранятся в DB, token: uuid, expiresAt + clean-up cron.
- Пароль хранится bcrypt hash.
- Сессии делаются HTTP-only cookies, secure only prod.
- Role-based access `requireMinRole` в POST/PUT/DELETE методах.
- В `admin/layout.tsx` также есть проверка email через `isAdminEmail`.
- `integration credentials` зашифрованы AES-256-CBC по `ENCRYPTION_SECRET`.

Риски:
- `ENCRYPTION_SECRET` потерян → невозможно раскодировать credentials.
- Отсутствие `YANDEX_GEOCODER_API_KEY` → `/api/map/orders` не работает.
- Уязвимость CSRF: нет явной защиты, полагается на cookie + SameSite=Lax.

## Интеграции и внешние сервисы

1. RetailCRM
   - хранение: `Integration` provider=retailcrm
   - запросы: `retailCrmGet` в `server/integrations/retailcrm-client.service.ts`
   - `apiKey/site` из credentialsJson
   - import: `/api/retailcrm/import-orders`, `/api/map/orders`, `/api/cron/import-orders`

2. Геокодинг
   - `server/geocoding/nominatim.ts` (на самом деле Yandex Geocoder)
   - кэширование DB и in-memory

3. Карты
   - Yandex (`ymaps`) + 2GIS (`@2gis/mapgl`)
   - Google не реализован

4. AI
   - Sberbank GigaChat API (в code: `route-ai/plan`).

## Работа с картами и геоданными

- Заказы попадают с `/api/map/orders` на `/map`.
- Вычисляется `mapStatusConfig` из маппинга и применяется цвет/видимость.
- 2GIS map строит HtmlMarker и Marker. Yandex - Placemark + offset.
- Coords берутся из order.geo (где possible null), либо geocoding.
- Изначально  `mapProvider` выбирается из `settings/general` и сохраняется.
- По координатам: предотвращается NaN и требует float/number.

## База данных и модели

- PostgreSQL через Prisma.
- Модель данная в `prisma/schema.prisma`.
- Модель `Order` с уникальностью `companyId_integrationId_externalId`.
- Файлы миграций в `prisma/migrations`.

## Конфиги

- `package.json`: скрипты и зависимости.
- `tsconfig.json` - TS настройки.
- `next.config.ts` - security headers.
- `prisma/schema.prisma` - схема.
- `middleware.ts` - route protection.
- В репозитории нет `.env.example`.

## Как проверять после запуска (smoke-check)

1. `npm run dev` успешно стартует без ошибок.
2. `/register` создает новую компанию и логинит.
3. `/login` с тем же email/password работает.
4. `/settings`: данные `me` и overview загружаются.
5. `/settings/integrations`: тест подключения + сохранение интеграции.
6. `/settings/mappings`: создание mapping.
7. `/settings/warehouses`: CRUD.
8. `/settings/orders`: создание заказа в ручную.
9. `/map`: заказы отобразились,
10. `/api/map/orders` возвращает success.
11. `/api/route-ai/plan` POST с prompt -> план или ошибка 502/500 в зависимости от GigaChat.
12. `POST /api/cron/cleanup-sessions` с хедером `x-cron-secret`.

## Сценарии ручной проверки

- happy path: register -> login -> integration -> mapping -> warehouse -> order -> map.
- edge case: отсутствие интеграции на `/map` должно показать сообщение.
- error case: неверный API ключ Yandex Geocoder -> лог ошибки.
- пустые состояния: `/settings` step warnings.
- env missing: без `DATABASE_URL` приложение падает при старте.

## Типичные проблемы и диагностика

- `DATABASE_URL is not set` → установить .env.
- `ENCRYPTION_SECRET is not set` → не удаётся декодировать credentials.
- `YANDEX_GEOCODER_API_KEY is not set` → `/api/map/orders` 500 по geocoder.
- `session_token` отсутствует → middleware редирект на `/login`.
- `Forbidden` в POST /api/orders -> роль `dispatcher`.
- map marker не отображается: нет `NEXT_PUBLIC_YANDEX_MAPS_API_KEY`.
- `Rate limited` при `/api/auth/login` -> ждём.
- `400` на `/api/integrations` если некорректная JSON.

## Ограничения проекта

- Часть AI-логики MVP, `route-ai` и `openai` dependencies не используются в основном UI.
- GoogleMap не реализован.
- Нет контрактного API doc и тестов.
- Вендоры интеграций ограничены `retailcrm`.
- Некоторые формы используют неявные данные и client state.
- Нет `.env.example`, не полный список env.

## Что важно не сломать

- `middleware.ts` и `requireSession` / roles.
- `Integration` (isDefault / saving / deactivation).
- `Order` уникальность по `companyId_integrationId_externalId`.
- Шифрование в `server/lib/crypto`.
- `map orders` geocoding flow (retry, cache, fallback).

## Что требует уточнения

- Продакшн flow: deploy и process manager не описаны.
- Логику `GoogleMap` (placeholder) понять нельзя.
- `openai` и `GOOGLE_AI_API_KEY` не актуальны в коде.
- Ноутбуков/тесты отсутствуют — нет примеров тестов.
- Возможно `item-load-mappings`, `courier-capacity` используются не полностью.

## Рекомендации по документации

- Добавить `./.env.example`.
- Добавить `ARCHITECTURE.md` с диаграммой запросов.
- Добавить `API.md` (спецификации и примеры payload).
- Добавить `RUNBOOK.md` для операторов (cron, DB backup).
- Добавить тесты (Jest, integration) и `CI` pipeline docs.

