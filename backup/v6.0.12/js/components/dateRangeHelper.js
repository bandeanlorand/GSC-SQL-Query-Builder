// dateRangeHelper.js
export function getDateRangeClause(selectedDateRange) {
  const END = `DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)`;      // last available day
  const ALL_START = `DATE '2023-02-21'`;                       // bulk export start

  // helper: n days inclusive, e.g. last 7 days → start = END - 6
  const lastNDays = (n) => `DATE_SUB(${END}, INTERVAL ${n - 1} DAY) AND ${END}`;
  const lastNMonths = (n) => `DATE_SUB(${END}, INTERVAL ${n} MONTH) AND ${END}`;

  switch (selectedDateRange) {
    case 'Yesterday':                     return `${END} AND ${END}`;
    case 'Last Week':                     return lastNDays(7);
    case 'Last 7 days':                   return lastNDays(7);
    case 'Last 14 days':                  return lastNDays(14);
    case 'Last 28 days':                  return lastNDays(28);
    case 'Last 30 days':                  return lastNDays(30);

    case 'Month to last available date':  return `DATE_TRUNC(${END}, MONTH) AND ${END}`;
    case 'Year to last available date':   return `DATE_TRUNC(${END}, YEAR) AND ${END}`;
    case 'Last month':                    return `
        DATE_TRUNC(${END}, MONTH) - INTERVAL 1 MONTH
        AND (DATE_TRUNC(${END}, MONTH) - INTERVAL 1 DAY)
    `.trim().replace(/\s+/g, ' ');
    case 'Last year':                     return `
        DATE_TRUNC(${END}, YEAR) - INTERVAL 1 YEAR
        AND (DATE_TRUNC(${END}, YEAR) - INTERVAL 1 DAY)
    `.trim().replace(/\s+/g, ' ');
    case 'Last quarter':                  return `
        DATE_TRUNC(${END}, QUARTER) - INTERVAL 3 MONTH
        AND (DATE_TRUNC(${END}, QUARTER) - INTERVAL 1 DAY)
    `.trim().replace(/\s+/g, ' ');
    case 'Quarter to last available date':return `DATE_TRUNC(${END}, QUARTER) AND ${END}`;

    // NEW presets
    case 'All available dates':           return `${ALL_START} AND ${END}`;
    case 'Last 3 months':                 return lastNMonths(3);
    case 'Last 6 months':                 return lastNMonths(6);
    case 'Last 12 months':                return lastNMonths(12);
    case 'Last 16 months':                return lastNMonths(16);

    case 'Custom date range': {
      const start = document.getElementById('startDate')?.value;
      const end   = document.getElementById('endDate')?.value;
      if (start && end) return `DATE('${start}') AND DATE('${end}')`;
      // harmless fallback that keeps SQL valid-ish until user picks dates
      return `${ALL_START} AND ${END}`;
    }

    default:
      // safe default = last 28 days
      return lastNDays(28);
  }
}
