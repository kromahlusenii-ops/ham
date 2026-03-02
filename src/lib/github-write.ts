const API = "https://api.github.com";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

export async function getBranchSha(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string> {
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { headers: headers(token) },
  );
  if (!res.ok) throw new Error(`Failed to get branch SHA: ${res.status}`);
  const data = await res.json();
  return data.object.sha;
}

export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  branchName: string,
  fromSha: string,
): Promise<void> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: fromSha }),
  });
  if (!res.ok) throw new Error(`Failed to create branch: ${res.status}`);
}

export async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<string | null> {
  const res = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: headers(token) },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to get file SHA: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

export async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string,
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create/update ${path}: ${res.status} ${err}`);
  }
}

export async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string,
): Promise<string> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ title, body, head, base }),
  });
  if (!res.ok) throw new Error(`Failed to create PR: ${res.status}`);
  const data = await res.json();
  return data.html_url;
}
