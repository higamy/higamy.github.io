// ===== Planning Calendar =====
// Stores events in localStorage. Lets you post when items/animals will be ready.

const EVENTS_KEY = 'hoosierhops_events';

let currentYear, currentMonth;

// ===== Sample Events =====
const SAMPLE_EVENTS = [
  {
    id: '1',
    title: 'Holland Lop litter ready',
    date: getRelativeDate(14),
    type: 'animals',
    notes: 'Litter of 5, broken tort and solid black. Will be 8 weeks and weaned.'
  },
  {
    id: '2',
    title: 'Fresh raw feed batch available',
    date: getRelativeDate(3),
    type: 'products',
    notes: 'Chicken & rabbit blend and beef & tripe mix. 5 lb bags, frozen.'
  },
  {
    id: '3',
    title: 'Netherland Dwarf kits born',
    date: getRelativeDate(-7),
    type: 'animals',
    notes: 'New litter! Will be ready for homes in about 8 weeks.'
  },
  {
    id: '4',
    title: 'Farmers market booth',
    date: getRelativeDate(21),
    type: 'general',
    notes: 'We\'ll have a booth at the local farmers market. Come say hi!'
  }
];

function getRelativeDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

// ===== Data =====

function getEvents() {
  const data = localStorage.getItem(EVENTS_KEY);
  if (!data) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(SAMPLE_EVENTS));
    return SAMPLE_EVENTS;
  }
  return JSON.parse(data);
}

function saveEvents(events) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

// ===== Calendar Rendering =====

function initCalendar() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  renderCalendar();
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

  document.getElementById('calendarMonthYear').textContent =
    `${monthNames[currentMonth]} ${currentYear}`;

  const events = getEvents();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // First day of month & total days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  let html = '';

  // Day headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day => {
    html += `<div class="calendar-day-header">${day}</div>`;
  });

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    html += `<div class="calendar-day other-month"><span class="day-num">${d}</span></div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const dayEvents = events.filter(e => e.date === dateStr);

    html += `<div class="calendar-day${isToday ? ' today' : ''}" onclick="openDayEvents('${dateStr}')">`;
    html += `<span class="day-num">${d}</span>`;
    dayEvents.forEach(ev => {
      html += `<div class="calendar-event ${ev.type}" title="${escapeAttr(ev.title)}">${escapeHtml(ev.title)}</div>`;
    });
    html += `</div>`;
  }

  // Next month leading days
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="calendar-day other-month"><span class="day-num">${i}</span></div>`;
  }

  grid.innerHTML = html;
  renderUpcomingEvents();
}

// ===== Upcoming Events =====

function renderUpcomingEvents() {
  const container = document.getElementById('eventListItems');
  const events = getEvents();
  const today = new Date().toISOString().split('T')[0];

  const upcoming = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  if (upcoming.length === 0) {
    container.innerHTML = '<p style="color: var(--text-light); padding: 1rem;">No upcoming events. Add one above!</p>';
    return;
  }

  container.innerHTML = upcoming.map(e => `
    <div class="event-item" onclick="openEditEvent('${e.id}')" style="cursor:pointer;">
      <div style="display:flex; align-items:center;">
        <span class="event-dot ${e.type}"></span>
        <div>
          <strong>${escapeHtml(e.title)}</strong>
          <div style="font-size:0.85rem; color: var(--text-light);">${formatDate(e.date)}${e.notes ? ' - ' + escapeHtml(e.notes).substring(0, 60) + '...' : ''}</div>
        </div>
      </div>
      <span style="font-size:0.85rem; color: var(--text-light); white-space:nowrap; margin-left:1rem;">${formatDate(e.date)}</span>
    </div>
  `).join('');
}

// ===== Modal / Event CRUD =====

function openAddEvent() {
  document.getElementById('modalTitle').textContent = 'Add Event';
  document.getElementById('eventForm').reset();
  document.getElementById('eventId').value = '';
  document.getElementById('deleteEventBtn').style.display = 'none';
  document.getElementById('eventModal').classList.add('open');
}

function openDayEvents(dateStr) {
  document.getElementById('modalTitle').textContent = 'Add Event';
  document.getElementById('eventForm').reset();
  document.getElementById('eventId').value = '';
  document.getElementById('eventDate').value = dateStr;
  document.getElementById('deleteEventBtn').style.display = 'none';
  document.getElementById('eventModal').classList.add('open');
}

function openEditEvent(id) {
  const events = getEvents();
  const ev = events.find(e => e.id === id);
  if (!ev) return;

  document.getElementById('modalTitle').textContent = 'Edit Event';
  document.getElementById('eventId').value = ev.id;
  document.getElementById('eventName').value = ev.title;
  document.getElementById('eventDate').value = ev.date;
  document.getElementById('eventType').value = ev.type;
  document.getElementById('eventNotes').value = ev.notes || '';
  document.getElementById('deleteEventBtn').style.display = 'inline-block';
  document.getElementById('eventModal').classList.add('open');
}

function closeModal() {
  document.getElementById('eventModal').classList.remove('open');
}

function saveEvent(e) {
  e.preventDefault();

  const events = getEvents();
  const id = document.getElementById('eventId').value;
  const title = document.getElementById('eventName').value.trim();
  const date = document.getElementById('eventDate').value;
  const type = document.getElementById('eventType').value;
  const notes = document.getElementById('eventNotes').value.trim();

  if (id) {
    // Edit existing
    const ev = events.find(x => x.id === id);
    if (ev) {
      ev.title = title;
      ev.date = date;
      ev.type = type;
      ev.notes = notes;
    }
  } else {
    // New event
    events.push({
      id: Date.now().toString(),
      title,
      date,
      type,
      notes
    });
  }

  saveEvents(events);
  closeModal();
  renderCalendar();
  showToast(id ? 'Event updated!' : 'Event added!');
}

function deleteEvent() {
  const id = document.getElementById('eventId').value;
  if (!id || !confirm('Delete this event?')) return;

  let events = getEvents();
  events = events.filter(e => e.id !== id);
  saveEvents(events);
  closeModal();
  renderCalendar();
  showToast('Event deleted.');
}

// Close modal on overlay click
document.getElementById('eventModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ===== Utilities =====

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => toast.className = 'toast', 3000);
}

// ===== Init =====
initCalendar();
