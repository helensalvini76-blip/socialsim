/* Exercise Jupiter — ICC wall display.

   Read-only. It follows the facilitator's clock and never publishes one, so it
   can be left on a projector all afternoon without ever fighting the dashboard.

   The point of it is the one number the command team cannot argue with: how
   long it has been since the organisation said anything in public, while the
   feed beside it keeps moving. */

import { Engine } from './engine.js?v=27';
import { connect } from './sync.js?v=27';
import { TRENDING_BEFORE, TRENDING_AFTER } from './scenario-jupiter.js?v=27';
import { clockLabel, fmtCount } from './util.js?v=27';

const params  = new URLSearchParams(location.search);
const SESSION = params.get('session') || 'jupiter';
const OFFLINE = params.get('offline') === '1';

const $ = id => document.getElementById(id);

/* Headless feed — the wall needs the data, not the social media chrome. */
const posts = [];
const feed = {
  add(post){ posts.push(post); },
  comment(post, who, text, min, id){
    post.thread = post.thread || [];
    if (id && post.thread.some(c => c.id === id)) return;
    post.thread.push({ id, persona: who, text, min, replies: [] });
  },
  commentReply(comment, who, text, min, id){
    comment.replies = comment.replies || [];
    if (id && comment.replies.some(c => c.id === id)) return;
    comment.replies.push({ id, persona: who, text, min, replies: [] });
  },
  all(){ return posts; },
  clear(){ posts.length = 0; },
  refreshInbox(){},
};

const engine = new Engine(feed, { seed: 'jupiter-' + SESSION });
engine.seedBaseline();
let transport = null;
let started = false;

/* ── Which posts belong on a wall ────────────────────────────────── */
const PUBLIC = ['x', 'fb', 'ig'];

function visible(){
  return posts
    .filter(p => PUBLIC.includes(p.plat) && p.min >= 0 && p.min <= engine.nowMin)
    .sort((a, b) => b.min - a.min);
}

const TAG = {
  media:    ['MEDIA', 't-media'],
  rumour:   ['UNVERIFIED', 't-rumour'],
  family:   ['FAMILY', 't-family'],
  org:      ['US', 't-org'],
  official: ['PARTNER', 't-media'],
  public:   ['PUBLIC', 't-public'],
  staff:    ['STAFF', 't-public'],
};

/* ── Feed ────────────────────────────────────────────────────────── */
let shownIds = new Set();

function paintFeed(){
  const list = visible().slice(0, 6);
  const box = $('feed');
  const ids = list.map(p => p.id).join('|');
  if (ids === paintFeed._last) return;
  paintFeed._last = ids;

  box.innerHTML = '';
  list.forEach(p => {
    const [label, cls] = TAG[p.persona.type] || TAG.public;
    const div = document.createElement('div');
    div.className = 'card';
    if (shownIds.has(p.id)) div.style.animation = 'none';
    shownIds.add(p.id);
    div.innerHTML =
      `<div class="card-h">` +
        `<span class="who">${esc(p.persona.name)}</span>` +
        `<span class="tagp ${cls}">${label}</span>` +
        `<span class="when">${clockLabel(p.min)}</span>` +
      `</div><div class="body">${esc(p.text)}</div>`;
    box.appendChild(div);
  });

  $('vol').textContent = visible().length + ' posts';
}

/* ── The number that matters ─────────────────────────────────────── */
function lastStatement(){
  const ours = posts.filter(p => p.persona.type === 'org' && p.participant && p.min <= engine.nowMin);
  const replies = [];
  posts.forEach(p => (p.thread || []).forEach(c => {
    if (c.persona && c.persona.type === 'org') replies.push({ min: c.min, text: c.text });
  }));
  const all = ours.map(p => ({ min: p.min, text: p.text })).concat(replies);
  all.sort((a, b) => b.min - a.min);
  return { latest: all[0] || null, count: all.length };
}

function paintPressure(){
  const { latest, count } = lastStatement();
  const box = $('since');

  if (!latest){
    const waited = Math.max(0, Math.floor(engine.nowMin));
    $('since-n').textContent = started ? waited : '—';
    $('since-u').textContent = started ? 'minutes with no public statement' : 'no statement issued yet';
    box.classList.toggle('warn', started && waited > 15 && waited <= 30);
    box.classList.toggle('bad', started && waited > 30);
    $('latest').className = 'latest none';
    $('latest').textContent = 'Nothing has been issued.';
    $('latest-when').textContent = '';
  } else {
    const gap = Math.max(0, Math.floor(engine.nowMin - latest.min));
    $('since-n').textContent = gap;
    $('since-u').textContent = 'minutes since we last spoke';
    box.classList.toggle('warn', gap > 20 && gap <= 40);
    box.classList.toggle('bad', gap > 40);
    $('latest').className = 'latest';
    $('latest').textContent = latest.text.length > 220 ? latest.text.slice(0, 220) + '…' : latest.text;
    $('latest-when').textContent = 'Issued ' + clockLabel(latest.min) + '  ·  T+' + Math.round(latest.min);
  }

  const open = engine.unansweredEnquiries().length;
  $('s-enq').textContent = open;
  $('s-enq').className = open > 3 ? 'bad' : open ? 'idle' : 'ok';
  $('s-posts').textContent = visible().length;
  $('s-posts').className = 'idle';
  $('s-said').textContent = count;
  $('s-said').className = count ? 'ok' : 'bad';
}

/* ── Trending ────────────────────────────────────────────────────── */
function paintTrending(){
  const live = engine.nowMin >= 12;
  const list = live ? TRENDING_AFTER : TRENDING_BEFORE;
  const since = Math.max(0, engine.nowMin - 12);
  $('trending').innerHTML = list.map(t => {
    const n = Math.round(t.count + (t.rate || 0) * since);
    return `<div class="trend"><span class="tag">${esc(t.tag)}</span>` +
           `<span class="n">${fmtCount(n)}</span></div>`;
  }).join('');
}

/* ── Ticker: media and rumour headlines ──────────────────────────── */
function paintTicker(){
  const heads = visible()
    .filter(p => p.persona.type === 'media' || p.persona.type === 'rumour')
    .slice(0, 8)
    .map(p => `<span><b>${esc(p.persona.name)}</b> · ${esc(p.text.slice(0, 150))}</span>`);
  const html = heads.length ? heads.join('') : '<span>No media coverage yet.</span>';
  if (html === paintTicker._last) return;         // restarting the animation looks broken
  paintTicker._last = html;
  $('track').innerHTML = html + html;
}

/* ── Clock ───────────────────────────────────────────────────────── */
function paintClock(){
  $('tplus').textContent = 'T+' + String(Math.max(0, Math.floor(engine.nowMin))).padStart(3, '0');
  $('wall-time').textContent = clockLabel(engine.nowMin);
  $('phase').textContent = engine.phase().name;
  $('holding').classList.toggle('hide', started);
}

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ── Follow the facilitator ──────────────────────────────────────── */
let lastGen = null;

function applyClock(v){
  if (!v || typeof v.anchorMin !== 'number') return;

  if (v.gen != null && lastGen != null && v.gen !== lastGen){
    engine.reset();
    engine.pause();
    shownIds = new Set();
    paintFeed._last = null;
    paintTicker._last = null;
    started = false;
  }
  if (v.gen != null) lastGen = v.gen;

  const serverNow = transport.serverNow ? transport.serverNow() : Date.now();
  const STALE_MS = 3 * 60 * 1000;
  if (v.running && (serverNow - (v.at || 0)) > STALE_MS) return;   // finished run, not a live one

  const elapsed = v.running ? Math.max(0, (serverNow - (v.at || serverNow)) / 60000) * (v.speed || 1) : 0;
  const target = v.anchorMin + elapsed;
  engine.speed = v.speed || 1;
  if (Math.abs(target - engine.nowMin) > 0.35 || v.running !== engine.running) engine.seek(target);
  if (v.running && !engine.running) engine.start();
  if (!v.running && engine.running) engine.pause();
  started = v.running || v.anchorMin > 0;
}

/* ── Boot ────────────────────────────────────────────────────────── */
const BUILD = document.querySelector('meta[name="build"]') ? document.querySelector('meta[name="build"]').content : '?';
console.info('Exercise Jupiter wall display — build', BUILD, '— session', SESSION);

connect(SESSION, { offline: OFFLINE }).then(t => {
  transport = t;
  engine.attach(t);
  t.on('clock', applyClock);
  t.on('settings', () => {});
  window.__wall = { engine, transport };
});

setInterval(() => { paintClock(); paintFeed(); paintPressure(); paintTrending(); }, 700);
setInterval(paintTicker, 4000);
