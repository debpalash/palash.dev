/**
 * PHOSPHOR OS window manager.
 *
 * Window contents are server-rendered by Astro into hidden `.winsrc`
 * sections (id="winsrc-<id>"). Opening a window moves that DOM node into a
 * window frame; closing moves it back. Zero framework runtime.
 *
 * Any element with `data-open="<id>"` opens a window — including elements
 * inside other windows. `data-view` + `data-cap` on an element opens an
 * image viewer window.
 */

interface Win {
  id: string;
  frame: HTMLElement;
  body: HTMLElement;
  src: HTMLElement | null;
  taskBtn: HTMLButtonElement;
  minimized: boolean;
  maximized: boolean;
}

const wins = new Map<string, Win>();
let zTop = 10;
let cascade = 0;
let focusedId: string | null = null;

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

const $ = (id: string) => document.getElementById(id);
const layer = () => $('windows')!;
const store = () => $('winsrc-store')!;

/* ------------------------------------------------------------ frame */

function buildFrame(id: string, title: string): { frame: HTMLElement; body: HTMLElement } {
  const frame = document.createElement('section');
  frame.className = 'window';
  frame.dataset.win = id;
  frame.setAttribute('role', 'dialog');
  frame.setAttribute('aria-label', title);

  const bar = document.createElement('header');
  bar.className = 'titlebar';

  const t = document.createElement('span');
  t.className = 'title';
  t.textContent = `▓▒░ ${title}`;

  const controls = document.createElement('span');
  controls.className = 'controls';
  for (const [act, glyph, label] of [
    ['min', '─', 'Minimize'],
    ['max', '□', 'Maximize'],
    ['close', '✕', 'Close'],
  ] as const) {
    const b = document.createElement('button');
    b.dataset.act = act;
    b.textContent = glyph;
    b.setAttribute('aria-label', label);
    controls.appendChild(b);
  }

  bar.append(t, controls);

  const body = document.createElement('div');
  body.className = 'winbody';

  const grip = document.createElement('div');
  grip.className = 'resize-grip';
  grip.setAttribute('aria-hidden', 'true');

  frame.append(bar, body, grip);
  layer().appendChild(frame);

  bar.addEventListener('pointerdown', (e) => startDrag(e, frame));
  grip.addEventListener('pointerdown', (e) => startResize(e, frame));
  frame.addEventListener('pointerdown', () => focusWin(id), true);
  controls.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn) return;
    e.stopPropagation();
    if (btn.dataset.act === 'close') closeWin(id);
    if (btn.dataset.act === 'min') minimizeWin(id);
    if (btn.dataset.act === 'max') toggleMax(id);
  });

  return { frame, body };
}

function placeFrame(frame: HTMLElement, w: number, h: number, center = false) {
  if (isMobile()) return;
  const deskW = innerWidth;
  const deskH = innerHeight;
  const width = Math.min(w, deskW - 32);
  const height = Math.min(h, deskH - 100);
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  if (center) {
    // biased slightly left so the top-right theme dropdown stays clear
    frame.style.left = `${Math.max(16, (deskW - width) / 2 - 80)}px`;
    frame.style.top = `${Math.max(16, (deskH - height - 60) / 2)}px`;
    return;
  }
  const step = 28;
  const x = Math.min(140 + cascade * step, Math.max(16, deskW - width - 24));
  const y = Math.min(48 + cascade * step, Math.max(16, deskH - height - 100));
  cascade = (cascade + 1) % 10;
  frame.style.left = `${x}px`;
  frame.style.top = `${y}px`;
}

/* ------------------------------------------------------------ taskbar */

function addTaskBtn(id: string, title: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'taskbtn';
  b.textContent = title;
  b.addEventListener('click', () => {
    const w = wins.get(id);
    if (!w) return;
    if (w.minimized) {
      restoreWin(id);
    } else if (focusedId === id) {
      minimizeWin(id);
    } else {
      focusWin(id);
    }
  });
  $('task-items')!.appendChild(b);
  return b;
}

/* ------------------------------------------------------------ core ops */

export function openWindow(id: string) {
  const existing = wins.get(id);
  if (existing) {
    restoreWin(id);
    return;
  }

  const src = $(`winsrc-${id}`);
  if (!src) return;

  const title = src.dataset.title || id;
  const w = parseInt(src.dataset.w || '560', 10);
  const h = parseInt(src.dataset.h || '420', 10);

  const { frame, body } = buildFrame(id, title);
  placeFrame(frame, w, h, 'center' in src.dataset);

  src.hidden = false;
  body.appendChild(src);

  const win: Win = {
    id,
    frame,
    body,
    src,
    taskBtn: addTaskBtn(id, title),
    minimized: false,
    maximized: false,
  };
  wins.set(id, win);
  focusWin(id);
  syncPins();
  document.dispatchEvent(new CustomEvent('os:open', { detail: { id } }));
}

/** running indicator on taskbar-pinned programs */
function syncPins() {
  document.querySelectorAll<HTMLElement>('#pins .pin[data-open]').forEach((p) => {
    p.classList.toggle('running', wins.has(p.dataset.open || ''));
  });
}

/** Ephemeral image-viewer window (not backed by a winsrc node). */
export function openViewer(srcUrl: string, caption: string) {
  const id = `viewer-${Date.now()}`;
  const { frame, body } = buildFrame(id, `view: ${caption}`);
  placeFrame(frame, Math.min(860, innerWidth - 64), Math.min(620, innerHeight - 140));

  const img = document.createElement('img');
  img.src = srcUrl;
  img.alt = caption;
  img.className = 'viewer-img';
  img.loading = 'eager';
  body.appendChild(img);

  const win: Win = {
    id,
    frame,
    body,
    src: null,
    taskBtn: addTaskBtn(id, caption),
    minimized: false,
    maximized: false,
  };
  wins.set(id, win);
  focusWin(id);
}

function closeWin(id: string) {
  const w = wins.get(id);
  if (!w) return;
  if (w.src) {
    w.src.hidden = true;
    store().appendChild(w.src);
  }
  w.frame.remove();
  w.taskBtn.remove();
  wins.delete(id);
  syncPins();
  if (focusedId === id) {
    focusedId = null;
    const last = [...wins.values()].filter((x) => !x.minimized).pop();
    if (last) focusWin(last.id);
  }
}

function minimizeWin(id: string) {
  const w = wins.get(id);
  if (!w) return;
  w.minimized = true;
  w.frame.classList.add('minimized');
  w.taskBtn.classList.remove('active');
  if (focusedId === id) focusedId = null;
}

function restoreWin(id: string) {
  const w = wins.get(id);
  if (!w) return;
  w.minimized = false;
  w.frame.classList.remove('minimized');
  focusWin(id);
  document.dispatchEvent(new CustomEvent('os:open', { detail: { id } }));
}

export function closeWindow(id: string) {
  closeWin(id);
}

function toggleMax(id: string) {
  const w = wins.get(id);
  if (!w) return;
  w.maximized = !w.maximized;
  w.frame.classList.toggle('maximized', w.maximized);
  focusWin(id);
}

function focusWin(id: string) {
  const w = wins.get(id);
  if (!w || w.minimized) return;
  focusedId = id;
  zTop += 1;
  w.frame.style.zIndex = String(zTop);
  for (const [wid, ww] of wins) {
    ww.frame.classList.toggle('focused', wid === id);
    ww.taskBtn.classList.toggle('active', wid === id);
  }
}

/* ------------------------------------------------------------ drag */

function startDrag(e: PointerEvent, frame: HTMLElement) {
  if (isMobile()) return;
  if ((e.target as HTMLElement).closest('button')) return;
  if (frame.classList.contains('maximized')) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const rect = frame.getBoundingClientRect();
  const bar = e.currentTarget as HTMLElement;
  bar.setPointerCapture(e.pointerId);

  function onMove(ev: PointerEvent) {
    const x = rect.left + (ev.clientX - startX);
    const y = rect.top + (ev.clientY - startY);
    frame.style.left = `${Math.min(Math.max(x, -rect.width + 80), innerWidth - 40)}px`;
    frame.style.top = `${Math.min(Math.max(y, 0), innerHeight - 80)}px`;
  }
  function onUp() {
    bar.removeEventListener('pointermove', onMove);
    bar.removeEventListener('pointerup', onUp);
  }
  bar.addEventListener('pointermove', onMove);
  bar.addEventListener('pointerup', onUp);
}

function startResize(e: PointerEvent, frame: HTMLElement) {
  if (isMobile()) return;
  if (frame.classList.contains('maximized')) return;
  e.preventDefault();
  e.stopPropagation();

  const rect = frame.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const grip = e.currentTarget as HTMLElement;
  grip.setPointerCapture(e.pointerId);

  function onMove(ev: PointerEvent) {
    const w = rect.width + (ev.clientX - startX);
    const h = rect.height + (ev.clientY - startY);
    frame.style.width = `${Math.min(Math.max(w, 280), innerWidth - rect.left - 8)}px`;
    frame.style.height = `${Math.min(Math.max(h, 160), innerHeight - rect.top - 8)}px`;
    frame.style.maxWidth = 'none';
    frame.style.maxHeight = 'none';
  }
  function onUp() {
    grip.removeEventListener('pointermove', onMove);
    grip.removeEventListener('pointerup', onUp);
  }
  grip.addEventListener('pointermove', onMove);
  grip.addEventListener('pointerup', onUp);
}

/* ------------------------------------------------------------ background */

const BG_MODES = ['starfield', 'wallpaper', 'video'] as const;
type BgMode = (typeof BG_MODES)[number];

function bgList(elId: string, key: 'srcs' | 'ids'): string[] {
  try {
    return JSON.parse($(elId)?.dataset[key] || '[]');
  } catch {
    return [];
  }
}

const store2 = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const load2 = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

let wallIdx = 0;
let vidIdx = 0;

function setWallpaper(i: number) {
  const el = $('bg-wallpaper');
  const list = bgList('bg-wallpaper', 'srcs');
  if (!el || !list.length) return;
  wallIdx = ((i % list.length) + list.length) % list.length;
  el.style.backgroundImage = `url('${list[wallIdx]}')`;
  store2('phosphor-wall', String(wallIdx));
}

function setVideo(i: number) {
  const holder = $('bg-video');
  const list = bgList('bg-video', 'ids');
  if (!holder || !list.length) return;
  vidIdx = ((i % list.length) + list.length) % list.length;
  store2('phosphor-vid', String(vidIdx));
  holder.innerHTML = '';
  if (document.body.dataset.bg === 'video') injectVideo();
}

function injectVideo() {
  const holder = $('bg-video');
  const list = bgList('bg-video', 'ids');
  if (!holder || !list.length || holder.querySelector('iframe')) return;
  const yt = list[vidIdx];
  const iframe = document.createElement('iframe');
  iframe.src =
    `https://www.youtube-nocookie.com/embed/${yt}` +
    `?autoplay=1&mute=1&controls=0&loop=1&playlist=${yt}` +
    '&rel=0&playsinline=1&iv_load_policy=3&disablekb=1';
  iframe.allow = 'autoplay; encrypted-media';
  iframe.tabIndex = -1;
  iframe.title = 'Ambient background video';
  holder.appendChild(iframe);
}

function applyBackground(mode: BgMode) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (mode === 'video' && reduced) mode = 'wallpaper';

  document.body.dataset.bg = mode;
  store2('phosphor-bg', mode);
  if (mode === 'video') injectVideo();

  const btn = $('bg-cycle');
  if (btn) btn.textContent = `display: ${mode} ▸`;
  const chip = $('tray-bg');
  if (chip) chip.textContent = `▩ ${mode}`;
  // mark the active mode in the context menu
  document.querySelectorAll<HTMLElement>('[data-bg-set]').forEach((b) => {
    b.classList.toggle('active', b.dataset.bgSet === mode);
  });
}

function hideCtxMenu() {
  $('ctx-menu')?.setAttribute('hidden', '');
  $('tbar-menu')?.setAttribute('hidden', '');
}

/* ------------------------------------------------------------ bulk ops + refresh */

function clearAllWindows() {
  [...wins.keys()].forEach((id) => closeWin(id));
}

function minimizeAllWindows() {
  [...wins.keys()].forEach((id) => minimizeWin(id));
}

function buildTreeLines(): string[] {
  try {
    const vfs = JSON.parse($('vfs-data')?.textContent || 'null');
    if (!vfs?.root) return [];
    const lines = ['guest@palash.dev:/$ tree /', '.'];
    const walk = (node: { ch: Record<string, any> }, prefix: string) => {
      const entries = Object.entries(node.ch || {});
      entries.forEach(([name, ch], i) => {
        const last = i === entries.length - 1;
        lines.push(prefix + (last ? '└── ' : '├── ') + name + (ch.t === 'd' ? '/' : ''));
        if (ch.t === 'd') walk(ch, prefix + (last ? '    ' : '│   '));
      });
    };
    walk(vfs.root, '');
    lines.push(
      '',
      `${lines.length - 2} entries scanned — cache invalidated, vibes refreshed.`,
      'guest@palash.dev:/$ ▉',
    );
    return lines;
  } catch {
    return [];
  }
}

let refreshing = false;
function refreshDesktop() {
  if (refreshing) return;
  refreshing = true;
  hideCtxMenu();

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('div');
  overlay.className = 'refresh-overlay';
  const pre = document.createElement('pre');
  overlay.appendChild(pre);
  document.body.appendChild(overlay);
  $('icons')?.classList.add('icons-flash');

  const lines = buildTreeLines();
  let i = 0;
  const finish = () => {
    setTimeout(() => {
      overlay.classList.add('done');
      setTimeout(() => {
        overlay.remove();
        $('icons')?.classList.remove('icons-flash');
        refreshing = false;
      }, 450);
    }, 550);
  };
  const step = () => {
    for (let k = 0; k < 3 && i < lines.length; k++) {
      pre.textContent += lines[i++] + '\n';
    }
    overlay.scrollTop = overlay.scrollHeight;
    if (i < lines.length) {
      setTimeout(step, 20);
    } else {
      finish();
    }
  };

  if (reduced || !lines.length) {
    pre.textContent = lines.join('\n');
    finish();
  } else {
    step();
  }
}

function initBackground() {
  const fallback = ($('desktop')?.dataset.bg || 'starfield') as BgMode;
  let mode = fallback;
  const saved = load2('phosphor-bg') as BgMode | null;
  if (saved && BG_MODES.includes(saved)) mode = saved;
  wallIdx = parseInt(load2('phosphor-wall') || '0', 10) || 0;
  vidIdx = parseInt(load2('phosphor-vid') || '0', 10) || 0;
  setWallpaper(wallIdx);
  applyBackground(mode);

  const cycleBg = () => {
    const current = (document.body.dataset.bg || 'starfield') as BgMode;
    const next = BG_MODES[(BG_MODES.indexOf(current) + 1) % BG_MODES.length];
    applyBackground(next);
  };
  $('bg-cycle')?.addEventListener('click', (e) => {
    e.stopPropagation();
    cycleBg();
  });
  $('tray-bg')?.addEventListener('click', cycleBg);

  // right-click menus: desktop and taskbar
  const ctx = $('ctx-menu');
  const tbar = $('tbar-menu');
  document.addEventListener('contextmenu', (e) => {
    const t = e.target as HTMLElement;
    if (tbar && t.closest('#taskbar')) {
      e.preventDefault();
      ctx?.setAttribute('hidden', '');
      tbar.hidden = false;
      const r = tbar.getBoundingClientRect();
      tbar.style.left = `${Math.min(e.clientX, innerWidth - r.width - 8)}px`;
      tbar.style.top = 'auto';
      tbar.style.bottom = `calc(var(--taskbar-h) + 0.35rem)`;
      return;
    }
    if (!ctx || !t.closest('#desktop')) return;
    if (t.closest('.window')) return; // windows keep the native menu
    e.preventDefault();
    tbar?.setAttribute('hidden', '');
    ctx.hidden = false;
    const r = ctx.getBoundingClientRect();
    ctx.style.left = `${Math.min(e.clientX, innerWidth - r.width - 8)}px`;
    ctx.style.top = `${Math.min(e.clientY, innerHeight - r.height - 8)}px`;
    ctx.style.bottom = 'auto';
  });
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (ctx && !ctx.hidden && !t.closest('#ctx-menu')) ctx.hidden = true;
    if (tbar && !tbar.hidden && !t.closest('#tbar-menu')) tbar.hidden = true;
  });

  $('ctx-refresh')?.addEventListener('click', refreshDesktop);
  $('tbar-refresh')?.addEventListener('click', refreshDesktop);
  $('tbar-clear')?.addEventListener('click', () => {
    clearAllWindows();
    hideCtxMenu();
  });
  $('tbar-min')?.addEventListener('click', () => {
    minimizeAllWindows();
    hideCtxMenu();
  });

  document.addEventListener('click', (e) => {
    const setBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-bg-set]');
    if (setBtn) {
      applyBackground(setBtn.dataset.bgSet as BgMode);
      return;
    }
    if ((e.target as HTMLElement).closest('#ctx-next-wall')) {
      setWallpaper(wallIdx + 1);
      applyBackground('wallpaper');
    }
    if ((e.target as HTMLElement).closest('#ctx-next-video')) {
      setVideo(vidIdx + 1);
      applyBackground('video');
    }
  });
}

/* ------------------------------------------------------------ themes */

const THEMES = [
  'phosphor',
  'amber',
  'ice',
  'synthwave',
  'doom',
  'paper',
  'xp',
  'snow',
  'tiger',
  'omarchy',
  'xmen97',
  'shaktimaan',
  'simba',
];

function applyTheme(theme: string) {
  if (!THEMES.includes(theme)) theme = 'phosphor';
  if (theme === 'phosphor') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
  store2('phosphor-ui-theme', theme);
  // the print spooler only haunts shaktimaan mode
  $('tray-printer')?.toggleAttribute('hidden', theme !== 'shaktimaan');
  if (theme !== 'shaktimaan' && wins.has('printer')) closeWin('printer');
  const btn = $('theme-btn');
  if (btn) btn.textContent = `◐ ${theme}`;
  const chip = $('tray-theme');
  if (chip) chip.textContent = `◐ ${theme}`;
  document.querySelectorAll<HTMLElement>('[data-theme-set]').forEach((b) => {
    b.classList.toggle('active', b.dataset.themeSet === theme);
  });
}

function initThemes() {
  applyTheme(load2('phosphor-ui-theme') || 'phosphor');

  const btn = $('theme-btn');
  const menu = $('theme-menu');
  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu) menu.hidden = !menu.hidden;
  });
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const pick = t.closest<HTMLElement>('[data-theme-set]');
    if (pick) {
      applyTheme(pick.dataset.themeSet!);
      return;
    }
    if (menu && !menu.hidden && !t.closest('#theme-corner')) menu.hidden = true;
  });

  $('tray-theme')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'phosphor';
    applyTheme(THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]);
  });
}

/* ------------------------------------------------------------ sys meter */

/** Live "what is this website consuming" readout: JS heap (Chromium) and
 *  bytes transferred, with a heap sparkline. */
function initSysMeter() {
  const meter = $('tray-meter');
  const sys = $('tray-sys');
  if (!meter || !sys) return;

  const hist: number[] = [];
  const BARS = '▁▂▃▄▅▆▇█';
  const fmt = (b: number) =>
    b < 1024 * 1024 ? `${Math.round(b / 1024)}K` : `${(b / (1024 * 1024)).toFixed(1)}M`;

  function sample() {
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const used = mem?.usedJSHeapSize ?? 0;

    let net = 0;
    for (const e of performance.getEntriesByType('resource')) {
      net += (e as PerformanceResourceTiming).transferSize || 0;
    }
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    net += nav?.transferSize || 0;

    if (used) {
      hist.push(used);
      if (hist.length > 6) hist.shift();
      const peak = Math.max(...hist);
      meter!.textContent = hist
        .map((v) => BARS[Math.min(7, Math.round((v / peak) * 7))])
        .join('')
        .padStart(6, '▁');
    }

    sys!.textContent = used ? `mem ${fmt(used)} · net ${fmt(net)}` : `net ${fmt(net)}`;
    meter!.title = `this website, right now — js heap: ${used ? fmt(used) : 'n/a'} · transferred: ${fmt(net)}`;
  }

  sample();
  setInterval(sample, 2000);
}

/* ------------------------------------------------------------ boot */

function runBoot(then: () => void) {
  const boot = $('boot');
  if (!boot) return then();

  const skip = sessionStorage.getItem('phosphor-booted') === '1'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (skip) {
    boot.classList.add('done');
    return then();
  }

  const lines = JSON.parse(boot.dataset.lines || '[]') as string[];
  boot.textContent = '';
  let i = 0;
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    sessionStorage.setItem('phosphor-booted', '1');
    boot!.classList.add('done');
    then();
  }

  function next() {
    if (finished) return;
    if (i >= lines.length) {
      setTimeout(finish, 450);
      return;
    }
    const line = document.createElement('span');
    line.className = 'boot-line';
    const text = lines[i];
    line.innerHTML = text.replace(/\bOK\b/g, '<span class="boot-ok">OK</span>');
    boot!.appendChild(line);
    i += 1;
    setTimeout(next, 90 + Math.random() * 140);
  }

  boot.addEventListener('click', finish);
  document.addEventListener('keydown', finish, { once: true });
  next();
}

/* ------------------------------------------------------------ init */

export function initWM() {
  // click delegation: anything with data-open / data-view
  document.addEventListener('click', (e) => {
    const opener = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
    if (opener) {
      e.preventDefault();
      openWindow(opener.dataset.open!);
      $('start-menu')?.setAttribute('hidden', '');
      hideCtxMenu();
      return;
    }
    const viewer = (e.target as HTMLElement).closest<HTMLElement>('[data-view]');
    if (viewer) {
      e.preventDefault();
      openViewer(viewer.dataset.view!, viewer.dataset.cap || 'image');
    }
  });

  // Esc closes the focused window; start menu toggle
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openMenu = ['ctx-menu', 'tbar-menu', 'start-menu', 'theme-menu']
        .map($)
        .find((m) => m && !m.hidden);
      if (openMenu) {
        openMenu.hidden = true;
      } else if (focusedId) {
        closeWin(focusedId);
      }
    }
  });

  const startBtn = $('start-btn');
  const menu = $('start-menu');
  startBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu) menu.hidden = !menu.hidden;
  });
  document.addEventListener('click', (e) => {
    if (menu && !menu.hidden && !(e.target as HTMLElement).closest('#start-menu, #start-btn')) {
      menu.hidden = true;
    }
  });

  initBackground();
  initThemes();

  initSysMeter();

  // clock + date
  const clock = $('clock');
  const trayDate = $('tray-date');
  function tick() {
    const d = new Date();
    if (clock) {
      clock.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (trayDate) {
      trayDate.textContent = d
        .toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })
        .toUpperCase();
    }
  }
  tick();
  setInterval(tick, 15000);

  // boot, then open deep-linked window; autopen only on the first visit
  runBoot(() => {
    const hashId = location.hash.slice(1);
    if (hashId && $(`winsrc-${hashId}`)) {
      openWindow(hashId);
      return;
    }
    const firstVisit = load2('phosphor-visited') !== '1';
    store2('phosphor-visited', '1');
    if (firstVisit) {
      const auto = ($('desktop')?.dataset.autopen || '').split(',').filter(Boolean);
      auto.forEach((id, idx) => setTimeout(() => openWindow(id.trim()), idx * 160));
    }
  });
}
