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
