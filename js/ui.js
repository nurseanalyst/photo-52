// ── Toast Notifications ─────────────────────────────────

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// ── Modal ───────────────────────────────────────────────

export function showModal({ icon, title, message, actions }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal');
    const content = document.getElementById('modalContent');

    let html = '';
    if (icon) html += `<div class="modal-icon">${icon}</div>`;
    if (title) html += `<div class="modal-title">${title}</div>`;
    if (message) html += `<div class="modal-message">${message}</div>`;

    html += '<div class="modal-actions">';
    actions.forEach((action, i) => {
      const cls = action.danger ? 'btn btn--danger btn--full' :
                  action.primary ? 'btn btn--primary btn--full' :
                  'btn btn--secondary btn--full';
      html += `<button class="${cls}" data-modal-action="${i}">${action.label}</button>`;
    });
    html += '</div>';

    content.innerHTML = html;
    overlay.hidden = false;

    const handler = (e) => {
      const btn = e.target.closest('[data-modal-action]');
      if (!btn) return;
      const index = parseInt(btn.dataset.modalAction);
      overlay.hidden = true;
      content.removeEventListener('click', handler);
      resolve(actions[index]?.value ?? index);
    };

    content.addEventListener('click', handler);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.hidden = true;
        content.removeEventListener('click', handler);
        resolve(null);
      }
    }, { once: true });
  });
}

// ── Confetti ────────────────────────────────────────────

export function showConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#e8a849', '#f0b55a', '#4caf7d', '#f0f0f0', '#e85454', '#8a8a8a'];
  const particles = [];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 100,
      w: 4 + Math.random() * 6,
      h: 4 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1
    });
  }

  let frame = 0;
  const maxFrames = 120;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.vy += 0.1;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      if (frame > maxFrames * 0.6) {
        p.opacity = Math.max(0, p.opacity - 0.02);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    frame++;
    if (frame < maxFrames) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

// ── Celebration Modal ───────────────────────────────────

export async function showCelebration(emoji, title, message) {
  showConfetti();
  await showModal({
    icon: `<span class="celebration-emoji">${emoji}</span>`,
    title,
    message,
    actions: [{ label: 'Continue', primary: true, value: 'ok' }]
  });
}

// ── Animated Counter ────────────────────────────────────

export function animateCounter(element, from, to, duration = 600) {
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + (to - from) * eased);
    element.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ── Format Helpers ──────────────────────────────────────

export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}