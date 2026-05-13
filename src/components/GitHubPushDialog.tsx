import { useState, useEffect, useCallback } from 'react';
import {
  X, GitBranch, Folder, FolderPlus, ChevronRight, Home,
  Loader, AlertCircle, CheckCircle, ExternalLink,
} from 'lucide-react';
import type { Wcmp2Record } from '../types/wcmp2';
import type { FormState } from '../hooks/useWcmp2Form';
import {
  getUser, listUserRepos, getRepo, getContents, getFileSha,
  getDefaultBranchSha, createBranch, putFile, createPR, makeBranchName,
  type GHUser, type GHRepo, type GHContent,
} from '../utils/github';

const TOKEN_KEY = 'wcmp2_gh_token';

type Step = 'auth' | 'repo' | 'directory' | 'review';

interface Props {
  record: Wcmp2Record;
  form: FormState;
  onClose: () => void;
}

// ── PR body template ────────────────────────────────────────────────────────

function buildPrBody(record: Wcmp2Record, isUpdate: boolean): string {
  const desc =
    record.properties.description.length > 300
      ? record.properties.description.slice(0, 297) + '…'
      : record.properties.description;
  const themes = record.properties.themes
    .flatMap(t => t.concepts.map(c => c.id))
    .slice(0, 5)
    .join(', ') || '—';

  return `## WCMP2 Metadata Record

This pull request ${isUpdate ? 'updates an existing' : 'adds a new'} metadata record prepared with the [WCMP2 Editor](https://github.com/6a6d74/wcmp2-editor).

| Field | Value |
|---|---|
| Record ID | \`${record.id}\` |
| Title | ${record.properties.title} |
| Description | ${desc} |
| Data policy | \`${record.properties['wmo:dataPolicy']}\` |
| Themes | ${themes} |
| Links | ${record.links.length} |
| Created | ${record.properties.created} |${record.properties.updated ? `\n| Updated | ${record.properties.updated} |` : ''}

## Validation

Before merging this PR, the record should pass the [WCMP2 Essential Test Suite](https://wis2-gdc.weather.gc.ca/processes/pywcmp-wis2-wcmp2-ets/execution).

## Checklist

- [ ] Record passes WCMP2 ETS validation
- [ ] All fields are complete and accurate
- [ ] Access links resolve successfully
- [ ] Approved by the dataset's point of contact
`;
}

// ── Small reusable pieces ────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'auth', label: 'Authenticate' },
    { id: 'repo', label: 'Repository' },
    { id: 'directory', label: 'Location' },
    { id: 'review', label: 'Review & push' },
  ];
  const idx = steps.findIndex(s => s.id === step);
  return (
    <div className="flex items-center gap-0 px-5 py-3 border-b border-gray-100 bg-gray-50">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-0">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${
            i < idx ? 'text-green-600' : i === idx ? 'text-blue-700' : 'text-gray-400'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              i < idx ? 'bg-green-100 text-green-700' :
              i === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {i < idx ? '✓' : i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={12} className="mx-2 text-gray-300 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle size={15} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ── Main dialog ──────────────────────────────────────────────────────────────

export function GitHubPushDialog({ record, form, onClose }: Props) {
  const [step, setStep] = useState<Step>('auth');

  // Auth state
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<GHUser | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  // Repo state
  const [repos, setRepos] = useState<GHRepo[]>([]);
  const [repoQuery, setRepoQuery] = useState('');
  const [reposBusy, setReposBusy] = useState(false);
  const [repoError, setRepoError] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GHRepo | null>(null);

  // Directory state
  const [currentPath, setCurrentPath] = useState('');
  const [dirContents, setDirContents] = useState<GHContent[]>([]);
  const [dirBusy, setDirBusy] = useState(false);
  const [filename, setFilename] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');

  // Review / push state
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState('');
  const [prResult, setPrResult] = useState<{ url: string; number: number } | null>(null);

  // ── Restore session token ──────────────────────────────────────────────────

  const loadRepos = useCallback(async (t: string) => {
    setReposBusy(true);
    setRepoError('');
    try {
      setRepos(await listUserRepos(t));
    } catch (e) {
      setRepoError((e as Error).message);
    } finally {
      setReposBusy(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (!saved) return;
    setAuthBusy(true);
    getUser(saved)
      .then(u => {
        setToken(saved);
        setUser(u);
        setStep('repo');
        loadRepos(saved);
      })
      .catch(() => sessionStorage.removeItem(TOKEN_KEY))
      .finally(() => setAuthBusy(false));
  }, [loadRepos]);

  // ── Auth ───────────────────────────────────────────────────────────────────

  const handleConnect = async () => {
    const t = tokenInput.trim();
    if (!t) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const u = await getUser(t);
      setToken(t);
      setUser(u);
      sessionStorage.setItem(TOKEN_KEY, t);
      setStep('repo');
      loadRepos(t);
    } catch (e) {
      setAuthError((e as Error).message || 'Authentication failed. Check your token.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    setTokenInput('');
    setStep('auth');
    setRepos([]);
    setSelectedRepo(null);
  };

  // ── Repo ───────────────────────────────────────────────────────────────────

  const loadDir = useCallback(async (repo: GHRepo, path: string) => {
    setDirBusy(true);
    try {
      const items = await getContents(token, repo.full_name, path);
      setDirContents(items.filter(c => c.type === 'dir'));
    } catch {
      setDirContents([]);
    } finally {
      setDirBusy(false);
    }
  }, [token]);

  const handleSelectRepo = async (repo: GHRepo) => {
    setRepoError('');
    try {
      const full = await getRepo(token, repo.full_name);
      if (full.permissions && !full.permissions.push) {
        setRepoError(`You don't have write access to ${repo.full_name}.`);
        return;
      }
      setSelectedRepo(full);
      const suggested = (form.localId || 'record').replace(/[^a-zA-Z0-9._-]/g, '_') + '.json';
      setFilename(suggested);
      setCurrentPath('');
      setShowNewFolder(false);
      setNewFolderInput('');
      setStep('directory');
      loadDir(full, '');
    } catch (e) {
      setRepoError((e as Error).message);
    }
  };

  const looksLikeFullName = (q: string) => /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(q.trim());

  const filteredRepos = repos
    .filter(r =>
      r.full_name.toLowerCase().includes(repoQuery.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(repoQuery.toLowerCase()),
    )
    .slice(0, 15);

  // ── Directory ──────────────────────────────────────────────────────────────

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setShowNewFolder(false);
    setNewFolderInput('');
    loadDir(selectedRepo!, path);
  };

  const confirmNewFolder = () => {
    const name = newFolderInput.trim().replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-|-$/g, '');
    if (!name) return;
    const newPath = currentPath ? `${currentPath}/${name}` : name;
    setCurrentPath(newPath);
    setDirContents([]);
    setShowNewFolder(false);
    setNewFolderInput('');
  };

  const breadcrumbs = currentPath ? currentPath.split('/') : [];

  const handleConfirmLocation = () => {
    setPrTitle(`Add WCMP2 metadata record: ${record.properties.title}`);
    setPrBody(buildPrBody(record, false));
    setPushError('');
    setPrResult(null);
    setStep('review');
  };

  // ── Push ───────────────────────────────────────────────────────────────────

  const handlePush = async () => {
    if (!selectedRepo) return;
    setPushing(true);
    setPushError('');
    try {
      const filePath = currentPath ? `${currentPath}/${filename}` : filename;
      const branch = makeBranchName(form.localId, form.title);

      const [existingSha, baseSha] = await Promise.all([
        getFileSha(token, selectedRepo.full_name, filePath),
        getDefaultBranchSha(token, selectedRepo.full_name, selectedRepo.default_branch),
      ]);

      const isUpdate = !!existingSha;
      const finalTitle = isUpdate
        ? `Update WCMP2 metadata record: ${record.properties.title}`
        : prTitle;
      const finalBody = isUpdate ? buildPrBody(record, true) : prBody;

      await createBranch(token, selectedRepo.full_name, branch, baseSha);
      await putFile(
        token, selectedRepo.full_name, filePath,
        JSON.stringify(record, null, 2),
        isUpdate
          ? `Update WCMP2 metadata record: ${record.id}`
          : `Add WCMP2 metadata record: ${record.id}`,
        branch, existingSha,
      );

      const pr = await createPR(
        token, selectedRepo.full_name,
        finalTitle, finalBody,
        branch, selectedRepo.default_branch,
      );
      setPrResult({ url: pr.html_url, number: pr.number });
    } catch (e) {
      setPushError((e as Error).message);
    } finally {
      setPushing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900">Push to GitHub</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <StepIndicator step={step} />

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

          {/* ── Step 1: Auth ─────────────────────────────────────────────── */}
          {step === 'auth' && (
            <div className="space-y-4">
              {authBusy ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4 justify-center">
                  <Loader size={15} className="animate-spin" /> Checking saved credentials…
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Enter a GitHub <strong>Personal Access Token</strong> with permission to create
                    branches and pull requests in the target repository.
                  </p>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-800 space-y-1">
                    <p className="font-medium">Required permissions</p>
                    <p>
                      <strong>Classic token:</strong> select the <code className="bg-blue-100 px-1 rounded">repo</code> scope.
                    </p>
                    <p>
                      <strong>Fine-grained token:</strong> grant <em>Contents</em> (read &amp; write) and{' '}
                      <em>Pull requests</em> (read &amp; write) for the target repository.
                    </p>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=WCMP2+Editor"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 underline font-medium mt-1"
                    >
                      Create a classic token <ExternalLink size={11} />
                    </a>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Personal Access Token
                    </label>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={e => { setTokenInput(e.target.value); setAuthError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleConnect()}
                      placeholder="github_pat_…"
                      autoComplete="off"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Stored in this browser tab only — cleared when you close the tab.
                    </p>
                  </div>
                  {authError && <ErrorBox message={authError} />}
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Repo ─────────────────────────────────────────────── */}
          {step === 'repo' && (
            <div className="space-y-3">
              {user && (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                  <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">{user.name || user.login}</p>
                    <p className="text-xs text-green-700">@{user.login}</p>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="text-xs text-green-700 underline hover:text-green-900"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Search your repositories
                </label>
                <input
                  type="text"
                  value={repoQuery}
                  onChange={e => setRepoQuery(e.target.value)}
                  placeholder="Filter by name, or type owner/repo…"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {reposBusy && (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <Loader size={13} className="animate-spin" /> Loading repositories…
                </div>
              )}

              {!reposBusy && (
                <ul className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto">
                  {filteredRepos.length === 0 && !looksLikeFullName(repoQuery) && (
                    <li className="px-3 py-3 text-sm text-gray-400 text-center">
                      {repos.length === 0 ? 'No repositories found.' : 'No matches.'}
                    </li>
                  )}
                  {filteredRepos.map(repo => (
                    <li key={repo.full_name}>
                      <button
                        onClick={() => handleSelectRepo(repo)}
                        className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors"
                      >
                        <Folder size={15} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{repo.full_name}</p>
                          {repo.description && (
                            <p className="text-xs text-gray-400 truncate">{repo.description}</p>
                          )}
                        </div>
                        {repo.private && (
                          <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                            private
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                  {looksLikeFullName(repoQuery) && !filteredRepos.find(r => r.full_name === repoQuery.trim()) && (
                    <li>
                      <button
                        onClick={() =>
                          handleSelectRepo({ full_name: repoQuery.trim() } as GHRepo)
                        }
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors text-blue-700"
                      >
                        <Folder size={15} className="shrink-0" />
                        <span className="text-sm font-medium">Use "{repoQuery.trim()}"</span>
                      </button>
                    </li>
                  )}
                </ul>
              )}

              {repoError && <ErrorBox message={repoError} />}
            </div>
          )}

          {/* ── Step 3: Directory ────────────────────────────────────────── */}
          {step === 'directory' && selectedRepo && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 font-medium">{selectedRepo.full_name}</div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-1 flex-wrap text-sm">
                <button
                  onClick={() => navigateTo('')}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <Home size={13} /> root
                </button>
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight size={12} className="text-gray-400" />
                    <button
                      onClick={() => navigateTo(breadcrumbs.slice(0, i + 1).join('/'))}
                      className={i === breadcrumbs.length - 1
                        ? 'font-semibold text-gray-800'
                        : 'text-blue-600 hover:text-blue-800'}
                    >
                      {crumb}
                    </button>
                  </span>
                ))}
              </div>

              {/* Directory listing */}
              <div className="border border-gray-200 rounded-lg overflow-hidden min-h-[5rem]">
                {dirBusy ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 p-4 justify-center">
                    <Loader size={13} className="animate-spin" /> Loading…
                  </div>
                ) : dirContents.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center p-4">
                    {currentPath ? 'Empty directory — record will be saved here.' : 'Root of repository.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {dirContents.map(entry => (
                      <li key={entry.path}>
                        <button
                          onClick={() => navigateTo(entry.path)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left text-sm transition-colors"
                        >
                          <Folder size={14} className="text-yellow-500 shrink-0" />
                          {entry.name}
                          <ChevronRight size={13} className="ml-auto text-gray-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* New folder */}
              {showNewFolder ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newFolderInput}
                    onChange={e => setNewFolderInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmNewFolder();
                      if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderInput(''); }
                    }}
                    placeholder="New folder name"
                    className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={confirmNewFolder}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowNewFolder(false); setNewFolderInput(''); }}
                    className="px-3 py-1.5 rounded text-gray-600 text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FolderPlus size={14} /> Create new folder here
                </button>
              )}

              {/* Filename */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Filename</label>
                <input
                  type="text"
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Will be saved to:{' '}
                  <code className="bg-gray-100 px-1 rounded">
                    {currentPath ? `${currentPath}/` : ''}{filename || '…'}
                  </code>
                </p>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Push ─────────────────────────────────────── */}
          {step === 'review' && selectedRepo && (
            <div className="space-y-4">
              {prResult ? (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 text-center space-y-2">
                  <CheckCircle size={32} className="mx-auto text-green-600" />
                  <p className="font-semibold text-green-800">Pull request created!</p>
                  <p className="text-sm text-green-700">PR #{prResult.number} is open and awaiting review.</p>
                  <a
                    href={prResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1 px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                  >
                    View pull request <ExternalLink size={13} />
                  </a>
                </div>
              ) : (
                <>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 text-xs text-gray-600 space-y-1">
                    <div>
                      <span className="text-gray-400">Repository: </span>
                      <span className="font-medium">{selectedRepo.full_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Path: </span>
                      <code className="bg-gray-100 px-1 rounded">
                        {currentPath ? `${currentPath}/` : ''}{filename}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-400">Base branch: </span>
                      <code className="bg-gray-100 px-1 rounded">{selectedRepo.default_branch}</code>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">PR title</label>
                    <input
                      type="text"
                      value={prTitle}
                      onChange={e => setPrTitle(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">PR description</label>
                    <textarea
                      value={prBody}
                      onChange={e => setPrBody(e.target.value)}
                      rows={10}
                      className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                  </div>

                  {pushError && <ErrorBox message={pushError} />}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              if (step === 'repo') setStep('auth');
              else if (step === 'directory') setStep('repo');
              else if (step === 'review') setStep('directory');
              else onClose();
            }}
            className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {step === 'auth' ? 'Cancel' : '← Back'}
          </button>

          <div>
            {step === 'auth' && !authBusy && (
              <button
                onClick={handleConnect}
                disabled={!tokenInput.trim() || authBusy}
                className="px-4 py-2 rounded bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-medium flex items-center gap-2 transition-colors"
              >
                {authBusy ? <Loader size={14} className="animate-spin" /> : <GitBranch size={14} />}
                Connect
              </button>
            )}

            {step === 'directory' && (
              <button
                onClick={handleConfirmLocation}
                disabled={!filename.trim()}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                Use this location →
              </button>
            )}

            {step === 'review' && !prResult && (
              <button
                onClick={handlePush}
                disabled={pushing || !prTitle.trim()}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium flex items-center gap-2 transition-colors"
              >
                {pushing && <Loader size={14} className="animate-spin" />}
                {pushing ? 'Creating PR…' : 'Create pull request'}
              </button>
            )}

            {prResult && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
