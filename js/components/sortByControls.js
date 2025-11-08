/**
 * sortByControls.js
 * ------------------
 * UI logic for the "Sort by" block.
 *
 * Responsibilities:
 * - toggleSortBy(): Show/hide the Sort section and rotate the caret icon.
 * - addSortRow(): Append a new "field + ASC/DESC" row.
 * - removeSortRow(): Remove the last sort row (keeps at least one).
 * - updateSortRemoveButton(): Show/hide the "−" button based on row count.
 * - updateSortFieldOptions(): Rebuild <select> options for each row from the
 *   current global Sets `selectedDimensions` and `selectedMetrics`, ensuring
 *   the sort-by dropdown always offers whatever the user has selected elsewhere.
 *
 * Data sources:
 * - `selectedDimensions` and `selectedMetrics` (global Sets, defined in main.js)
 *
 * Notes:
 * - addSortRow() builds a row with a <select> and an ASC/DESC radio group.
 * - updateSortFieldOptions() is safe to call after metrics/dimensions change
 *   (e.g., on selectMetric/removeMetric/selectDimension/removeDimension).
 * - Keep IDs in index.html consistent: #sortSection, #sortArrow, #sortRows,
 *   #removeSortRowBtn so these functions can find the right nodes.
 */
// js/sortByControls.js — custom dropdown version (no native <select>)

let hasGlobalOutsideClick = false;

function getSortRowsEl() { return document.getElementById('sortRows'); }
function getSortSectionEl() { return document.getElementById('sortSection'); }
function getSortArrowEl() { return document.getElementById('sortArrow'); }

function getSelectedSets() {
  const selectedDimensions = (window.selectedDimensions instanceof Set) ? window.selectedDimensions : new Set();
  const selectedMetrics    = (window.selectedMetrics    instanceof Set) ? window.selectedMetrics    : new Set();
  return { selectedDimensions, selectedMetrics };
}

function computeAllSortOptions() {
  const { selectedDimensions, selectedMetrics } = getSelectedSets();

  // Map display labels to normalized values you want in SQL
  const labelToValue = {
    'Query': 'query',
    'URL': 'url',
    'Clicks': 'clicks',
    'Impressions': 'impressions',
    'CTR': 'ctr',
    'Position': 'position',
  };

  const uniq = new Map();
  [...selectedDimensions, ...selectedMetrics].forEach(lbl => {
    const label = String(lbl);
    const value = labelToValue[label] || label.toLowerCase();
    if (!uniq.has(value)) uniq.set(value, label);
  });

  // Fallback (if nothing selected yet)
  if (uniq.size === 0) {
    [
      ['query','Query'],
      ['url','URL'],
      ['clicks','Clicks'],
      ['impressions','Impressions'],
      ['ctr','CTR'],
      ['position','Position'],
    ].forEach(([v,l]) => uniq.set(v,l));
  }

  return [...uniq.entries()].map(([value, label]) => ({ value, label }));
}

function ensureSortStateIndex(i) {
  if (!Array.isArray(window._sortClauses)) window._sortClauses = [];
  if (!window._sortClauses[i]) window._sortClauses[i] = { field: null, order: 'ASC' };
}

function safeUpdateClauses() {
  try {
    if (typeof window.updateFilterAndSortClauses === 'function') {
      window.updateFilterAndSortClauses();
    }
  } catch (_) { /* no-op */ }
}


function closeAllSortDropdowns() {
  const rows = getSortRowsEl()?.children || [];
  for (let i = 0; i < rows.length; i++) {
    const dd = document.getElementById(`sortFieldDropdown-${i}`);
    const arrow = document.getElementById(`sortFieldArrow-${i}`);
    if (dd && dd.getAttribute('data-open') === 'true') {
      closeDropdown(dd, arrow);
    }
  }
}


function toggleDropdown(dd, arrow) {
  if (!dd) return;
  const isOpen = dd.getAttribute('data-open') === 'true';
  isOpen ? closeDropdown(dd, arrow) : openDropdown(dd, arrow);
}

function openDropdown(dd, arrow) {
  // prep
  dd.classList.remove('hidden');
  dd.classList.add('block');
  dd.setAttribute('data-open', 'true');
  arrow?.classList.add('rotate-180');

  // start from collapsed + transparent
  dd.style.overflow = 'auto';
  dd.style.height = '0px';
  dd.style.opacity = '0';

  // force reflow so the browser acknowledges height=0
  // and we can animate to the target height
  void dd.offsetHeight;

  // animate to natural height + visible
  dd.style.height = dd.scrollHeight + 'px';
  dd.style.opacity = '1';

  // on transition end, cleanup inline styles so future opens work
  const onEnd = (e) => {
    if (e.target !== dd) return;
    dd.removeEventListener('transitionend', onEnd);
    dd.style.removeProperty('height');
    dd.style.removeProperty('opacity');
    // dd.style.removeProperty('overflow');
    dd.style.removeProperty('user-select');
    dd.style.removeProperty('background');
    dd.style.removeProperty('width');
  };
  dd.addEventListener('transitionend', onEnd, { once: true });
}

function closeDropdown(dd, arrow) {
  // mark closed immediately
  dd.setAttribute('data-open', 'false');
  arrow?.classList.remove('rotate-180');

  // lock current height to animate from it
  // dd.style.overflow = 'hidden';
  dd.style.height = dd.scrollHeight + 'px';
  dd.style.opacity = '1';

  // reflow then animate to 0
  void dd.offsetHeight;
  dd.style.height = '0px';
  dd.style.opacity = '0';

  const onEnd = (e) => {
    if (e.target !== dd) return;
    dd.removeEventListener('transitionend', onEnd);
    dd.classList.add('hidden');
    dd.classList.remove('block');

    // full cleanup so next open starts fresh
    dd.style.removeProperty('height');
    dd.style.removeProperty('opacity');
    // dd.style.removeProperty('overflow');
    dd.style.removeProperty('user-select');
    dd.style.removeProperty('background');
    dd.style.removeProperty('width');
  };
  dd.addEventListener('transitionend', onEnd, { once: true });
}


function buildDropdownItemsHTML(options, currentValue = null) {
  return options.map(o => `
    <div class="cursor-pointer p-1 hover:bg-[var(--bg-dropdown-hover)] hover:text-[var(--color-dropdown-hover)] rounded-[3px] px-2 ${o.value === currentValue ? 'bg-gray-200' : ''}"
         data-field="${o.value}">
      ${o.label}
    </div>
  `).join('');
}

/** PUBLIC: toggle Sort By section (keeps original API) */
export function toggleSortBy() {
  const section = getSortSectionEl();
  const arrow = getSortArrowEl();
  section.classList.toggle('hidden');
  arrow.classList.toggle('rotate-180');
}

/** PUBLIC: remove last sort row (keeps original API) */
export function removeSortRow() {
  const container = getSortRowsEl();
  if (container.children.length > 1) {
    container.lastElementChild.remove();
    // trim state
    if (Array.isArray(window._sortClauses)) {
      window._sortClauses.length = container.children.length;
      safeUpdateClauses();
    }
    updateSortRemoveButton();
  }
}

/** INTERNAL: wire click handlers for dropdown items in a row */
function wireDropdownClicksForRow(idx) {
  const list = document.getElementById(`sortFieldDropdown-${idx}`);
  const placeholder = document.getElementById(`sortFieldPlaceholder-${idx}`);
  const arrow = document.getElementById(`sortFieldArrow-${idx}`);

  list.querySelectorAll('[data-field]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = item.getAttribute('data-field');
      const label = item.textContent.trim();
      placeholder.textContent = label;
      ensureSortStateIndex(idx);
      window._sortClauses[idx].field = val;
      safeUpdateClauses();
      closeDropdown(list, arrow);
    });
  });
}

/** PUBLIC: add sort row (custom dropdown version) */
export function addSortRow() {
  const container = getSortRowsEl();
  const idx = container.children.length;

  // row wrapper
  const wrapper = document.createElement('div');
  // wrapper.className = 'flex items-center gap-4';
  wrapper.className = 'flex flex-wrap md:flex-nowrap items-center gap-4 [&>*]:basis-full sm:[&>*]:basis-auto';
  wrapper.id = `sortRow-${idx}`;

  // LEFT: custom dropdown
  const dropScope = document.createElement('div');
  // dropScope.className = 'relative w-[calc(50%-0px)] group focus-within:ring-0';
  dropScope.className = 'relative w-full sm:w-[calc(50%-0px)] group focus-within:ring-0';
  dropScope.setAttribute('data-sort-dropdown-scope', 'true');

  const trigger = document.createElement('div');
  trigger.id = `selectedSortField-${idx}`;
  trigger.tabIndex = 0;
  trigger.className = 'input w-full input-lg relative items-center justify-between cursor-pointer focus:outline-none text-sm';
  trigger.innerHTML = `
    <span id="sortFieldPlaceholder-${idx}" class="">Select Field</span>
    <svg id="sortFieldArrow-${idx}"
      class="w-4 h-4 transition-transform duration-300 cursor-pointer ml-2 flex-shrink-0"
      fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  `;

  const dropdown = document.createElement('div');
  dropdown.id = `sortFieldDropdown-${idx}`;
  dropdown.setAttribute('data-open', 'false');
  dropdown.className = 'bg-[var(--bg-dropdown)] border border-gray-600 p-1 rounded absolute z-10 mt-[8px] hidden max-h-[240px] overflow-auto w-full';
  dropdown.innerHTML = buildDropdownItemsHTML(computeAllSortOptions());

  dropScope.appendChild(trigger);
  dropScope.appendChild(dropdown);

  // RIGHT: asc/desc radios
  const radioGroup = document.createElement('div');
  // radioGroup.className = 'flex items-center gap-4 text-sm';
  radioGroup.className = 'flex items-center gap-4 text-sm w-full sm:w-auto justify-start sm:justify-normal pt-3 md:pt-0 border-b md:border-b-0 border-[color:var(--border,#3f3f46)] py-4 md:py-0 mb-4 md:mb-0';
  radioGroup.innerHTML = `
    <label class="inline-flex items-center gap-1 m-0 font-semibold">
      <input type="radio" name="sort-${idx}" value="ASC" class="radio radio-sm" checked />
      Ascending
    </label>
    <label class="inline-flex items-center gap-1 m-0 font-semibold">
      <input type="radio" name="sort-${idx}" value="DESC" class="radio radio-sm" />
      Descending
    </label>
  `;

  wrapper.appendChild(dropScope);
  wrapper.appendChild(radioGroup);
  container.appendChild(wrapper);

  // arrow toggle + keyboard
  const arrow = document.getElementById(`sortFieldArrow-${idx}`);
  trigger.addEventListener('click', (ev) => {
    ev.stopPropagation();
    toggleDropdown(dropdown, arrow);
  });
  trigger.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      toggleDropdown(dropdown, arrow);
    }
    if (ev.key === 'Escape') closeDropdown(dropdown, arrow);
  });

  // option clicks
  wireDropdownClicksForRow(idx);

  // order radios → update state
  wrapper.querySelectorAll(`input[name="sort-${idx}"]`).forEach(r => {
    r.addEventListener('change', () => {
      ensureSortStateIndex(idx);
      window._sortClauses[idx].order = r.value;
      safeUpdateClauses();
    });
  });

  // init state for row
  ensureSortStateIndex(idx);

  // outside click (install once)
  if (!hasGlobalOutsideClick) {
    hasGlobalOutsideClick = true;
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-sort-dropdown-scope="true"]')) return;
      closeAllSortDropdowns();
    });
  }

  updateSortRemoveButton();
}

/** PUBLIC: show/hide the "−" button depending on rows */
export function updateSortRemoveButton() {
  const container = getSortRowsEl();
  const removeBtn = document.getElementById('removeSortRowBtn');
  if (!removeBtn) return;
  if (container.children.length <= 1) {
    removeBtn.classList.add('hidden');
  } else {
    removeBtn.classList.remove('hidden');
  }
}

/** PUBLIC: refresh all row dropdown options from selectedDimensions/selectedMetrics */
export function updateSortFieldOptions() {
  const container = getSortRowsEl();
  const options = computeAllSortOptions();

  [...container.children].forEach((row, idx) => {
    const dd = document.getElementById(`sortFieldDropdown-${idx}`);
    if (!dd) return;

    // preserve current value
    const currentVal = (window._sortClauses && window._sortClauses[idx]?.field) || null;

    dd.innerHTML = buildDropdownItemsHTML(options, currentVal);
    wireDropdownClicksForRow(idx);

    // update placeholder label
    const placeholder = document.getElementById(`sortFieldPlaceholder-${idx}`);
    const chosen = options.find(o => o.value === currentVal);
    placeholder.textContent = chosen ? chosen.label : 'Select Field';
  });
}
