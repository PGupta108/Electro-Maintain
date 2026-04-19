import { get, post, patch, del } from '../utils/api.js';
import { toast } from '../components/toast.js';
import { showModal, closeModal } from '../components/modal.js';

const CAT_ICONS  = { Computer:'💻', Mobile:'📱', Appliance:'🏠', Network:'📡', Vehicle:'🚗', 'TV/Display':'📺', Audio:'🔊', Other:'🔧' };
const CAT_COLORS = { Computer:'rgba(0,229,255,.12)', Mobile:'rgba(167,139,250,.12)', Appliance:'rgba(255,107,53,.12)', Network:'rgba(34,197,94,.12)', Vehicle:'rgba(245,158,11,.12)', 'TV/Display':'rgba(96,165,250,.12)', Audio:'rgba(244,114,182,.12)', Other:'rgba(100,116,139,.12)' };

export async function renderDevices(container) {
  container.innerHTML = `<div style="display:flex;justify-content:center;padding:3rem"><span class="spinner" style="width:28px;height:28px;border-width:3px"></span></div>`;
  try {
    const { devices } = await get('/devices');
    buildDeviceUI(container, devices);
  } catch (err) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">⚠</div><p class="empty-text">${err.message}</p></div>`;
  }
}

function buildDeviceUI(container, devices) {
  container.innerHTML = `
    <div class="anim-fadeup">
      <div class="section-header mb-2">
        <div>
          <h2>My Devices <span class="section-title-tag">(${devices.length})</span></h2>
          <p style="color:var(--muted);font-size:.82rem;margin-top:2px">Add a device — maintenance reminders are created <strong style="color:var(--accent)">automatically</strong></p>
        </div>
        <button class="btn btn-primary" id="add-device-btn">+ Add Device</button>
      </div>

      <!-- Smart Reminder Info Banner -->
      <div style="background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.18);border-radius:12px;padding:.85rem 1.1rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:.75rem">
        <span style="font-size:1.2rem">🤖</span>
        <div>
          <span style="font-size:.85rem;font-weight:700;color:var(--accent)">Smart Auto-Reminder System Active</span>
          <p style="font-size:.75rem;color:var(--muted);margin-top:2px">When you add a device, the system automatically generates a full maintenance schedule based on the device type, age, condition, and usage. No manual reminder creation needed!</p>
        </div>
      </div>

      ${devices.length === 0 ? `
        <div class="empty"><div class="empty-icon">📱</div><p class="empty-text">No devices yet. Add your first device to get a smart maintenance schedule!</p></div>`
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:1rem">
          ${devices.map(d => deviceCard(d)).join('')}
        </div>`}
    </div>`;

  document.getElementById('add-device-btn').addEventListener('click', () => openDeviceModal(container, null));

  // Edit buttons
  container.querySelectorAll('.device-edit-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const { device } = await get(`/devices/${btn.dataset.id}`);
        openDeviceModal(container, device);
      } catch(err) { toast(err.message, 'error'); }
    });
  });

  // Delete buttons
  container.querySelectorAll('.device-del-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Delete this device? Its reminders will also be removed.')) return;
      try {
        await del(`/devices/${btn.dataset.id}`);
        toast('Device deleted', 'success');
        renderDevices(container);
      } catch (err) { toast(err.message, 'error'); }
    });
  });
}

function deviceCard(d) {
  const catLabel = d.displayCategory || d.category;
  const warrantyDaysLeft = d.warrantyExpiry ? Math.ceil((new Date(d.warrantyExpiry) - new Date()) / 86400000) : null;
  const warrantyBadge = warrantyDaysLeft === null ? ''
    : warrantyDaysLeft > 0
      ? `<span class="badge badge-ok">Warranty: ${warrantyDaysLeft}d</span>`
      : `<span class="badge badge-overdue">Expired</span>`;

  return `
    <div class="device-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between">
        <div class="device-icon" style="background:${CAT_COLORS[d.category]||'rgba(100,116,139,.12)'}">
          ${CAT_ICONS[d.category]||'🔧'}
        </div>
        <div style="display:flex;gap:.3rem">
          <button class="btn btn-ghost btn-icon device-edit-btn" data-id="${d._id}" title="Edit Device" style="color:var(--muted);font-size:.8rem">✎</button>
          <button class="btn btn-ghost btn-icon device-del-btn" data-id="${d._id}" title="Delete" style="color:var(--muted)">✕</button>
        </div>
      </div>
      <div class="device-name">${d.name}</div>
      <div class="device-sub">${d.brand} ${d.model}</div>
      <div class="device-meta">
        <span class="badge badge-ok">${catLabel}</span>
        ${warrantyBadge}
        ${d.overdueReminders > 0 ? `<span class="badge badge-overdue">${d.overdueReminders} overdue</span>` : ''}
        ${d.pendingReminders > 0 ? `<span class="badge badge-warning">${d.pendingReminders} pending</span>` : ''}
        ${d.smartRemindersGenerated ? `<span class="badge badge-ml">🤖 Auto</span>` : ''}
      </div>
      <div style="margin-top:.85rem;padding-top:.85rem;border-top:1px solid var(--border)">
        <div style="display:flex;gap:1.5rem;flex-wrap:wrap">
          ${d.purchaseDate ? `<div><div style="font-family:var(--fm);font-size:.65rem;color:var(--muted);margin-bottom:2px">PURCHASED</div><div style="font-size:.8rem">${formatDate(d.purchaseDate)}</div></div>` : ''}
          <div><div style="font-family:var(--fm);font-size:.65rem;color:var(--muted);margin-bottom:2px">AGE</div><div style="font-size:.8rem">${d.ageMonths||0}mo</div></div>
          <div><div style="font-family:var(--fm);font-size:.65rem;color:var(--muted);margin-bottom:2px">CONDITION</div><div style="font-size:.8rem">${d.condition||'Good'}</div></div>
          <div><div style="font-family:var(--fm);font-size:.65rem;color:var(--muted);margin-bottom:2px">USAGE</div><div style="font-size:.8rem">${d.usageHours||0}h/day</div></div>
        </div>
      </div>
      ${d.serialNumber ? `<div style="margin-top:.5rem;font-family:var(--fm);font-size:.68rem;color:var(--muted)">S/N: ${d.serialNumber}</div>` : ''}
    </div>`;
}

// UPGRADE 4: Combined Add + Edit modal (isEdit = true when editing)
function openDeviceModal(container, existingDevice) {
  const isEdit = !!existingDevice;
  const d = existingDevice || {};
  const title = isEdit ? '✎ Edit Device' : '➕ Add New Device';
  const btnLabel = isEdit ? 'Save Changes' : 'Add & Generate Schedule';

  const overlay = showModal(`
    <div class="modal-title">${title}</div>
    <div style="display:flex;flex-direction:column;gap:.85rem">

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Device Name *</label>
          <input class="form-input" id="d-name" value="${d.name||''}" placeholder="e.g. My Laptop" />
        </div>
        <div class="form-group">
          <label class="form-label">Brand *</label>
          <input class="form-input" id="d-brand" value="${d.brand||''}" placeholder="e.g. Dell, Apple" />
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Model *</label>
          <input class="form-input" id="d-model" value="${d.model||''}" placeholder="e.g. XPS 15" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" id="d-cat">
            ${Object.keys(CAT_ICONS).map(c => `<option value="${c}" ${d.category===c?'selected':''}>${CAT_ICONS[c]} ${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- UPGRADE 2: Custom Category field — shown/hidden based on "Other" selection -->
      <div class="form-group" id="custom-cat-wrap" style="display:${d.category==='Other'?'flex':'none'};flex-direction:column;gap:5px">
        <label class="form-label">Custom Category Name</label>
        <input class="form-input" id="d-custom-cat" value="${d.customCategory||''}" placeholder="e.g. Camera, Printer, Generator..." />
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Serial Number</label>
          <input class="form-input" id="d-serial" value="${d.serialNumber||''}" placeholder="Optional" />
        </div>
        <div class="form-group">
          <label class="form-label">Condition</label>
          <select class="form-select" id="d-condition">
            ${['Excellent','Good','Fair','Poor'].map(c => `<option ${d.condition===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Purchase Date</label>
          <input class="form-input" id="d-purchase" type="date" value="${d.purchaseDate?d.purchaseDate.split('T')[0]:''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Warranty (months)</label>
          <input class="form-input" id="d-warranty" type="number" value="${d.warrantyPeriod||12}" min="0" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Daily Usage Hours</label>
        <input class="form-input" id="d-usage" type="number" value="${d.usageHours||4}" min="0" max="24" step="0.5" />
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="d-notes" placeholder="Any additional notes...">${d.notes||''}</textarea>
      </div>

      ${!isEdit ? `
      <div style="background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.18);border-radius:8px;padding:.75rem;font-size:.78rem;color:var(--accent)">
        🤖 <strong>Smart Schedule:</strong> After saving, the system will automatically create a full maintenance reminder schedule for this device based on its type, age, condition and usage.
      </div>` : ''}

      <div id="d-error" style="color:var(--red);font-size:.8rem;display:none"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="d-cancel">Cancel</button>
      <button class="btn btn-primary" id="d-save">${btnLabel}</button>
    </div>
  `);

  // UPGRADE 2: Toggle custom category input on select change
  overlay.querySelector('#d-cat').addEventListener('change', (e) => {
    overlay.querySelector('#custom-cat-wrap').style.display = e.target.value === 'Other' ? 'flex' : 'none';
  });

  overlay.querySelector('#d-cancel').addEventListener('click', () => closeModal(overlay));

  overlay.querySelector('#d-save').addEventListener('click', async () => {
    const btn = overlay.querySelector('#d-save');
    const errEl = overlay.querySelector('#d-error');
    errEl.style.display = 'none';
    btn.innerHTML = isEdit ? '<span class="spinner"></span> Saving...' : '<span class="spinner"></span> Adding + Generating...';
    btn.disabled = true;

    const payload = {
      name:           overlay.querySelector('#d-name').value,
      brand:          overlay.querySelector('#d-brand').value,
      model:          overlay.querySelector('#d-model').value,
      category:       overlay.querySelector('#d-cat').value,
      customCategory: overlay.querySelector('#d-custom-cat').value,
      serialNumber:   overlay.querySelector('#d-serial').value,
      condition:      overlay.querySelector('#d-condition').value,
      purchaseDate:   overlay.querySelector('#d-purchase').value || undefined,
      warrantyPeriod: parseInt(overlay.querySelector('#d-warranty').value) || 12,
      usageHours:     parseFloat(overlay.querySelector('#d-usage').value) || 4,
      notes:          overlay.querySelector('#d-notes').value
    };

    try {
      if (isEdit) {
        await patch(`/devices/${d._id}`, payload);
        toast('✅ Device updated!', 'success');
      } else {
        const result = await post('/devices', payload);
        toast(`✅ Device added! ${result.autoRemindersGenerated} reminders auto-created 🤖`, 'success');
      }
      closeModal(overlay);
      renderDevices(container);
    } catch (err) {
      errEl.textContent = err.message; errEl.style.display = 'block';
      btn.innerHTML = btnLabel; btn.disabled = false;
    }
  });
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
