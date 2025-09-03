// integration.js — URL-hash + query-param ingestion + postMessage listener
(function () {
  // ---------- tiny DOM helpers ----------
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // GSC has a ~2-day reporting delay
  const GSC_LAG_DAYS = 2;
  const toISO = d => d.toISOString().slice(0, 10);
  const lastAvailableDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - GSC_LAG_DAYS);
    return d;
  };

  function openSection(sectionId, headerId) {
    const section = qs(`#${sectionId}`);
    const header = qs(`#${headerId}`);
    if (!section || !header) return;
    if (section.classList.contains('hidden')) header.click();
  }

  // ---------- decode helpers ----------
  function tryDecode(str) {
    if (window.LZString) {
      try {
        const json = window.LZString.decompressFromEncodedURIComponent(str);
        if (json) return JSON.parse(json);
      } catch { }
    }
    try {
      const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
      const json = atob(b64 + '='.repeat(pad));
      return JSON.parse(json);
    } catch { }
    try { return JSON.parse(decodeURIComponent(str)); } catch { }
    return null;
  }
  // wait for element
  function whenReady(sel, { tries = 40, interval = 200 } = {}, root = document) {
    return new Promise((resolve, reject) => {
      let n = 0;
      const tick = () => {
        const el = root.querySelector(sel);
        if (el) return resolve(el);
        if (++n > tries) return reject(new Error(`Timeout waiting for ${sel}`));
        setTimeout(tick, interval);
      };
      tick();
    });
  }

  // ---------- general helpers ----------
  function splitCSV(v) { return (v || '').split(',').map(s => s.trim()).filter(Boolean); }
  function yyyymmddToISO(v) { return (v && v.length === 8) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}` : v; }

  function normalizeDevice(v) {
    const s = (v || '').toUpperCase();
    return ['DESKTOP', 'MOBILE', 'TABLET', 'ALL'].includes(s) ? s : '';
  }

  // expects window.predefinedCountries = [{code:'DE', alpha3:'DEU', name:'Germany'}, ...]
  function normalizeCountryCode(v) {
    if (!v) return '';
    const s = v.trim().toUpperCase();
    const list = window.predefinedCountries || [];
    if (s.length === 2) return s; // already alpha-2
    const hit = list.find(c => (c.alpha3 === s) || (c.code3 === s));
    return hit ? (hit.code || hit.alpha2) : s; // fallback
  }
  function countryLabelFromCode(code) {
    const list = window.predefinedCountries || [];
    const hit = list.find(c => (c.code === code) || (c.alpha2 === code));
    return hit ? hit.name : code;
  }

  // ---------- HASH ingestion ----------
  // Accepts either compressed "#gsc=<payload>" OR plain "#m=...&dim=...&sd=...&ed=..."
function getHashPayload() {
  const raw = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;

  // 1) compressed payload support (existing)
  const m = raw.match(/(?:^|&)gsc=([^&]+)/);
  if (m) {
    const obj = tryDecode(m[1]);
    if (obj) return obj;
  }

  // 2) plain hash params
  const hp = new URLSearchParams(raw);
  if (![...hp.keys()].length) return null;

  const metricsMap = {
    CLICKS: 'Clicks',
    IMPRESSIONS: 'Impressions',
    CTR: 'CTR',
    POSITION: 'Avg Position'
  };
  const dimMap = {
    page: 'URL',
    query: 'Query',
    country: 'Country',
    device: 'Device',
    search_type: 'Search Type'
  };

  // metrics (filter unknowns)
  const allowedLabels = new Set(Object.values(metricsMap));
  const metrics = splitCSV(hp.get('m'))
    .map(x => metricsMap[(x || '').toUpperCase()] || '')
    .filter(v => allowedLabels.has(v));

  const breakdown  = (hp.get('dim') || '').toLowerCase();
  const dimensions = breakdown ? [dimMap[breakdown] || breakdown] : [];

  // dates
  const sd  = yyyymmddToISO(hp.get('sd') || hp.get('start_date'));
  const ed  = yyyymmddToISO(hp.get('ed') || hp.get('end_date'));
  const sd2 = yyyymmddToISO(hp.get('sd2'));
  const ed2 = yyyymmddToISO(hp.get('ed2'));
  const nm  = hp.get('nm') ? parseInt(hp.get('nm'), 10) : null;
  const cmp = (hp.get('cmp') || '').toLowerCase();

  let date = sd && ed ? { from: sd, to: ed } : (nm ? { months: nm } : null);
  if (sd2 && ed2) {
    date = { from: sd, to: ed, from2: sd2, to2: ed2 };
  } else if (cmp === 'prev' && sd && ed) {
    // compute previous period automatically
    const d1 = new Date(sd), d2 = new Date(ed);
    const days = Math.round((d2 - d1) / 86400000) + 1;
    const prevEnd = new Date(d1); prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - (days - 1));
    date = {
      from: sd, to: ed,
      from2: prevStart.toISOString().slice(0,10),
      to2:   prevEnd.toISOString().slice(0,10)
    };
  }

  const filters = [];

  const st = hp.get('st');
  if (st) filters.push({ field:'Search Type', op:'EQUALS', value: (st+'').toUpperCase() });

  const dv = normalizeDevice(hp.get('dv'));
  if (dv && dv !== 'ALL') filters.push({ field:'Device', op:'EQUALS', value: dv });

  const page = hp.get('page');
  if (page) filters.push({ field:'URL', op:'CONTAINS', value: (page+'').replace(/\*/g,'') });

  const country = hp.get('country');
  if (country) {
    const c2 = normalizeCountryCode(country);
    if (c2) filters.push({ field:'Country', op:'EQUALS', value: c2 });
  }

  // NEW: legacy query= fallback (hash)
  const qfilter = hp.get('query');
  if (qfilter) filters.push({ field:'Query', op:'CONTAINS', value: (qfilter+'').replace(/\*/g,'') });

  // NEW: parse generic f= filters (URL:CONTAINS:*..., Query:REGEXP:..., etc.)
  // --- NEW: parse generic f= filters (URL:CONTAINS:*..., Query:REGEXP:..., etc.)
const fs = hp.getAll('f');
fs.forEach(rawFilter => {
  if (!rawFilter) return;
  const parts = String(rawFilter).split(':');
  if (parts.length < 3) return;

  const fieldRaw = parts[0].trim().toLowerCase();   // url | query | device | country | search type...
  const opRaw    = parts[1].trim().toUpperCase();   // CONTAINS | EQUALS | REGEXP | NOT_CONTAINS | NOT_REGEXP ...
  const valueRaw = parts.slice(2).join(':');        // allow ":" inside value

  const fieldMap = { page:'URL', url:'URL', query:'Query', country:'Country', device:'Device', 'search type':'Search Type' };
  const field = fieldMap[fieldRaw] || (fieldRaw.charAt(0).toUpperCase() + fieldRaw.slice(1));

  // map op tokens → UI labels used by your select element
  const opMap = {
    'REGEXP': 'REGEXP CONTAINS',
    'NOT_REGEXP': 'NOT REGEXP CONTAINS',
    'NOT_EQUALS': 'NOT EQUALS',
    'NOT CONTAINS': 'NOT CONTAINS',
    'CONTAINS': 'CONTAINS',
    'EQUALS': 'EQUALS'
  };
  const uiOp = opMap[opRaw] || opRaw;

  // normalize values for specific fields
  let v = valueRaw;
  if (field === 'Device')   v = normalizeDevice(valueRaw);
  if (field === 'Country')  v = normalizeCountryCode(valueRaw.replace(/\*/g, ''));
  if (field === 'URL')      v = valueRaw.replace(/\*/g, '');
  if (field === 'Query' && uiOp === 'CONTAINS') v = valueRaw.replace(/\*/g, ''); // strip wildcards for input

  filters.push({ field, op: uiOp, value: v });
});


  return {
    v: 1,
    source: 'hash',
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


  // ---------- QUERY ingestion (legacy links / Stephan’s link) ----------
  function getQueryParamPayload() {
    const qp = new URLSearchParams(location.search);
    if (![...qp.keys()].length) return null;

    const metricsMap = { CLICKS: 'Clicks', IMPRESSIONS: 'Impressions', CTR: 'CTR', POSITION: 'Avg Position' };
    const dimMap = { page: 'URL', query: 'Query', country: 'Country', device: 'Device', search_type: 'Search Type' };

    const allowedLabels = new Set(Object.values(metricsMap));
    const metrics = splitCSV(qp.get('metrics'))
      .map(m => metricsMap[(m || '').toUpperCase()] || '')
      .filter(v => allowedLabels.has(v));   // drop unknowns

    const breakdown = (qp.get('breakdown') || '').toLowerCase();
    const dimensions = breakdown ? [dimMap[breakdown] || breakdown] : [];

    // dates: prefer explicit start/end over months
    const sd = yyyymmddToISO(qp.get('start_date'));
    const ed = yyyymmddToISO(qp.get('end_date'));
    const months = parseInt(qp.get('num_of_months') || '0', 10);
    const date = (sd && ed) ? { from: sd, to: ed } : (months > 0 ? { months } : null);

    const filters = [];

    const device = normalizeDevice(qp.get('device'));
    if (device && device !== 'ALL') filters.push({ field: 'Device', op: 'EQUALS', value: device });

    const st = qp.get('search_type');
    if (st) filters.push({ field: 'Search Type', op: 'EQUALS', value: (st + '').toUpperCase() });

    const page = qp.get('page');
    if (page) filters.push({ field: 'URL', op: 'CONTAINS', value: (page + '').replace(/\*/g, '') });

    const country = qp.get('country');
    if (country) {
      const c2 = normalizeCountryCode(country);
      if (c2) filters.push({ field: 'Country', op: 'EQUALS', value: c2 });
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

  async function setDate(date) {
    if (!date) return;

    // wait for dropdown + inputs to exist
    try {
      await whenReady('#dateRangeDropdown');
    } catch { return; }

    const dropdown = qs('#dateRangeDropdown');

    // ensure the “Custom date range” option is clickable
    const clickCustom = () => {
      const opt = qsa('[data-range]', dropdown)
        .find(el => (el.getAttribute('data-range') || '').toLowerCase() === 'custom date range');
      if (opt) opt.click();
    };

    // helper to fill inputs (retry until the inputs render)
    const fillInputs = async (fromISO, toISO) => {
      try {
        await whenReady('#startDate');
        await whenReady('#endDate');
        const startEl = qs('#startDate');
        const endEl = qs('#endDate');
        if (startEl && endEl) {
          startEl.value = fromISO;
          endEl.value = toISO;
          // trigger change for any listeners
          startEl.dispatchEvent(new Event('input', { bubbles: true }));
          endEl.dispatchEvent(new Event('input', { bubbles: true }));
          startEl.dispatchEvent(new Event('change', { bubbles: true }));
          endEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch {/* inputs never appeared; ignore */ }
    };

    // months shortcut (respect 2-day lag)
    if (date.months) {
      const end = lastAvailableDate();
      const start = new Date(end);
      start.setMonth(start.getMonth() - Number(date.months));
      clickCustom();
      await fillInputs(toISO(start), toISO(end));
      return;
    }

    // preset handled by main.js
    if (date.preset) {
      const presetBtn = qsa('[data-range]', dropdown)
        .find(el => (el.getAttribute('data-range') || '') === date.preset);
      presetBtn?.click();
      return;
    }

    // explicit custom range (accept YYYY-MM-DD or YYYYMMDD just in case)
    const norm = (v) => (v && /^\d{8}$/.test(v))
      ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}`
      : v;

    if (date.from && date.to) {
      const fromISO = norm(date.from);
      const toISO = norm(date.to);
      clickCustom();
      await fillInputs(fromISO, toISO);
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
      const opSelect = selects[1];

      // 1) Set field first so the correct value control is created
      if (fieldSelect && f.field) {
        const fieldMap = { query: 'Query', page: 'URL', country: 'Country', device: 'Device', 'search type': 'Search Type' };
        const uiField = fieldMap[(f.field + '').toLowerCase()] || f.field;
        fieldSelect.value = uiField;
        fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2) Operator
if (opSelect && f.op) {
  // normalize to UI labels
  const opNormMap = {
    'REGEXP': 'REGEXP CONTAINS',
    'NOT_REGEXP': 'NOT REGEXP CONTAINS',
    'NOT_EQUALS': 'NOT EQUALS',
    'NOT CONTAINS': 'NOT CONTAINS',
    'CONTAINS': 'CONTAINS',
    'EQUALS': 'EQUALS'
  };
  const want = opNormMap[(f.op + '').toUpperCase()] || (f.op + '');

  // try set by value
  opSelect.value = want;

  // fallback: set by visible text
  if (opSelect.value !== want) {
    const opt = Array.from(opSelect.options).find(o => (o.value || o.textContent).trim().toUpperCase() === want.toUpperCase());
    if (opt) opt.selected = true;
  }
  opSelect.dispatchEvent(new Event('change', { bubbles: true }));
}


      // 3) Set the control value
const deviceSelect  = row.querySelector('select.device-select');
const countryInput  = row.querySelector('input.country-search-input');
const textInput     = row.querySelector('input[type="text"]');

if (deviceSelect && (fieldSelect?.value === 'Device')) {
  deviceSelect.classList.remove('hidden');
  deviceSelect.value = normalizeDevice(f.value || '');
} else if (countryInput && (fieldSelect?.value === 'Country')) {
  const code = normalizeCountryCode(f.value || '');
  countryInput.dataset.code = code;
  countryInput.value = countryLabelFromCode(code);
} else if (textInput && f.value != null) {
  let val = f.value;
  if (fieldSelect?.value === 'Query' && /CONTAINS/i.test(opSelect?.value || '')) {
    val = String(val).replace(/\*/g, '');
  }
  textInput.value = val;
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
        const fieldMap = { clicks: 'Clicks', impressions: 'Impressions', ctr: 'CTR', position: 'Avg Position' };
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
          const opSelect = selects[1];
          const txt = row.querySelector('input[type="text"]');
          const countryInput = row.querySelector('input.country-search-input');

          if (fieldSelect && c.field) {
            const fieldMap = { query: 'Query', page: 'URL', country: 'Country', device: 'Device', 'search type': 'Search Type' };
            const uiField = fieldMap[(c.field + '').toLowerCase()] || c.field;
            fieldSelect.value = uiField;
            fieldSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (opSelect && c.op) {
            opSelect.value = (c.op + '').toUpperCase();
            opSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (countryInput && (fieldSelect?.value === 'Country')) {
            const code = normalizeCountryCode(c.value || '');
            countryInput.dataset.code = code;
            countryInput.value = countryLabelFromCode(code);
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

    // Safety: if date inputs were late, try once more shortly after
    if (r.date) setTimeout(() => setDate(r.date), 400);
  }


  // ---------- boot sequence ----------
  function boot() {
    const h = getHashPayload();
    if (h) { applyState(h); return; }      // hash (new schema) wins
    const q = getQueryParamPayload();
    if (q) { applyState(q); return; }
  }

  let booted = false;
  function bootOnce() { if (!booted) { booted = true; boot(); } }

  document.addEventListener('gscql:ui-ready', bootOnce);
  document.addEventListener('DOMContentLoaded', () => {
    // Fallback in case the custom event isn't fired yet
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
