// ===== Contact Form Handler =====
// Since there's no backend, messages are saved to localStorage
// and can also be forwarded via mailto link or a service like Formspree.

const MESSAGES_KEY = 'hoosierhops_messages';

// ===== CONFIGURE YOUR EMAIL HERE =====
// Option 1: Set your email to use mailto: links (opens user's email client)
const OWNER_EMAIL = ''; // e.g. 'brett@example.com'

// Option 2: Use Formspree (free tier, no backend needed)
// Sign up at https://formspree.io, create a form, and paste your endpoint:
const FORMSPREE_URL = ''; // e.g. 'https://formspree.io/f/xabcdefg'

function submitContact(e) {
  e.preventDefault();

  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value;
  const message = document.getElementById('contactMessage').value.trim();
  const preferred = document.getElementById('contactPreferred').value;

  const entry = {
    id: Date.now().toString(),
    name,
    phone,
    email,
    subject,
    message,
    preferred,
    date: new Date().toLocaleString()
  };

  // Save locally
  const messages = getMessages();
  messages.unshift(entry);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

  // Try to forward via Formspree if configured
  if (FORMSPREE_URL) {
    fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        email,
        subject: getSubjectLabel(subject),
        message,
        preferred_contact: preferred
      })
    }).catch(() => {
      // Silently fail - message is still saved locally
    });
  }

  // Fallback: open mailto if configured and no Formspree
  if (OWNER_EMAIL && !FORMSPREE_URL) {
    const mailSubject = encodeURIComponent(`[Hoosier Hops & Raw] ${getSubjectLabel(subject)} - from ${name}`);
    const mailBody = encodeURIComponent(
      `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nInterested In: ${getSubjectLabel(subject)}\nPreferred Contact: ${preferred}\n\nMessage:\n${message}`
    );
    window.open(`mailto:${OWNER_EMAIL}?subject=${mailSubject}&body=${mailBody}`, '_blank');
  }

  // Reset form and show success
  document.getElementById('contactForm').reset();
  showToast('Message sent! We\'ll get back to you within 24 hours.');
}

function getSubjectLabel(val) {
  const labels = {
    'rabbits': 'Rabbits / Animals',
    'raw-feed': 'Raw Dog Feed',
    'trinkets': 'Trinkets & Goods',
    'breeding': 'Breeding Inquiries',
    'general': 'General Question',
    'other': 'Other'
  };
  return labels[val] || val;
}

// ===== Messages View (Admin) =====

function getMessages() {
  const data = localStorage.getItem(MESSAGES_KEY);
  return data ? JSON.parse(data) : [];
}

function toggleMessages() {
  const panel = document.getElementById('messagesPanel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    renderMessages();
  }
}

function renderMessages() {
  const list = document.getElementById('messagesList');
  const messages = getMessages();

  if (messages.length === 0) {
    list.innerHTML = '<p style="color: var(--text-light);">No messages yet.</p>';
    return;
  }

  list.innerHTML = messages.map(m => `
    <div style="background: var(--bg-alt); border-radius: var(--radius); padding: 1rem; margin-bottom: 0.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <strong>${escapeHtml(m.name)}</strong>
        <small style="color: var(--text-light);">${escapeHtml(m.date)}</small>
      </div>
      <p style="font-size: 0.9rem; margin-bottom: 0.3rem;">
        <strong>Phone:</strong> ${escapeHtml(m.phone)}
        ${m.email ? ` | <strong>Email:</strong> ${escapeHtml(m.email)}` : ''}
      </p>
      <p style="font-size: 0.9rem; margin-bottom: 0.3rem;">
        <strong>Interest:</strong> ${escapeHtml(getSubjectLabel(m.subject))} | <strong>Preferred:</strong> ${escapeHtml(m.preferred)}
      </p>
      <p style="font-size: 0.9rem; color: var(--text-light); margin-top: 0.5rem;">${escapeHtml(m.message)}</p>
      <button class="btn btn-danger btn-sm" style="margin-top: 0.5rem;" onclick="deleteMessage('${m.id}')">Delete</button>
    </div>
  `).join('');
}

function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  let messages = getMessages();
  messages = messages.filter(m => m.id !== id);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  renderMessages();
  showToast('Message deleted.');
}

// ===== Utilities =====

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => toast.className = 'toast', 3000);
}
