import "server-only";

// Product words and photos live in this repository. The admin saves them as one commit, and
// Vercel rebuilds the site. The access key stays on the server.
const TOKEN = process.env.GITHUB_TOKEN?.trim() ?? "";
const REPO = "shohugah/revasser-bd";
const FOLDER = "revasser-bd";
const LOCAL = process.env.ORDERS_ALLOW_LOCAL === "1" ? process.env.GITHUB_API_URL?.trim() : "";
const API = LOCAL?.startsWith("http://127.0.0.1:") ? LOCAL : "https://api.github.com";
/** The live site writes to main; a test copy writes only to its own branch. */
const BRANCH = process.env.VERCEL_ENV === "production" ? "main" : (process.env.VERCEL_GIT_COMMIT_REF ?? "").trim();
// Never the owner's real email: the repository is public.
const AUTHOR = { name: "Revasser Admin", email: "117073495+shohugah@users.noreply.github.com" };

export const githubReady = () => TOKEN.length > 20 && !!BRANCH && !(process.env.VERCEL_ENV !== "production" && BRANCH === "main");

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function api<T>(path: string, method = "GET", body?: object): Promise<T> {
  const res = await fetch(`${API}/repos/${REPO}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "revasser-admin", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new GitHubError(res.status, `GitHub answered ${res.status} for ${method} ${path.split("?")[0]}`);
  return res.json() as Promise<T>;
}

const encode = (path: string) => path.split("/").map(encodeURIComponent).join("/");

/** Null when the file does not exist. */
export async function readFile(path: string): Promise<{ sha: string; text: string } | null> {
  try {
    const f = await api<{ sha: string; content: string }>(`/contents/${encode(`${FOLDER}/${path}`)}?ref=${encodeURIComponent(BRANCH)}`);
    return { sha: f.sha, text: Buffer.from(f.content, "base64").toString("utf8") };
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) return null;
    throw err;
  }
}

export async function listFolder(path: string): Promise<string[]> {
  const items = await api<{ name: string; type: string }[]>(`/contents/${encode(`${FOLDER}/${path}`)}?ref=${encodeURIComponent(BRANCH)}`);
  return items.filter((i) => i.type === "file").map((i) => i.name);
}

export type Change = { path: string; content: Buffer | null };

/**
 * Writes all changes as one commit. `check` runs against the newest branch state just before
 * writing; if someone else committed in between, GitHub refuses and we check again.
 */
export async function commit(message: string, changes: Change[], check: () => Promise<void>) {
  const blobs = await Promise.all(
    changes.map(async (c) => ({
      path: `${FOLDER}/${c.path}`,
      mode: "100644",
      type: "blob",
      sha: c.content === null ? null : (await api<{ sha: string }>("/git/blobs", "POST", { content: c.content.toString("base64"), encoding: "base64" })).sha,
    })),
  );
  for (let attempt = 1; ; attempt++) {
    const head = (await api<{ object: { sha: string } }>(`/git/ref/heads/${encode(BRANCH)}`)).object.sha;
    await check();
    const base = (await api<{ tree: { sha: string } }>(`/git/commits/${head}`)).tree.sha;
    const tree = (await api<{ sha: string }>("/git/trees", "POST", { base_tree: base, tree: blobs })).sha;
    const made = (await api<{ sha: string }>("/git/commits", "POST", { message, tree, parents: [head], author: AUTHOR, committer: AUTHOR })).sha;
    try {
      await api(`/git/refs/heads/${encode(BRANCH)}`, "PATCH", { sha: made, force: false });
      return;
    } catch (err) {
      if (!(err instanceof GitHubError && err.status === 422) || attempt >= 3) throw err;
    }
  }
}
