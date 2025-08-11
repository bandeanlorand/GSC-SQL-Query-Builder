// integration.js — URL-hash + query-param ingestion + postMessage listener
// Works with your existing UI functions: selectMetric, clearAllMetrics,
// selectDimension, clearAllDimensions, addFilterRow, addSortRow,
// addCustomFieldGroup, and generateSQL.

(function () {
  // ---------- decode helpers ----------
  function tryDecode(str) {
    // Preferred: LZString (encodedURIComponent)
    if (window.LZString) {
      try {
        const json = window.LZString.decompressFromEncodedURIComponent(str);
        if (json) return JSON.parse(json);
      } catch (e) {}
    }
    // Fallback: base64url → JSON
    try {
      const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
      const json = atob(b64 + '='.repeat(pad));
      return JSON.parse(json);
    } catch (e) {}
    // Fallback: decodeURIComponent(JSON)
    try {
      return JSON.parse(decodeURIComponent(str));
    } catch (e) {}
    return null;
  }

  function getHashPayload() {
    const m = location.hash.match(/[#&]gsc=([^&]+)/);
    return m ? tryDecode(m[1]) : null;
  }

  // ---------- query param → payload (Stephan’s link) ----------
  function getQueryParamPayload() {
    const qp = new URLSearchParams(location.search);
    if (![...qp.keys()].length) return null;

    // Metrics map to your UI labels
    const metricsMap = { CLICKS:'Clicks', IMPRESSIONS:'Impressions', CTR:'CTR', POSITION:'Avg Position' };
    const metrics = (qp.get('metrics') || '')
      .split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      .map(m => metricsMap[m] || m);

    // Breakdown → single dimension
    const dimMap = { page:'URL', query:'Query', country:'Country', device:'Device', search_type:'Search Type' };
    const breakdown = (qp.get('breakdown') || '').toLowerCase();
    const dimensions = breakdown ? [dimMap[breakdown] || breakdown] : [];

    // Date from num_of_months
    const months = parseInt(qp.get('num_of_months') || '0', 10);
    const date = months > 0 ? { months } : null;

    // Filters
    const filters = [];
    const device = qp.get('device');
    if (device) filters.push({ field:'Device', op:'EQUALS', value: device.toUpperCase() });

    const st = qp.get('search_type');
    if (st) filters.push({ field:'Search Type', op:'EQUALS', value: st.toUpperCase() });

    const page = qp.get('page');
    if (page) {
      const val = page.replace(/\*/g, '');       // treat *xxx → LIKE %xxx%
      filters.push({ field:'URL', op:'CONTAINS', value: val });
    }

    return {
      v: 1,
      source: 'querystring',
      report: {
        date,
        dimensions,
        metrics,
        filters_logic: 'AND',
        filters,
        sort: [],
        customFields: []
      }
    };
  }

  // ---------- UI setters ----------
  function setDate(date) {
    if (!date) return;
    const dropdown = document.getElementById('dateRangeDropdown');
    if (!dropdown) return;

    // Handle months shortcut (e.g., num_of_months=3)
    if (date.months) {
      const toISO = d => d.toISOString().slice(0, 10);
      const end = new Date();           // today
      const start = new Date();
      start.setMonth(start.getMonth() - Number(date.months));

      const custom = [...dropdown.querySelectorAll('[data-range]')]
        .find(el => el.getAttribute('data-range') === 'Custom date range');
      custom?.click();

      const startEl = document.getElementById('startDate');
      const endEl = document.getElementById('endDate');
      if (startEl && endEl) {
        startEl.value = toISO(start);
        endEl.value = toISO(end);
      }
      return;
    }

    // Preset
    if (date.preset) {
      const opt = [...dropdown.querySelectorAll('[data-range]')]
        .find(el => el.getAttribute('data-range') === date.preset);
      opt?.click();
      return;
    }

    // Explicit range
    if (date.from && date.to) {
      const custom = [...dropdown.querySelectorAll('[data-range]')]
        .find(el => el.getAttribute('data-range') === 'Custom date range');
      custom?.click();
      const startEl = document.getElementById('startDate');
      const endEl = document.getElementById('endDate');
      if (startEl && endEl) {
        startEl.value = date.from;
        endEl.value = date.to;
      }
    }
  }

  function setMetrics(list = []) {
    if (typeof window.clearAllMetrics === 'function') window.clearAllMetrics();
    list.forEach(m => typeof window.selectMetric === 'function' && window.selectMetric(m));
  }

  function setDimensions(list = []) {
    if (typeof window.clearAllDimensions === 'function') window.clearAllDimensions();
    list.forEach(d => typeof window.selectDimension === 'function' && window.selectDimension(d));
  }

  function clearFiltersUI() {
    const c = document.getElementById('filterRows');
    if (c) c.innerHTML = '';
  }

  function setFilters(filters = [], logic = 'AND') {
    clearFiltersUI();
    const cont = document.getElementById('filterRows');
    filters.forEach((f, idx) => {
      if (typeof window.addFilterRow === 'function') window.addFilterRow();
      const row = cont?.lastElementChild; if (!row) return;

      const selects = row.querySelectorAll('select');
      const fieldSelect = selects[0];
      const opSelect = selects[1];

      if (fieldSelect && f.field) {
        const fieldMap = { query:'Query', page:'URL', country:'Country', device:'Device', 'search type':'Search Type' };
        const uiField = fieldMap[(f.field + '').toLowerCase()] || f.field;
        fieldSelect.value = uiField;
        fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (opSelect && f.op) {
        opSelect.value = (f.op + '').toUpperCase();
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
    const cont = document.getElementById('sortRows');
    sort.forEach(s => {
      if (typeof window.addSortRow === 'function') window.addSortRow();
      const row = cont?.lastElementChild; if (!row) return;

      const fieldSelect = row.querySelector('select');
      const radios = [...row.querySelectorAll('input[type="radio"]')];

      if (fieldSelect && s.field) {
        const fieldMap = { clicks:'Clicks', impressions:'Impressions', ctr:'CTR', position:'Avg Position' };
        fieldSelect.value = fieldMap[(s.field + '').toLowerCase()] || s.field;
        fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const dir = (s.dir || 'DESC').toUpperCase();
      radios.find(r => r.value === dir)?.click();
    });
  }

  function clearCustomFieldsUI() {
    const c = document.getElementById('customFieldGroups');
    if (c) c.innerHTML = '';
  }

  function setCustomFields(groups = []) {
    clearCustomFieldsUI();
    const cont = document.getElementById('customFieldGroups');
    groups.forEach(g => {
      if (typeof window.addCustomFieldGroup === 'function') window.addCustomFieldGroup();
      const group = cont?.lastElementChild; if (!group) return;

      const nameInput = group.querySelector('input[type="text"][placeholder="e.g. Brand bucket"]');
      if (nameInput && g.name) nameInput.value = g.name;

      const wrapper = group.querySelector('.custom-condition-group');
      if (Array.isArray(g.conditions)) {
        // ensure row count
        let rows = wrapper.querySelectorAll('.custom-condition-row');
        for (let i = rows.length; i < g.conditions.length; i++) {
          group.querySelector('button.add-condition-btn')?.click();
        }
        rows = wrapper.querySelectorAll('.custom-condition-row');
        g.conditions.forEach((c, i) => {
          const row = rows[i]; if (!row) return;
          const selects = row.querySelectorAll('select');
          const fieldSelect = selects[0];
          const opSelect = selects[1];
          const txt = row.querySelector('input[type="text"]');
          const countryInput = row.querySelector('input.country-search-input');

          if (fieldSelect && c.field) {
            const fieldMap = { query:'Query', page:'URL', country:'Country', device:'Device', 'search type':'Search Type' };
            const uiField = fieldMap[(c.field + '').toLowerCase()] || c.field;
            fieldSelect.value = uiField;
            fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (opSelect && c.op) {
            opSelect.value = (c.op + '').toUpperCase();
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

  // ---------- boot sequence ----------
  function boot() {
    // Priority: query params (Stephan’s links) → then hash → then postMessage
    const q = getQueryParamPayload();
    if (q) { applyState(q); return; }

    const h = getHashPayload();
    if (h) { applyState(h); return; }
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('hashchange', () => {
    const h = getHashPayload();
    if (h) applyState(h);
  });

  // Also support postMessage for very large payloads
  window.addEventListener('message', (evt) => {
    const { type, payload } = evt.data || {};
    if (type === 'GSC_HELPER_STATE') applyState(payload);
  });
})();
