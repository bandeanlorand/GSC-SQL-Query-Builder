// utils.js
export function copySQL() {
  const sqlText = document.getElementById('sqlOutputFormated').textContent;
  copyToTheClipboard(sqlText);
}

export async function copyToTheClipboard(textToCopy) {
  try {
    await navigator.clipboard.writeText(textToCopy);
    document.body.classList.add('show-copied');
    setTimeout(() => {
      document.body.classList.remove('show-copied');
    }, 3000);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

export function setupEnterKeyTrigger(generateSQL) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generateSQL();
  });
}

/* Function to get the date range clause based on the selected date range. - starts here */
export function getDateRangeClause() {

      const range = selectedDateRange;

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
          const startDate = document.getElementById('startDate').value;
          const endDate = document.getElementById('endDate').value;
          if (startDate && endDate) {
            return `DATE('${startDate}') AND DATE('${endDate}')`;
          } else {
            return 'DATE1 AND DATE2 -- replace with actual dates';
          }
        default:
          return '... AND ...';
      }
      
    }
    /* * Function to get the date range clause based on the selected date range. - ends here */