/* Exercise Jupiter — participant app.

   Stage 1: runs standalone in the browser so the feed can be judged for realism
   on a real phone. Multi-device sync, the facilitator dashboard and the enquiry
   channels come next and will replace the local clock with the shared one. */

import { renderPost, refreshCounts, addFbComment, setReplyHandler } from './feeds.js';
import { Engine } from './engine.js';
import { PHASES, FIRE_LOCATION, TRENDING_BEFORE, TRENDING_AFTER, SUGGESTED } from './scenario-jupiter.js';
import { ORG, persona } from './personas.js';
import { makeAvatar, escapeHtml, richText, clockLabel, fmtCount, VERIFIED_SVG } from './util.js';

const PLATFORMS = ['x', 'fb', 'ig'];
const screen  = document.getElementById('screen');
const navEl   = document.getElementById('nav');
const sheet   = document.getElementById('sheet');
const shText  = document.getElementById('sh-text');
const shPost  = document.getElementById('sh-post');
const rail    = document.getElementById('rail');

let current = 'fb';           // Facebook first — the hospice's real audience lives there
const posts = [];
const panes = {};

/* ── Panes ───────────────────────────────────────────────────────── */
function buildPanes(){
  panes.x = el('div', 'pane', `
    <div class="x-head">
      <div class="x-head-top"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24H16.2l-5.21-6.82-5.96 6.82H1.72l7.73-8.84L1.3 2.25h6.98l4.71 6.23 5.25-6.23z"/></svg></div>
      <div class="x-tabs"><div class="x-tab on">For you</div><div class="x-tab">Following</div></div>
    </div><div class="stream"></div>`);
  panes.fb = el('div', 'pane fb-wrap', `
    <div class="fb-head">
      <div class="fb-brand">facebook</div>
      <div class="fb-search">🔍 Search Facebook</div>
    </div><div class="stream"></div>`);
  panes.ig = el('div', 'pane', `
    <div class="ig-head"><div class="ig-brand">Instagram</div><div style="font-size:19px">♡ ✈</div></div>
    <div class="ig-stories"></div><div class="stream"></div>`);
  const boot = document.getElementById('boot');
  if (boot) boot.remove();
  PLATFORMS.forEach(p => { panes[p].style.display = 'none'; screen.appendChild(panes[p]); });
}

function el(tag, cls, html){
  const n = document.createElement(tag);
  n.className = cls;
  if (html) n.innerHTML = html;
  return n;
}

function stream(p){ return panes[p].querySelector('.stream'); }

/* ── Feed API handed to the engine ───────────────────────────────── */
const feed = {
  add(post, opts = {}){
    posts.push(post);
    const node = renderPost(post, engine ? engine.nowMin : 0);
    post.refresh = () => refreshCounts(post);
    if (!opts.silent) node.classList.add('newflash');
    const s = stream(post.plat);
    s.insertBefore(node, s.firstChild);
    if (post.plat !== current && !opts.silent) markUnread(post.plat);
    if (opts.own) setTimeout(() => screen.scrollTo({ top: 0, behavior: 'smooth' }), 60);
  },
  comment(post, persona, text){
    if (post.plat === 'fb'){ addFbComment(post, persona, text); return; }
    if (post.plat === 'ig' && post.el){
      const row = el('div', 'ig-cap newflash',
        `<b>${escapeHtml((persona.handle || '').replace('@',''))}</b> ${richText(text)}`);
      const caps = post.el.querySelectorAll('.ig-cap');
      post.el.insertBefore(row, caps[caps.length - 1]);
      post.counts.replies += 1;
      refreshCounts(post);
    }
  },
  all(){ return posts; },
  clear(){ posts.length = 0; PLATFORMS.forEach(p => stream(p).innerHTML = ''); },
};

/* ── Navigation ──────────────────────────────────────────────────── */
const NAV = [
  { id:'fb', icon:'📘', label:'Facebook' },
  { id:'x',  icon:'✖',  label:'X' },
  { id:'ig', icon:'📷', label:'Instagram' },
];

function buildNav(){
  // Desktop-only heading; hidden by CSS on phones.
  const brand = el('div', '', 'Exercise Jupiter');
  brand.id = 'nav-brand';
  navEl.appendChild(brand);

  NAV.forEach(n => {
    const b = el('button', 'nb', `<span class="nb-ic">${n.icon}</span><span class="nb-lb">${n.label}</span><span class="nb-dot"></span>`);
    b.dataset.p = n.id;
    b.addEventListener('click', () => show(n.id));
    navEl.appendChild(b);
  });

  const postBtn = el('button', '', 'Post');
  postBtn.id = 'nav-post';
  postBtn.addEventListener('click', () => openSheet(null));
  navEl.appendChild(postBtn);
}

/* ── Right rail (desktop) ────────────────────────────────────────── */
const RAIL_TITLE = { x:'Trending in Huddersfield', fb:'Trending now', ig:'Suggested for you' };

function buildRail(){
  const searchLabel = { x:'Search', fb:'Search Facebook', ig:'Search' }[current] || 'Search';
  rail.innerHTML = `<div class="r-search">🔍 ${searchLabel}</div>`;

  const trendCard = el('div', 'r-card', `<h3>${RAIL_TITLE[current]}</h3><div class="t-rows"></div>`);
  rail.appendChild(trendCard);

  const accts = el('div', 'r-card', `<h3>Who to follow</h3>`);
  SUGGESTED.forEach(k => {
    const p = persona(k);
    const row = el('div', 'r-acct', '');
    row.appendChild(makeAvatar(p));
    row.insertAdjacentHTML('beforeend',
      `<div><div class="r-acct-n">${escapeHtml(p.name)}${p.verified ? VERIFIED_SVG : ''}</div>` +
      `<div class="r-acct-h">${escapeHtml(p.handle)}</div></div>` +
      `<button class="r-follow">Follow</button>`);
    accts.appendChild(row);
  });
  rail.appendChild(accts);

  rail.insertAdjacentHTML('beforeend',
    `<div class="r-note">⚠ Exercise Jupiter — simulated environment. All accounts, posts ` +
    `and news outlets shown here are fictional and exist only for this exercise.</div>`);

  refreshTrending();
}

/* Trending flips from ordinary town chatter to the incident, and climbs. */
function refreshTrending(){
  const rows = rail.querySelector('.t-rows');
  if (!rows || !engine) return;
  const live = engine.nowMin >= 12;
  const list = live ? TRENDING_AFTER : TRENDING_BEFORE;
  const since = Math.max(0, engine.nowMin - 12);
  rows.innerHTML = list.map((t, i) => {
    const n = Math.round(t.count + (t.rate || 0) * since);
    return `<div class="r-row"><div class="r-meta">${i + 1} · ${t.meta}</div>` +
           `<div class="r-tag">${escapeHtml(t.tag)}</div>` +
           `<div class="r-count">${fmtCount(n)} posts</div></div>`;
  }).join('');
}

function markUnread(p){
  const b = navEl.querySelector(`[data-p="${p}"]`);
  if (b) b.classList.add('has');
}

function show(p){
  current = p;
  PLATFORMS.forEach(q => panes[q].style.display = q === p ? '' : 'none');
  navEl.querySelectorAll('.nb').forEach(b => {
    b.classList.toggle('on', b.dataset.p === p);
    if (b.dataset.p === p) b.classList.remove('has');
  });
  screen.scrollTop = 0;
  if (engine) buildRail();
}

/* ── Composer ────────────────────────────────────────────────────── */
let replyTarget = null;

function openSheet(target){
  replyTarget = target || null;
  const ctx = document.getElementById('sh-ctx');
  const plat = replyTarget ? replyTarget.plat : current;
  document.getElementById('sh-plat').textContent = NAV.find(n => n.id === plat).label;
  if (replyTarget){
    const body = replyTarget.text.length > 180 ? replyTarget.text.slice(0, 180) + '…' : replyTarget.text;
    ctx.innerHTML =
      `<div class="sh-reply-to">Replying to <b>${escapeHtml(replyTarget.persona.name)}</b> ` +
      `<span>${escapeHtml(replyTarget.persona.handle || '')}</span></div>` +
      `<div class="sh-quote">${escapeHtml(body)}</div>`;
    ctx.style.display = 'block';
    shText.placeholder = 'Write a reply…';
    shPost.textContent = 'Reply';
  } else {
    ctx.innerHTML = '';
    ctx.style.display = 'none';
    shText.placeholder = 'Write an update…';
    shPost.textContent = 'Post';
  }
  sheet.classList.add('open');
  shText.value = '';
  shPost.disabled = true;
  shText.focus();
}

function initComposer(){
  document.getElementById('fab').addEventListener('click', () => openSheet(null));
  document.getElementById('sh-cancel').addEventListener('click', () => {
    sheet.classList.remove('open');
    replyTarget = null;
  });
  shText.addEventListener('input', () => { shPost.disabled = !shText.value.trim(); });
  shPost.addEventListener('click', () => {
    const v = shText.value.trim();
    if (!v) return;
    sheet.classList.remove('open');
    if (replyTarget) engine.participantReply(replyTarget, v);
    else engine.participantPost(current, v);
    replyTarget = null;
  });
  // Reply buttons on every post route back here.
  setReplyHandler(post => openSheet(post));
}

/* ── Facilitator preview bar ─────────────────────────────────────── */
function initPreview(){
  const bar = document.getElementById('prev');
  const params = new URLSearchParams(location.search);
  if (params.get('facilitator') !== '1' && params.get('f') !== '1') return;
  bar.classList.add('on');

  const clk  = bar.querySelector('.clk');
  const ph   = bar.querySelector('.ph');
  const nxt  = bar.querySelector('.nxt');
  const play = bar.querySelector('[data-play]');

  bar.querySelectorAll('[data-speed]').forEach(b => {
    b.addEventListener('click', () => {
      engine.setSpeed(Number(b.dataset.speed));
      bar.querySelectorAll('[data-speed]').forEach(o => o.classList.toggle('on', o === b));
    });
  });
  play.addEventListener('click', () => {
    if (engine.running){ engine.pause(); play.textContent = '▶'; }
    else { engine.start(); play.textContent = '❚❚'; }
  });
  bar.querySelector('[data-jump]').addEventListener('change', e => {
    const v = Number(e.target.value);
    engine.seek(v);
  });
  bar.querySelector('[data-wm]').addEventListener('click', function(){
    document.body.classList.toggle('wm');
    this.classList.toggle('on', document.body.classList.contains('wm'));
  });
  bar.querySelector('[data-reset]').addEventListener('click', () => engine.reset());

  engine.onTick = (min, phase) => {
    clk.textContent = 'T+' + String(Math.max(0, Math.floor(min))).padStart(3,'0') + '  ' + clockLabel(min);
    ph.textContent = phase ? phase.name : '';
    const n = engine.nextInject();
    nxt.textContent = n ? `next in ${Math.max(0, n.in).toFixed(1)}m` : 'script complete';
  };
  engine.onCommsPost = (post, isFirst) => {
    if (isFirst){
      const t = engine.timeToFirstStatement();
      const ok = t <= 30;
      bar.querySelector('.ind').innerHTML =
        `<span style="color:${ok ? '#5ee6a8' : '#ff8b8b'}">first statement T+${t.toFixed(0)} ${ok ? '✓ within 30' : '✗ over 30'}</span>`;
    }
  };
}

/* ── Boot ────────────────────────────────────────────────────────── */
let engine;
buildPanes();
buildNav();
initComposer();
engine = new Engine(feed);
engine.seedBaseline();
show('fb');
buildRail();
setInterval(refreshTrending, 3000);
initPreview();
engine.start();
window.__jupiter = engine;   // facilitator/debug handle; stage-2 dashboard hooks this

// Populate Instagram stories from whoever is in the feed.
setTimeout(() => {
  const box = panes.ig.querySelector('.ig-stories');
  const seen = new Set();
  posts.slice(0, 9).forEach(p => {
    if (seen.has(p.persona.name)) return;
    seen.add(p.persona.name);
    const s = el('div', 'ig-story', '');
    const ring = el('div', 'ig-ring', '');
    ring.appendChild(makeAvatar(p.persona));
    s.appendChild(ring);
    s.appendChild(el('div', 'ig-sname', escapeHtml((p.persona.handle || '').replace('@',''))));
    box.appendChild(s);
  });
}, 300);

// Handset clock shows exercise time, not real time.
const sbTime = document.getElementById('sb-time');
setInterval(() => { sbTime.textContent = clockLabel(engine.nowMin); }, 1000);

console.info('Exercise Jupiter — fire location token:', FIRE_LOCATION);
