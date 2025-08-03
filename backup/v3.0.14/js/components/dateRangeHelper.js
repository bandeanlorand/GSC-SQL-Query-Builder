// export function getDateRangeClause(selectedDateRange) {
//   switch (selectedDateRange) {
//     case 'Yesterday':
//       return 'DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
//     case 'Last Week':
//       return 'DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
//     case 'Last month':
//       return 'DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
//     case 'Month to yesterday':
//       return 'DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), MONTH) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
//     case 'Last 7 days':
//       return 'DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
//     case 'Last 14 days':
//       return 'DATE_SUB(CURRENT_DATE(), INTERVAL 15 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
//     case 'Last 30 days':
//       return 'DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
//     case 'Year to yesterday':
//       return 'DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), YEAR) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
//     case 'Last year':
//       return 'DATE_SUB(DATE_TRUNC(CURRENT_DATE(), YEAR), INTERVAL 1 YEAR) AND DATE_SUB(DATE_TRUNC(CURRENT_DATE(), YEAR), INTERVAL 1 DAY)';
//     case 'Custom date range': {
//       const startDate = document.getElementById('startDate').value;
//       const endDate = document.getElementById('endDate').value;
//       if (startDate && endDate) {
//         return `DATE('${startDate}') AND DATE('${endDate}')`;
//       } else {
//         return 'DATE1 AND DATE2 -- replace with actual dates';
//       }
//     }
//     default:
//       return '... AND ...';
//   }
// }



export function getDateRangeClause(selectedDateRange) {
  switch (selectedDateRange) {
    case 'Yesterday':
      return 'DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
    case 'Last Week':
      return 'DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
    case 'Last month':
      return 'DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
    case 'Month to last available date':
      return 'DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), MONTH) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
    case 'Last 7 days':
      return 'DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
    case 'Last 14 days':
      return 'DATE_SUB(CURRENT_DATE(), INTERVAL 15 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
    case 'Last 30 days':
      return 'DATE_SUB(CURRENT_DATE(), INTERVAL 31 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
    case 'Year to last available date':
      return 'DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), YEAR) AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)';
    case 'Last year':
      return 'DATE_SUB(DATE_TRUNC(CURRENT_DATE(), YEAR), INTERVAL 1 YEAR) AND DATE_SUB(DATE_TRUNC(CURRENT_DATE(), YEAR), INTERVAL 1 DAY)';

    case 'Last quarter': {
      // Calculate quarter start and end in BigQuery logic
      return `
        DATE_SUB(DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), QUARTER), INTERVAL 3 MONTH)
        AND DATE_SUB(DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), QUARTER), INTERVAL 1 DAY)
      `.trim().replace(/\s+/g, ' ');
    }

    case 'Quarter to last available date': {
      return `
        DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), QUARTER)
        AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
      `.trim().replace(/\s+/g, ' ');
    }

    case 'Custom date range': {
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      if (startDate && endDate) {
        return `DATE('${startDate}') AND DATE('${endDate}')`;
      } else {
        return 'DATE1 AND DATE2 -- replace with actual dates';
      }
    }
    default:
      return '... AND ...';
  }
}
