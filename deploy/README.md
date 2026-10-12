# Deploying JobQ

Two halves:

- **Frontend** on Vercel, at <https://jobq-one.vercel.app>
- **Backend** (five services plus Kafka) on one EC2 instance, via Docker Compose

Postgres (Neon) and Redis (Upstash) are managed services, so Kafka is the only
infrastructure container.

```
browser ──HTTPS──▶ Vercel (Next.js) ──HTTP──▶ EC2 :5001-5004, :5050
                   rewrites /api/* and /uploads/*
```

The browser only ever talks to Vercel. Next.js rewrites forward `/api/<service>/*`
and `/uploads/*` to the EC2 host from Vercel's servers, so there is no
mixed-content blocking and no CORS.

## Running it locally

```bash
cp .env.docker.example .env      # includes COMPOSE_PROFILES=web
docker compose up --build
```

Then open <http://localhost:3000>. Locally the frontend container runs too, and
the browser calls each service on its own port.

Each service reads its secrets from its own `services/<name>/.env`, which is
gitignored. Copy each `services/<name>/.env.example` and fill it in first.
`INTERNAL_TOKEN` must be the same in auth, user, job and utils, and `JWT_SEC`
the same in every service.

Compose overrides the URL-shaped variables in those files (`Kafka_Broker`,
`UPLOAD_SERVICE`, `SELF_URL`, `Frontend_Url`) with in-network addresses, so the
same `.env` works both bare and containerised.

## Frontend: Vercel

**Pushing to `main` deploys it.** The Vercel project is connected to the GitHub
repo with its root directory set to `frontend`. A failed build never replaces
the live site.

Production environment variables, set in the Vercel project:

| Variable | Value | Why |
|---|---|---|
| `BACKEND_HOST` | `http://<elastic-ip>` | where the rewrites forward to; read on the server only |
| `NEXT_PUBLIC_SAME_ORIGIN_API` | `1` | makes every API URL relative, so calls go through the rewrites |

`/api/status` checks the backend with a 3-second timeout. API calls wait on it,
so when EC2 is stopped the site says "offline" within a few seconds instead of
hanging for the proxy's 30-second connect timeout.

### `NEXT_PUBLIC_*` is compiled in

`NEXT_PUBLIC_*` variables are **inlined into the browser bundle at build time**,
not read at runtime. Changing one needs a rebuild, and for the Compose frontend
they are passed as build args, not environment.

## Backend: EC2

One `t3.micro` (1 GB) in `ap-south-1`, with 2 GB of swap and an Elastic IP.
Kafka's heap is capped at 320 MB in the compose file, which is what makes 1 GB
enough. The frontend container does not run here (`COMPOSE_PROFILES` is unset).

**Security group, inbound:**

| Port | Source | Why |
|---|---|---|
| 22 | your current IP only | SSH; `deploy/jobq ssh` keeps this up to date |
| 5001–5004, 5050 | 0.0.0.0/0 | Vercel's servers forward to these, and their IPs are not fixed |

`/api/utils/upload` is open on 5001 but refuses any request without the shared
`INTERNAL_TOKEN`, so only the other services can use it.

### From scratch

1. Launch Amazon Linux 2023 with [`ec2-bootstrap.sh`](ec2-bootstrap.sh) as user
   data. It installs Docker and Compose and clones the repo to `/opt/jobq`.
2. Attach an Elastic IP before anything else, since `BACKEND_HOST` on Vercel
   points at it.
3. Copy the secrets up. They are not in git, by design:
   ```bash
   for s in auth utils user job payment; do
     scp services/$s/.env ec2-user@<ip>:/opt/jobq/services/$s/.env
   done
   ```
4. On the box: `cd /opt/jobq && docker compose up -d --build`

### Shipping a backend change

```bash
./deploy/jobq ssh
cd /opt/jobq && git pull && docker compose up -d --build <service>
```

## Day-to-day

```bash
./deploy/jobq start     # boot it; returns once the services answer (~20s)
./deploy/jobq stop      # shut it down to save credits
./deploy/jobq status    # state, URLs, cost
./deploy/jobq ssh       # shell onto the box
./deploy/jobq logs      # tail the container logs
```

`ssh` and `logs` first move the SSH rule to your current public IP. Home
connections get a new address every so often, after which SSH silently times
out.

Running costs about $9/mo; stopped, about $3.60/mo for the idle Elastic IP.
While stopped, the site loads and shows an offline banner.

## Uploads

Cloudinary is the primary store, with local disk as the fallback. The local
driver writes to the `uploads` Docker volume and stores **relative** URLs
(`/uploads/x.pdf`), which work through the Vercel rewrites wherever the backend
lives.

Rows written before that change held absolute URLs. If you ever move hosts and
find old images 404ing, `scripts/rebase-upload-urls.mjs` rewrites them. Copy it
into the job container to run it, since that container has the database driver:

```bash
docker cp scripts/rebase-upload-urls.mjs jobq-job:/app/rebase.mjs
docker compose exec job node /app/rebase.mjs http://old-host:5001 "" --dry-run
```

`""` as the target makes them relative. Drop `--dry-run` to apply.

**Cloudinary currently rejects every upload with 403**: the API key is a
restricted key without upload permission. Until that's fixed, files live only
on the instance's volume, which survives restarts but not losing the instance.

## Known gap

The hop from Vercel to EC2 is plain HTTP over the public internet. Visitors'
connections are HTTPS, but sign-in requests, and the passwords in them, cross
that second hop unencrypted. Closing it means TLS on the EC2 side, with a
reverse proxy and a certificate.
