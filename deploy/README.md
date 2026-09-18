# Deploying JobQ

The whole stack runs from one `docker-compose.yml`. Postgres (Neon) and Redis
(Upstash) are managed services reached over the internet, so the only
infrastructure container is Kafka.

## Locally

```bash
cp .env.docker.example .env      # PUBLIC_HOST=http://localhost is correct here
docker compose up --build
```

Then open <http://localhost:3000>.

Each service reads its secrets from its own `services/<name>/.env`, which is
gitignored. Copy each `services/<name>/.env.example` and fill it in first.

Compose overrides the URL-shaped variables in those files — `Kafka_Broker`,
`UPLOAD_SERVICE`, `SELF_URL`, `Frontend_Url` — with in-network addresses, so
the same `.env` works both bare and containerised.

## The one thing that catches people

`NEXT_PUBLIC_*` variables are **compiled into the browser bundle at build
time**. They are not read from the environment at runtime, because the code
using them runs in the visitor's browser, which cannot see the container's
environment.

So they are passed as build args, and they must be URLs a browser can reach.
`http://auth:5050` would work between containers but resolves to nothing in
the browser.

Changing `PUBLIC_HOST` therefore needs a rebuild, not a restart:

```bash
docker compose up -d --build frontend
```

## Carrying existing uploads over

The `uploads` volume starts empty. If you already have files in
`services/utils/uploads/` from running bare, they will 404 until you copy them
in — company logos and résumés silently break:

```bash
docker cp services/utils/uploads/. jobq-utils:/app/uploads/
docker compose exec utils chown -R node:node /app/uploads
```

Only needed once, and only while the local-disk driver is in play. Moving to
S3 removes the problem.

### And rewrite the stored URLs

Copying the files is half of it. The local-disk driver writes an **absolute**
URL into the database at upload time (`${SELF_URL}/uploads/x`), so rows created
on one host still point at it after a move — the files are present and every
image still 404s:

```bash
docker compose exec job node /app/rebase.mjs \
  http://localhost:5001 http://<new-host>:5001 --dry-run
```

Drop `--dry-run` to apply. It touches `companies.logo`, `users.profile_pic`,
`users.resume` and `applications.resume`, leaves Cloudinary-hosted rows alone,
and reverses cleanly by swapping the arguments.

Storing a relative path and resolving it at render time would remove the need
for this entirely; the script exists because the existing rows are absolute.

## On EC2

A single instance running Compose. Cheaper and simpler than six Fargate tasks,
and nothing here needs to scale independently.

**1. Launch** an Amazon Linux 2023 instance. `t3.small` (2 GB) is the floor —
six Node processes plus Kafka will not fit in the 1 GB of a `t2.micro`. Paste
[`ec2-bootstrap.sh`](ec2-bootstrap.sh) into the User data field.

**2. Security group** — inbound:

| Port | Source | Why |
|------|--------|-----|
| 22 | your IP only | SSH |
| 3000 | 0.0.0.0/0 | frontend |
| 5001–5004, 5050 | 0.0.0.0/0 | the browser calls these services directly |

The service ports have to be publicly reachable because the frontend calls
them from the visitor's browser, not from inside the network.

**3. Copy the secrets up.** They are not in git, by design:

```bash
for s in auth utils user job payment; do
  scp services/$s/.env ec2-user@<ip>:/opt/jobq/services/$s/.env
done
```

**4. Start it:**

```bash
ssh ec2-user@<ip>
cd /opt/jobq
docker compose up -d --build
```

The bootstrap script writes `PUBLIC_HOST` from the instance metadata, so the
frontend builds against the right public address.

## Day-to-day: starting and stopping

`deploy/jobq` wraps the instance controls so this is one command rather than
four clicks in the console:

```bash
./deploy/jobq start     # boot it, waits until the app actually answers
./deploy/jobq stop      # shut it down and stop burning credits
./deploy/jobq status    # state, URL, and what it is costing
./deploy/jobq ssh       # shell onto the box
./deploy/jobq logs      # tail the container logs
```

A cold start is about 20 seconds — the containers restart themselves, and
`start` polls the real page rather than returning as soon as the machine
boots. The Elastic IP is kept across a stop, so the URL never changes.

Running costs roughly $9/mo; stopped, about $3.60/mo for the idle Elastic IP.
Stopping between demos is worth roughly 2.5x the runway on a credit balance.

## Before you share the URL

- **Plain HTTP sends passwords in the clear.** Fine for a demo you drive
  yourself; put Caddy or nginx in front with a real certificate before sending
  the link to anyone.
- **A stopped instance keeps its EBS volume but loses its public IP**, and
  `PUBLIC_HOST` is baked into the frontend bundle. Attach an Elastic IP, or
  rebuild the frontend after each restart.
- **Uploads currently land on a Docker volume** when Cloudinary is
  unavailable. That survives restarts but not instance replacement — move to
  S3 before treating any of it as durable.
