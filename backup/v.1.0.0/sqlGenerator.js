export function getDateRangeClause(range, startDate = '', endDate = '') {
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
      if (startDate && endDate) return `DATE('${startDate}') AND DATE('${endDate}')`;
      return 'DATE1 AND DATE2 -- replace with actual dates';
    default:
      return '... AND ...';
  }
}

export function generateSQL({ dateRange, startDate, endDate, metrics, dimensions, filters }) {
  const dateClause = getDateRangeClause(dateRange, startDate, endDate);

  const tableName = dimensions.includes("URL")
    ? "searchconsole.searchdata_url_impression"
    : "searchconsole.searchdata_site_impression";

  const metricExpressions = metrics.map(m => {
    if (m === "CTR") return "SUM(Clicks) / SUM(Impressions) AS ctr";
    if (m === "Position") return "((SUM(sum_position) / SUM(Impressions)) + 1.0) AS avg_position";
    return `SUM(${m}) AS ${m.toLowerCase()}`;
  });

  const selectClause = [...dimensions, ...metricExpressions].join(", ");
  const groupByClause = dimensions.join(", ");

  const filterClauses = filters.map(({ field, operator, value }) => {
    if (operator === "CONTAINS") return `${field} LIKE '%${value.replace(/'/g, "''")}%'`;
    if (operator === "EQUALS") return `${field} = '${value.replace(/'/g, "''")}'`;
    return ""; // Extend as needed
  }).filter(Boolean);

  let whereClause = `data_date BETWEEN ${dateClause}`;
  if (filterClauses.length) {
    whereClause += "\n  AND " + filterClauses.join("\n  AND ");
  }

  return `SELECT
  ${selectClause}
FROM
  \`${tableName}\`
WHERE
  ${whereClause}
GROUP BY
  ${groupByClause}`;
}
