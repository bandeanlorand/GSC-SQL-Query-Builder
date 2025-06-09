// function generateSQL() {
//   updateFilterAndSortClauses();
//   const dateClause = getDateRangeClause();
//   const metrics = Array.from(selectedMetrics);
//   const dimensions = Array.from(selectedDimensions);

//   const indent = '<span style="display:inline-block; width:1em"></span>';
//   const selectLines = [];
//   const plainSelectLines = [];
//   const customFieldsToGroup = [];

//   dimensions.forEach(dim => {
//     selectLines.push(`${indent}<span class="sql-column">${dim}</span>`);
//     plainSelectLines.push(`    ${dim}`);
//   });

//   if (metrics.includes('Clicks')) {
//     selectLines.push(`${indent}<span class="sql-function">SUM(Clicks)</span> AS <span class="sql-alias">clicks</span>`);
//     plainSelectLines.push(`    SUM(Clicks) AS clicks`);
//   }
//   if (metrics.includes('Impressions')) {
//     selectLines.push(`${indent}<span class="sql-function">SUM(Impressions)</span> AS <span class="sql-alias">impressions</span>`);
//     plainSelectLines.push(`    SUM(Impressions) AS impressions`);
//   }
//   if (metrics.includes('CTR')) {
//     selectLines.push(`${indent}<span class="sql-expression">SUM(Clicks) / SUM(Impressions)</span> AS <span class="sql-alias">ctr</span>`);
//     plainSelectLines.push(`    SUM(Clicks) / SUM(Impressions) AS ctr`);
//   }
//   if (metrics.includes('Position')) {
//     selectLines.push(`${indent}((<span class="sql-function">SUM(sum_position)</span> / <span class="sql-function">SUM(Impressions)</span>) + 1.0) AS <span class="sql-alias">avg_position</span>`);
//     plainSelectLines.push(`    ((SUM(sum_position) / SUM(Impressions)) + 1.0) AS avg_position`);
//   }

//   const customFieldGroups = document.querySelectorAll('#customFieldGroups > div');
//   let customFieldIndex = 1;

//   customFieldGroups.forEach((group) => {
//     const conditionBlocks = group.querySelectorAll('.custom-condition-group > div, .added-custom-condition-group');
//     const elseRow = group.querySelector('input[placeholder="Non-Brand"], input[placeholder="Non-Brand2"], input[placeholder="Else"]');
//     const elseValue = elseRow ? elseRow.value.trim() : '';
//     const cases = [];

//     conditionBlocks.forEach((block) => {
//       const selects = block.querySelectorAll('select');
//       const valueInput = block.querySelector('input[type="text"]');
//       let thenInput;

//       if (block.classList.contains('added-custom-condition-group')) {
//         thenInput = block.querySelector('input[placeholder="Brand"]');
//       } else {
//         const thenRow = group.querySelectorAll('div.flex.items-center.gap-2')[1];
//         thenInput = thenRow?.querySelector('input[type="text"]');
//       }

//       const field = selects[0]?.value;
//       const operator = selects[1]?.value;
//       const value = valueInput?.value.trim();
//       const thenValue = thenInput?.value.trim();

//       if (!field || !operator || !value || !thenValue) return;

//       let condition = '';
//       switch (operator) {
//         case 'EQUALS': condition = field.startsWith('Is ') ? `${field} = ${value}` : `${field} = '${value}'`; break;
//         case 'NOT EQUALS': condition = field.startsWith('Is ') ? `${field} != ${value}` : `${field} != '${value}'`; break;
//         case 'CONTAINS': condition = `${field} LIKE '%${value}%'`; break;
//         case 'NOT CONTAINS': condition = `${field} NOT LIKE '%${value}%'`; break;
//         case 'REGEX CONTAINS': condition = `REGEXP_CONTAINS(${field}, '${value}')`; break;
//         case 'REGEX NOT CONTAINS': condition = `NOT REGEXP_CONTAINS(${field}, '${value}')`; break;
//       }
//       cases.push(`WHEN ${condition} THEN '${thenValue}'`);
//     });

//     if (cases.length > 0 || elseValue) {
//       const alias = `custom_field_${customFieldIndex++}`;
//       const caseSQL = `CASE\n    ${cases.join('\n    ')}\n    ELSE '${elseValue}'\nEND AS ${alias}`;
//       const visualCaseSQL = caseSQL.replace(/\n/g, '<br>' + indent);
//       selectLines.push(`${indent}${visualCaseSQL}`);
//       plainSelectLines.push(`    ${caseSQL}`);
//       customFieldsToGroup.push(alias);
//     }
//   });

//   const selectClause = `<span class="sql-keyword">SELECT</span><br>${selectLines.join(',<br>')}`;
//   const plainSelectClause = `SELECT\n${plainSelectLines.join(',\n')}`;

//   const fromTable = dimensions.includes('URL')
//     ? '`searchconsole.searchdata_url_impression`'
//     : '`searchconsole.searchdata_site_impression`';

//   const fromClause = `<br><span class="sql-keyword">FROM</span><br>${indent}<span class="sql-table">${fromTable}</span>`;
//   const plainFromClause = `FROM\n    ${fromTable}`;

//   const baseWhereClause = `<br><span class="sql-keyword">WHERE</span><br>${indent}<span class="sql-column">data_date</span> <span class="sql-keyword">BETWEEN</span> ${dateClause}`;
//   const basePlainWhereClause = `WHERE\n    data_date BETWEEN ${dateClause}`;

//   const filterClauses = window._filterClauses || [];
//   const sortClauses = window._sortClauses || [];

//   const extraWhere = (() => {
//     if (!filterClauses.length) return '';

//     const grouped = [];
//     let currentGroup = [];
//     let currentLogic = filterClauses[0].logic || 'AND';

//     filterClauses.forEach((item, index) => {
//       if (index === 0 || item.logic === currentLogic) {
//         currentGroup.push(item.clause);
//       } else {
//         grouped.push({ logic: currentLogic, clauses: [...currentGroup] });
//         currentGroup = [item.clause];
//         currentLogic = item.logic;
//       }
//     });

//     if (currentGroup.length) {
//       grouped.push({ logic: currentLogic, clauses: [...currentGroup] });
//     }

//     return grouped.map((group, i) => {
//       const prefix = i === 0 ? '' : ` ${group.logic} `;
//       const content = group.clauses.length > 1 ? `(${group.clauses.join(` ${group.logic} `)})` : group.clauses[0];
//       return prefix + content;
//     }).join('');
//   })();

//   const whereHTML = extraWhere ? `<br>${indent}${extraWhere}` : '';
//   const whereText = extraWhere ? `\n    ${extraWhere}` : '';

//   const groupItems = [...dimensions, ...customFieldsToGroup];
//   const groupByClause = groupItems.length
//     ? `<br><span class="sql-keyword">GROUP BY</span><br>${indent}${groupItems.map(d => `<span class="sql-column">${d}</span>`).join(', ')}`
//     : '';
//   const plainGroupByClause = groupItems.length
//     ? `GROUP BY\n    ${groupItems.join(', ')}`
//     : '';

//   const orderHTML = sortClauses.length
//     ? `<br><span class="sql-keyword">ORDER BY</span><br>${indent}${sortClauses.map(cl => `<span class="sql-column">${cl}</span>`).join(', ')}`
//     : '';
//   const orderText = sortClauses.length
//     ? `\nORDER BY\n    ${sortClauses.join(', ')}`
//     : '';

//   const sql = `${selectClause}${fromClause}${baseWhereClause}${whereHTML}${groupByClause}${orderHTML}`;
//   const plainSQL = `${plainSelectClause}\n${plainFromClause}\n${basePlainWhereClause}${whereText}${plainGroupByClause ? `\n${plainGroupByClause}` : ''}${orderText}`;

//   document.getElementById('sqlOutput').innerHTML = sql;
//   document.getElementById('sqlOutputFormated').textContent = plainSQL;

//   document.querySelectorAll('#customFieldGroups input[type="text"]').forEach(input => {
//     input.addEventListener('input', () => {
//       if (input.value.trim() !== '') {
//         input.classList.add('user-started');
//       } else {
//         input.classList.remove('user-started');
//       }
//     });
//   });

//   const body = document.body;
//   const sqlStatus = document.getElementById('sqlStatus');

//   body.classList.remove('show-generated', 'show-generated-incomplete');
//   const hasErrors = document.querySelectorAll('#customFieldGroups .border-red-500').length > 0;
//   const userTouchedInputs = document.querySelectorAll('#customFieldGroups input.user-started').length > 0;

//   if (userTouchedInputs && hasErrors) {
//     void body.offsetHeight;
//     body.classList.add('show-generated-incomplete');
//     if (sqlStatus) sqlStatus.setAttribute('title', 'There are incomplete fields – SQL Generated!');
//   } else {
//     body.classList.add('show-generated');
//     if (sqlStatus) sqlStatus.removeAttribute('title');
//   }
// }

// function updateFilterAndSortClauses() {
//   const filters = [];
//   document.querySelectorAll('#filterRows > div').forEach(filter => {
//     const selects = filter.querySelectorAll('select');
//     const field = selects[0]?.value;
//     const operator = selects[1]?.value;
//     const logic = filter.querySelector('input[type="radio"]:checked')?.value || 'AND';

//     let value;
//     const textInput = filter.querySelector('input[type="text"]');
//     const allSelects = filter.querySelectorAll('select');
//     const possibleBooleanSelect = allSelects.length === 3 ? allSelects[2] : null;

//     if (field?.startsWith('Is ') && possibleBooleanSelect) {
//       value = possibleBooleanSelect.value?.trim();
//     } else if (textInput) {
//       value = textInput.value.trim();
//     }

//     if (field && operator && (value || operator.includes('NULL'))) {
//       let clause = '';
//       switch (operator) {
//         case 'EQUALS': clause = field.startsWith('Is ') ? `${field} = ${value}` : `${field} = '${value}'`; break;
//         case 'NOT EQUALS': clause = field.startsWith('Is ') ? `${field} != ${value}` : `${field} != '${value}'`; break;
//         case 'CONTAINS': clause = `${field} LIKE '%${value}%'`; break;
//         case 'NOT CONTAINS': clause = `${field} NOT LIKE '%${value}%'`; break;
//         case 'GREATER THAN': clause = `${field} > '${value}'`; break;
//         case 'LESS THAN': clause = `${field} < '${value}'`; break;
//         case 'IS NULL': clause = `${field} IS NULL`; break;
//         case 'IS NOT NULL': clause = `${field} IS NOT NULL`; break;
//       }
//       if (clause) filters.push({ clause, logic });
//     }
//   });

//   const sorts = [];
//   document.querySelectorAll('#sortRows > div').forEach(row => {
//     const select = row.querySelector('select');
//     const direction = row.querySelector('input[type="radio"]:checked')?.value || 'ASC';
//     if (select && select.value) {
//       sorts.push(`${select.value} ${direction}`);
//     }
//   });

//   window._filterClauses = filters;
//   window._sortClauses = sorts;
// }


function generateSQL() {
  updateFilterAndSortClauses();
  const dateClause = getDateRangeClause();
  const metrics = Array.from(selectedMetrics);
  const dimensions = Array.from(selectedDimensions);

  const indent = '<span style="display:inline-block; width:1em"></span>';
  const selectLines = [];
  const plainSelectLines = [];
  const customFieldsToGroup = [];

  dimensions.forEach(dim => {
    selectLines.push(`${indent}<span class="sql-column">${dim}</span>`);
    plainSelectLines.push(`    ${dim}`);
  });

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
      const valueInput = block.querySelector('input[type="text"]');
      const radioInput = block.querySelector('input[name^="bool-val"]:checked'); /*Is  with checkbox*/
      let thenInput;

      if (block.classList.contains('added-custom-condition-group')) {
        thenInput = block.querySelector('input[placeholder="Brand"]');
      } else {
        const thenRow = group.querySelectorAll('div.flex.items-center.gap-2')[1];
        thenInput = thenRow?.querySelector('input[type="text"]');
      }

      const field = selects[0]?.value;
      const operator = selects[1]?.value;
      // const value = valueInput?.value.trim(); - is with dropdown
      const value = field?.startsWith('Is ') ? radioInput?.value : valueInput?.value.trim();/*Is  with checkbox*/
      const thenValue = thenInput?.value.trim();

      if (!field || !operator || !value || !thenValue) return;

      let condition = '';
      switch (operator) {
        case 'EQUALS': condition = field.startsWith('Is ') ? `${field} = ${value.toUpperCase()}` : `${field} = '${value}'`; break;
        case 'NOT EQUALS': condition = field.startsWith('Is ') ? `${field} != ${value.toUpperCase()}` : `${field} != '${value}'`; break;
        case 'CONTAINS': condition = `${field} LIKE '%${value}%'`; break;
        case 'NOT CONTAINS': condition = `${field} NOT LIKE '%${value}%'`; break;
        case 'REGEX CONTAINS': condition = `REGEXP_CONTAINS(${field}, '${value}')`; break;
        case 'REGEX NOT CONTAINS': condition = `NOT REGEXP_CONTAINS(${field}, '${value}')`; break;
      }
      cases.push(`WHEN ${condition} THEN '${thenValue}'`);
    });

    if (cases.length > 0 || elseValue) {
      const alias = `custom_field_${customFieldIndex++}`;
      const caseSQL = `CASE\n    ${cases.join('\n    ')}\n    ELSE '${elseValue}'\nEND AS ${alias}`;
      const visualCaseSQL = caseSQL.replace(/\n/g, '<br>' + indent);
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

  // const filterClauses = window._filterClauses || [];
  const filterClauses = (window._filterClauses || []).map(f => {
    let clause = f.clause;
    // Add boolean span highlight
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

  const groupItems = [...dimensions, ...customFieldsToGroup];
  const groupByClause = groupItems.length
    ? `<br><span class="sql-keyword">GROUP BY</span><br>${indent}${groupItems.map(d => `<span class="sql-column">${d}</span>`).join(', ')}`
    : '';
  const plainGroupByClause = groupItems.length
    ? `GROUP BY\n    ${groupItems.join(', ')}`
    : '';

  const orderHTML = sortClauses.length
    ? `<br><span class="sql-keyword">ORDER BY</span><br>${indent}${sortClauses.map(cl => `<span class="sql-column">${cl}</span>`).join(', ')}`
    : '';
  const orderText = sortClauses.length
    ? `\nORDER BY\n    ${sortClauses.join(', ')}`
    : '';

  const sql = `${selectClause}${fromClause}${baseWhereClause}${whereHTML}${groupByClause}${orderHTML}`;
  const plainSQL = `${plainSelectClause}\n${plainFromClause}\n${basePlainWhereClause}${whereText}${plainGroupByClause ? `\n${plainGroupByClause}` : ''}${orderText}`;

  document.getElementById('sqlOutput').innerHTML = sql;
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


// function updateFilterAndSortClauses() {
//   const filters = [];
//   document.querySelectorAll('#filterRows > div').forEach(filter => {
//     const selects = filter.querySelectorAll('select');
//     const field = selects[0]?.value;
//     const operator = selects[1]?.value;
//     const logic = filter.querySelector('input[type="radio"]:checked')?.value || 'AND';

//     let value;
//     const textInput = filter.querySelector('input[type="text"]');
//     const allSelects = filter.querySelectorAll('select');
//     const possibleBooleanSelect = allSelects.length === 3 ? allSelects[2] : null;

//     if (field?.startsWith('Is ') && possibleBooleanSelect) {
//       value = possibleBooleanSelect.value?.trim().toUpperCase(); // ← Uppercase true/false
//     } else if (textInput) {
//       value = textInput.value.trim();
//     }

//     if (field && operator && (value || operator.includes('NULL'))) {
//       let clause = '';
//       switch (operator) {
//         case 'EQUALS':
//           clause = field.startsWith('Is ') ? `${field} = ${value}` : `${field} = '${value}'`;
//           break;
//         case 'NOT EQUALS':
//           clause = field.startsWith('Is ') ? `${field} != ${value}` : `${field} != '${value}'`;
//           break;
//         case 'CONTAINS':
//           clause = `${field} LIKE '%${value}%'`;
//           break;
//         case 'NOT CONTAINS':
//           clause = `${field} NOT LIKE '%${value}%'`;
//           break;
//         case 'GREATER THAN':
//           clause = `${field} > '${value}'`;
//           break;
//         case 'LESS THAN':
//           clause = `${field} < '${value}'`;
//           break;
//         case 'IS NULL':
//           clause = `${field} IS NULL`;
//           break;
//         case 'IS NOT NULL':
//           clause = `${field} IS NOT NULL`;
//           break;
//       }
      

//       if (clause) filters.push({ clause, logic });
//     }
//   });

//   const sorts = [];
//   document.querySelectorAll('#sortRows > div').forEach(row => {
//     const select = row.querySelector('select');
//     const direction = row.querySelector('input[type="radio"]:checked')?.value || 'ASC';
//     if (select && select.value) {
//       sorts.push(`${select.value} ${direction}`);
//     }
//   });

//   window._filterClauses = filters;
//   window._sortClauses = sorts;
// }

function updateFilterAndSortClauses() {
  const filters = [];
  document.querySelectorAll('#filterRows > div').forEach(filter => {
    const selects = filter.querySelectorAll('select');
    const field = selects[0]?.value;
    const operator = selects[1]?.value;
    const logic = filter.querySelector('input[type="radio"]:checked')?.value || 'AND';

    let value;
    const textInput = filter.querySelector('input[type="text"]');
    const booleanRadio = filter.querySelector('input[name^="bool-val"]:checked');

    if (field?.startsWith('Is ') && booleanRadio) {
      value = booleanRadio.value?.toUpperCase();
    } else if (textInput) {
      value = textInput.value.trim();
    }

    if (field && operator && (value || operator.includes('NULL'))) {
      let clause = '';
      switch (operator) {
        case 'EQUALS':
          clause = field.startsWith('Is ') ? `${field} = ${value}` : `${field} = '${value}'`;
          break;
        case 'NOT EQUALS':
          clause = field.startsWith('Is ') ? `${field} != ${value}` : `${field} != '${value}'`;
          break;
        case 'CONTAINS':
          clause = `${field} LIKE '%${value}%'`;
          break;
        case 'NOT CONTAINS':
          clause = `${field} NOT LIKE '%${value}%'`;
          break;
        case 'GREATER THAN':
          clause = `${field} > '${value}'`;
          break;
        case 'LESS THAN':
          clause = `${field} < '${value}'`;
          break;
        case 'IS NULL':
          clause = `${field} IS NULL`;
          break;
        case 'IS NOT NULL':
          clause = `${field} IS NOT NULL`;
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
      sorts.push(`${select.value} ${direction}`);
    }
  });

  window._filterClauses = filters;
  window._sortClauses = sorts;
}
