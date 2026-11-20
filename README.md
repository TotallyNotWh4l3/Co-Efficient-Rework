# Co:Efficient

A self-hosted, local-network dashboard for shared displays and kiosks. Co:Efficient puts the clock, weather, schedule, announcements, and train/bus departures on one customizable screen, served from a single Node process on your LAN. No cloud account or external database is required.

It can be opened in any browser on the network, or run as a standalone desktop window through Electron.

## Features

- **Modular dashboard**: arrange modules on a grid and configure each one individually.
- **Clock**: uses server time, so kiosks with drifting clocks stay accurate (`GET /api/time`).
- **Weather**: forecasts from [Open-Meteo](https://open-meteo.com/), refreshed on a background schedule, with current conditions, hourly and daily views, charts, sun arc, moon phase, and alerts. Locations are searchable through the built-in geocoding module.
- **Schedule**: calendar with tags and Japanese public holidays (via `@holiday-jp/holiday_jp`), plus a "today" view.
- **Announcements**: any user can post; includes read tracking, archiving, an audit log, and rate limiting.
- **Transit**: station and bus-stop timetables loaded from plain JSON files, with automatic reload on save.
- **Themes**: light and dark defaults, plus a theme customizer with live preview.
- **Users and roles**: JWT authentication with `admin`, `manager`, and `user` roles.
- **Realtime updates**: a single Server-Sent Events channel pushes changes to every connected display.
- **Languages**: English and Japanese UI.

## Tech stack

| Layer         | Technology                                                             |
| ------------- | ---------------------------------------------------------------------- |
| Frontend      | React 19, Vite, React Compiler, Radix UI, Lucide icons, Axios          |
| Backend       | Node.js (ES modules), Express 5, Zod, Helmet, CORS, express-rate-limit |
| Auth          | JSON Web Tokens, bcrypt                                                |
| Database      | SQLite via `@libsql/client` (file-based, stored in `backend/data/`)    |
| Desktop shell | Electron, packaged with electron-builder (Windows NSIS installer)      |

## Project structure

```
Co-Efficient-Rework/
├── backend/
│   ├── data/
│   │   └── transit/        # Timetable JSON files (see backend/modules/transit/README.md)
│   ├── modules/            # One folder per feature: auth, weather, schedule, announcements,
│   │                       # transit, themes, locations, geocoding, dashboard, settings, users
│   ├── shared/
│   │   ├── db/             # Database client, schema init, migrations, seeds, maintenance scripts
│   │   ├── middleware/     # Auth and role checks
│   │   └── utils/          # JWT and password helpers
│   ├── sse/                # Server-Sent Events channel
│   └── server.js           # Entry point
├── frontend/
│   └── src/
│       ├── modules/        # UI for each feature (mirrors the backend modules)
│       ├── shared/         # API client, i18n (en/ja), styles, shared constants
│       └── common/
├── shared/                 # Constants used by both sides (default dashboard, themes, weather codes)
├── electron-main.js        # Electron wrapper
├── start.bat               # Windows launcher for the backend
└── package.json            # Root scripts (dev, electron, package)
```

## Requirements

- Node.js 20.19 or newer (22 LTS recommended) and npm
- Windows is needed only for building the Electron installer and for `start.bat`; the server and web UI run anywhere Node does

## Getting started

### 1. Install dependencies

Dependencies are installed separately in the root, backend, and frontend folders:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:

| Variable          | Description                                                            | Default                       |
| ----------------- | ---------------------------------------------------------------------- | ----------------------------- |
| `PORT`            | Port the server listens on                                             | `3001`                        |
| `JWT_SECRET`      | Secret used to sign login tokens. **Set this to a long random value.** | `change-me`                   |
| `DB_PATH`         | Optional path to the SQLite file                                       | `backend/data/coefficient.db` |
| `ALLOWED_ORIGINS` | Optional comma-separated CORS origins (development only)               | any origin on port `5173`     |

### 3. Define your users

Initial accounts live in [`backend/shared/db/seedUsers.config.js`](backend/shared/db/seedUsers.config.js), which ships with a single placeholder admin. Edit it before the first run:

```js
export default [
    { username: "admin", password: "CHANGE_ME", role: "admin" },
    // { username: "teacher01", password: "a-strong-password", role: "manager" },
];
```

- `role` is `admin`, `manager`, or `user`.
- At least one `admin` is required. The built-in locations and themes are owned by the first admin, whatever its username.
- Passwords must be at least 8 characters, and setup refuses to run while one is still `CHANGE_ME`.
- Existing users are never overwritten, so re-running only adds new entries.
- Passwords are stored in plaintext in this file. Keep real ones out of version control, or change them after the first login.

### 4. Initialize the database

```bash
npm run setup:db --prefix backend
```

This checks the user config, creates the tables, applies migrations, then seeds the users, locations, and themes. It is safe to run repeatedly; anything already present is skipped. To add users to an existing database later, edit the config and run `node shared/db/seed.js` from `backend/`.

### 5. Run it

**Development** (backend with nodemon, and the Vite dev server with hot reload):

```bash
npm run dev
```

The frontend is available at `http://localhost:5173` and the API at `http://localhost:3001`. Both are reachable from other devices on the LAN.

**Production** (Express serves the built frontend, so only one process is needed):

```bash
npm run build:frontend
npm start --prefix backend
```

The dashboard is then available at `http://<server-ip>:3001`. On Windows you can double-click `start.bat` instead of running the second command.

## Desktop app (Electron)

The Electron wrapper starts the backend server and opens a window pointing at it.

```bash
npm run build:frontend
npm run electron
```

To build a Windows installer:

```bash
npm run package
```

Notes:

- `electron-main.js` currently loads a fixed address (`http://192.168.200.101:3001`). Change the `loadApp()` URL to match your server, or to `http://localhost:3001` for a single-machine setup.
- The packaging config expects `backend/.env` to exist, since it is bundled as an extra resource.
- Electron writes a log to the app's user-data folder as `app-log.txt`.

## Roles

| Role      | Typical abilities                                                            |
| --------- | ---------------------------------------------------------------------------- |
| `admin`   | Everything, including user management                                        |
| `manager` | Manage shared content and view diagnostics such as `GET /api/transit/errors` |
| `user`    | View the dashboard and post announcements                                    |

Exact permissions are enforced per route in each module's controller and in `backend/shared/middleware/requireRole.js`.

## Adding transit timetables

Timetables live in `backend/data/transit/` as JSON. Copy `_template.json`, edit it, and save. The server reloads the file on the next request, with no restart needed. Files that fail validation are skipped entirely, and the reason is available at `GET /api/transit/errors` (manager role or above) and in the server log.

The full file format is documented in [`backend/modules/transit/README.md`](backend/modules/transit/README.md) (written in Japanese).

## API overview

All routes live under `/api`:

`/auth` · `/users` · `/settings` · `/dashboard` · `/weather` · `/schedule` · `/announcements` · `/locations` · `/geocoding` · `/themes` · `/transit` · `/sse` · `/time`

## Maintenance scripts

Run from the `backend/` folder:

| Command                                                    | Purpose                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| `node shared/db/resetPassword.js <username> <newPassword>` | Reset any user's password from the command line              |
| `node shared/db/seed.js`                                   | Add users from `seedUsers.config.js` to an existing database |
| `node shared/db/migration/migrate.js`                      | Apply pending migrations only                                |
| `node shared/db/seedLocations.js`                          | Re-seed default locations                                    |
| `node shared/db/seedThemes.js`                             | Re-seed default themes                                       |

## Frontend development

```bash
cd frontend
npm run dev       # start the Vite dev server
npm run build     # production build into frontend/dist
npm run lint      # run Oxlint
```

The React Compiler is enabled, which makes dev and build slightly slower.
