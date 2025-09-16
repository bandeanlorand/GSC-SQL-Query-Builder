// integration.js - listens for #gsc=... in the URL and for postMessage payloads
// Depends on: window.selectedMetrics/selectedDimensions, addFilterRow, addSortRow, addCustomFieldGroup, generateSQL.

(function() {
  // ---- decode helpers ----
  function tryDecode(str) {
    // LZ-String encodedURIComponent (preferred)
    if (window.LZString) {
      try {
        const json = window.LZString.decompressFromEncodedURIComponent(str);
        if (json) return JSON.parse(json);
      } catch(e){}
    }
    // Base64url JSON fallback
    try {
      const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
      const json = atob(b64 + '='.repeat(pad));
      return JSON.parse(json);
    } catch(e){}
    // Plain decodeURIComponent JSON fallback
    try {
      return JSON.parse(decodeURIComponent(str));
    } catch(e){}
    return null;
  }

  function getHashPayload() {
    const m = location.hash.match(/[#&]gsc=([^&]+)/);
    return m ? tryDecode(m[1]) : null;
  }

  // ---- UI mappers ----
  function setDate(date) {
    if (!date) return;
    const dd = document.getElementById('dateRangeDropdown');
    if (!dd) return;

    if (date.preset) {
      const opt = [...dd.querySelectorAll('[data-range]')].find(el => el.getAttribute('data-range') === date.preset);
      if (opt) opt.click();
      return;
    }
    if (date.from && date.to) {
      const opt = [...dd.querySelectorAll('[data-range]')].find(el => el.getAttribute('data-range') === 'Custom date range');
      if (opt) opt.click();
      const start = document.getElementById('startDate');
      const end = document.getElementById('endDate');
      if (start && end) {
        start.value = date.from;
        end.value = date.to;
      }
    }
  }

  function setMetrics(metrics = []) {
    if (typeof window.clearAllMetrics === 'function') window.clearAllMetrics();
    metrics.forEach(m => typeof window.selectMetric === 'function' && window.selectMetric(m));
  }

  function setDimensions(dims = []) {
    if (typeof window.clearAllDimensions === 'function') window.clearAllDimensions();
    dims.forEach(d => typeof window.selectDimension === 'function' && window.selectDimension(d));
  }

  function clearFiltersUI() {
    const c = document.getElementById('filterRows');
    if (c) c.innerHTML = '';
  }

  function setFilters(filters = [], logic = 'AND') {
    clearFiltersUI();
    const container = document.getElementById('filterRows');
    filters.forEach((f, idx) => {
      if (typeof window.addFilterRow === 'function') window.addFilterRow();
      const row = container?.lastElementChild;
      if (!row) return;

      const selects = row.querySelectorAll('select');
      const fieldSelect = selects[0];
      const opSelect = selects[1];

      if (fieldSelect && f.field) {
        const fieldMap = { query: 'Query', page: 'URL', country: 'Country', device: 'Device', 'search type': 'Search Type' };
        const uiField = fieldMap[(f.field+'').toLowerCase()] || f.field;
        fieldSelect.value = uiField;
        fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (opSelect && f.op) {
        opSelect.value = (f.op+'').toUpperCase();
        opSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const countryInput = row.querySelector('input.country-search-input');
      const textInput = row.querySelector('input[type="text"]');
      if (countryInput && (fieldSelect?.value === 'Country')) {
        countryInput.dataset.code = f.value || '';
        countryInput.value = f.value || '';
      } else if (textInput && f.value != null) {
        textInput.value = f.value;
      }

      if (idx > 0) {
        const radios = row.querySelectorAll('input[type="radio"][name^="filter-logic"]');
        const target = [...radios].find(r => r.value === (logic || 'AND'));
        if (target) target.checked = true;
      }
    });
  }

  function clearSortUI() {
    const c = document.getElementById('sortRows');
    if (c) c.innerHTML = '';
  }

  function setSort(sort = []) {
    clearSortUI();
    const container = document.getElementById('sortRows');
    sort.forEach(s => {
      if (typeof window.addSortRow === 'function') window.addSortRow();
      const row = container?.lastElementChild;
      if (!row) return;

      const fieldSelect = row.querySelector('select');
      const radios = [...row.querySelectorAll('input[type="radio"]')];

      if (fieldSelect && s.field) {
        const fieldMap = { clicks: 'Clicks', impressions: 'Impressions', ctr: 'CTR', position: 'Avg Position' };
        fieldSelect.value = fieldMap[(s.field+'').toLowerCase()] || s.field;
        fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const dir = (s.dir || 'DESC').toUpperCase();
      const radio = radios.find(r => r.value === dir);
      if (radio) radio.checked = true;
    });
  }

  function clearCustomFieldsUI() {
    const c = document.getElementById('customFieldGroups');
    if (c) c.innerHTML = '';
  }

  function setCustomFields(groups = []) {
    clearCustomFieldsUI();
    const groupsEl = document.getElementById('customFieldGroups');
    groups.forEach(g => {
      if (typeof window.addCustomFieldGroup === 'function') window.addCustomFieldGroup();
      const group = groupsEl?.lastElementChild;
      if (!group) return;

      const nameInput = group.querySelector('input[type="text"][placeholder="e.g. Brand bucket"]');
      if (nameInput && g.name) nameInput.value = g.name;

      const condWrapper = group.querySelector('.custom-condition-group');
      if (Array.isArray(g.conditions)) {
        let rows = condWrapper.querySelectorAll('.custom-condition-row');
        for (let i = rows.length; i < g.conditions.length; i++) {
          const addBtn = group.querySelector('button.add-condition-btn');
          addBtn?.click();
        }
        rows = condWrapper.querySelectorAll('.custom-condition-row');
        g.conditions.forEach((c, i) => {
          const row = rows[i];
          if (!row) return;
          const selects = row.querySelectorAll('select');
          const fieldSelect = selects[0];
          const opSelect = selects[1];
          const txt = row.querySelector('input[type="text"]');
          const countryInput = row.querySelector('input.country-search-input');

          if (fieldSelect && c.field) {
            const fieldMap = { query: 'Query', page: 'URL', country: 'Country', device: 'Device', 'search type': 'Search Type' };
            const uiField = fieldMap[(c.field+'').toLowerCase()] || c.field;
            fieldSelect.value = uiField;
            fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (opSelect && c.op) {
            opSelect.value = (c.op+'').toUpperCase();
            opSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (countryInput && (fieldSelect?.value === 'Country')) {
            countryInput.dataset.code = c.value || '';
            countryInput.value = c.value || '';
          } else if (txt && c.value != null) {
            txt.value = c.value;
          }
        });
      }

      const thenInput = group.querySelector('input.then-input');
      const elseInput = group.querySelector('input.else-input');
      if (thenInput && g.then != null) thenInput.value = g.then;
      if (elseInput && g.else != null) elseInput.value = g.else;
    });
  }

  function applyState(state) {
    if (!state || state.v !== 1) return;
    const r = state.report || {};

    setDate(r.date);
    setDimensions(r.dimensions || []);
    setMetrics(r.metrics || []);
    setFilters(r.filters || [], r.filters_logic || 'AND');
    setSort(r.sort || []);
    setCustomFields(r.customFields || []);

    if (typeof window.generateSQL === 'function') window.generateSQL();
  }

  // Initial hash + hash changes
  function tryHash() {
    const st = getHashPayload();
    if (st) applyState(st);
  }
  window.addEventListener('hashchange', tryHash);
  document.addEventListener('DOMContentLoaded', tryHash);

  // postMessage listener
  window.addEventListener('message', (evt) => {
    const { type, payload } = evt.data || {};
    if (type === 'GSC_HELPER_STATE') applyState(payload);
  });
})();
