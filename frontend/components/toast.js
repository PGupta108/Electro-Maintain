// Toast notification system
let toastRoot = null;

function getRoot() {
  if (!toastRoot) {
    toastRoot = document.getElementById('toast-root');
    if (!toastRoot) {
      toastRoot = document.createElement('div');
      toastRoot.id = 'toast-root';
      document.body.appendChild(toastRoot);
    }
  }
  return toastRoot;
}

export function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  getRoot().appendChild(el);
  setTimeout(() => el.remove(), 3200);
}
