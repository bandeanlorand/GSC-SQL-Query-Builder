// utils.js
export function copySQL() {
  const sqlText = document.getElementById('sqlOutputFormated').textContent;
  copyToTheClipboard(sqlText);
}

export async function copyToTheClipboard(textToCopy) {
  try {
    await navigator.clipboard.writeText(textToCopy);
    document.body.classList.add('show-copied');
    setTimeout(() => {
      document.body.classList.remove('show-copied');
    }, 3000);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

export function setupEnterKeyTrigger(generateSQL) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generateSQL();
  });
}


// utils.js
export function initSlideInPanel({ panelId, overlayId } = {}) {
  const panel   = document.getElementById(panelId);
  const overlay = document.getElementById(overlayId);
  if (!panel || !overlay) {
    console.warn('[initSlideInPanel] Missing panel/overlay');
    return { open: () => {}, close: () => {} };
  }

  const HIDDEN_LEFT  = '-translate-x-full';
  const HIDDEN_RIGHT = 'translate-x-full';

  // Determine which side it’s anchored to (robust: computed style first)
  function anchoredSide() {
    const cs = getComputedStyle(panel);
    if (cs.left === '0px')  return 'left';
    if (cs.right === '0px') return 'right';
    if (panel.classList.contains('left-0'))  return 'left';
    if (panel.classList.contains('right-0')) return 'right';
    return 'left'; // sane default
  }

  function applyHiddenState(hide) {
    panel.classList.remove(HIDDEN_LEFT, HIDDEN_RIGHT);
    if (hide) panel.classList.add(anchoredSide() === 'left' ? HIDDEN_LEFT : HIDDEN_RIGHT);
  }

  let lastFocused = null;

  function open() {
    lastFocused = document.activeElement;
    applyHiddenState(false);
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.remove('opacity-0'));
    document.body.classList.add('overflow-hidden');
    panel.setAttribute('aria-hidden', 'false');
  }

  function close() {
    applyHiddenState(true);
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.body.classList.remove('overflow-hidden');
    panel.setAttribute('aria-hidden', 'true');
    if (lastFocused) lastFocused.focus();
  }

  document.addEventListener('keydown', (e) => {
    if (panel.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') close();
  });

  // Ensure starting state is correct (in case HTML missed it)
  applyHiddenState(true);

  return { open, close };
}

