/* Exercise Jupiter — facilitator dashboard.

   Runs the same Engine and the same transport as the participant view, but
   with a headless feed: it needs the data, not the rendered social media.

   Everything here answers one of the four things that made the old control bar
   painful to drive — no scrolling to find a control, the clock and the next
   inject always visible, an inject one click away, and the comms team's own
   activity on screen while doing something else. */

import { Engine } from './engine.js?v=14';
import { connect } from './sync.js?v=14';
import { PHASES } from './scenario-jupiter.js?v=14';
import { PERSONAS, persona } from './personas.js?v=14';
import { QUICKFIRE, GROUPS } from './quickfire.js?v=14';
import { clockLabel } from './util.js?v=14';

const params  = new URLSearchParams(location.search);
const SESSION = params.get('session') || 'jupiter';
const OFFLINE = params.get('offline') === '1';

const $ = id => document.getElementById(id);

/* ── Headless feed ───────────────────────────────────────────────── */
const posts = [];
let onChange = () => {};

const feed = {
  add(post){ posts.push(post); onChange(post); },
  comment(post, who, text, min, id){
    post.thread = post.thread || [];
    if (id && post.thread.some(c => c.id === id)) return;
    post.thread.push({ id, persona: who, text, min, replies: [] });
    onChange(post, { comment: true, who, text, min });
  },
  commentReply(comment, who, text, min, id){
    comment.replies = comment.replies || [];
    if (id && comment.replies.some(c => c.id === id)) return;
    comment.replies.push({ id, persona: who, text, min, replies: [] });
    onChange(comment.parentPost, { comment: true, who, text, min });
  },
  all(){ return posts; },
  clear(){ posts.length = 0; },
};

const engine = new Engine(feed, { seed: 'jupiter-' + SESSION });
engine.seedBaseline();
let transport = null;

/* ── Clock and phase ─────────────────────────────────────────────── */
function paintClock(){
  const m = engine.nowMin;
  $('tplus').textContent = 'T+' + String(Math.max(0, Math.floor(m))).padStart(3, '0');
  $('wall').textContent = clockLabel(m);
  const ph = engine.phase();
  $('phase').textContent = ph.id;
  $('phasename').textContent = ph.name;
}

function publishClock(){
  if (!transport || !transport.setClock) return;
  transport.setClock({ anchorMin: engine.nowMin, speed: engine.speed, running: engine.running });
}

/* ── Timeline ────────────────────────────────────────────────────── */
let timelineBuilt = false;

function buildTimeline(){
  const box = $('timeline');
  box.innerHTML = '';
  engine.queue.forEach(item => {
    const row = document.createElement('div');
    row.className = 'tl';
    row.dataset.id = item.id;
    const tags =
      (item.packRef ? `<span class="tl-tag tag-pack">PACK ${item.packRef}</span>` : '') +
      (item.enquiry ? `<span class="tl-tag tag-enq">ENQUIRY</span>` : '');
    row.innerHTML =
      `<div class="tl-t">T+${Math.round(item.min)}</div>` +
      `<div class="tl-b">` +
        `<div class="tl-who">${esc(item.persona.name)}${tags}</div>` +
        `<div class="tl-txt">${esc(item.text.slice(0, 150))}${item.text.length > 150 ? '…' : ''}</div>` +
        (item.note ? `<div class="tl-note">${esc(item.note)}</div>` : '') +
      `</div>` +
      `<button class="tl-fire" title="Fire this now">now</button>`;
    row.querySelector('.tl-fire').addEventListener('click', () => fireNow(item));
    box.appendChild(row);
  });
  $('tl-count').textContent = engine.queue.length;
  timelineBuilt = true;
}

function paintTimeline(){
  if (!timelineBuilt) return;
  const next = engine.nextInject();
  const box = $('timeline');
  engine.queue.forEach(item => {
    const row = box.querySelector(`[data-id="${item.id}"]`);
    if (!row) return;
    row.classList.toggle('done', !!item.fired);
    const isNext = next && next.item.id === item.id;
    row.classList.toggle('next', isNext);
    const t = row.querySelector('.tl-t');
    t.textContent = isNext
      ? 'in ' + Math.max(0, next.in).toFixed(1) + 'm'
      : 'T+' + Math.round(item.min);
  });
  if (next && !scrolledAway(box)){
    const el = box.querySelector('.tl.next');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

/* Do not yank the view around if the facilitator is reading further down. */
let lastScroll = 0, userScrolled = false;
function scrolledAway(box){
  if (box.scrollTop !== lastScroll){ userScrolled = true; lastScroll = box.scrollTop; }
  return userScrolled;
}
$('timeline').addEventListener('scroll', () => { userScrolled = true; lastScroll = $('timeline').scrollTop; });
$('timeline').addEventListener('dblclick', () => { userScrolled = false; });

/* Pull a scripted inject forward to now. */
function fireNow(item){
  if (item.fired) return;
  item.fireAt = engine.nowMin;
  toast('Fired: ' + item.persona.name);
}

/* ── Monitor ─────────────────────────────────────────────────────── */
const seenLog = new Set();

function paintMonitor(){
  const box = $('monitor');
  const rows = engine.log.filter(l => l.kind === 'comms' || l.kind === 'comms-reply');
  $('mon-count').textContent = rows.length;
  if (!rows.length) return;

  rows.forEach((l, i) => {
    const key = l.kind + i + l.min;
    if (seenLog.has(key)) return;
    seenLog.add(key);
    const empty = box.querySelector('.mon-empty');
    if (empty) empty.remove();

    const div = document.createElement('div');
    div.className = 'mon fresh';
    const wait = l.waitedMin != null
      ? `<div class="mon-wait">waited <b class="${l.waitedMin <= 10 ? 'ok' : 'slow'}">${l.waitedMin}m</b> before replying</div>`
      : '';
    div.innerHTML =
      `<div class="mon-h">` +
        `<span class="mon-org">The Kirkwood</span>` +
        `<span class="mon-kind ${l.kind === 'comms' ? 'k-post' : 'k-reply'}">${l.kind === 'comms' ? 'POST' : 'REPLY'}</span>` +
        `<span class="mon-plat">${(l.plat || '').toUpperCase()}</span>` +
        `<span class="mon-t">T+${Math.round(l.min)} · ${clockLabel(l.min)}</span>` +
      `</div>` +
      (l.inReplyTo ? `<div class="mon-ctx">in reply to <b>${esc(l.inReplyTo)}</b></div>` : '') +
      `<div class="mon-txt">${esc(l.text)}</div>` + wait;
    box.insertBefore(div, box.firstChild);
  });
}

/* ── Indicators and enquiries ────────────────────────────────────── */
function paintStatus(){
  const first = engine.timeToFirstStatement();
  const fEl = $('i-first');
  if (first == null){
    const late = engine.nowMin > 30;
    fEl.textContent = late ? 'none · T+' + Math.floor(engine.nowMin) : '—';
    fEl.className = late ? 'bad' : 'idle';
  } else {
    fEl.textContent = 'T+' + Math.round(first);
    fEl.className = first <= 30 ? 'ok' : 'warn';
  }

  const posted  = engine.log.filter(l => l.kind === 'comms').length;
  const replied = engine.log.filter(l => l.kind === 'comms-reply').length;
  $('i-posts').textContent = posted;
  $('i-posts').className = posted ? 'ok' : 'idle';
  $('i-replies').textContent = replied;
  $('i-replies').className = replied ? 'ok' : 'idle';

  const answered = engine.answeredEnquiries();
  $('i-answered').textContent = answered.length;
  $('i-answered').className = answered.length ? 'ok' : 'idle';

  const open = engine.unansweredEnquiries();
  $('enq-count').textContent = open.length;
  $('enq-count').classList.toggle('alert', open.length > 3);
  $('enquiries').innerHTML = open.length
    ? open.map(e => {
        const age = Math.max(0, Math.round(engine.nowMin - e.min));
        return `<div class="enq">
          <div class="enq-h"><span class="enq-t">T+${e.min}</span><span class="enq-w">${esc(e.who)}</span></div>
          <div class="enq-x">${esc(e.text.slice(0, 130))}${e.text.length > 130 ? '…' : ''}</div>
          <div class="enq-age">unanswered for ${age} minutes</div>
        </div>`;
      }).join('')
    : '<div class="mon-empty" style="padding:16px">Nothing outstanding.</div>';
}

/* ── Quick-fire ──────────────────────────────────────────────────── */
let group = GROUPS[0];

function buildQuickfire(){
  $('qf-groups').innerHTML = GROUPS
    .map(g => `<button class="qf-g${g === group ? ' on' : ''}" data-g="${g}">${g}</button>`).join('');
  $('qf-groups').querySelectorAll('.qf-g').forEach(b => {
    b.addEventListener('click', () => { group = b.dataset.g; buildQuickfire(); });
  });

  $('qf-list').innerHTML = '';
  QUICKFIRE.filter(q => q.group === group).forEach(q => {
    const b = document.createElement('button');
    b.className = 'qf';
    b.innerHTML =
      `<div class="qf-l">${esc(q.label)}</div>` +
      `<div class="qf-w">${esc(persona(q.who).name)} · ${q.plat.toUpperCase()}</div>` +
      `<div class="qf-x">${esc(q.text)}</div>`;
    b.addEventListener('click', () => sendInject(q.who, q.plat, q.text, q.label));
    $('qf-list').appendChild(b);
  });
}

function sendInject(who, plat, text, label){
  if (!transport){ toast('Not connected'); return; }
  transport.publishPost({ kind: 'post', plat, text, who, min: engine.nowMin });
  engine.log.push({ min: engine.nowMin, kind: 'manual', who: persona(who).name, plat, text });
  toast('Sent: ' + (label || persona(who).name));
}

/* ── Custom inject ───────────────────────────────────────────────── */
function buildCustom(){
  const sel = $('c-who');
  sel.innerHTML = Object.keys(PERSONAS)
    .filter(k => k !== 'kirkwood')
    .map(k => `<option value="${k}">${esc(PERSONAS[k].name)}</option>`).join('');
  $('c-text').addEventListener('input', () => { $('send').disabled = !$('c-text').value.trim(); });
  $('send').addEventListener('click', () => {
    const text = $('c-text').value.trim();
    if (!text) return;
    sendInject($('c-who').value, $('c-plat').value, text);
    $('c-text').value = '';
    $('send').disabled = true;
  });
}

/* ── Debrief export ──────────────────────────────────────────────── */
function exportDebrief(){
  const L = [];
  const first = engine.timeToFirstStatement();
  L.push('EXERCISE JUPITER — MediaSim debrief export');
  L.push('The Kirkwood, Dalton site — 10 September 2026');
  L.push('Exported at T+' + Math.round(engine.nowMin) + ' (' + clockLabel(engine.nowMin) + ')');
  L.push('');
  L.push('PERFORMANCE INDICATORS');
  L.push('  First authoritative holding message: ' +
    (first == null ? 'NOT ISSUED' : 'T+' + Math.round(first) + '  (' + clockLabel(first) + ')  — target within 30 minutes: ' + (first <= 30 ? 'MET' : 'NOT MET')));
  L.push('  Posts issued by the comms team:      ' + engine.log.filter(l => l.kind === 'comms').length);
  L.push('  Replies sent:                        ' + engine.log.filter(l => l.kind === 'comms-reply').length);
  L.push('  Direct enquiries answered:           ' + engine.answeredEnquiries().length);
  L.push('  Direct enquiries never answered:     ' + engine.unansweredEnquiries().length);
  L.push('');

  L.push('WHAT THE COMMS TEAM SAID');
  const comms = engine.log.filter(l => l.kind === 'comms' || l.kind === 'comms-reply');
  if (!comms.length) L.push('  (nothing issued)');
  comms.forEach(l => {
    L.push('  T+' + String(Math.round(l.min)).padStart(3) + ' ' + clockLabel(l.min) + '  [' + (l.plat || '').toUpperCase() + '] ' +
      (l.kind === 'comms-reply' ? 'REPLY to ' + l.inReplyTo + (l.waitedMin != null ? ' (waited ' + l.waitedMin + 'm)' : '') : 'POST'));
    L.push('        ' + l.text);
  });
  L.push('');

  L.push('ENQUIRIES ANSWERED');
  const ans = engine.answeredEnquiries();
  if (!ans.length) L.push('  (none)');
  ans.forEach(e => L.push('  T+' + String(e.min).padStart(3) + '  ' + e.who + ' — answered after ' + e.waitedMin + ' minutes'));
  L.push('');

  L.push('ENQUIRIES NEVER ANSWERED');
  const open = engine.unansweredEnquiries();
  if (!open.length) L.push('  (none — every direct enquiry received a response)');
  open.forEach(e => {
    L.push('  T+' + String(e.min).padStart(3) + '  ' + e.who + (e.packRef ? '  [PACK ' + e.packRef + ']' : ''));
    L.push('        ' + e.text);
  });
  L.push('');

  L.push('FULL INJECT LOG');
  engine.log.forEach(l => {
    L.push('  T+' + String(Math.round(l.min)).padStart(3) + '  ' + l.kind.toUpperCase().padEnd(12) + ' ' +
      l.who + (l.packRef ? '  [PACK ' + l.packRef + ']' : ''));
    L.push('        ' + (l.text || '').slice(0, 200));
  });

  const blob = new Blob([L.join('\r\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Exercise Jupiter - MediaSim debrief.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Debrief exported');
}

/* ── Top bar wiring ──────────────────────────────────────────────── */
function wireTop(){
  $('play').addEventListener('click', () => {
    if (engine.running){ engine.pause(); $('play').textContent = '▶'; }
    else { engine.start(); $('play').textContent = '❚❚'; }
    publishClock();
  });
  document.querySelectorAll('[data-speed]').forEach(b => {
    b.addEventListener('click', () => {
      engine.setSpeed(Number(b.dataset.speed));
      document.querySelectorAll('[data-speed]').forEach(o => o.classList.toggle('on', o === b));
      publishClock();
    });
  });
  $('jump').addEventListener('change', e => {
    if (e.target.value === '') return;
    engine.seek(Number(e.target.value));
    publishClock();
    e.target.value = '';
    userScrolled = false;
  });
  $('wm').addEventListener('click', function(){
    this.classList.toggle('on');
    toast(this.classList.contains('on')
      ? 'Watermark on — participants must refresh'
      : 'Watermark off — participants must refresh');
  });
  $('export').addEventListener('click', exportDebrief);
  $('reset').addEventListener('click', async () => {
    if (!confirm('Reset the exercise for everyone?\n\nThis clears every post and reply, for all devices.')) return;
    if (transport && transport.clearAll) await transport.clearAll();
    engine.reset();
    seenLog.clear();
    $('monitor').innerHTML = '<div class="mon-empty">Reset. Waiting for the comms team.</div>';
    buildTimeline();
    publishClock();
    toast('Exercise reset');
  });
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
let toastTimer;
function toast(msg){
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
}

/* ── Boot ────────────────────────────────────────────────────────── */
const BUILD = document.querySelector('meta[name="build"]') ? document.querySelector('meta[name="build"]').content : '?';
$('buildtag').textContent = 'build ' + BUILD + ' · ' + SESSION;

buildTimeline();
buildQuickfire();
buildCustom();
wireTop();
paintClock();
paintStatus();

connect(SESSION, { offline: OFFLINE }).then(t => {
  transport = t;
  engine.attach(t);
  window.__dash = { engine, transport };

  t.on('connection', up => {
    $('dot').classList.toggle('off', !up);
    $('conn').textContent = up ? 'live · facilitator' : 'reconnecting…';
  });
  if (t.mode === 'local'){
    $('dot').classList.add('off');
    $('conn').textContent = OFFLINE ? 'offline preview' : 'local only — not syncing';
  } else {
    $('conn').textContent = 'live · facilitator';
  }

  engine.start();
  publishClock();
  setInterval(publishClock, 15000);       // keep late joiners in step
});

onChange = () => { paintMonitor(); paintStatus(); };
setInterval(() => { paintClock(); paintTimeline(); paintStatus(); }, 500);
setInterval(paintMonitor, 1000);
