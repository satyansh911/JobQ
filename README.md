# JobQ

A two-sided job portal built as a microservices system: job seekers browse and
apply, recruiters post roles and manage applicants, and AI assists both sides
with résumé scoring and career guidance.

```
                     ┌───────────────┐
                     │  Next.js UI   │  :3000
                     └───────┬───────┘
        ┌───────────┬────────┼────────┬────────────┐
     ┌──▼──┐    ┌───▼──┐  ┌──▼──┐  ┌──▼────┐   ┌───▼───┐
     │Auth │    │ User │  │ Job │  │Payment│   │ Utils │
     │:5050│    │:5002 │  │:5003│  │ :5004 │   │ :5001 │
     └──┬──┘    └───┬──┘  └──┬──┘  └───┬───┘   └───┬───┘
        └───────────┴────────┴─────────┘           │
                    │                              │
              Postgres (Neon)              Cloudinary / local disk
                    │                        Gemini · SMTP
                  Redis                           │
                    └──────── Kafka `send-mail` ──┘
```

| Service | Port | Responsibility |
|---|---|---|
| Frontend | 3000 | Next.js 16 App Router UI |
| Auth | **5050** | Register, login, password reset (Postgres + Redis + Kafka producer) |
| Utils | 5001 | File storage, Gemini AI, Kafka mail consumer |
| User | 5002 | Profiles, skills, applications |
| Job | 5003 | Companies, job postings, applicant review |
| Payment | 5004 | Razorpay subscription checkout |

> **Why auth is on 5050, not 5000:** on macOS, Control Center's AirPlay Receiver
> occupies port 5000 and silently intercepts requests (they come back from
> `AirTunes` with no CORS headers, so the browser reports an opaque network
> error). Either keep 5050 or disable AirPlay Receiver in System Settings.

## Prerequisites

- Node.js 20+
- Docker (for Kafka)
- A Postgres database — the services use `@neondatabase/serverless`
- A Redis instance (password-reset tokens)

Optional, with graceful degradation:

- **Cloudinary** — file uploads. If unavailable, uploads fall back to local
  disk under `services/utils/uploads/`, served from `/uploads/*`.
- **Gemini** — the two AI features. Without a valid key they return a clear
  503; the rest of the product is unaffected.
- **SMTP + Kafka** — outbound mail. Without Kafka the services still boot and
  every non-mail flow works.
- **Razorpay** — subscriptions.

## Configuration

Each service reads its own `.env`; see `services/*/.env`.

```
# services/auth/.env
PORT=5050
DB_URL=postgresql://…
Redis_url=rediss://…
JWT_SEC=<same value across auth, user, job, payment>
Kafka_Broker=localhost:9092
Frontend_Url=http://localhost:3000
UPLOAD_SERVICE=http://localhost:5001
```

`JWT_SEC` **must** be identical across auth, user, job and payment — auth signs
the token and the others verify it.

The frontend reads service URLs from `frontend/.env.local` (see
`frontend/.env.example`); the localhost defaults work with no setup.

## Running

Start Kafka once:

```bash
docker run -d --name kafka -p 9092:9092 \
  -e KAFKA_NODE_ID=1 -e KAFKA_PROCESS_ROLES=broker,controller \
  -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT \
  -e KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  -e KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS=0 \
  apache/kafka:4.1.0
```

Then, in separate terminals — **utils and auth first**, since utils hosts the
upload endpoint and auth creates the shared tables on boot:

```bash
cd services/utils   && npm install && npm run build && npm run dev
cd services/auth    && npm install && npm run build && npm run dev
cd services/job     && npm install && npm run build && npm run dev
cd services/user    && npm install && npm run build && npm run dev
cd services/payment && npm install && npm run build && npm run dev
cd frontend         && npm install && npm run dev
```

> Run `npm run build` once before `npm run dev` on a fresh clone. The dev
> script runs `tsc -w` and `nodemon dist/index.js` concurrently, and nodemon
> crashes if `dist/` doesn't exist yet when it first starts.

Open <http://localhost:3000>.

## Demo data

```bash
node scripts/seed.mjs
```

Creates three companies, six jobs, a recruiter and a job seeker by driving the
real HTTP APIs — so a successful run also proves the services are wired up.
Safe to re-run; existing records are skipped.

| Account | Email | Password |
|---|---|---|
| Recruiter | `priya@jobq.demo` | `Test1234` |
| Job seeker | `arjun@jobq.demo` | `Test1234` |

## Architecture notes

- **One shared Postgres database.** All four data services point at the same
  `DB_URL`. Foreign keys exist *within* a service's own tables; references
  across a service boundary (`jobs.posted_by_recruiter_id → users.user_id`) are
  deliberately unenforced so the schema wouldn't change if the databases were
  ever split.
- **Kafka carries one topic, `send-mail`.** Auth and Job produce; Utils
  consumes and sends via SMTP. It exists so an HTTP response never waits on an
  SMTP round-trip.
- **Auth is a hybrid, not stateless JWT.** The token carries only a user id;
  every protected request re-reads the user from Postgres, so role and
  subscription changes take effect immediately.
- **Storage has two drivers.** Cloudinary first, local disk as fallback, chosen
  per request in `services/utils/src/storage.ts`.
