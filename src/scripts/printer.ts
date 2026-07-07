/**
 * The shaktimaan print-spooler gag, staged:
 * stuck → retry → acting up → "shake the printer" (percussive maintenance,
 * click it) → short circuit (sparks + flash + smoke) → slow print → done.
 * The ⎙ tray chip only exists in shaktimaan mode (wm.ts toggles it).
 */

import { openWindow } from './wm';

const SHAKES_NEEDED = 4;

export function initPrinter() {
  const chip = document.getElementById('tray-printer');
  chip?.addEventListener('click', () => {
    chip.classList.add('read');
    openWindow('printer');
  });

  const root = document.getElementById('prn-root');
  if (!root) return;
  const msg = document.getElementById('prn-msg')!;
  const retry = document.getElementById('prn-retry')!;
  const wrap = document.getElementById('prn-wrap')!;
  const done = root.querySelector<HTMLElement>('.prn-done')!;

  let shakes = 0;
  const setState = (s: string) => (root.dataset.state = s);

  retry.addEventListener('click', () => {
    if (root.dataset.state !== 'stuck') return;
    retry.hidden = true;
    setState('actingup');
    msg.innerHTML =
      'retrying… <strong>ERR_CARRIAGE_JAM</strong> — the spooler is possessed.';
    setTimeout(() => {
      setState('shakeme');
      msg.innerHTML =
        'diagnosis: needs <strong>percussive maintenance</strong>. shake the printer! <span class="dim">(click it a few times)</span>';
    }, 2200);
  });

  wrap.addEventListener('click', () => {
    if (root.dataset.state !== 'shakeme') return;
    shakes += 1;
    wrap.classList.remove('thunk');
    void wrap.offsetWidth; // restart the thunk animation
    wrap.classList.add('thunk');

    if (shakes < SHAKES_NEEDED) {
      msg.innerHTML = `percussive maintenance: <strong>${shakes}/${SHAKES_NEEDED}</strong> — harder!`;
      return;
    }

    setState('shorting');
    msg.innerHTML = '⚡ <strong>short circuit!</strong> kundalini surge in the carriage…';
    setTimeout(() => {
      setState('printing');
      msg.innerHTML =
        'printing <strong>shaktimaan.pdf</strong> — gathering all seven chakras…';
      setTimeout(() => {
        setState('done');
        msg.innerHTML = '✓ job complete — <strong>shaktimaan.pdf</strong>';
        done.hidden = false;
      }, 8600);
    }, 1600);
  });
}
