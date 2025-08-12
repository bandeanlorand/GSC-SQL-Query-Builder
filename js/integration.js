// integration.js — URL-hash + query-param ingestion + postMessage listener
(function () {
  // ---------- tiny DOM helpers ----------
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // GSC has a 2-day reporting delay
  const GSC_LAG_DAYS = 2;
  const toISO = d => d.toISOString().slice(0, 10);
  const lastAvailableDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - GSC_LAG_DAYS);
    return d;
  };

  function openSection(sectionId, headerId) {
    const section = qs(`#${sectionId}`);
    const header  = qs(`#${headerId}`);
    if (!section || !header) return;
    if (section.classList.contains('hidden')) header.click();
  }

  // ---------- decode helpers ----------
  function tryDecode(str) {
    if (window.LZString) {
      try {
        const json = window.LZString.decompressFromEncodedURIComponent(str);
        if (json) return JSON.parse(json);
      } catch {}
    }
    try {
      const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
      const json = atob(b64 + '='.repeat(pad));
      return JSON.parse(json);
    } catch {}
    try { return JSON.parse(decodeURIComponent(str)); } catch {}
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

    const metricsMap = { CLICKS:'Clicks', IMPRESSIONS:'Impressions', CTR:'CTR', POSITION:'Avg Position' };
    const metrics = (qp.get('metrics') || '')
      .split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      .map(m => metricsMap[m] || m);

    const dimMap = { page:'URL', query:'Query', country:'Country', device:'Device', search_type:'Search Type' };
    const breakdown = (qp.get('breakdown') || '').toLowerCase();
    const dimensions = breakdown ? [dimMap[breakdown] || breakdown] : [];

    const months = parseInt(qp.get('num_of_months') || '0', 10);
    const date = months > 0 ? { months } : null;

    const filters = [];
    const device = qp.get('device');
    if (device) filters.push({ field:'Device', op:'EQUALS', value: device.toUpperCase() });

    const st = qp.get('search_type');
    if (st) filters.push({ field:'Search Type', op:'EQUALS', value: st.toUpperCase() });

    const page = qp.get('page');
    if (page) {
      const val = page.replace(/\*/g, ''); // "*tipps" → CONTAINS "tipps"
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
    const dropdown = qs('#dateRangeDropdown');
    if (!dropdown) return;

    // months shortcut (respect GSC 2‑day lag)
    if (date.months) {
      const end = lastAvailableDate();
      const start = new Date(end);
      start.setMonth(start.getMonth() - Number(date.months));

      qsa('[data-range]', dropdown).find(el => el.getAttribute('data-range') === 'Custom date range')?.click();

      const startEl = qs('#startDate');
      const endEl   = qs('#endDate');
      if (startEl && endEl) { startEl.value = toISO(start); endEl.value = toISO(end); }
      return;
    }

    // preset handled by main.js
    if (date.preset) {
      qsa('[data-range]', dropdown).find(el => el.getAttribute('data-range') === date.preset)?.click();
      return;
    }

    // explicit custom range
    if (date.from && date.to) {
      qsa('[data-range]', dropdown).find(el => el.getAttribute('data-range') === 'Custom date range')?.click();
      const startEl = qs('#startDate');
      const endEl   = qs('#endDate');
      if (startEl && endEl) { startEl.value = date.from; endEl.value = date.to; }
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

  function setFilters(filters = [], logic = 'AND') {
    if (!filters.length) return;
    openSection('filterSection', 'toggleFiltersHeader');

    const cont = qs('#filterRows');
    if (!cont) return;

    cont.innerHTML = '';

    filters.forEach((f, idx) => {
      if (typeof window.addFilterRow === 'function') window.addFilterRow();
      const row = cont.lastElementChild; if (!row) return;

      const selects = row.querySelectorAll('select');
      const fieldSelect = selects[0];
      const opSelect    = selects[1];

      // 1) Set field and trigger change so main.js builds the right value control (device/country/etc.)
      if (fieldSelect && f.field) {
        const fieldMap = { query:'Query', page:'URL', country:'Country', device:'Device', 'search type':'Search Type' };
        const uiField = fieldMap[(f.field + '').toLowerCase()] || f.field;
        fieldSelect.value = uiField;
        fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2) Set operator
      if (opSelect && f.op) {
        opSelect.value = (f.op + '').toUpperCase();
        opSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 3) Now the correct control exists → set its value
      const deviceSelect  = row.querySelector('select.device-select');
      const countryInput  = row.querySelector('input.country-search-input');
      const textInput     = row.querySelector('input[type="text"]');

      if (deviceSelect && (fieldSelect?.value === 'Device')) {
        deviceSelect.classList.remove('hidden'); // make sure it's visible
        deviceSelect.value = (f.value || '').toUpperCase();
      } else if (countryInput && (fieldSelect?.value === 'Country')) {
        countryInput.dataset.code = f.value || '';
        countryInput.value = f.value || '';
      } else if (textInput && f.value != null) {
        textInput.value = f.value;
      }

      // 4) Logic between rows
      if (idx > 0) {
        const radios = row.querySelectorAll('input[type="radio"][name^="filter-logic"]');
        const target = Array.from(radios).find(r => r.value === (logic || 'AND'));
        if (target) target.checked = true;
      }
    });
  }

  function setSort(sort = []) {
    if (!sort.length) return;
    openSection('sortSection', 'toggleSortByHeader');

    const cont = qs('#sortRows');
    if (!cont) return;

    cont.innerHTML = '';
    sort.forEach(s => {
      if (typeof window.addSortRow === 'function') window.addSortRow();
      const row = cont.lastElementChild; if (!row) return;

      const fieldSelect = row.querySelector('select');
      const radios = Array.from(row.querySelectorAll('input[type="radio"]'));

      if (fieldSelect && s.field) {
        const fieldMap = { clicks:'Clicks', impressions:'Impressions', ctr:'CTR', position:'Avg Position' };
        fieldSelect.value = fieldMap[(s.field + '').toLowerCase()] || s.field;
        fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const dir = (s.dir || 'DESC').toUpperCase();
      radios.find(r => r.value === dir)?.click();
    });
  }

  function setCustomFields(groups = []) {
    if (!groups.length) return;
    openSection('customFieldsSection', 'toggleCustomFieldsHeader');

    const cont = qs('#customFieldGroups');
    if (!cont) return;

    cont.innerHTML = '';
    groups.forEach(g => {
      if (typeof window.addCustomFieldGroup === 'function') window.addCustomFieldGroup();
      const group = cont.lastElementChild; if (!group) return;

      const nameInput = group.querySelector('input[type="text"][placeholder="e.g. Brand bucket"]');
      if (nameInput && g.name) nameInput.value = g.name;

      const wrapper = group.querySelector('.custom-condition-group');
      if (Array.isArray(g.conditions)) {
        let rows = wrapper.querySelectorAll('.custom-condition-row');
        for (let i = rows.length; i < g.conditions.length; i++) {
          group.querySelector('button.add-condition-btn')?.click();
        }
        rows = wrapper.querySelectorAll('.custom-condition-row');
        g.conditions.forEach((c, i) => {
          const row = rows[i]; if (!row) return;
          const selects = row.querySelectorAll('select');
          const fieldSelect = selects[0];
          const opSelect    = selects[1];
          const txt         = row.querySelector('input[type="text"]');
          const countryInput= row.querySelector('input.country-search-input');

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
    // No auto-generate: user must click "Generate SQL"
  }

  // ---------- boot sequence ----------
  function boot() {
    const q = getQueryParamPayload();
    if (q) { applyState(q); return; }
    const h = getHashPayload();
    if (h) { applyState(h); return; }
  }

  let booted = false;
  function bootOnce() { if (!booted) { booted = true; boot(); } }

  document.addEventListener('gscql:ui-ready', bootOnce);
  document.addEventListener('DOMContentLoaded', () => {
    // Fallback in case the custom event isn't fired
    let tries = 0;
    const iv = setInterval(() => {
      const ok = qs('#metricsDropdown') && qs('#dimensionsDropdown');
      if (ok || ++tries > 20) { clearInterval(iv); bootOnce(); }
    }, 100);
  });

  window.addEventListener('hashchange', () => {
    const h = getHashPayload();
    if (h) applyState(h);
  });

  window.addEventListener('message', (evt) => {
    const { type, payload } = evt.data || {};
    if (type === 'GSC_HELPER_STATE') applyState(payload);
  });
})();
