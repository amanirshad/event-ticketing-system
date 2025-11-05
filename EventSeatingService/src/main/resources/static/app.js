// app.js - plain JS to call your seating endpoints
const base = window.location.origin; // same host/port as server

// helper
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: {} };
  if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(base + path, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) throw { status: res.status, body: data };
  console.log("URL called is : "+data);
  return data;
}

// Events
async function loadEvents() {
  try {
    const list = await api('/v1/events');
    const el = document.getElementById('eventsList');
    if (!list || list.length === 0) { el.innerText = 'No events'; return; }
    let html = '<ul>';
    for (const e of list) {
      html += `<li><strong>${e.eventId}</strong> — ${e.eventName} (sno: ${e.sno || ''})</li>`;
    }
    html += '</ul>';
    el.innerHTML = html;
  } catch (err) {
    document.getElementById('eventsList').innerText = 'Error: ' + JSON.stringify(err);
  }
}

async function addEvent() {
  const id = document.getElementById('newEventId').value.trim();
  const name = document.getElementById('newEventName').value.trim();
  if (!id || !name) { alert('Provide eventId and eventName'); return; }
  try {
    const saved = await api('/v1/seating/events', 'POST', { eventId: id, eventName: name });
    alert('Saved: ' + JSON.stringify(saved));
    loadEvents();
  } catch (err) {
    alert('Error: ' + JSON.stringify(err));
  }
}

// Seats / Holds / Stats
async function loadSeats() {
  const ev = document.getElementById('eventId').value.trim();
  if (!ev) { alert('Enter eventId'); return; }
  try {
    const seats = await api(`/v1/seating/events/${encodeURIComponent(ev)}`);
    renderSeats(seats);
  } catch (err) {
    document.getElementById('seatsArea').innerText = 'Error: ' + JSON.stringify(err);
  }
}

async function loadHolds() {
  const ev = document.getElementById('eventId').value.trim();
  if (!ev) return;
  try {
    const holds = await api(`/v1/seating/events/${encodeURIComponent(ev)}`);
    renderHolds(holds);
  } catch (err) {
    document.getElementById('holdsArea').innerText = 'Error: ' + JSON.stringify(err);
  }
}

async function loadStats() {
  const ev = document.getElementById('eventId').value.trim();
  console.log("Event ID is : "+ev);
  if (!ev) { alert('Enter eventId'); return; }
  try {
    const st = await api(`/v1/seating/stats?eventId=${encodeURIComponent(ev)}`);
    document.getElementById('statsArea').innerText =
      `Total: ${st.totalSeats}, Available: ${st.available}, Held: ${st.held}, Allocated: ${st.allocated}`;
  } catch (err) {
    document.getElementById('statsArea').innerText = 'Error: ' + JSON.stringify(err);
  }
}

function renderSeats(seats) {
  const el = document.getElementById('seatsArea');
  if (!seats || seats.length === 0) { el.innerText = 'No seats'; return; }
  let html = '<table><tr><th>Seat</th><th>Status</th><th>User</th><th>HoldToken</th><th>Actions</th></tr>';
  for (const s of seats) {
    html += `<tr>
      <td>${s.seatCode}</td>
      <td>${s.status}</td>
      <td>${s.userId || ''}</td>
      <td style="word-break:break-all">${s.holdToken || ''}</td>
      <td>
        ${s.holdToken ? `<button onclick="adminRelease('${s.holdToken}')">Release</button>
                        <button onclick="adminAllocatePrompt('${s.holdToken}')">Allocate</button>` : ''}
      </td>
    </tr>`;
  }
  html += '</table>';
  el.innerHTML = html;
}

function renderHolds(holds) {
  const el = document.getElementById('holdsArea');
  if (!holds || holds.length === 0) { el.innerText = 'No holds'; return; }
  let html = '<table><tr><th>HoldToken</th><th>SeatID</th><th>Status</th><th>User</th><th>Expiry</th></tr>';
  for (const h of holds) {
    html += `<tr>
      <td style="word-break:break-all">${h.holdToken}</td>
      <td>${h.eventSeatId}</td>
      <td>${h.status}</td>
      <td>${h.userId || ''}</td>
      <td>${h.holdExpiry || ''}</td>
    </tr>`;
  }
  html += '</table>';
  el.innerHTML = html;
}

// Reserve seats
async function reserveSeats() {
  const eventId = document.getElementById('reserveEventId').value.trim();
  const userId = document.getElementById('reserveUserId').value.trim();
  const seatCodes = document.getElementById('reserveSeatCodes').value.split(',').map(x=>x.trim()).filter(Boolean);
  const idemp = document.getElementById('reserveIdempo').value.trim() || null;
  if (!eventId || !userId || seatCodes.length === 0) { alert('Provide eventId, userId and seatCodes'); return; }
  try {
    const resp = await api('/v1/seating/reserve', 'POST', { eventId, userId, seatCodes, idempotencyKey: idemp });
    document.getElementById('reserveResult').innerText = JSON.stringify(resp, null, 2);
    // refresh seats/holds
    loadSeats(); loadHolds();
  } catch (err) {
    document.getElementById('reserveResult').innerText = 'Error: ' + JSON.stringify(err);
  }
}

// Allocate / Release
async function allocate() {
  const token = document.getElementById('allocHoldToken').value.trim();
  const orderId = document.getElementById('allocOrderId').value.trim();
  if (!token || !orderId) { alert('Provide holdToken and orderId'); return; }
  try {
    await api('/v1/seating/allocate', 'POST', { holdToken: token, orderId });
    document.getElementById('allocResult').innerText = 'Allocated';
    loadSeats(); loadHolds();
  } catch (err) {
    document.getElementById('allocResult').innerText = 'Error: ' + JSON.stringify(err);
  }
}

async function release() {
  const token = document.getElementById('allocHoldToken').value.trim();
  if (!token) { alert('Provide holdToken'); return; }
  try {
    await api('/v1/seating/release', 'POST', { holdToken: token, reason: 'admin' });
    document.getElementById('allocResult').innerText = 'Released';
    loadSeats(); loadHolds();
  } catch (err) {
    document.getElementById('allocResult').innerText = 'Error: ' + JSON.stringify(err);
  }
}

// admin helpers wired to table buttons
async function adminRelease(token) {
  if (!confirm('Release hold ' + token + '?')) return;
  try {
    await api(`/v1/seating/admin/release?holdToken=${encodeURIComponent(token)}`, 'POST');
    alert('Released');
    loadSeats(); loadHolds();
  } catch (err) {
    alert('Error: ' + JSON.stringify(err));
  }
}

function adminAllocatePrompt(token) {
  const orderId = prompt('Enter orderId for allocation:');
  if (!orderId) return;
  api(`/v1/seating/admin/allocate?holdToken=${encodeURIComponent(token)}&orderId=${encodeURIComponent(orderId)}`, 'POST')
    .then(()=> { alert('Allocated'); loadSeats(); loadHolds(); })
    .catch(e=> alert('Error: ' + JSON.stringify(e)));
}

// wire buttons
document.getElementById('btnLoadEvents').addEventListener('click', loadEvents);
document.getElementById('btnAddEvent').addEventListener('click', addEvent);
document.getElementById('btnLoadSeats').addEventListener('click', ()=>{ loadSeats(); loadHolds(); });
document.getElementById('btnLoadStats').addEventListener('click', loadStats);
document.getElementById('btnReserve').addEventListener('click', reserveSeats);
document.getElementById('btnAllocate').addEventListener('click', allocate);
document.getElementById('btnRelease').addEventListener('click', release);

// initial load
loadEvents();
