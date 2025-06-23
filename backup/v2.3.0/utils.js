// utils.js
/* copy to  clipboard script -  starts here */
function copySQL() {
  const sqlText = document.getElementById('sqlOutputFormated').textContent;
  copyToTheClipboard(sqlText);
}

async function copyToTheClipboard(textToCopy) {
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

/* copy to  clipboard script - ends here */

// Trigger SQL generation on Enter key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    generateSQL();
  }
});