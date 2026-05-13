const BASE = 'https://api.github.com';

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function ghFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers(token) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.json();
}

async function ghPost<T>(token: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.json();
}

async function ghPut<T>(token: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.json();
}

export interface GHUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface GHRepo {
  full_name: string;
  name: string;
  owner: { login: string };
  default_branch: string;
  permissions?: { push: boolean; admin: boolean };
  private: boolean;
  description: string | null;
}

export interface GHContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
}

export async function getUser(token: string): Promise<GHUser> {
  return ghFetch<GHUser>(token, '/user');
}

export async function listUserRepos(token: string): Promise<GHRepo[]> {
  const all: GHRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await ghFetch<GHRepo[]>(token, `/user/repos?sort=updated&per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

export async function getRepo(token: string, fullName: string): Promise<GHRepo> {
  return ghFetch<GHRepo>(token, `/repos/${fullName}`);
}

export async function getContents(token: string, fullName: string, path: string): Promise<GHContent[]> {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  try {
    const data = await ghFetch<GHContent[]>(token, `/repos/${fullName}/contents/${encoded}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getFileSha(token: string, fullName: string, path: string): Promise<string | undefined> {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  try {
    const data = await ghFetch<{ sha: string }>(token, `/repos/${fullName}/contents/${encoded}`);
    return data.sha;
  } catch {
    return undefined;
  }
}

export async function getDefaultBranchSha(token: string, fullName: string, branch: string): Promise<string> {
  const data = await ghFetch<{ object: { sha: string } }>(
    token,
    `/repos/${fullName}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  return data.object.sha;
}

export async function createBranch(
  token: string,
  fullName: string,
  branchName: string,
  sha: string,
): Promise<void> {
  await ghPost(token, `/repos/${fullName}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha,
  });
}

export async function putFile(
  token: string,
  fullName: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  existingSha?: string,
): Promise<void> {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  const body: Record<string, string> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch,
  };
  if (existingSha) body.sha = existingSha;
  await ghPut(token, `/repos/${fullName}/contents/${encoded}`, body);
}

export async function createPR(
  token: string,
  fullName: string,
  title: string,
  body: string,
  head: string,
  base: string,
): Promise<{ html_url: string; number: number }> {
  return ghPost<{ html_url: string; number: number }>(token, `/repos/${fullName}/pulls`, {
    title,
    body,
    head,
    base,
  });
}

export function makeBranchName(localId: string, title: string): string {
  const slug = (localId || title || 'record')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `wcmp2-editor/${slug}-${date}`;
}
