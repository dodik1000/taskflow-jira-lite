# TaskFlow (Jira-lite)

Деплой:
https://taskflow-jira-lite.vercel.app/

Тестовые данные для входа:

- email: `test@gmail.com`
- password: `000000`

## Описание проекта

TaskFlow — веб-приложение для управления задачами на канбан-досках, разработанное с использованием React, TypeScript и Supabase.

Приложение поддерживает:

- регистрацию и вход пользователей
- создание и удаление досок
- работу с колонками и задачами
- sortable drag-and-drop для задач внутри колонки и между колонками
- комментарии
- совместный доступ к доскам
- роли owner / member
- realtime-обновления
- базовые тесты компонентов и маршрутов
- проверку кода линтером
- строгую проверку типов TypeScript

## Технологии

- React
- TypeScript
- Vite
- Supabase
- React Router
- dnd-kit
- SCSS
- Vitest
- Testing Library

## Интерфейс

![1](docs/screenshots/login.jpg)

![2](docs/screenshots/boards.jpg)

![3](docs/screenshots/taskboard.jpg)

![4](docs/screenshots/taskdetails.jpg)

![5](docs/screenshots/taskdetailsmobil.jpg)

## Реализованный функционал

### Уровень 1

#### Аутентификация

- регистрация по email и паролю
- вход и выход
- защита роутов для неавторизованных пользователей

#### Доски

- список доступных досок
- создание доски
- удаление доски
- переход на страницу доски

#### Колонки

- создание трёх колонок по умолчанию при создании доски
- добавление колонок
- удаление колонок
- переименование колонок
- изменение порядка колонок

#### Задачи

- создание задачи в колонке
- удаление задачи
- перенос задач между колонками через drag-and-drop
- изменение порядка задач внутри колонки
- сохранение `position` при сортировке и переносе между колонками

#### Базовый UI

- адаптивная вёрстка
- тёмная тема
- лоадеры
- уведомления об ошибках и успешных действиях

### Уровень 2

#### Детали задачи

- открытие задачи в модальном окне
- редактирование названия
- описание
- приоритет
- дедлайн
- назначение исполнителя

#### Комментарии

- список комментариев
- добавление комментариев
- удаление комментариев
- отображение автора и времени

#### Realtime

- обновление задач и колонок в реальном времени при открытой доске

#### Совместный доступ

- приглашение пользователя на доску по email
- роли owner / member
- owner может управлять участниками
- owner может управлять структурой доски
- member может работать с задачами

## Ограничение доступа и RLS

Контроль доступа вынесен в Supabase RLS policies.

Пользователь видит только те доски, в которых он является участником.

Для основных таблиц проекта настроены RLS policies:

- `boards`
- `board_members`
- `columns`
- `tasks`
- `comments`
- `profiles`

Для проверки доступа используются helper functions в базе данных:

- `is_board_owner`
- `is_board_member`
- `can_access_column`
- `can_access_task`

Политика для `profiles` ограничена: пользователь может читать свой профиль и профили пользователей, с которыми он состоит в одной доске.  
Поиск пользователя по email для приглашения реализован через отдельную SQL-функцию `find_profile_by_email`.

## SQL и структура базы данных

SQL-файлы для воспроизведения базы данных находятся в папке `sql/`:

- `sql/01_schema.sql` — схема таблиц
- `sql/02_functions.sql` — helper functions для RLS
- `sql/03_policies.sql` — RLS policies

Актуальная схема таблиц включает:

### boards

- `id`
- `title`
- `owner_id`
- `created_at`

### board_members

- `id`
- `board_id`
- `user_id`
- `role`

### columns

- `id`
- `board_id`
- `title`
- `position`

### tasks

- `id`
- `column_id`
- `title`
- `position`
- `created_at`
- `description`
- `priority`
- `due_date`
- `assignee_id`
- `created_by`

### comments

- `id`
- `task_id`
- `user_id`
- `content`
- `created_at`

### profiles

- `id`
- `name`
- `avatar_url`
- `email`

## Тестирование и качество кода

В проекте:

- включён TypeScript strict mode
- код проходит проверку линтером
- добавлены unit- и component-тесты
- покрыты успешные и ошибочные сценарии сервисов
- reorder-алгоритм вынесен из UI и покрыт отдельными тестами
- бизнес-логика прав owner/member вынесена в отдельный utility-слой

Покрыты тестами:

- `ProtectedRoute`
- `LoginPage`
- `BoardPage`
- `BoardColumn`
- `TaskCard`
- `TaskDetailsModal`
- `boards` service
- `members` service
- `tasks` service
- `permissions` utility
- `reorderTasks` utility

## Что можно улучшить

При наличии дополнительного времени можно доработать:

- страницу профиля пользователя
- аватары пользователей в интерфейсе
- поиск и фильтрацию задач
- лог активности на доске
- прикрепление файлов к задачам

## Установка и запуск

Клонировать репозиторий:

`git clone https://github.com/dodik1000/taskflow-jira-lite`

Перейти в папку проекта:

`cd taskflow-jira-lite`

Установить зависимости:

`npm install`

Создать `.env` на основе `.env.example`:

`cp .env.example .env`

Заполнить переменные окружения:

`VITE_SUPABASE_URL=`

`VITE_SUPABASE_KEY=`

Запустить проект:

`npm run dev`

## Проверка проекта

Проверка линтера:

`npm run lint`

Проверка типов:

`npm run type-check`

Запуск тестов:

`npm run test:run`
