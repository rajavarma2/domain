// ======= Lightweight single-file app logic =======
// Data model persisted to localStorage under key 'tt_state'
const STORAGE_KEY = 'tt_state_v1';
let state = load();
seedDefaults();

// UI refs
const el = id => document.getElementById(id);
const q = sel => document.querySelector(sel);

// Pages
const pages = ['dashboard','scheduler','viewer','faculty','approval','analytics'];
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  el(id).classList.remove('hidden');
  // refresh when showing
  if(id==='dashboard') renderLists();
  if(id==='scheduler') renderSchedulerUI();
  if(id==='viewer') renderViewerUI();
  if(id==='faculty') renderFacultyUI();
  if(id==='approval') renderVersions();
  if(id==='analytics') renderAnalytics();
  // highlight in sidebar
  document.querySelectorAll('#sidebar .nav').forEach(b=>b.classList.toggle('active', b.dataset.page===id));
}

// load/save
function load(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e){ return {}; } }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// seed sample users and empty arrays
function seedDefaults(){
  if(!state.users){ state.users = [
    {username:'admin',email:'admin@local',password:'admin',role:'Admin'},
    {username:'scheduler',email:'scheduler@local',password:'scheduler',role:'Scheduler'},
    {username:'faculty',email:'faculty@local',password:'faculty',role:'Faculty'},
    {username:'approver',email:'approver@local',password:'approver',role:'Approver'}
  ]; }
  state.faculties = state.faculties || [];
  state.rooms = state.rooms || [];
  state.subjects = state.subjects || [];
  state.batches = state.batches || [];
  state.departments = state.departments || [];
  state.versions = state.versions || [];
  state.timetableOptions = state.timetableOptions || []; // array of generated timetable objects
  state.attendance = state.attendance || {}; // { slotId: {present:[...], count: n}}
  save();
}

// ---------- AUTH ----------
function currentUser(){ return JSON.parse(sessionStorage.getItem('tt_user')||'null'); }
function setUser(u){ if(u) sessionStorage.setItem('tt_user', JSON.stringify(u)); else sessionStorage.removeItem('tt_user'); renderUserPanel(); }
function renderUserPanel(){
  const u = currentUser();
  el('userpanel').innerHTML = u ? `<span class="muted">Signed in:</span> <strong>${u.username}</strong> (${u.role})` : '';
  el('sidebar-user').textContent = u ? `${u.username} (${u.role})` : '';
  if(!u){ el('page-auth').classList.remove('hidden'); el('page-app').classList.add('hidden'); }
  else { el('page-auth').classList.add('hidden'); el('page-app').classList.remove('hidden'); showPage('dashboard'); }
}

// login handler
el('btn-login').addEventListener('click', ()=>{
  const username = el('login-username').value.trim();
  const password = el('login-password').value;
  const role = el('login-role').value;
  const found = state.users.find(u=> (u.username===username || u.email===username) && u.password===password && u.role===role);
  if(!found){ alert('Invalid credentials (use seeded accounts).'); return; }
  setUser(found);
});

// logout
el('btn-logout').addEventListener('click', ()=>{
  setUser(null);
  location.hash = '';
});

// sidebar nav
document.querySelectorAll('#sidebar .nav').forEach(b=>b.addEventListener('click', e=>{
  showPage(b.dataset.page || e.target.dataset.page);
}));

// ---------- DASHBOARD CRUD ----------
function renderLists(){
  // faculties
  const fw = el('faculty-list'); fw.innerHTML = '';
  state.faculties.forEach((f,i)=> fw.innerHTML += `<div class="item">${f.name} <small>${f.dept||''}</small><div><button onclick="delFaculty(${i})">Delete</button></div></div>`);
  // batches
  el('batch-list').innerHTML = ''; state.batches.forEach((b,i)=> el('batch-list').innerHTML += `<div class="item">${b.name} <small>size:${b.size}</small><div><button onclick="delBatch(${i})">Delete</button></div></div>`);
  // rooms
  el('room-list').innerHTML = ''; state.rooms.forEach((r,i)=> el('room-list').innerHTML += `<div class="item">${r.name} <small>${r.type}</small><div><button onclick="delRoom(${i})">Delete</button></div></div>`);
  // subjects
  el('subject-list').innerHTML = ''; state.subjects.forEach((s,i)=> el('subject-list').innerHTML += `<div class="item">${s.code} - ${s.title} <small>${s.dept||''}</small><div><button onclick="delSubject(${i})">Delete</button></div></div>`);
  // depts
  el('dept-list').innerHTML = ''; state.departments.forEach((d,i)=> el('dept-list').innerHTML += `<div class="item">${d} <div><button onclick="delDept(${i})">Delete</button></div></div>`);
  save();
}

document.getElementById('faculty-form').addEventListener('submit', e=>{
  e.preventDefault(); const fd = new FormData(e.target);
  state.faculties.push({ name: fd.get('fname'), dept: fd.get('fdept') }); e.target.reset(); renderLists();
});
function delFaculty(i){ if(confirm('Delete faculty?')) { state.faculties.splice(i,1); renderLists(); } }

document.getElementById('batch-form').addEventListener('submit', e=>{
  e.preventDefault(); const fd = new FormData(e.target);
  state.batches.push({ name: fd.get('bname'), size: +fd.get('bsize') }); e.target.reset(); renderLists();
});
function delBatch(i){ state.batches.splice(i,1); renderLists(); }

document.getElementById('room-form').addEventListener('submit', e=>{
  e.preventDefault(); const fd = new FormData(e.target);
  state.rooms.push({ name: fd.get('rname'), type: fd.get('rtype') }); e.target.reset(); renderLists();
});
function delRoom(i){ state.rooms.splice(i,1); renderLists(); }

document.getElementById('subject-form').addEventListener('submit', e=>{
  e.preventDefault(); const fd = new FormData(e.target);
  state.subjects.push({ code: fd.get('scode'), title: fd.get('stitle'), dept: fd.get('sdept') }); e.target.reset(); renderLists();
});
function delSubject(i){ state.subjects.splice(i,1); renderLists(); }

document.getElementById('dept-form').addEventListener('submit', e=>{
  e.preventDefault(); const fd = new FormData(e.target);
  state.departments.push(fd.get('dname')); e.target.reset(); renderLists();
});
function delDept(i){ state.departments.splice(i,1); renderLists(); }

// sample data and clear
el('btn-generate-sample').addEventListener('click', ()=>{
  state.departments = ['CSE','ECE','ME']; state.faculties = [{name:'Prof A',dept:'CSE'},{name:'Prof B',dept:'ECE'},{name:'Prof C',dept:'ME'}];
  state.rooms = [{name:'R101',type:'Classroom'},{name:'Lab1',type:'Lab'},{name:'R102',type:'Classroom'}];
  state.subjects = [{code:'MAT101',title:'Math',dept:'CSE'},{code:'PHY101',title:'Physics',dept:'ME'},{code:'CSE101',title:'Intro CS',dept:'CSE'}];
  state.batches = [{name:'1A',size:30,dept:'CSE'},{name:'1B',size:28,dept:'ECE'}];
  renderLists(); alert('Sample data generated.');
});
el('btn-clear-data').addEventListener('click', ()=>{ if(confirm('Clear all user data?')){ localStorage.removeItem(STORAGE_KEY); state = {}; seedDefaults(); renderLists(); alert('Cleared'); }});

// faculty csv upload
el('faculty-csv').addEventListener('change', e=>{
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader(); r.onload = ev=>{
    ev.target.result.split(/\r?\n/).filter(Boolean).forEach(line=>{
      const [name,email,dept] = line.split(',');
      state.faculties.push({ name: name?.trim(), email: email?.trim(), dept: dept?.trim() });
    }); renderLists(); alert('CSV uploaded'); };
  r.readAsText(file);
});

// ---------- SCHEDULER ----------
// helpers to create empty grid
function createEmptyTimetable(daysArr, startHour, endHour, roomsPerSlot){
  const grid = {}; daysArr.forEach(d=>{ grid[d]=[]; for(let h=startHour;h<endHour;h++) grid[d].push([]); });
  return { days: daysArr, start: startHour, end: endHour, roomsPerSlot, grid };
}

// preview empty grid
el('btn-preview-grid').addEventListener('click', ()=>{
  const days = +el('input-days').value;
  const daysArr = days===5 ? ['Mon','Tue','Wed','Thu','Fri'] : ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const tt = createEmptyTimetable(daysArr, +el('input-start').value, +el('input-end').value, +el('input-roomsPerSlot').value);
  state.timetablePreview = tt; save();
  alert('Empty grid preview created (use Viewer to inspect after generating an option).');
});

// run scheduler (very simple randomized generator with constraints, creates multiple options)
el('btn-run-scheduler').addEventListener('click', async ()=>{
  if(state.subjects.length===0 || state.batches.length===0 || state.rooms.length===0 || state.faculties.length===0){ alert('Add subjects/batches/rooms/faculties first'); return; }
  const daysCount = +el('input-days').value;
  const daysArr = daysCount===5 ? ['Mon','Tue','Wed','Thu','Fri'] : ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const start = +el('input-start').value, end = +el('input-end').value;
  const roomsPerSlot = +el('input-roomsPerSlot').value;
  const optionsN = +el('input-options').value || 1;
  // parse frequencies & constraints
  let freqs = {}; try { freqs = JSON.parse(el('input-freq').value || '{}'); } catch(e){ alert('Invalid frequencies JSON'); return; }
  let constraints = {}; try { constraints = JSON.parse(el('input-constraints').value || '{}'); } catch(e){ alert('Invalid constraints JSON'); return; }
  let deptmap = {}; try { deptmap = JSON.parse(el('input-deptmap').value || '{}'); } catch(e){ alert('Invalid deptmap JSON'); return; }

  showSchedulerProgress(true);
  state.timetableOptions = [];

  for(let opt=0; opt<optionsN; opt++){
    // simple randomized assignment: for each batch and its subjects assign occurrences across slots
    const tt = createEmptyTimetable(daysArr, start, end, roomsPerSlot);
    const allSlots = [];
    daysArr.forEach(d => { for(let h=start; h<end; h++) allSlots.push({day:d, hour:h}); });
    // prepare occurrences (subject repeats) per batch using freqs or default 3/week
    const occurrences = [];
    state.batches.forEach(batch=>{
      const batchDept = batch.dept || '';
      state.subjects.filter(s=>!s.dept || s.dept===batchDept || !s.dept).forEach(s=>{
        const occ = freqs[s.code] || 2; // default 2 per week
        occurrences.push({ batch: batch.name, subject: s.code, occurrences: occ, dept: s.dept || batchDept });
      });
    });
    // shuffle occurrences
    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
    shuffle(occurrences);
    // assign
    let slotIdx = 0;
    for(const item of occurrences){
      for(let k=0;k<item.occurrences;k++){
        // try to find a free slot not violating constraints
        let placed=false, attempts=0;
        while(!placed && attempts<allSlots.length*2){
          const si = (slotIdx + Math.floor(Math.random()*allSlots.length)) % allSlots.length;
          const s = allSlots[si];
          const cell = tt.grid[s.day][s.hour - start];
          if(cell.length < roomsPerSlot){
            // pick room & faculty naive
            const room = state.rooms[(si + k) % state.rooms.length];
            const faculty = state.faculties[(si + k + 1) % state.faculties.length];
            // check faculty constraint
            const slotKey = `${s.day}-${s.hour}`;
            const unavailable = (constraints[faculty.name] || []).includes(slotKey);
            if(!unavailable){
              cell.push({ batch: item.batch, subject: item.subject, room: room.name, faculty: faculty.name, hour: s.hour, slotId:`${s.day}-${s.hour}-${cell.length}` });
              placed=true;
            }
          }
          attempts++; slotIdx++;
        }
        if(!placed){
          // could not place; continue (note: later we'll produce suggestions)
        }
      }
    }
    // record option
    tt.generatedBy = currentUser()?.username || 'system';
    tt.createdAt = Date.now();
    state.timetableOptions.push(tt);
    save();
    // update progress
    el('progress-bar').value = Math.round(((opt+1)/optionsN)*100);
    await new Promise(r=>setTimeout(r,150)); // small pause to simulate work
  }

  showSchedulerProgress(false);
  el('options-area').classList.remove('hidden');
  renderOptionsList();
  alert('Generated ' + state.timetableOptions.length + ' timetable option(s). Choose one to preview.');
});

// progress UI
function showSchedulerProgress(show){
  if(show) el('scheduler-progress').classList.remove('hidden'); else el('scheduler-progress').classList.add('hidden');
}

// render options list
function renderOptionsList(){
  const list = el('options-list'); list.innerHTML='';
  state.timetableOptions.forEach((opt,i)=>{
    const d = new Date(opt.createdAt).toLocaleString();
    const html = `<div class="item">Option ${i+1} • created by ${opt.generatedBy} • ${d} <div>
      <button onclick="previewOption(${i})">Preview</button>
      <button onclick="useOption(${i})">Use</button>
    </div></div>`;
    list.innerHTML += html;
  });
  // populate select-option used in viewer
  const sel = el('select-option'); sel.innerHTML = '<option value="">--select--</option>';
  state.timetableOptions.forEach((_,i)=> sel.innerHTML += `<option value="${i}">Option ${i+1}</option>`);
}

// preview an option inline
function previewOption(i){
  const opt = state.timetableOptions[i];
  el('option-preview').innerHTML = `<div><strong>Preview - Option ${i+1}</strong></div>` + renderTimetableHTML(opt);
}

// set as current (selected) option (does not save as approved)
function useOption(i){
  state.selectedOptionIndex = i;
  save();
  alert('Selected option '+(i+1)+' as active preview. Open Viewer to inspect.');
  // update viewer selection
  if(!el('select-option')) return;
  el('select-option').value = i;
}

// ---------- VIEWER: render timetable grid and drag-drop ----------
function renderViewerUI(){
  // fill filters
  const fb = el('filter-batch'); const ff = el('filter-faculty'); const fr = el('filter-room');
  fb.innerHTML = '<option value="">All</option>'; state.batches.forEach(b=> fb.innerHTML += `<option value="${b.name}">${b.name}</option>`);
  ff.innerHTML = '<option value="">All</option>'; state.faculties.forEach(f=> ff.innerHTML += `<option value="${f.name}">${f.name}</option>`);
  fr.innerHTML = '<option value="">All</option>'; state.rooms.forEach(r=> fr.innerHTML += `<option value="${r.name}">${r.name}</option>`);
  // options select already populated by renderOptionsList()
  renderTimetable();
}

el('select-option').addEventListener('change', ()=> renderTimetable());
el('filter-batch').addEventListener('change', ()=> renderTimetable());
el('filter-faculty').addEventListener('change', ()=> renderTimetable());
el('filter-room').addEventListener('change', ()=> renderTimetable());

// create HTML for chosen timetable
function renderTimetable(){
  const idx = el('select-option').value;
  if(idx === '') { el('timetable-container').innerHTML = '<div class="muted">Select a generated option to preview timetable.</div>'; return; }
  const tt = state.timetableOptions[+idx];
  if(!tt) { el('timetable-container').innerHTML = '<div class="muted">No timetable found.</div>'; return; }
  el('timetable-container').innerHTML = renderTimetableHTML(tt, true);
  detectConflicts(tt);
}

// helper to produce HTML table from timetable object
function renderTimetableHTML(tt, enableDrag=false){
  const start = tt.start, end = tt.end;
  const hours = []; for(let h=start;h<end;h++) hours.push(h);
  let html = `<table class="tt-table"><thead><tr><th>Day / Time</th>${hours.map(h=>`<th>${h}:00 - ${h+1}:00</th>`).join('')}</tr></thead><tbody>`;
  tt.days.forEach(day=>{
    html += `<tr><th>${day}</th>`;
    for(let hi=0;hi<hours.length;hi++){
      const cell = tt.grid[day][hi] || [];
      // cell may have multiple parallel classes
      let cellHtml = '';
      cell.forEach((s, ci)=>{
        cellHtml += `<div class="slot ${s.roomType==='Lab'?'lab':''}" draggable="${enableDrag}" data-day="${day}" data-hour="${s.hour}" data-idx="${ci}" id="${s.slotId}">
          <strong>${s.subject}</strong><div class="muted">${s.batch} • ${s.room} • ${s.faculty}</div>
        </div>`;
      });
      if(cell.length===0) cellHtml = `<div class="muted">—</div>`;
      html += `<td>${cellHtml}</td>`;
    }
    html += '</tr>';
  });
  html += `</tbody></table>`;
  return html;
}

// drag/drop handlers (swap)
document.addEventListener('dragstart', e=>{
  if(!e.target.classList.contains('slot')) return;
  e.dataTransfer.setData('text/plain', JSON.stringify({id:e.target.id}));
});
document.addEventListener('dragover', e=>{ if(e.target.closest('td')) e.preventDefault(); });
document.addEventListener('drop', e=>{
  const td = e.target.closest('td');
  if(!td) return;
  const payload = JSON.parse(e.dataTransfer.getData('text/plain')||'{}');
  if(!payload.id) return;
  const srcEl = document.getElementById(payload.id);
  // determine source info
  const srcDay = srcEl.dataset.day, srcHour = +srcEl.dataset.hour, srcIdx = +srcEl.dataset.idx;
  // destination day/hour derive from cell position by inspecting column index
  // naive: find destination day and hour by locating parent row and column index
  const table = td.closest('table');
  const colIndex = Array.from(td.parentElement.children).indexOf(td);
  const headerRow = table.tHead.rows[0];
  const destHourStr = headerRow.cells[colIndex].textContent.split(':')[0];
  const destHour = +destHourStr;
  const row = td.parentElement;
  const destDay = row.firstElementChild.textContent;
  // swap elements in model (selected option)
  const selIdx = +el('select-option').value; const tt = state.timetableOptions[selIdx];
  if(!tt) return;
  // find source & dest arrays
  const srcArr = tt.grid[srcDay][srcHour - tt.start];
  const moving = srcArr.splice(srcIdx,1)[0];
  // push into dest (append)
  tt.grid[destDay][destHour - tt.start].push(moving);
  save();
  renderTimetable();
});

// detect conflicts and provide suggestions
function detectConflicts(tt){
  const conflicts = [];
  const selIdx = +el('select-option').value;
  tt = tt || state.timetableOptions[selIdx];
  if(!tt) return hideConflicts();
  tt.days.forEach(day=>{
    tt.grid[day].forEach((cell,hi)=>{
      const byFaculty = {}; const byRoom = {};
      cell.forEach(entry=>{
        byFaculty[entry.faculty] = byFaculty[entry.faculty]||[]; byFaculty[entry.faculty].push(entry);
        byRoom[entry.room] = byRoom[entry.room]||[]; byRoom[entry.room].push(entry);
      });
      Object.values(byFaculty).forEach(arr=>{ if(arr.length>1) conflicts.push({type:'Faculty',day,hour:tt.start+hi,entries:arr}); });
      Object.values(byRoom).forEach(arr=>{ if(arr.length>1) conflicts.push({type:'Room',day,hour:tt.start+hi,entries:arr}); });
    });
  });
  if(conflicts.length===0) return hideConflicts();
  // show
  el('conflict-list').innerHTML = ''; el('suggestions').innerHTML = '';
  conflicts.forEach((c,ci)=>{
    el('conflict-list').innerHTML += `<li>${c.type} conflict on ${c.day} ${c.hour}: ${c.entries.map(x=>x.faculty+'@'+x.room+'['+x.subject+']').join(' | ')}</li>`;
    // suggestion: attempt to find alternate slots for entries by scanning other empty slots
    const sugg = suggestAlternatives(tt,c.entries[0]);
    if(sugg.length) el('suggestions').innerHTML += `<div class="item">Suggestion: Move ${c.entries[0].subject} (${c.entries[0].batch}) to ${sugg[0].day} ${sugg[0].hour}</div>`;
  });
  el('conflicts').classList.remove('hidden');
}
function hideConflicts(){ el('conflicts').classList.add('hidden'); el('conflict-list').innerHTML=''; el('suggestions').innerHTML=''; }

// suggestion routine (naive): find first empty slot where faculty and room free
function suggestAlternatives(tt, entry){
  const suggestions = [];
  for(const day of tt.days){
    for(let hi=0; hi<tt.grid[day].length; hi++){
      const cell = tt.grid[day][hi];
      // skip same slot
      if(day===entry.day && (tt.start+hi)===entry.hour) continue;
      // check if faculty present in that cell
      const facultyBusy = cell.some(c=>c.faculty===entry.faculty);
      if(!facultyBusy && cell.length < tt.roomsPerSlot) suggestions.push({day,hour: tt.start+hi});
      if(suggestions.length>=3) return suggestions;
    }
  }
  return suggestions;
}

// save manual modifications as new version
el('btn-save-manual').addEventListener('click', ()=>{
  const sel = el('select-option').value; if(sel===''){ alert('Select option first'); return; }
  const ver = { id:'V'+Date.now(), ts:Date.now(), user:currentUser()?.username||'manual', comment:'Manual edit', timetable: JSON.parse(JSON.stringify(state.timetableOptions[+sel])) };
  state.versions.push(ver); save(); alert('Manual changes saved as version.');
  renderVersions();
});
el('btn-reset-latest').addEventListener('click', ()=>{
  const sel = el('select-option').value; if(sel===''){ alert('Select option'); return; }
  // reload selected option as-is
  renderTimetable();
});

// export CSV
el('btn-export-csv').addEventListener('click', ()=>{
  const sel = el('select-option').value; if(sel===''){ alert('Select option'); return; }
  const tt = state.timetableOptions[+sel];
  const rows = ['Day,Hour,Subject,Batch,Room,Faculty'];
  tt.days.forEach(day=>{
    tt.grid[day].forEach((cell,hi)=>{
      cell.forEach(c=> rows.push([day,tt.start+hi,c.subject,c.batch,c.room,c.faculty].map(x=>"\""+String(x).replace(/"/g,'""')+"\"").join(',')));
    });
  });
  const blob = new Blob([rows.join('\n')], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'timetable.csv'; a.click(); URL.revokeObjectURL(url);
});

// print
el('btn-print').addEventListener('click', ()=> window.print());

// ---------- FACULTY PORTAL & ATTENDANCE ----------
function renderFacultyUI(){
  const u = currentUser(); if(!u) return;
  el('faculty-name').textContent = u.username;
  // show timetable entries assigned to faculty across selected option(s)
  const rows = [];
  state.timetableOptions.forEach((tt, oi)=>{
    tt.days.forEach(day=>{
      tt.grid[day].forEach((cell,hi)=>{
        cell.forEach(entry=>{
          if(entry.faculty===u.username) rows.push({ option: oi, day, hour: entry.hour, subject: entry.subject, batch: entry.batch, room: entry.room, slotId: entry.slotId });
        });
      });
    });
  });
  if(rows.length===0) el('faculty-timetable').innerHTML = '<div class="muted">No allocations yet.</div>';
  else{
    let html = '<table class="tt-table"><thead><tr><th>Option</th><th>Day</th><th>Hour</th><th>Subject</th><th>Batch</th><th>Room</th><th>Attendance</th></tr></thead><tbody>';
    rows.forEach(r=> html += `<tr><td>${r.option+1}</td><td>${r.day}</td><td>${r.hour}:00</td><td>${r.subject}</td><td>${r.batch}</td><td>${r.room}</td>
      <td><button onclick='takeAttendance("${r.slotId}","${r.subject}","${r.batch}")'>Mark</button></td></tr>`);
    html += '</tbody></table>';
    el('faculty-timetable').innerHTML = html;
  }
  // attendance records summary
  renderAttendanceReport();
}

// take attendance (store counts and example list)
function takeAttendance(slotId, subject, batch){
  const key = slotId;
  state.attendance[key] = state.attendance[key] || { subject, batch, times:[], count:0 };
  const now = Date.now();
  state.attendance[key].times.push({ ts: now, by: currentUser()?.username || 'faculty' });
  state.attendance[key].count += 1;
  save();
  alert(`Attendance recorded for ${subject} (${batch}). Count total: ${state.attendance[key].count}`);
  renderAttendanceReport();
}

function renderAttendanceReport(){
  const out = el('attendance-report');
  out.innerHTML = '';
  const keys = Object.keys(state.attendance);
  if(keys.length===0){ out.innerHTML = '<div class="muted">No attendance yet.</div>'; return; }
  keys.forEach(k=>{
    const a = state.attendance[k];
    out.innerHTML += `<div class="item">${a.subject} - ${a.batch} • records: ${a.times.length} • total marks: ${a.count}</div>`;
  });
}

// ---------- VERSIONS & APPROVAL ----------
function renderVersions(){
  const wl = el('version-list'); wl.innerHTML = '';
  if(state.versions.length===0) wl.innerHTML = '<div class="muted">No versions yet.</div>';
  state.versions.slice().reverse().forEach(v=>{
    const d = new Date(v.ts).toLocaleString();
    wl.innerHTML += `<div class="item">${v.id} • ${v.user} • ${d} <div>
      <button onclick='viewVersion("${v.id}")'>View</button>
      <button onclick='useVersion("${v.id}")'>Load</button>
    </div></div>`;
  });
}
function viewVersion(id){
  const v = state.versions.find(x=>x.id===id); if(!v) return;
  el('approval-panel').classList.remove('hidden'); el('approval-title').textContent = `${v.id} by ${v.user} at ${new Date(v.ts).toLocaleString()}`;
  el('approval-preview').innerHTML = renderTimetableHTML(v.timetable);
  el('btn-approve').dataset.id = id; el('btn-reject').dataset.id = id;
}
function useVersion(id){
  const v = state.versions.find(x=>x.id===id); if(!v) return;
  // load v into timetableOptions as new selected option
  state.timetableOptions.push(JSON.parse(JSON.stringify(v.timetable)));
  save(); renderOptionsList(); alert('Version loaded as new option.');
}
el('btn-approve').addEventListener('click', ()=>{
  const id = el('btn-approve').dataset.id; const v = state.versions.find(x=>x.id===id); if(!v) return;
  v.approved = true; v.approvedBy = currentUser()?.username; v.approvalTs = Date.now(); v.comment = el('approval-comment').value;
  save(); alert('Approved'); renderVersions();
});
el('btn-reject').addEventListener('click', ()=>{
  const id = el('btn-reject').dataset.id; const v = state.versions.find(x=>x.id===id); if(!v) return;
  v.approved = false; v.rejectedBy = currentUser()?.username; v.rejectionTs = Date.now(); v.comment = el('approval-comment').value;
  save(); alert('Rejected'); renderVersions();
});

// ---------- ANALYTICS ----------
function renderAnalytics(){
  const roomWrap = el('analytics-room'); const facWrap = el('analytics-faculty');
  roomWrap.innerHTML = ''; facWrap.innerHTML = '';
  if(state.timetableOptions.length===0){ roomWrap.innerHTML = '<div class="muted">No timetable</div>'; facWrap.innerHTML = '<div class="muted">No timetable</div>'; return; }
  const tt = state.timetableOptions[ state.selectedOptionIndex || 0 ];
  const usage = {}, facultyLoad = {};
  tt.days.forEach(day=>{
    tt.grid[day].forEach(cell=>{
      cell.forEach(entry=>{
        usage[entry.room] = (usage[entry.room]||0)+1;
        facultyLoad[entry.faculty] = (facultyLoad[entry.faculty]||0)+1;
      });
    });
  });
  Object.entries(usage).forEach(([r,v])=> roomWrap.innerHTML += `<div class="item">${r}: ${v}</div>`);
  Object.entries(facultyLoad).forEach(([f,v])=> facWrap.innerHTML += `<div class="item">${f}: ${v}</div>`);
}

// initial render
renderUserPanel();
renderLists();
renderOptionsList();
