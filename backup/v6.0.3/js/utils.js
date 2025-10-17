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

  // ---- Config (override via data-* on #app-splash) ----
  const cfg = {
    intro: ms(splash.dataset.intro) ?? 700,
    hold:  ms(splash.dataset.hold)  ?? 300,
    outro: ms(splash.dataset.outro) ?? 500,

    // zoom scales
    endScaleOut: num(splash.dataset.endScale) ?? 0.55,     // shrink target
    endScaleIn:  num(splash.dataset.endScaleIn) ?? 1.35,   // grow target

    // desktop now uses top-right behavior (former mobile)
    cornerOffset: splash.dataset.cornerOffset || '20px',
    // desktop zoom mode: "out" (default) or "in"
    zoomDesktop: (splash.dataset.desktopZoom || 'out').toLowerCase(),

    breakpoint: parseInt(splash.dataset.mobileBreakpoint || '640', 10),
  };

  // Reduced motion: shorten durations
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cfg.intro = Math.min(cfg.intro, 300);
    cfg.hold  = Math.min(cfg.hold, 100);
    cfg.outro = Math.min(cfg.outro, 250);
  }

  const isMobile = window.matchMedia(`(max-width: ${cfg.breakpoint}px)`).matches;

  // ---- Inject keyframes stylesheet (JS-only) ----
  const STYLE_ID = 'splash-inline-anim';
  const css = makeKeyframes(cfg);
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;

  // Minimal inline layout (no CSS file needed)
  Object.assign(splash.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '10000',
    display: 'grid',
    placeItems: 'center',
    background: getPageBg() || '#f6f8fb',
    pointerEvents: 'none',
    height: '100vh'
  });

  Object.assign(logo.style, {
    opacity: '0',
    willChange: 'transform, opacity'
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('overflow-hidden');

    // INTRO
    logo.style.animation = `splashIntro ${cfg.intro}ms ease-out forwards`;

    // OUTRO start
    // OUTRO start
setTimeout(() => {
  const outroName = isMobile
    ? 'splashOutroCenterZoomIn'
    : (cfg.zoomDesktop === 'in' ? 'splashOutroTopRightZoomIn' : 'splashOutroTopRightZoomOut');

  // 👇 ensure mobile starts slightly smaller so growth is obvious
  if (isMobile) logo.style.transform = 'scale(0.9) rotate(360deg)';

  logo.style.animation = `${outroName} ${cfg.outro}ms ease-in forwards`;
}, cfg.intro + cfg.hold);


    // HIDE splash
    setTimeout(() => {
      splash.style.display = 'none';
      document.body.classList.remove('overflow-hidden');
      logo.style.animation = '';
    }, cfg.intro + cfg.hold + cfg.outro);
  });

  // ------- helpers -------
  function ms(v){ if(v==null) return null; const n=parseFloat(v); return Number.isFinite(n)?n:null; }
  function num(v){ if(v==null) return null; const n=parseFloat(v); return Number.isFinite(n)?n:null; }
  function getPageBg(){
    const bg = getComputedStyle(document.documentElement).backgroundColor;
    return (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') ? bg : null;
  }

  function makeKeyframes(c) {
    return `
@keyframes splashIntro{
  0%   { opacity:0; transform: scale(.85) rotate(-90deg); }
  40%  { opacity:1; transform: scale(1) rotate(0deg); }
  100% { opacity:1; transform: scale(1) rotate(360deg); }
}

/* Desktop: fly to TOP-RIGHT + zoom OUT (shrink) */
@keyframes splashOutroTopRightZoomOut{
  0%   { opacity:1; transform: translate(0,0) scale(1) rotate(360deg); }
  100% {
    opacity:0;
    transform:
      translate(calc(50vw - ${c.cornerOffset}), calc(-50vh + ${c.cornerOffset}))
      scale(${c.endScaleOut})
      rotate(540deg);
  }
}

/* Desktop: fly to TOP-RIGHT + zoom IN (grow) */
@keyframes splashOutroTopRightZoomIn{
  0%   { opacity:1; transform: translate(0,0) scale(1) rotate(360deg); }
  100% {
    opacity:0;
    transform:
      translate(calc(50vw - ${c.cornerOffset}), calc(-50vh + ${c.cornerOffset}))
      scale(${c.endScaleIn})
      rotate(540deg);
  }
}

/* Mobile: center-only ZOOM IN (no translate) */
/* Mobile: center-only ZOOM IN (clear growth) */
@keyframes splashOutroCenterZoomIn{
  0%   { opacity:1; transform: scale(0.9) rotate(360deg); }
  60%  { opacity:1; transform: scale(1.1) rotate(450deg); } /* subtle punch */
  100% { opacity:0; transform: scale(${c.endScaleIn}) rotate(540deg); }
}
`; }
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
    trigger: 'input w-full input-lg relative items-center justify-between cursor-pointer focus:outline-none text-sm',
    menu: 'bg-[var(--bg-dropdown)] border border-gray-600 p-1 rounded absolute z-10 mt-2 hidden w-full max-h-64 overflow-auto'
  }
} = {}) {
  if (!selectEl) return null;

  const wrap = document.createElement('div');
  wrap.className = 'relative custom-select-wrap';
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(selectEl);

  // hide native
  Object.assign(selectEl.style, {
    position:'absolute', opacity:'0', pointerEvents:'none', width:'0', height:'0'
  });

  const trigger = document.createElement('div');
  trigger.className = classNames.trigger;
  trigger.tabIndex = 0;
  trigger.innerHTML = `
    <span class="__label">${getSelectedLabel(selectEl) || placeholder}</span>
    <svg class="w-4 h-4 ml-2 transition-transform duration-200 __arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
    </svg>`;
  wrap.appendChild(trigger);

  const menu = document.createElement('div');
  menu.className = classNames.menu;
  menu.setAttribute('data-open', 'false');
  menu.innerHTML = buildMenu(selectEl);
  wrap.appendChild(menu);

  const arrow = trigger.querySelector('.__arrow');

  // ---- disabled helpers ----
  const isDisabled = () =>
    trigger.getAttribute('aria-disabled') === 'true' || selectEl.disabled;

  const setDisabled = (flag = true) => {
    if (flag) {
      selectEl.disabled = true;
      trigger.setAttribute('aria-disabled', 'true');
      trigger.classList.add('opacity-50', 'cursor-not-allowed');
      trigger.tabIndex = -1;
      close(); // ensure it's closed when disabling
    } else {
      selectEl.disabled = false;
      trigger.removeAttribute('aria-disabled');
      trigger.classList.remove('opacity-50', 'cursor-not-allowed');
      trigger.tabIndex = 0;
    }
  };

  // ---- open/close/toggle ----
  const open = (e) => {
    e?.stopPropagation?.();
    if (isDisabled() || menu.getAttribute('data-open') === 'true') return;
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
  const isOpen = () => menu.getAttribute('data-open') === 'true';

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled()) return;
    isOpen() ? close() : open(e);
  });
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isDisabled()) return;
      isOpen() ? close() : open(e);
    }
    if (e.key === 'Escape') close();
  });

  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });

  // pick option
  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-value]');
    if (!opt || isDisabled()) return;
    const val = opt.getAttribute('data-value');
    selectEl.value = val;
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    trigger.querySelector('.__label').textContent = opt.textContent.trim();
    close();
  });

  // keep in sync
  selectEl.addEventListener('change', () => {
    trigger.querySelector('.__label').textContent = getSelectedLabel(selectEl) || placeholder;
    menu.innerHTML = buildMenu(selectEl);
  });
  new MutationObserver(() => {
    trigger.querySelector('.__label').textContent = getSelectedLabel(selectEl) || placeholder;
    menu.innerHTML = buildMenu(selectEl);
  }).observe(selectEl, { childList:true, subtree:true, attributes:true });

  // respect initial disabled state
  if (selectEl.disabled) setDisabled(true);

  function buildMenu(sel) {
    return [...sel.options].map(o => `
      <div class="cursor-pointer p-1 hover:bg-[var(--bg-dropdown-hover)] hover:text-[var(--color-dropdown-hover)] rounded-[3px] px-2 ${o.selected ? 'selected-dropdown-el' : ''}"
           data-value="${o.value}">${o.text}</div>
    `).join('') || `<div class="p-2 text-gray-400">${placeholder}</div>`;
  }
  function getSelectedLabel(sel) {
    const o = sel.options[sel.selectedIndex];
    return o && !o.disabled ? o.text : '';
  }

  return { wrap, trigger, menu, open, close, setDisabled, isDisabled };
}

// after you create/append a filter row:
function initFilterRow(rowEl) {
  const fieldSel = rowEl.querySelector('select[data-role="filter-field"]');
  const opSel    = rowEl.querySelector('select[data-role="filter-op"]');

  const fieldCS = makeCustomSelect(fieldSel, { placeholder: 'Select Field' });
  const opCS    = makeCustomSelect(opSel,    { placeholder: 'Operator' });

  // start disabled
  opCS.setDisabled(true);

  fieldSel.addEventListener('change', () => {
    const hasField = !!fieldSel.value;
    // (optional) repopulate operator options here based on field type…
    // opSel.innerHTML = getOperatorsFor(fieldSel.value).map(o => `<option value="${o}">${o}</option>`).join('');
    // opSel.selectedIndex = -1; opSel.dispatchEvent(new Event('change'));

    opCS.setDisabled(!hasField);
  });
}


function closeAllCustomMenus() {
  document.querySelectorAll('.custom-select-wrap [data-open="true"]').forEach(el => {
    el.classList.add('hidden');
    el.setAttribute('data-open', 'false');
    const arrow = el.parentElement?.querySelector?.('.__arrow');
    arrow?.classList?.remove('rotate-180');
  });
}


/* theme switcher */

// utils.js
export const THEME_KEY = 'theme';
const mql = window.matchMedia('(prefers-color-scheme: dark)');

export function systemPrefersDark(){ return mql.matches; }

export function applyTheme(mode){
  const root = document.documentElement;
  const resolved = mode === 'auto' ? (systemPrefersDark() ? 'dark' : 'light') : mode;
  root.setAttribute('data-theme', resolved);
  root.classList.toggle('dark', resolved === 'dark'); // Tailwind
}

export function initThemeToggle(containerId = 'themeToggle'){
  const el = document.getElementById(containerId);
  if (!el) return;

  const radios = el.querySelectorAll('input[name="themeTabs"]');

  // hydrate (default = dark)
  let mode = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(mode);
  localStorage.setItem(THEME_KEY, mode);
  radios.forEach(r => r.checked = (r.value === mode));

  // change handler
  el.addEventListener('change', (e)=>{
    const r = e.target;
    if (r && r.name === 'themeTabs') {
      mode = r.value;
      localStorage.setItem(THEME_KEY, mode);
      applyTheme(mode);
    }
  });

  // follow system when in auto
  mql.addEventListener?.('change', ()=>{
    if ((localStorage.getItem(THEME_KEY) || 'dark') === 'auto') applyTheme('auto');
  });
}
