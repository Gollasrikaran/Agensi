export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', durationMs = 3500) {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.style.borderRadius = '12px';
  toast.style.padding = '14px 20px';
  toast.style.fontSize = '15px';
  toast.style.fontWeight = '500';
  toast.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
  toast.style.transition = 'all 0.3s ease';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';
  toast.innerText = message;

  // Set colors based on type
  if (type === 'success') {
    toast.style.background = '#10b981';
    toast.style.color = '#fff';
  } else if (type === 'error') {
    toast.style.background = '#ef4444';
    toast.style.color = '#fff';
  } else {
    toast.style.background = '#6366f1';
    toast.style.color = '#fff';
  }

  container.appendChild(toast);

  // Trigger animation in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300); // Wait for fade out
  }, durationMs);
}
