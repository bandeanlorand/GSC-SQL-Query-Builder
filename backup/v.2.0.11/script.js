function copySQL() {
  navigator.clipboard.writeText(plainSQL).then(() => {
    document.body.classList.add('show-copied');
    setTimeout(() => document.body.classList.remove('show-copied'), 3000);
  }).catch(err => console.error('Copy failed', err));
}


// Trigger SQL generation on Enter key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    generateSQL();
  }
});
