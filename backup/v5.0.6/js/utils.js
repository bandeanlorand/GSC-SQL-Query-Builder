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
(function () {
  const splash = document.getElementById('app-splash');
  if (!splash) return;
  const logo = splash.querySelector('.splash__logo');
  if (!logo) return;

  function getMs(name, fallback){
    const r = getComputedStyle(document.documentElement).getPropertyValue(name);
    const n = parseFloat(r);
    return Number.isFinite(n) ? n : fallback;
  }
  const INTRO = getMs('--splash-intro',700);
  const HOLD  = getMs('--splash-hold', 300);
  const OUTRO = getMs('--splash-outro',900);

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('overflow-hidden');

    splash.classList.add('splash--intro');
    logo.style.animation = `splashIntro ${INTRO}ms ease-out forwards`;

    setTimeout(() => {
      splash.classList.remove('splash--intro');
      splash.classList.add('splash--outro');
      logo.style.animation = `splashOutro ${OUTRO}ms ease-in forwards`;
    }, INTRO + HOLD);

    setTimeout(() => {
      splash.classList.add('splash--hidden');
      splash.classList.remove('splash--outro');
      document.body.classList.remove('overflow-hidden');
      logo.style.animation = '';
    }, INTRO + HOLD + OUTRO);
  });
})();


// ---------- Dropdown auto-placement (up/down with clamped height) ----------
export function autoPlaceDropdown(triggerEl, dropdownEl, opts = {}) {
  if (!triggerEl || !dropdownEl) return 'down';

  const {
    offset = 8,          // gap between trigger and menu
    minHeight = 120,     // never smaller than this when open
    maxHeight = 320,     // preferred max menu height
    root = null          // custom root (else viewport)
  } = opts;

  // Make sure the menu is wide enough and positioned relative to the trigger
  dropdownEl.style.left = '0px';
  dropdownEl.style.minWidth = triggerEl.offsetWidth + 'px';

  const rect = triggerEl.getBoundingClientRect();
  const viewportH = root
    ? (root.clientHeight || window.innerHeight)
    : (window.innerHeight || document.documentElement.clientHeight);

  const spaceBelow = viewportH - rect.bottom;
  const spaceAbove = rect.top;

  const desired = Math.min(maxHeight, dropdownEl.scrollHeight || maxHeight);
  const openUp = spaceBelow < desired && spaceAbove > spaceBelow;

  dropdownEl.classList.remove('dd--up', 'dd--down');
  dropdownEl.classList.add(openUp ? 'dd--up' : 'dd--down');

  const avail = openUp ? (spaceAbove - offset) : (spaceBelow - offset);
  const finalMax = Math.max(minHeight, Math.min(desired, avail));

  dropdownEl.style.maxHeight = finalMax + 'px';
  dropdownEl.style.overflowY = dropdownEl.scrollHeight > finalMax ? 'auto' : 'visible';
  dropdownEl.dataset.placement = openUp ? 'up' : 'down';

  return openUp ? 'up' : 'down';
}

// Recompute placement on resize/scroll. Returns a cleanup() you can call on close.
export function watchDropdownPlacement(triggerEl, dropdownEl, opts = {}) {
  const fn = () => autoPlaceDropdown(triggerEl, dropdownEl, opts);
  const parents = getScrollParents(triggerEl);
  window.addEventListener('resize', fn);
  parents.forEach(p => p.addEventListener('scroll', fn, { passive: true }));
  return () => {
    window.removeEventListener('resize', fn);
    parents.forEach(p => p.removeEventListener('scroll', fn));
  };
}

// Find scrollable ancestors so placement updates while containers scroll
export function getScrollParents(el) {
  const out = [];
  let node = el && el.parentElement;
  const scrollRE = /(auto|scroll|overlay)/;
  while (node && node !== document.body) {
    const cs = getComputedStyle(node);
    if (scrollRE.test(cs.overflow + cs.overflowY + cs.overflowX)) out.push(node);
    node = node.parentElement;
  }
  out.push(window);
  return out;
}


// utils.js
// Minimal custom dropdown over a native <select>.
// It hides the <select>, renders a trigger + menu, and keeps them in sync.
export function makeCustomSelect(selectEl, {
  placeholder = 'Select…',
  classNames = {
    trigger: 'input input-lg w-full p-[9px] text-sm cursor-pointer flex items-center justify-between',
    menu: 'bg-white border border-gray-600 p-1 rounded absolute z-10 mt-2 hidden w-full max-h-64 overflow-auto'
  }
} = {}) {
  if (!selectEl) return null;

  // wrapper
  const wrap = document.createElement('div');
  wrap.className = 'relative custom-select-wrap';
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(selectEl);

  // visually hide native select but keep it in DOM
  selectEl.style.position = 'absolute';
  selectEl.style.opacity = '0';
  selectEl.style.pointerEvents = 'none';
  selectEl.style.width = '0';
  selectEl.style.height = '0';

  const trigger = document.createElement('div');
  trigger.className = classNames.trigger;
  trigger.tabIndex = 0;
  trigger.innerHTML = `
    <span class="__label">${getSelectedLabel(selectEl) || placeholder}</span>
    <svg class="w-4 h-4 ml-2 transition-transform duration-200 __arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
    </svg>
  `;
  wrap.appendChild(trigger);

  const menu = document.createElement('div');
  menu.className = classNames.menu;
  menu.setAttribute('data-open', 'false');
  menu.innerHTML = buildMenu(selectEl);
  wrap.appendChild(menu);

  const arrow = trigger.querySelector('.__arrow');

  const open = (e) => {
    e?.stopPropagation?.();
    if (menu.getAttribute('data-open') === 'true') return;
    closeAllCustomMenus();
    menu.classList.remove('hidden');
    menu.setAttribute('data-open', 'true');
    arrow.classList.add('rotate-180');
  };
  const close = () => {
    if (menu.getAttribute('data-open') !== 'true') return;
    menu.classList.add('hidden');
    menu.setAttribute('data-open', 'false');
    arrow.classList.remove('rotate-180');
  };

  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
    if (e.key === 'Escape') close();
  });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });

  // Click an option → set native select + dispatch change
  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-value]');
    if (!opt) return;
    const val = opt.getAttribute('data-value');
    selectEl.value = val;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    trigger.querySelector('.__label').textContent = opt.textContent.trim();
    close();
  });

  // Keep in sync if someone changes the native select programmatically
  selectEl.addEventListener('change', () => {
    trigger.querySelector('.__label').textContent = getSelectedLabel(selectEl) || placeholder;
    menu.innerHTML = buildMenu(selectEl);
  });

  // Rebuild if options list is repopulated
  const observer = new MutationObserver(() => {
    trigger.querySelector('.__label').textContent = getSelectedLabel(selectEl) || placeholder;
    menu.innerHTML = buildMenu(selectEl);
  });
  observer.observe(selectEl, { childList: true, subtree: true, attributes: true });

  function buildMenu(sel) {
    return [...sel.options].map(o => `
      <div class="cursor-pointer p-1 hover:bg-gray-200 rounded px-2 ${o.selected ? 'bg-gray-100' : ''}"
           data-value="${o.value}">
        ${o.text}
      </div>
    `).join('') || `<div class="p-2 text-gray-400">${placeholder}</div>`;
  }
  function getSelectedLabel(sel) {
    const o = sel.options[sel.selectedIndex];
    return o && !o.disabled ? o.text : '';
  }

  return { wrap, trigger, menu, open, close };
}

function closeAllCustomMenus() {
  document.querySelectorAll('.custom-select-wrap [data-open="true"]').forEach(el => {
    el.classList.add('hidden');
    el.setAttribute('data-open', 'false');
    const arrow = el.parentElement?.querySelector?.('.__arrow');
    arrow?.classList?.remove('rotate-180');
  });
}
