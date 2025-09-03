# MANIFESTO TO READ BEFORE TRYING TO RUN ON PI + NVMe (kuato)

## LAYOUT

### Directory Layout (in repo)

/media/dmytrokuzyk/kuato/shared/book-swap-project/
├── backend/                      # Node/Express backend (one codebase, two instances)
├── frontend/                     # React frontend
└── infra/
    ├── MANIFEST.md               # hi there, you are here
    ├── systemd/                  # service templates (install into /etc/systemd/system/)
    │   ├── bookbook-main.service
    │   └── bookbook-demo.service
    ├── docker/                   # compose files for infra services
    │   └── bookbook-mongo.compose.yml
    └── docs/                     # notes, port maps, runbooks
        └── PORTS.md

### Data Layout (not in repo)

/media/dmytrokuzyk/kuato/data/
├── mongo-main/                   # MongoDB storage for main
└── mongo-demo/                   # MongoDB storage for demo

## SERVICES

### Nginx Proxy Manager (NPM)

- Role: TLS termination, domain routing, certs, WebSockets.
- Ports: 80 HTTP, 443 HTTPS, 81 admin UI.
- Data: /opt/npm/data/ (UI-managed; back up entire folder).

- Domain mappings:
    - pi.bookbook.live → http://127.0.0.1:6969
    - pi.demo.bookbook.live → http://127.0.0.1:6970

### MongoDB (two containers via Docker)

- mongo-main: 127.0.0.1:27017, data → /media/dmytrokuzyk/kuato/data/mongo-main/
- mongo-demo: 127.0.0.1:27018, data → /media/dmytrokuzyk/kuato/data/mongo-demo/
- Compose file: infra/docker/bookbook-mongo.compose.yml
- Policy: loopback only, never exposed to LAN/Internet

### BookBook backend apps (systemd)

- bookbook-main:
    - Working dir: /media/dmytrokuzyk/kuato/shared/book-swap-project/backend/
    - Env file: backend/.env.production
    - Port: 6969

- bookbook-demo:
    - Working dir: /media/dmytrokuzyk/kuato/shared/book-swap-project/backend/
    - Env file: backend/.env.demo
    - Port: 6970

(both services point to the same backend/directory. They differ by env and PORT)

## PORTS POLICY

### Reserved

- 80/443 → NPM public web

- 81 → NPM admin

- 6969 → BookBook main (backend)

- 6970 → BookBook demo (backend)

- 27017/27018 → Mongo loopback only

NB: do NOT touch: 22 SSH, 5900 VNC, 139/445/137/138 Samba, 3306 MariaDB, 631 CUPS

## systemd UNIT TEMPLATES

Each unit starts Node in backend/, loads its env file, and keeps it alive with auto-restart.

NB: Canonical copies live here: infra/systemd/bookbook-main.service; installed copies live in /etc/systemd/system/

## NPM Host Entries (what the UI should reflect)

- pi.bookbook.live → proxy to http://127.0.0.1:6969
    - Force SSL: on
    - HTTP/2: on
    - WebSocket support: on
    - Cert: Let’s Encrypt

- pi.demo.bookbook.live → proxy to http://127.0.0.1:6970
    - Force SSL: on
    - HTTP/2: on
    - WebSocket support: on
    - Cert: Let’s Encrypt

You don’t hand-edit NPM internals. Use the UI. Back up /opt/npm/data/ (with something like: `sudo tar -czf npm-data-backup.tar.gz -C /opt/npm/data .`)

## BACKUPS

Mongo data:
- `/media/dmytrokuzyk/kuato/data/mongo-main/`
- `/media/dmytrokuzyk/kuato/data/mongo-demo/`

Repo (code + infra): `/media/dmytrokuzyk/kuato/shared/book-swap-project/`
NPM data: `/opt/npm/data/`

NB: a fresh Pi can be rebuilt using this repo, NPM data, and Mongo data alone. If not, this file is lying.

## Recovery Plan (disaster mode)

1. Reinstall PiOS, Docker, NPM.
2. Re-mount NVMe so .../shared/book-swap-project/ and .../data/ are present.
3. Pull the repo; populate env (.env.production and .env.demo) files. NB: Ensure .env.production and .env.demo are copied into backend/ before starting services.
4. Ensure Mongo containers exist and store data in the .../data/mongo-* paths.
5. Install service templates to /etc/systemd/system/, enable them.
6. In NPM, confirm hosts and reissue certs if needed.
7. Hit backend ports locally, then through domains. Sign in. Done.

## ASCII ART

                   ┌──────────────────────────┐
                   │        Users (Web)       │
                   └─────────────┬────────────┘
                                 │
                       HTTPS (80/443 via NPM)
                                 │
              ┌──────────────────┴───────────────────┐
              │                                      │
   pi.bookbook.live                        pi.demo.bookbook.live
        (Main)                                     (Demo)
              │                                      │
              ▼                                      ▼
      ┌────────────────┐                    ┌────────────────┐
      │  bookbook-main │   systemd service  │  bookbook-demo │
      │(Node/Exp) 6969 │                    │ (Node/Exp) 6970│
      └───────┬────────┘                    └───────┬────────┘
              │                                     │
              │                                     │
              ▼                                     ▼
      ┌────────────────┐                    ┌────────────────┐
      │  mongo-main    │  docker container  │  mongo-demo    │
      │   port 27017   │  (volume: data/)   │   port 27018   │
      └────────────────┘                    └────────────────┘

### Other infra:

- Nginx Proxy Manager (docker, ports 80/81/443).
- Systemd ensures backend services stay alive.
- Docker ensures Mongo stays isolated + persistent in `/media/dmytrokuzyk/kuato/data`.
