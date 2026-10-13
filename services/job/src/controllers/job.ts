import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import getBuffer from "../utils/buffer.js";
import { sql } from "../utils/db.js";
import ErrorHandler from "../utils/errorHandler.js";
import { TryCatch } from "../utils/TryCatch.js";
import { applicationStatusUpdateTemplate } from "../template.js";
import { publishToTopic } from "../producer.js";

const MAX_COMPANIES = 3;
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const WORK_MODES = ["On-site", "Remote", "Hybrid"];
const STATUSES = ["Submitted", "Hired", "Rejected"];

/** "kitepost.in" → "https://kitepost.in"; anything that still isn't a URL is rejected. */
function normaliseWebsite(raw: unknown): string {
  const value = String(raw ?? "").trim();
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) throw new Error();
    return withScheme;
  } catch {
    throw new ErrorHandler(400, "Add the full address, like kitepost.in");
  }
}

async function uploadLogo(file: Express.Multer.File) {
  if (!file.mimetype.startsWith("image/")) {
    throw new ErrorHandler(400, "Logos need to be a PNG or JPG.");
  }
  const fileBuffer = getBuffer(file);
  if (!fileBuffer || !fileBuffer.content) {
    throw new ErrorHandler(500, "Failed to create file buffer");
  }
  const { data } = await axios.post(
    `${process.env.UPLOAD_SERVICE}/api/utils/upload`,
    { buffer: fileBuffer.content },
    { headers: { "x-internal-token": process.env.INTERNAL_TOKEN ?? "" } }
  );
  return { url: data.url as string, public_id: data.public_id as string };
}

export const createCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(403, "Only recruiters can add companies.");
    }

    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();

    if (!name || !description || !req.body.website) {
      throw new ErrorHandler(400, "Add a name, a description and a website.");
    }
    if (description.length > 500) {
      throw new ErrorHandler(400, "Keep the description under 500 characters.");
    }
    const website = normaliseWebsite(req.body.website);

    const [{ count }] =
      await sql`SELECT COUNT(*)::int AS count FROM companies WHERE recruiter_id = ${user.user_id}`;
    if (count >= MAX_COMPANIES) {
      throw new ErrorHandler(400, "You've added 3 companies, the most one account can have.");
    }

    const existingCompanies =
      await sql`SELECT company_id FROM companies WHERE LOWER(name) = LOWER(${name})`;

    if (existingCompanies.length > 0) {
      throw new ErrorHandler(409, `There's already a company called ${name} on JobQ.`);
    }

    // The logo is optional; until there is one, the app shows initials.
    const logo = req.file ? await uploadLogo(req.file) : { url: null, public_id: null };

    const [newCompany] =
      await sql`INSERT INTO companies (name, description, website, logo, logo_public_id, recruiter_id) VALUES (${name}, ${description}, ${website}, ${logo.url}, ${logo.public_id}, ${user.user_id}) RETURNING *`;

    res.json({
      message: "Company created successfully",
      company: newCompany,
    });
  }
);

export const updateCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { companyId } = req.params;

    const [company] =
      await sql`SELECT company_id FROM companies WHERE company_id = ${companyId} AND recruiter_id = ${user?.user_id}`;
    if (!company) {
      throw new ErrorHandler(404, "Company not found or you're not allowed to edit it.");
    }

    const name = req.body.name !== undefined ? String(req.body.name).trim() : null;
    const description = req.body.description !== undefined ? String(req.body.description).trim() : null;
    const website = req.body.website !== undefined ? normaliseWebsite(req.body.website) : null;

    if (name === "" || description === "") {
      throw new ErrorHandler(400, "Name and description can't be empty.");
    }
    if (description && description.length > 500) {
      throw new ErrorHandler(400, "Keep the description under 500 characters.");
    }
    if (name) {
      const clash =
        await sql`SELECT company_id FROM companies WHERE LOWER(name) = LOWER(${name}) AND company_id <> ${companyId}`;
      if (clash.length > 0) {
        throw new ErrorHandler(409, `There's already a company called ${name} on JobQ.`);
      }
    }

    const logo = req.file ? await uploadLogo(req.file) : null;

    const [updated] = await sql`UPDATE companies SET
      name = COALESCE(${name}, name),
      description = COALESCE(${description}, description),
      website = COALESCE(${website}, website),
      logo = COALESCE(${logo?.url ?? null}, logo),
      logo_public_id = COALESCE(${logo?.public_id ?? null}, logo_public_id)
      WHERE company_id = ${companyId} RETURNING *`;

    res.json({ message: "Company updated", company: updated });
  }
);

export const deleteCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { companyId } = req.params;

    const [company] =
      await sql`SELECT logo_public_id FROM companies WHERE company_id = ${companyId} AND recruiter_id = ${user?.user_id}`;

    if (!company) {
      throw new ErrorHandler(
        404,
        "Company not found or you're not authorized to delete it."
      );
    }

    await sql`DELETE FROM companies WHERE company_id = ${companyId}`;

    res.json({
      message: "Company and all associated jobs have been deleted",
    });
  }
);

export const createJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "recruiter") {
    throw new ErrorHandler(403, "Only recruiters can post jobs");
  }

  const {
    title,
    description,
    salary,
    location,
    role,
    job_type,
    work_location,
    company_id,
    openings,
  } = req.body;

  if (!title?.trim() || !description?.trim() || !location || !role) {
    throw new ErrorHandler(400, "Add a title, role, description and city.");
  }
  if (!(Number(salary) > 0)) {
    throw new ErrorHandler(400, "Add the annual salary in rupees.");
  }
  if (!Number.isInteger(Number(openings)) || Number(openings) < 1) {
    throw new ErrorHandler(400, "Openings must be at least 1.");
  }
  if (!JOB_TYPES.includes(job_type) || !WORK_MODES.includes(work_location)) {
    throw new ErrorHandler(400, "Pick a work mode and a job type.");
  }

  const [company] =
    await sql`SELECT company_id FROM companies WHERE company_id = ${company_id} AND recruiter_id = ${user.user_id}`;

  if (!company) {
    throw new ErrorHandler(404, "Company not found");
  }

  const [newJob] =
    await sql`INSERT INTO jobs (title, description, salary, location, role, job_type, work_location, company_id, posted_by_recruiter_id, openings) VALUES (${title}, ${description}, ${salary}, ${location}, ${role}, ${job_type}, ${work_location}, ${company_id}, ${user.user_id}, ${openings}) RETURNING *`;

  res.json({
    message: "Job posted successfully",
    job: newJob,
  });
});

export const updateJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "recruiter") {
    throw new ErrorHandler(403, "Only recruiters can edit jobs");
  }

  const {
    title,
    description,
    salary,
    location,
    role,
    job_type,
    work_location,
    company_id,
    openings,
    is_active,
  } = req.body;

  const [existingJob] =
    await sql`SELECT posted_by_recruiter_id FROM jobs WHERE job_id = ${req.params.jobId}`;

  if (!existingJob) {
    throw new ErrorHandler(404, "Job not found");
  }

  if (existingJob.posted_by_recruiter_id !== user.user_id) {
    throw new ErrorHandler(403, "You can only edit jobs you posted");
  }

  // Partial update: COALESCE keeps the existing value for any field the
  // caller didn't send. A plain `SET col = ${value}` would write NULL into
  // every omitted NOT NULL column and fail the whole request.
  const [updatedJob] = await sql`UPDATE jobs SET
  title = COALESCE(${title ?? null}, title),
  description = COALESCE(${description ?? null}, description),
  salary = COALESCE(${salary ?? null}, salary),
  location = COALESCE(${location ?? null}, location),
  role = COALESCE(${role ?? null}, role),
  job_type = COALESCE(${job_type ?? null}, job_type),
  work_location = COALESCE(${work_location ?? null}, work_location),
  openings = COALESCE(${openings ?? null}, openings),
  is_active = COALESCE(${is_active ?? null}, is_active)
  WHERE job_id = ${req.params.jobId} RETURNING *;
  `;

  res.json({
    message: "Job updated successfully",
    job: updatedJob,
  });
});

/**
 * The company page has always offered "Delete posting", but no route existed
 * behind it, so the request 404'd and the posting stayed up. Applications
 * reference jobs with ON DELETE CASCADE, so they go with it.
 */
export const deleteJob = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    throw new ErrorHandler(401, "Authentication required");
  }

  if (user.role !== "recruiter") {
    throw new ErrorHandler(403, "Only recruiters can delete jobs");
  }

  const [job] =
    await sql`SELECT posted_by_recruiter_id FROM jobs WHERE job_id = ${req.params.jobId}`;

  if (!job) {
    throw new ErrorHandler(404, "Job not found");
  }

  if (job.posted_by_recruiter_id !== user.user_id) {
    throw new ErrorHandler(403, "You can only delete jobs you posted");
  }

  await sql`DELETE FROM jobs WHERE job_id = ${req.params.jobId}`;

  res.json({ message: "Job deleted" });
});

export const getAllCompany = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    // Counts for the company cards and the delete confirmation.
    const companies = await sql`
      SELECT c.*,
        (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.company_id AND COALESCE(j.is_active, true))::int AS open_jobs,
        (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.company_id AND NOT COALESCE(j.is_active, true))::int AS closed_jobs,
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.job_id = a.job_id
          WHERE j.company_id = c.company_id AND a.status = 'Submitted')::int AS in_queue,
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON j.job_id = a.job_id
          WHERE j.company_id = c.company_id)::int AS application_count
      FROM companies c
      WHERE c.recruiter_id = ${req.user?.user_id}
      ORDER BY c.created_at ASC`;

    res.json(companies);
  }
);

export const getCompanyDetails = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (!id) {
      throw new ErrorHandler(400, "Company id is required");
    }

    const [companyData] = await sql`SELECT c.*, COALESCE (
     (
       SELECT json_agg(j.*) FROM jobs j WHERE j.company_id = c.company_id
      ),
      '[]'::json
    ) AS jobs
     FROM companies c WHERE c.company_id = ${id} GROUP BY c.company_id;`;

    if (!companyData) {
      throw new ErrorHandler(404, "Company not found");
    }

    res.json(companyData);
  }
);

/** Applicant counts per job, for the owner's company page. */
export const getCompanyStats = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const [company] =
      await sql`SELECT company_id FROM companies WHERE company_id = ${req.params.id} AND recruiter_id = ${req.user?.user_id}`;
    if (!company) {
      throw new ErrorHandler(404, "Company not found");
    }

    const stats = await sql`
      SELECT j.job_id,
        COUNT(a.application_id) FILTER (WHERE a.status = 'Submitted')::int AS in_queue,
        COUNT(a.application_id) FILTER (WHERE a.status = 'Hired')::int AS hired,
        COUNT(a.application_id) FILTER (WHERE a.status = 'Rejected')::int AS rejected,
        COUNT(a.application_id) FILTER (WHERE a.status = 'Submitted' AND u.subscription > NOW())::int AS priority,
        COUNT(a.application_id)::int AS total
      FROM jobs j
      LEFT JOIN applications a ON a.job_id = j.job_id
      LEFT JOIN users u ON u.user_id = a.applicant_id
      WHERE j.company_id = ${req.params.id}
      GROUP BY j.job_id`;

    res.json(stats);
  }
);

export const getAllActiveJobs = TryCatch(async (req, res) => {
  const { title, location } = req.query as {
    title?: string;
    location?: string;
  };

  let querySting = `SELECT j.job_id, j.title, j.description, j.salary, j.location, j.job_type, j.role, j.work_location, j.created_at, j.is_active, j.openings, c.name AS company_name, c.logo AS company_logo, c.company_id AS company_id FROM jobs j JOIN companies c ON j.company_id = c.company_id WHERE j.is_active = true`;

  const values = [];

  let paramIndex = 1;

  if (title) {
    querySting += ` AND j.title ILIKE $${paramIndex}`;
    values.push(`%${title}%`);
    paramIndex++;
  }

  if (location) {
    querySting += ` AND j.location ILIKE $${paramIndex}`;
    values.push(`%${location}%`);
    paramIndex++;
  }

  querySting += " ORDER BY j.created_at DESC";

  const jobs = (await sql.query(querySting, values)) as any[];

  res.json(jobs);
});

export const getSingleJob = TryCatch(async (req, res) => {
  // Join the company in so the detail page can show who is hiring — the list
  // endpoint already does this, and the client type expects both fields.
  const [job] = await sql`
    SELECT j.*, c.name AS company_name, c.logo AS company_logo, c.website AS company_website,
           c.description AS company_description
    FROM jobs j
    JOIN companies c ON j.company_id = c.company_id
    WHERE j.job_id = ${req.params.jobId}`;

  if (!job) {
    throw new ErrorHandler(404, "Job not found");
  }

  res.json(job);
});

export const getAllApplicationForJob = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(403, "Forbidden: Only recruiter can access this");
    }

    const { jobId } = req.params;

    const [job] = await sql`
    SELECT posted_by_recruiter_id FROM jobs WHERE job_id = ${jobId}
    `;

    if (!job) {
      throw new ErrorHandler(404, "job not found");
    }

    if (job.posted_by_recruiter_id !== user.user_id) {
      throw new ErrorHandler(403, "Forbidden you are not allowed");
    }

    const applications =
      // The applicant's name and photo come from their profile; applications
      // only store the email. Priority follows the applicant's subscription
      // as it is now, so buying it lifts applications already sent.
      // Priority first, then oldest first.
      await sql`
        SELECT a.application_id, a.job_id, a.applicant_id, a.applicant_email, a.status,
               a.resume, a.applied_at,
               COALESCE(u.subscription > NOW(), false) AS subscribed,
               u.name AS applicant_name, u.profile_pic AS applicant_pic
        FROM applications a
        LEFT JOIN users u ON u.user_id = a.applicant_id
        WHERE a.job_id = ${jobId}
        ORDER BY subscribed DESC, a.applied_at ASC`;

    res.json(applications);
  }
);

export const updateApplication = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (user.role !== "recruiter") {
      throw new ErrorHandler(403, "Forbidden: Only recruiter can access this");
    }

    const { id } = req.params;

    if (!STATUSES.includes(req.body.status)) {
      throw new ErrorHandler(400, "Status must be Submitted, Hired or Rejected.");
    }

    const [application] =
      await sql`SELECT * FROM applications WHERE application_id = ${id}`;

    if (!application) {
      throw new ErrorHandler(404, "Application not found");
    }

    const [job] =
      await sql`SELECT posted_by_recruiter_id, title FROM jobs WHERE job_id = ${application.job_id}`;

    if (!job) {
      throw new ErrorHandler(404, "no job with this id");
    }

    if (job.posted_by_recruiter_id !== user.user_id) {
      throw new ErrorHandler(403, "Forbidden you are not allowed");
    }

    const [updatedApplication] =
      await sql`UPDATE applications SET status = ${req.body.status} WHERE application_id = ${id} RETURNING *`;

    const message = {
      to: application.applicant_email,
      subject: `Update on your application for ${job.title} · JobQ`,
      html: applicationStatusUpdateTemplate(job.title),
    };

    publishToTopic("send-mail", message).catch((error) => {
      console.error("Failed to publish message to kafka", error);
    });

    res.json({
      message: "Application updated",
      job,
      updatedApplication,
    });
  }
);
