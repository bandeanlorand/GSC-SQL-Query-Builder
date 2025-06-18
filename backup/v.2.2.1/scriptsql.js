function normalizeFieldName(fieldLabel) {
  const trimmed = fieldLabel.trim();
  if (trimmed === 'Year') return 'YEAR';
  if (trimmed === 'Month') return 'MONTH';
  if (trimmed === 'Date') return 'DATE';
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '_');
}



function highlightSQL(sqlText) {
  return sqlText
    .replace(/\b(SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|CASE|WHEN|THEN|ELSE|END|AS|BETWEEN|IS NOT NULL|IS NULL|NOT|IN|ON|JOIN|INNER|LEFT|OUTER|DISTINCT)\b/gi,
      match => `<span class="sql-keyword">${match.toUpperCase()}</span>`)
    .replace(/\b(SUM|SAFE_DIVIDE|REGEXP_CONTAINS|AVG|COUNT|MAX|MIN)\b(?=\s*\()/gi,
      match => `<span class="sql-function">${match}</span>`)

    .replace(/\b(CURRENT_DATE|CURRENT_TIMESTAMP|NOW)\b/gi,
      match => `<span class="sql-function">${match.toUpperCase()}</span>`)
    .replace(/\bAS\s+(\w+)/gi, (match, p1) => {
      const upper = p1.toUpperCase();
      const specialAlias = ['YEAR', 'MONTH', 'DATE'];
      if (specialAlias.includes(upper)) {
        return `AS <span class="sql-alias-special">${upper}</span>`;
      }
      return `AS <span class="sql-alias">${p1}</span>`;
    })
    .replace(/'(%Y(?:-%m)?)'/g, (match, pattern) => {
      return `<span class="sql-date-format">'${pattern}'</span>`;
    })
    .replace(/\b(TRUE|FALSE)\b/gi,
      match => `<span class="sql-boolean">${match.toUpperCase()}</span>`)
    .replace(/(?<![\w])(\d+(\.\d+)?)(?![\w])/g,
      match => `<span class="sql-expression">${match}</span>`)
    .replace(/\b(\w+)\s+(ASC|DESC)\b/gi,
      (match, col, dir) =>
        `<span class="sql-column">${col}</span> <span class="sql-keyword">${dir.toUpperCase()}</span>`)
    .replace(/\b(YEAR|MONTH|DATE)\b/g,
      match => `<span class="sql-alias-special">${match}</span>`);
}



function isDerivedDimension(dim) {
  return dim === 'Year';
}

function getDimensionSelectLine(dim) {
  const normalized = normalizeFieldName(dim);
  if (dim === 'Year') {
    return {
      html: `<span class="sql-function">FORMAT_TIMESTAMP('%Y', data_date)</span> AS <span class="sql-alias">YEAR</span>`,
      text: `    FORMAT_TIMESTAMP('%Y', data_date) AS YEAR`,
      alias: 'YEAR'
    };
  } else if (dim === 'Month') {
    return {
      html: `<span class="sql-function">FORMAT_TIMESTAMP('%Y-%m', data_date)</span> AS <span class="sql-alias">MONTH</span>`,
      text: `    FORMAT_TIMESTAMP('%Y-%m', data_date) AS MONTH`,
      alias: 'MONTH'
    };
  } else if (dim === 'Date') {
    return {
      html: `<span class="sql-column">data_date</span> AS <span class="sql-alias">DATE</span>`,
      text: `    data_date AS DATE`,
      alias: 'DATE'
    };
  }

  return {
    html: `<span class="sql-column">${normalized}</span>`,
    text: `    ${normalized}`,
    alias: normalized
  };
};

function generateSQL() {
  updateFilterAndSortClauses();
  const dateClause = getDateRangeClause();
  const metrics = Array.from(selectedMetrics);
  const dimensions = Array.from(selectedDimensions);

  const indent = '<span style="display:inline-block; width:1em"></span>';
  const selectLines = [];
  const plainSelectLines = [];
  const customFieldsToGroup = [];
  const groupAliases = [];

  dimensions.forEach(dim => {
    const { html, text, alias } = getDimensionSelectLine(dim);
    selectLines.push(`${indent}${html}`);
    plainSelectLines.push(text);
    groupAliases.push(alias);
  });



  // dimensions.forEach(dim => {
  //   const normalizedDim = normalizeFieldName(dim);
  //   selectLines.push(`${indent}<span class="sql-column">${normalizedDim}</span>`);
  //   plainSelectLines.push(`    ${normalizedDim}`);
  //   console.log('dimension');
  // });

  if (metrics.includes('Clicks')) {
    selectLines.push(`${indent}<span class="sql-function">SUM(Clicks)</span> AS <span class="sql-alias">clicks</span>`);
    plainSelectLines.push(`    SUM(Clicks) AS clicks`);
  }
  if (metrics.includes('Impressions')) {
    selectLines.push(`${indent}<span class="sql-function">SUM(Impressions)</span> AS <span class="sql-alias">impressions</span>`);
    plainSelectLines.push(`    SUM(Impressions) AS impressions`);
  }
  if (metrics.includes('CTR')) {
    selectLines.push(`${indent}<span class="sql-expression">SUM(Clicks) / SUM(Impressions)</span> AS <span class="sql-alias">ctr</span>`);
    plainSelectLines.push(`    SUM(Clicks) / SUM(Impressions) AS ctr`);
  }
  if (metrics.includes('Position')) {
    selectLines.push(`${indent}((<span class="sql-function">SUM(sum_position)</span> / <span class="sql-function">SUM(Impressions)</span>) + 1.0) AS <span class="sql-alias">avg_position</span>`);
    plainSelectLines.push(`    ((SUM(sum_position) / SUM(Impressions)) + 1.0) AS avg_position`);
  }

  const customFieldGroups = document.querySelectorAll('#customFieldGroups > div');
  let customFieldIndex = 1;

  customFieldGroups.forEach((group) => {
    const conditionBlocks = group.querySelectorAll('.custom-condition-group > div, .added-custom-condition-group');
    const elseRow = group.querySelector('input[placeholder="Non-Brand"], input[placeholder="Non-Brand2"], input[placeholder="Else"]');
    const elseValue = elseRow ? elseRow.value.trim() : '';
    const cases = [];

    conditionBlocks.forEach((block) => {
      const selects = block.querySelectorAll('select');
      const field = selects[0]?.value;
      const normalizedField = normalizeFieldName(field);
      const operator = selects[1]?.value;

      const valueInput = block.querySelector('input[type="text"]');
      // const valueSelect = block.querySelector('select:nth-of-type(3)');

      const countryInputStyled = block.querySelector('input.country-search-input');
      const valueSelect = countryInputStyled?.dataset.code;

      const radioInput = block.querySelector('input[name^="bool-val"]:checked');

      let value;
      if (field === 'Country') {
        // value = valueSelect?.value?.trim();
        value = valueSelect?.trim();
      } else if (field?.startsWith('Is ')) {
        value = radioInput?.value;
      } else {
        value = valueInput?.value?.trim();
      }

      let thenInput;
      if (block.classList.contains('added-custom-condition-group')) {
        thenInput = block.querySelector('input[placeholder="Brand"]');
      } else {
        const thenRow = group.querySelectorAll('div.flex.items-center.gap-2')[1];
        thenInput = thenRow?.querySelector('input[type="text"]');
      }
      const thenValue = thenInput?.value.trim();

      if (!field || !operator || !value || !thenValue) return;

      let condition = '';
      switch (operator) {
        case 'EQUALS':
          condition = field.startsWith('Is ') ? `${normalizedField} = ${value.toUpperCase()}` : `${normalizedField} = '${value}'`;
          break;
        case 'NOT EQUALS':
          if (field.startsWith('Is ') && (value.toUpperCase() === 'FALSE' || value.toUpperCase() === 'TRUE')) {
            const correctedValue = value.toUpperCase() === 'FALSE' ? 'TRUE' : 'FALSE';
            condition = `${normalizedField} = ${correctedValue}`;
            console.log(`[Custom Field Adjusted] ${normalizedField} != ${value.toUpperCase()} ➜ ${normalizedField} = ${correctedValue}`);
          } else {
            condition = `${normalizedField} != '${value}'`;
          }
          break;
        case 'CONTAINS':
          condition = `${normalizedField} LIKE '%${value}%'`;
          break;
        case 'NOT CONTAINS':
          condition = `${normalizedField} NOT LIKE '%${value}%'`;
          break;
        case 'REGEX CONTAINS':
          condition = `REGEXP_CONTAINS(${normalizedField}, '${value}')`;
          break;
        case 'REGEX NOT CONTAINS':
          condition = `NOT REGEXP_CONTAINS(${normalizedField}, '${value}')`;
          break;
      }

      cases.push(`WHEN ${condition} THEN '${thenValue}'`);
    });

    if (cases.length > 0 || elseValue) {
      const alias = `custom_field_${customFieldIndex++}`;
      const caseSQL = `CASE\n    ${cases.join('\n    ')}\n    ELSE '${elseValue}'\nEND AS ${alias}`;
      let visualCaseSQL = caseSQL
        .replace(/\n/g, '<br>' + indent)
        .replace(/=\s*(TRUE|FALSE)/gi, '<span class="sql-boolean">= $1</span>');

      selectLines.push(`${indent}${visualCaseSQL}`);
      plainSelectLines.push(`    ${caseSQL}`);
      customFieldsToGroup.push(alias);
    }
  });

  const selectClause = `<span class="sql-keyword">SELECT</span><br>${selectLines.join(',<br>')}`;
  const plainSelectClause = `SELECT\n${plainSelectLines.join(',\n')}`;

  const fromTable = dimensions.includes('URL')
    ? '`searchconsole.searchdata_url_impression`'
    : '`searchconsole.searchdata_site_impression`';

  const fromClause = `<br><span class="sql-keyword">FROM</span><br>${indent}<span class="sql-table">${fromTable}</span>`;
  const plainFromClause = `FROM\n    ${fromTable}`;

  const baseWhereClause = `<br><span class="sql-keyword">WHERE</span><br>${indent}<span class="sql-column">data_date</span> <span class="sql-keyword">BETWEEN</span> ${dateClause}`;
  const basePlainWhereClause = `WHERE\n    data_date BETWEEN ${dateClause}`;

  const filterClauses = (window._filterClauses || []).map(f => {
    let clause = f.clause;
    clause = clause.replace(/=\s*(TRUE|FALSE)/gi, '<span class="sql-boolean">= $1</span>');
    return { ...f, clause };
  });
  const sortClauses = window._sortClauses || [];

  const extraWhere = (() => {
    if (!filterClauses.length) return '';

    const grouped = [];
    let currentGroup = [];
    let currentLogic = filterClauses[0].logic || 'AND';

    filterClauses.forEach((item, index) => {
      if (index === 0 || item.logic === currentLogic) {
        currentGroup.push(item.clause);
      } else {
        grouped.push({ logic: currentLogic, clauses: [...currentGroup] });
        currentGroup = [item.clause];
        currentLogic = item.logic;
      }
    });

    if (currentGroup.length) {
      grouped.push({ logic: currentLogic, clauses: [...currentGroup] });
    }

    return grouped.map((group, i) => {
      const prefix = ` <span class="sql-keyword">${group.logic}</span> `;
      const content = group.clauses.length > 1 ? `(${group.clauses.join(` ${group.logic} `)})` : group.clauses[0];
      return i === 0 ? `${prefix.trim()} ${content}` : `${prefix}${content}`;
    }).join(`<br>${indent}`);
  })();

  const whereHTML = extraWhere ? `<br>${indent}${extraWhere}` : '';
  const whereText = extraWhere ? `\n    ${extraWhere.replace(/<[^>]+>/g, '')}` : '';

  // const groupItems = [...dimensions, ...customFieldsToGroup];
  // const groupItems = [...dimensions.map(normalizeFieldName), ...customFieldsToGroup];
  const groupItems = [...groupAliases, ...customFieldsToGroup];

  // const groupByClause = groupItems.length
  //   ? `<br><span class="sql-keyword">GROUP BY</span><br>${indent}${groupItems.map(d => `<span class="sql-column">${d}</span>`).join(', ')}`
  //   : '';

  const groupByClause = groupItems.length
    ? `<br><span class="sql-keyword">GROUP BY</span><br>${groupItems.map(d => `${indent}<span class="sql-column">${d}</span>`).join(',<br>')}`
    : '';
  // const plainGroupByClause = groupItems.length
  //   ? `GROUP BY\n    ${groupItems.join(', ')}`
  //   : '';

  const plainGroupByClause = groupItems.length
    ? `GROUP BY\n    ${groupItems.map(item => item.trim()).join(',\n    ')}`
    : '';

  const orderHTML = sortClauses.length
    ? `<br><span class="sql-keyword">ORDER BY</span><br>${indent}${sortClauses.map(cl => `<span class="sql-column">${cl}</span>`).join(', ')}`
    : '';
  const orderText = sortClauses.length
    ? `\nORDER BY\n    ${sortClauses.join(', ')}`
    : '';

  const sql = `${selectClause}${fromClause}${baseWhereClause}${whereHTML}${groupByClause}${orderHTML}`;
  const plainSQL = `${plainSelectClause}\n${plainFromClause}\n${basePlainWhereClause}${whereText}${plainGroupByClause ? `\n${plainGroupByClause}` : ''}${orderText}`;

  document.getElementById('sqlOutput').innerHTML = highlightSQL(plainSQL);
  document.getElementById('sqlOutputFormated').textContent = plainSQL;

  document.querySelectorAll('#customFieldGroups input[type="text"]').forEach(input => {
    input.addEventListener('input', () => {
      if (input.value.trim() !== '') {
        input.classList.add('user-started');
      } else {
        input.classList.remove('user-started');
      }
    });
  });

  const body = document.body;
  const sqlStatus = document.getElementById('sqlStatus');

  body.classList.remove('show-generated', 'show-generated-incomplete');
  const hasErrors = document.querySelectorAll('#customFieldGroups .border-red-500').length > 0;
  const userTouchedInputs = document.querySelectorAll('#customFieldGroups input.user-started').length > 0;

  if (userTouchedInputs && hasErrors) {
    void body.offsetHeight;
    body.classList.add('show-generated-incomplete');
    if (sqlStatus) sqlStatus.setAttribute('title', 'There are incomplete fields – SQL Generated!');
  } else {
    body.classList.add('show-generated');
    if (sqlStatus) sqlStatus.removeAttribute('title');
  }
}


function updateFilterAndSortClauses() {
  const filters = [];
  document.querySelectorAll('#filterRows > div').forEach(filter => {
    const selects = filter.querySelectorAll('select');
    const field = selects[0]?.value;
    const operator = selects[1]?.value;
    const logic = filter.querySelector('input[type="radio"]:checked')?.value || 'AND';

    const textInput = filter.querySelector('input[type="text"]');
    const booleanRadio = filter.querySelector('input[name^="bool-val"]:checked');
    const countryInputStyled = filter.querySelector('input.country-search-input');

    let value = null;

    if (field?.startsWith('Is ') && booleanRadio) {
      value = booleanRadio.value?.toUpperCase();
    } else if (field === 'Country') {
      if (countryInputStyled?.dataset?.code) {
        value = countryInputStyled.dataset.code.trim();
      }
    } else if (textInput) {
      value = textInput.value?.trim();
    }

    if (typeof value === 'string') {
      value = value.trim();
    }

    const normalizedField = normalizeFieldName(field);

    // if (field && operator && (value || operator.includes('NULL'))) {
    if (field && operator && ((value && value.trim() !== '') || operator.includes('NULL'))) {

      let clause = '';

      switch (operator) {
        case 'EQUALS':
          clause = field.startsWith('Is ') ? `${normalizedField} = ${value.toUpperCase()}` : `${normalizedField} = '${value}'`;
          break;

        case 'NOT EQUALS':
          if (field.startsWith('Is ') && (value.toUpperCase() === 'FALSE' || value.toUpperCase() === 'TRUE')) {
            const correctedValue = value.toUpperCase() === 'FALSE' ? 'TRUE' : 'FALSE';
            clause = `${normalizedField} = ${correctedValue}`;
            console.log(`[Adjusted] ${normalizedField} != ${value.toUpperCase()} ➜ ${normalizedField} = ${correctedValue}`);
          } else {
            clause = `${normalizedField} != '${value}'`;
          }
          break;

        case 'CONTAINS':
          clause = `${normalizedField} LIKE '%${value}%'`;
          break;

        case 'NOT CONTAINS':
          clause = `${normalizedField} NOT LIKE '%${value}%'`;
          break;

        case 'GREATER THAN':
          clause = `${normalizedField} > '${value}'`;
          break;

        case 'LESS THAN':
          clause = `${normalizedField} < '${value}'`;
          break;

        case 'IS NULL':
          clause = `${normalizedField} IS NULL`;
          break;

        case 'IS NOT NULL':
          clause = `${normalizedField} IS NOT NULL`;
          break;

        case 'REGEX CONTAINS':
          clause = `REGEXP_CONTAINS(${normalizedField}, '${value}')`;
          break;

        case 'REGEX NOT CONTAINS':
          clause = `NOT REGEXP_CONTAINS(${normalizedField}, '${value}')`;
          break;
      }

      if (clause) filters.push({ clause, logic });
    }
  });

  const sorts = [];
  document.querySelectorAll('#sortRows > div').forEach(row => {
    const select = row.querySelector('select');
    const direction = row.querySelector('input[type="radio"]:checked')?.value || 'ASC';
    if (select && select.value) {
      const normalizedSort = normalizeFieldName(select.value);
      sorts.push(`${normalizedSort} ${direction}`);
    }
  });

  window._filterClauses = filters;
  window._sortClauses = sorts;
}
