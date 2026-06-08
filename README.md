# AGT — Project 911

Платформа для проведения командных городских игр в реальном времени.

## Стек
- **Backend:** Node.js + TypeScript + Fastify + Prisma + PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS (PWA)
- **Деплой:** Docker + Nginx

## Быстрый старт

```bash
# 1. Клонировать и настроить переменные
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Запустить БД
docker-compose up postgres -d

# 3. Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# 4. Frontend (отдельный терминал)
cd frontend
npm install
npm run dev
```

## Структура
```
project911/
├── backend/
│   ├── prisma/          # Схема БД и миграции
│   ├── src/
│   │   ├── config/      # Fastify плагины, Prisma клиент
│   │   ├── routes/      # Эндпоинты API
│   │   ├── services/    # Бизнес-логика
│   │   ├── middleware/  # Auth, rate limit
│   │   ├── utils/       # Scoring, сравнение ответов
│   │   └── events/      # SSE для реального времени
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── admin/   # Панель организатора
│       │   └── team/    # Интерфейс команды
│       ├── components/
│       │   ├── ui/      # Базовые компоненты (Button, Input, Card...)
│       │   ├── game/    # Игровые компоненты (Timer, TipCard, AnswerForm...)
│       │   ├── admin/   # Компоненты панели (Dashboard, EventFeed...)
│       │   └── auth/    # Форма входа
│       ├── stores/      # Zustand стейт
│       ├── api/         # Клиент для запросов
│       └── styles/      # Глобальные стили + Tailwind
├── docker/
│   ├── nginx/           # nginx.conf
│   └── postgres/        # init.sql
└── docs/                # Документация, ТЗ
# AGT
# AGT
# AGT
