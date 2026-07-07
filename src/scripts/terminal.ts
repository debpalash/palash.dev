/**
 * PHOSPHOR OS shell — reusable over any window that shows a prompt.
 *
 * The dedicated terminal window mounts on #terminal-root; any element with
 * class `mini-term` (about.txt, contact.sh, …) gets the same live shell.
 * All instances share the virtual filesystem that index.astro serializes
 * from the real site content (#vfs-data JSON).
 *
 * File nodes can carry: c (content), open (window id), view (image URL),
 * url (external link), x (executable).
 */

import { openWindow, openViewer, closeWindow } from './wm';

interface FileNode {
  t: 'f';
  c?: string;
  open?: string;
  view?: string;
  url?: string;
  x?: boolean;
}
interface DirNode {
  t: 'd';
  ch: Record<string, VfsNode>;
}
type VfsNode = FileNode | DirNode;

interface Vfs {
  meta: {
    user: string;
    host: string;
    email?: string;
    author: string;
    logo?: string;
    role?: string;
    os?: string;
    site?: string;
    company?: string;
    companyUrl?: string;
    github?: string;
    motto?: string;
    stack: string[];
    counts: Record<string, number>;
  };
  root: DirNode;
}

interface ShellOpts {
  banner?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function createShell(rootEl: HTMLElement, vfs: Vfs, opts: ShellOpts = {}) {
  const { user, host } = vfs.meta;

  rootEl.classList.add('term-root');
  rootEl.innerHTML = `
    <div class="term-out"></div>
    <div class="term-line">
      <span class="term-prompt"></span>
      <span class="term-echo"></span><span class="term-caret" aria-hidden="true">▉</span>
      <input class="term-in" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Terminal input" />
    </div>`;
  const out = rootEl.querySelector<HTMLElement>('.term-out')!;
  const promptEl = rootEl.querySelector<HTMLElement>('.term-prompt')!;
  const echo = rootEl.querySelector<HTMLElement>('.term-echo')!;
  const input = rootEl.querySelector<HTMLInputElement>('.term-in')!;

  let cwd: string[] = [];
  const history: string[] = [];
  let histIdx = -1;

  const promptText = () => `${user}@${host}:/${cwd.join('/')}$`;
  const refreshPrompt = () => (promptEl.textContent = promptText());
  const refreshEcho = () => (echo.textContent = input.value);

  function print(html: string) {
    const div = document.createElement('div');
    div.innerHTML = html;
    out.appendChild(div);
  }
  const printErr = (msg: string) => print(`<span class="t-err">${esc(msg)}</span>`);

  function resolve(path: string): { node: VfsNode | null; segs: string[] } {
    let segs = path.startsWith('/') || path.startsWith('~') ? [] : [...cwd];
    const parts = path.replace(/^~\/?|^\//, '').split('/').filter(Boolean);
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') {
        segs.pop();
        continue;
      }
      segs.push(p);
    }
    let node: VfsNode = vfs.root;
    for (const s of segs) {
      if (node.t !== 'd' || !node.ch[s]) return { node: null, segs };
      node = node.ch[s];
    }
    return { node, segs };
  }

  function nameHtml(name: string, node: VfsNode): string {
    if (node.t === 'd') return `<span class="t-dir">${esc(name)}/</span>`;
    if (node.x) return `<span class="t-exec">${esc(name)}*</span>`;
    if (node.view) return `<span class="t-img">${esc(name)}</span>`;
    return esc(name);
  }

  const cmds: Record<string, (args: string[]) => void> = {
    help() {
      print(
        [
          '<span class="t-dim">PHOSPHOR OS shell — commands:</span>',
          '  ls [path]      list directory',
          '  cd [path]      change directory',
          '  pwd            print working directory',
          '  cat &lt;file&gt;     print file contents',
          '  open &lt;file&gt;    open in a window (docs, programs, images)',
          '  run &lt;prog&gt;     run a program (same as ./prog)',
          '  neofetch       system info',
          '  whoami / date / uname / echo / clear / history',
          '  exit           close this window',
        ].join('\n'),
      );
    },
    pwd() {
      print(`/${cwd.join('/')}`);
    },
    ls(args) {
      const target = args.find((a) => !a.startsWith('-')) || '.';
      const { node } = resolve(target);
      if (!node) return printErr(`ls: ${target}: no such file or directory`);
      if (node.t === 'f') return print(esc(target));
      const entries = Object.entries(node.ch);
      if (!entries.length) return;
      print(entries.map(([n, ch]) => nameHtml(n, ch)).join('  '));
    },
    cd(args) {
      const target = args[0] || '/';
      const { node, segs } = resolve(target);
      if (!node) return printErr(`cd: ${target}: no such file or directory`);
      if (node.t !== 'd') return printErr(`cd: ${target}: not a directory`);
      cwd = segs;
      refreshPrompt();
    },
    cat(args) {
      if (!args[0]) return printErr('cat: missing operand');
      const { node } = resolve(args[0]);
      if (!node) return printErr(`cat: ${args[0]}: no such file or directory`);
      if (node.t === 'd') return printErr(`cat: ${args[0]}: is a directory`);
      print(`<span class="t-dim">${esc(node.c || '')}</span>`);
    },
    open(args) {
      if (!args[0]) return printErr('open: missing operand');
      const { node } = resolve(args[0]);
      if (!node) return printErr(`open: ${args[0]}: no such file or directory`);
      if (node.t === 'd') return printErr(`open: ${args[0]}: is a directory (try cd)`);
      if (node.view) return openViewer(node.view, args[0].split('/').pop() || 'image');
      if (node.open) return openWindow(node.open);
      if (node.url) {
        window.open(node.url, '_blank', 'noopener');
        return print(`<span class="t-dim">→ ${esc(node.url)}</span>`);
      }
      printErr(`open: ${args[0]}: nothing to open`);
    },
    run(args) {
      if (!args[0]) return printErr('run: missing operand');
      const { node } = resolve(args[0]);
      if (!node || node.t === 'd') return printErr(`run: ${args[0]}: not found`);
      if (!node.x) return printErr(`run: ${args[0]}: permission denied (not executable)`);
      print(`<span class="t-dim">launching ${esc(args[0])} …</span>`);
      if (node.open) openWindow(node.open);
    },
    echo(args) {
      print(esc(args.join(' ')));
    },
    whoami() {
      print(user);
    },
    hostname() {
      print(host);
    },
    date() {
      print(new Date().toString());
    },
    uname(args) {
      print(
        args.includes('-a')
          ? `${host} 7.0.6-phosphor #1 SMP CRT_GLOW arm64 GNU/Astro`
          : 'PHOSPHOR',
      );
    },
    clear() {
      out.innerHTML = '';
    },
    history() {
      print(history.map((h, i) => `  ${i + 1}  ${esc(h)}`).join('\n'));
    },
    neofetch() {
      const m = vfs.meta;
      const counts = Object.entries(m.counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(' · ');
      const row = (k: string, v: string) =>
        `<span class="k">${esc(k)}</span><span>${v}</span>`;
      const pal = ['--foreground0', '--foreground1', '--foreground2', '--amber', '--cyan', '--alert', '--background3']
        .map((c) => `<span style="background:var(${c})"></span>`)
        .join('');
      print(
        `<div class="nf-shell">` +
          (m.logo ? `<img src="${m.logo}" width="96" height="96" alt="" loading="lazy" />` : '') +
          `<div class="nf-body">` +
          `<span class="t-dir nf-title">${esc(m.email || `${m.user}@${m.host}`)}</span>` +
          `<span class="t-dim">─────────────────</span>` +
          `<div class="nf-rows">` +
          row('Name', `<strong>${esc(m.author)}</strong>`) +
          (m.role ? row('Role', esc(m.role)) : '') +
          (m.os ? row('OS', esc(m.os)) : '') +
          (m.site ? row('Host', `<a href="https://${esc(m.site)}">${esc(m.site)}</a>`) : '') +
          (m.company ? row('Company', `<a href="${esc(m.companyUrl || '#')}" target="_blank" rel="noopener">${esc(m.company)} ↗</a>`) : '') +
          (m.github ? row('GitHub', `<a href="https://${esc(m.github)}" target="_blank" rel="noopener">${esc(m.github)}</a>`) : '') +
          row('Packages', esc(counts)) +
          row('Shell', 'phosh 0.1') +
          (m.motto ? row('Motto', esc(m.motto)) : '') +
          row('Uptime', 'since boot, obviously') +
          `</div>` +
          `<div class="nf-pal">${pal}</div>` +
          `</div></div>`,
      );
    },
    exit() {
      // close whichever window hosts this shell
      const winsrc = rootEl.closest<HTMLElement>('.winsrc');
      if (winsrc) closeWindow(winsrc.id.replace('winsrc-', ''));
    },
    sudo() {
      printErr(`${user} is not in the sudoers file. This incident will be reported.`);
    },
    rm() {
      printErr('rm: read-only filesystem (nice try)');
    },
  };

  function exec(line: string) {
    print(`<span class="t-dim">${esc(promptText())}</span> ${esc(line)}`);
    const trimmed = line.trim();
    if (!trimmed) return;
    history.push(trimmed);
    histIdx = history.length;

    let [cmd, ...args] = trimmed.split(/\s+/);
    if (cmd.startsWith('./')) {
      args = [cmd.slice(2), ...args];
      cmd = 'run';
    }
    const fn = cmds[cmd];
    if (fn) {
      fn(args);
    } else {
      // bare path to an executable? emulate `opal.prg` → run
      const { node } = resolve(cmd);
      if (node && node.t === 'f' && node.x) return cmds.run([cmd]);
      printErr(`${cmd}: command not found (try: help)`);
    }
  }

  function complete() {
    const value = input.value;
    const parts = value.split(/\s+/);
    const last = parts[parts.length - 1] || '';
    const slash = last.lastIndexOf('/');
    const dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
    const prefix = slash >= 0 ? last.slice(slash + 1) : last;
    const { node } = resolve(dirPart || '.');
    if (!node || node.t !== 'd') return;
    const matches = Object.keys(node.ch).filter((n) => n.startsWith(prefix));
    if (matches.length === 1) {
      const m = matches[0];
      const suffix = node.ch[m].t === 'd' ? '/' : '';
      parts[parts.length - 1] = dirPart + m + suffix;
      input.value = parts.join(' ');
      refreshEcho();
    } else if (matches.length > 1) {
      print(matches.map((n) => nameHtml(n, node.ch[n])).join('  '));
    }
  }

  function scrollToEnd() {
    rootEl.scrollTop = rootEl.scrollHeight;
    const body = rootEl.closest('.winbody');
    if (body) body.scrollTop = body.scrollHeight;
  }

  input.addEventListener('input', refreshEcho);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      exec(input.value);
      input.value = '';
      refreshEcho();
      scrollToEnd();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) input.value = history[--histIdx] || '';
      refreshEcho();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length) input.value = history[++histIdx] || '';
      refreshEcho();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'Escape') {
      // first Esc blurs; a second (unfocused) Esc lets the WM close the window
      input.blur();
    }
    e.stopPropagation();
  });

  // clicking anywhere in the shell focuses the input
  rootEl.addEventListener('click', () => input.focus({ preventScroll: true }));
  input.addEventListener('focus', () => rootEl.classList.add('term-focus'));
  input.addEventListener('blur', () => rootEl.classList.remove('term-focus'));

  if (opts.banner) print(`<span class="t-dim">${opts.banner}</span>`);
  refreshPrompt();
  refreshEcho();

  return { input };
}

export function initTerminal() {
  const vfsEl = document.getElementById('vfs-data');
  if (!vfsEl) return;
  const vfs: Vfs = JSON.parse(vfsEl.textContent || '{}');

  const shells = new Map<string, { input: HTMLInputElement }>();

  const register = (el: HTMLElement, opts: ShellOpts = {}) => {
    const shell = createShell(el, vfs, opts);
    const winsrc = el.closest<HTMLElement>('.winsrc');
    if (winsrc) shells.set(winsrc.id.replace('winsrc-', ''), shell);
  };

  // clicking anywhere in a shell-hosting window — content, padding, empty
  // space, even the titlebar — activates its cursor, like a real terminal.
  // Interactive elements and text selections are left alone.
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('a, button, input, [data-open], [data-view]')) return;
    if (window.getSelection()?.toString()) return;
    const frame = t.closest<HTMLElement>('.window');
    if (!frame) return;
    const shell = shells.get(frame.dataset.win || '');
    if (shell) shell.input.focus({ preventScroll: true });
  });

  const termRoot = document.getElementById('terminal-root');
  if (termRoot) {
    register(termRoot, {
      banner: 'PHOSPHOR OS shell — type `help` to get started, `neofetch` to flex.',
    });
  }
  document
    .querySelectorAll<HTMLElement>('.mini-term')
    .forEach((el) => register(el));

  // focus the hosted shell when its window opens
  document.addEventListener('os:open', (e) => {
    const id = (e as CustomEvent).detail?.id;
    const shell = id && shells.get(id);
    if (shell) setTimeout(() => shell.input.focus({ preventScroll: true }), 60);
  });
}
