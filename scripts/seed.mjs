/**
 * Seed JobQ with realistic demo data by driving the real HTTP APIs — the same
 * paths the UI uses, so a successful seed also proves the services are wired
 * up correctly.
 *
 *   node scripts/seed.mjs
 *
 * Idempotent: companies that already exist are skipped rather than duplicated.
 * Requires the auth, user, job and utils services to be running.
 */
const AUTH = process.env.AUTH_SERVICE || "http://localhost:5050";
const USER = process.env.USER_SERVICE || "http://localhost:5002";
const JOB = process.env.JOB_SERVICE || "http://localhost:5003";

const PASSWORD = "Test1234";
const RECRUITER = "priya@jobq.demo";
const SEEKER = "arjun@jobq.demo";

// 1x1 transparent PNG — replaced below by a generated letter tile per company
const BLANK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

const MINIMAL_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] >> endobj
trailer << /Size 4 /Root 1 0 R >>
%%EOF`,
  "utf8"
);

async function api(url, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(url, { method, headers, body: payload });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data };
}

/** Register, or log in if the account already exists. */
async function ensureUser(fields, file) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  if (file) fd.append("file", new Blob([file.data], { type: file.type }), file.name);

  const reg = await api(`${AUTH}/api/auth/register`, { method: "POST", form: fd });
  if (reg.status === 200) return reg.data.token;

  const login = await api(`${AUTH}/api/auth/login`, {
    method: "POST",
    body: { email: fields.email, password: fields.password },
  });
  if (login.status !== 200) {
    throw new Error(`Could not create or log in ${fields.email}: ${JSON.stringify(login.data)}`);
  }
  return login.data.token;
}

const COMPANIES = [
  { name: "Northwind Labs", description: "Developer tooling for distributed teams.", website: "https://northwind.example" },
  { name: "Cobalt Systems", description: "Design systems and product infrastructure.", website: "https://cobalt.example" },
  { name: "Fernpath Analytics", description: "Data platforms for modern operations teams.", website: "https://fernpath.example" },
];

const JOBS = [
  { title: "Senior Frontend Engineer", role: "Frontend Engineer", salary: 3200000, location: "Remote", job_type: "Full-time", work_location: "Remote", openings: 2,
    description: "Own the customer-facing surface — design systems, performance, and the details that make a product feel fast." },
  { title: "Product Designer", role: "Designer", salary: 2100000, location: "Banglore", job_type: "Full-time", work_location: "Hybrid", openings: 1,
    description: "Shape end-to-end product flows and grow our design system." },
  { title: "Backend Engineer (Node)", role: "Backend Engineer", salary: 2600000, location: "Pune", job_type: "Full-time", work_location: "Hybrid", openings: 3,
    description: "Build the services behind matching, search and notifications." },
  { title: "Data Analyst", role: "Analyst", salary: 1500000, location: "Remote", job_type: "Full-time", work_location: "Remote", openings: 1,
    description: "Turn product and hiring funnel data into decisions." },
  { title: "DevOps Engineer", role: "DevOps", salary: 2400000, location: "Hyderabad", job_type: "Full-time", work_location: "On-site", openings: 1,
    description: "Own CI/CD, observability and the Kubernetes footprint." },
  { title: "Engineering Intern", role: "Intern", salary: 600000, location: "Delhi", job_type: "Internship", work_location: "On-site", openings: 4,
    description: "Six-month internship rotating across the frontend and backend squads." },
];

console.log("Seeding JobQ…\n");

const recruiterToken = await ensureUser({
  role: "recruiter", name: "Priya Raman", email: RECRUITER,
  password: PASSWORD, phoneNumber: "9810011001",
});
console.log(`  recruiter  ${RECRUITER}`);

const seekerToken = await ensureUser(
  { role: "jobseeker", name: "Arjun Mehta", email: SEEKER, password: PASSWORD,
    phoneNumber: "9820022002", bio: "Frontend engineer, 4 years with React and TypeScript." },
  { data: MINIMAL_PDF, type: "application/pdf", name: "resume.pdf" }
);
console.log(`  jobseeker  ${SEEKER}`);

for (const skill of ["React", "TypeScript", "Next.js"]) {
  await api(`${USER}/api/user/skill/add`, { method: "POST", token: seekerToken, body: { skillName: skill } });
}
console.log("  skills added");

const existing = await api(`${JOB}/api/job/company/all`, { token: recruiterToken });
const byName = new Map((existing.data || []).map((c) => [c.name, c.company_id]));

const companyIds = [];
for (const c of COMPANIES) {
  if (byName.has(c.name)) {
    companyIds.push(byName.get(c.name));
    console.log(`  company    ${c.name} (already existed)`);
    continue;
  }
  const fd = new FormData();
  fd.append("name", c.name);
  fd.append("description", c.description);
  fd.append("website", c.website);
  fd.append("file", new Blob([BLANK_PNG], { type: "image/png" }), "logo.png");
  const res = await api(`${JOB}/api/job/company/new`, { method: "POST", token: recruiterToken, form: fd });
  if (res.status === 409) {
    // Company names are globally unique — it exists under another account.
    console.log(`  company    ${c.name} (name taken by another recruiter — skipped)`);
    continue;
  }
  if (res.status !== 200) throw new Error(`company "${c.name}" failed: ${JSON.stringify(res.data)}`);
  companyIds.push(res.data.company.company_id);
  console.log(`  company    ${c.name}`);
}

if (!companyIds.length) {
  throw new Error("No companies owned by the seed recruiter — cannot post jobs.");
}

const live = await api(`${JOB}/api/job/all`);
const liveTitles = new Set((live.data || []).map((j) => j.title));

const jobIds = [];
for (let i = 0; i < JOBS.length; i++) {
  if (liveTitles.has(JOBS[i].title)) {
    console.log(`  job        ${JOBS[i].title} (already existed)`);
    continue;
  }
  const res = await api(`${JOB}/api/job/new`, {
    method: "POST", token: recruiterToken,
    body: { ...JOBS[i], company_id: companyIds[i % companyIds.length] },
  });
  if (res.status !== 200) throw new Error(`job "${JOBS[i].title}" failed: ${JSON.stringify(res.data)}`);
  jobIds.push(res.data.job.job_id);
  console.log(`  job        ${JOBS[i].title}`);
}

if (jobIds.length) {
  await api(`${USER}/api/user/apply/job`, { method: "POST", token: seekerToken, body: { job_id: jobIds[0] } });
  console.log("  application submitted");
}

console.log(`\nDone. Sign in with either account using the password "${PASSWORD}".`);
