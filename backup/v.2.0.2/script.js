function getDateRangeClause(range) {
    switch (range) {
      case 'Yesterday':
        return 'DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)';
      case 'Last Week':
        return 'DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)';
      case 'Last month':
        return 'DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)';
      case 'Month to yesterday':
        return 'DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), MONTH) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)';
      case 'Last 7 days':
        return 'DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY) AND CURRENT_DATE()';
      case 'Last 14 days':
        return 'DATE_SUB(CURRENT_DATE(), INTERVAL 13 DAY) AND CURRENT_DATE()';
      case 'Last 30 days':
        return 'DATE_SUB(CURRENT_DATE(), INTERVAL 29 DAY) AND CURRENT_DATE()';
      case 'Year to yesterday':
        return 'DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), YEAR) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)';
      case 'Last year':
        return 'DATE_SUB(DATE_TRUNC(CURRENT_DATE(), YEAR), INTERVAL 1 YEAR) AND DATE_SUB(DATE_TRUNC(CURRENT_DATE(), YEAR), INTERVAL 1 DAY)';
      case 'Custom date range':
        return 'DATE1 AND DATE2 -- replace with actual dates';
      default:
        return '... AND ...';
    }
  }
  
 
  
  function generateSQL() {
  const dateRange = document.getElementById('dateRange').value;
  const dateClause = getDateRangeClause(dateRange);

  const metrics = Array.from(document.getElementById('metrics').selectedOptions).map(opt => opt.value);
  const dimensions = Array.from(document.getElementById('dimensions').selectedOptions).map(opt => opt.value);

  // Determine correct table
  const tableName = dimensions.includes("URL")
    ? "searchconsole.searchdata_url_impression"
    : "searchconsole.searchdata_site_impression";

  // Use correct metrics expression
  const metricExpressions = metrics.map(m => {
    if (m === "CTR") return "SUM(Clicks) / SUM(Impressions) AS ctr";
    if (m === "Position") return "((SUM(sum_position) / SUM(Impressions)) + 1.0) AS avg_position";
    return `SUM(${m}) AS ${m.toLowerCase()}`;
  });

  const selectClause = [...dimensions, ...metricExpressions].join(", ");
  const groupByClause = dimensions.join(", ");

  // Filters
  const filters = Array.from(document.querySelectorAll(".filter-row"));
  const filterClauses = filters.map(row => {
    const dim = row.querySelector(".filter-dimension").value;
    const op = row.querySelector(".filter-operator").value;
    const val = row.querySelector(".filter-value").value;

    if (op === "CONTAINS") return `${dim} LIKE '%${val.replace(/'/g, "''")}%'`;
    if (op === "EQUALS") return `${dim} = '${val.replace(/'/g, "''")}'`;
    return ""; // Extend this as needed
  }).filter(Boolean);

  // Compose WHERE clause
  let whereClause = `data_date BETWEEN ${dateClause}`;
  if (filterClauses.length > 0) {
    whereClause += "\n  AND " + filterClauses.join("\n  AND ");
  }

  const sql = `SELECT
  ${selectClause}
FROM
  \`${tableName}\`
WHERE
  ${whereClause}
GROUP BY
  ${groupByClause}`;

  document.getElementById('sqlOutput').textContent = sql;
}
