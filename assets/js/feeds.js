/* Renderers for the three platforms.
   Each returns a DOM node for one post and keeps a reference to its own
   engagement counters so the numbers can climb while it sits on screen. */

import { makeAvatar, richText, escapeHtml, fmtCount, avColour, initials, agoLabel, VERIFIED_SVG, clockLabel } from './util.js?v=28';
import { stream } from './rng.js?v=28';
import { buildThread, fireReply, setReplyHandler, countComments } from './thread.js?v=28';
export { setReplyHandler, pushComment, pushCommentReply, setThreadClock } from './thread.js?v=28';

const ICON = {
  reply: '<svg viewBox="0 0 24 24"><path d="M1.75 10c0-4.42 3.58-8 8-8h4.37c4.49 0 7.88 3.77 7.88 8.28 0 4.42-3.46 8.1-7.88 8.1h-2.35c-1.38 0-2.45 1-2.45 2.2v2.07c0 .38-.3.65-.68.65-.15 0-.28-.04-.4-.11l-4.76-2.96A9.01 9.01 0 0 1 1.75 10z"/></svg>',
  rt:    '<svg viewBox="0 0 24 24"><path d="M4.75 3.79l4.6 4.3-1.7 1.82L6 8.38v7.37c0 .97.78 1.75 1.75 1.75H13V19.5H7.75A3.75 3.75 0 0 1 4 15.75V8.38L2.85 9.91.15 8.09l4.6-4.3zm14.5 16.42l-4.6-4.3 1.7-1.82L17.5 15.62V8.25c0-.97-.78-1.75-1.75-1.75H11V4.5h4.75A3.75 3.75 0 0 1 19.5 8.25v7.37l1.15-1.53 2.7 1.82-4.6 4.3z"/></svg>',
  like:  '<svg viewBox="0 0 24 24"><path d="M16.7 5.5c-1.22-.06-2.68.51-3.89 2.16l-.81 1.09-.8-1.09C9.98 6.01 8.53 5.44 7.3 5.5c-1.24.07-2.35.78-2.91 1.91-.55 1.12-.63 2.78.48 4.82 1.07 1.97 3.26 4.27 7.13 6.61 3.87-2.34 6.05-4.64 7.13-6.61 1.11-2.04 1.03-3.7.48-4.82-.56-1.13-1.67-1.84-2.91-1.91z"/></svg>',
};

/* Shared engagement model. Organisational and media posts get more reach. */
function seedCounts(post){
  const p = post.persona;
  const big = p.type === 'org' || p.type === 'media' || p.type === 'official';
  const viral = p.type === 'rumour';
  // Per-post variation is seeded from the post id, so every device arrives at
  // the same numbers rather than each drifting on its own random walk.
  const wobble = stream('eng:' + (post.id || post.text.slice(0, 24))).range(0.72, 1.3);
  const baseLikes  = viral ? 180 : big ? 90 : 6;
  const baseShares = viral ? 240 : big ? 70 : 2;
  return {
    baseLikes, baseShares, wobble,
    likes:  baseLikes,
    shares: baseShares,
    rate:   viral ? 5.2 : big ? 2.6 : 0.5,   // growth per exercise minute
  };
}

function actionBar(post){
  const c = post.counts;
  const bar = document.createElement('div');
  bar.className = 'tw-acts';
  bar.innerHTML =
    `<button class="tw-act" data-c="replies">${ICON.reply}<span>${fmtCount(countComments(post))}</span></button>` +
    `<button class="tw-act" data-c="shares">${ICON.rt}<span>${fmtCount(c.shares)}</span></button>` +
    `<button class="tw-act" data-c="likes">${ICON.like}<span>${fmtCount(c.likes)}</span></button>`;
  bar.querySelector('[data-c="replies"]').addEventListener('click', () => fireReply(post));
  bar.querySelector('[data-c="likes"]').addEventListener('click', function(){
    this.classList.toggle('liked');
    post.counts.likes += this.classList.contains('liked') ? 1 : -1;
    refreshCounts(post);
  });
  bar.querySelector('[data-c="shares"]').addEventListener('click', function(){
    this.classList.toggle('rted');
    post.counts.shares += this.classList.contains('rted') ? 1 : -1;
    refreshCounts(post);
  });
  return bar;
}

export function refreshCounts(post){
  if (!post.el) return;
  const c = post.counts;
  post.el.querySelectorAll('.tw-act').forEach(b => {
    const k = b.dataset.c;
    const span = b.querySelector('span');
    if (!span) return;
    span.textContent = k === 'replies'
      ? fmtCount(countComments(post))
      : fmtCount(Math.max(0, Math.round(c[k])));
  });
  const st = post.el.querySelector('.fb-stats');
  if (st){
    st.querySelector('.fb-n').textContent = fmtCount(Math.max(0, Math.round(c.likes)));
    const n = countComments(post);
    st.querySelector('.fb-c').textContent = n + (n === 1 ? ' comment' : ' comments');
    st.querySelector('.fb-s').textContent = Math.max(0, Math.round(c.shares)) + ' shares';
  }
  const ig = post.el.querySelector('.ig-likes');
  if (ig) ig.textContent = fmtCount(Math.max(0, Math.round(c.likes))) + ' likes';
}

/* ── X ───────────────────────────────────────────────────────────── */
function buildX(post, nowMin){
  const p = post.persona;
  const el = document.createElement('div');
  el.className = 'tweet post';
  el.appendChild(makeAvatar(p));
  const r = document.createElement('div');
  r.className = 'tw-r';
  const badge = p.verified ? VERIFIED_SVG : '';
  r.innerHTML =
    `<div class="tw-hdr"><span class="tw-name">${escapeHtml(p.name)}</span>${badge}` +
    `<span class="tw-handle">${escapeHtml(p.handle)}</span>` +
    `<span class="tw-time">· <span class="ago">${agoLabel(post.min, nowMin)}</span></span></div>` +
    (post.replyTo ? `<div class="replying">Replying to <b>${escapeHtml(post.replyTo)}</b></div>` : '') +
    `<div class="tw-body">${richText(post.text)}</div>`;
  if (post.img){
    const img = document.createElement('img');
    img.className = 'tw-img'; img.src = post.img; img.alt = '';
    img.onerror = () => img.remove();
    r.appendChild(img);
  }
  r.appendChild(actionBar(post));
  r.appendChild(buildThread(post));
  el.appendChild(r);
  return el;
}

/* ── Facebook ────────────────────────────────────────────────────── */
function buildFb(post, nowMin){
  const p = post.persona;
  const c = post.counts;
  const el = document.createElement('div');
  el.className = 'fb-post post';
  const head = document.createElement('div');
  head.className = 'fb-ph';
  head.appendChild(makeAvatar(p));
  const meta = document.createElement('div');
  meta.innerHTML =
    `<div class="fb-name">${escapeHtml(p.name)}` +
    (p.type === 'org' ? ' <span class="fb-official">OFFICIAL</span>' : '') + `</div>` +
    `<div class="fb-meta"><span class="ago">${agoLabel(post.min, nowMin)}</span> · 🌐</div>`;
  head.appendChild(meta);
  el.appendChild(head);
  const body = document.createElement('div');
  body.className = 'fb-body';
  body.innerHTML = richText(post.text);
  el.appendChild(body);
  if (post.img){
    const img = document.createElement('img');
    img.className = 'fb-img'; img.src = post.img; img.alt = '';
    img.onerror = () => img.remove();
    el.appendChild(img);
  }
  const stats = document.createElement('div');
  stats.className = 'fb-stats';
  stats.innerHTML =
    `<div class="fb-react"><span class="fb-emo" style="background:#1877f2">👍</span>` +
    `<span class="fb-emo" style="background:#f33e58">❤️</span>` +
    `<span class="fb-emo" style="background:#f7b125">😢</span>` +
    `&nbsp;&nbsp;<span class="fb-n">${fmtCount(c.likes)}</span></div>` +
    `<div><span class="fb-c">${countComments(post)} ${countComments(post) === 1 ? 'comment' : 'comments'}</span>` +
    ` &nbsp; <span class="fb-s">${c.shares} shares</span></div>`;
  el.appendChild(stats);
  const acts = document.createElement('div');
  acts.className = 'fb-acts';
  acts.innerHTML = `<button class="fb-act">👍 Like</button><button class="fb-act">💬 Comment</button><button class="fb-act">↪ Share</button>`;
  acts.children[0].addEventListener('click', function(){
    this.classList.toggle('on');
    post.counts.likes += this.classList.contains('on') ? 1 : -1;
    refreshCounts(post);
  });
  acts.children[1].addEventListener('click', () => fireReply(post));
  el.appendChild(acts);
  el.appendChild(buildThread(post));
  return el;
}

/* ── Instagram ───────────────────────────────────────────────────── */
const IG_GRADS = [['#ff6b35','#f7c59f'],['#1d3557','#457b9d'],['#2d6a4f','#95d5b2'],
                  ['#7b2d8b','#c77dff'],['#b5179e','#f72585'],['#0077b6','#48cae4']];

function buildIg(post, nowMin){
  const p = post.persona;
  const el = document.createElement('div');
  el.className = 'ig-post post';
  const head = document.createElement('div');
  head.className = 'ig-ph';
  head.appendChild(makeAvatar(p));
  head.insertAdjacentHTML('beforeend',
    `<div><div class="ig-uname">${escapeHtml((p.handle||'').replace('@',''))}</div></div>`);
  el.appendChild(head);
  if (post.img){
    const img = document.createElement('img');
    img.className = 'ig-media'; img.src = post.img; img.alt = '';
    img.onerror = () => { const g = gradTile(post); img.replaceWith(g); };
    el.appendChild(img);
  } else {
    el.appendChild(gradTile(post));
  }
  el.insertAdjacentHTML('beforeend',
    `<div class="ig-acts"><span data-like>🤍</span><span>💬</span><span>➤</span></div>` +
    `<div class="ig-likes">${fmtCount(post.counts.likes)} likes</div>` +
    `<div class="ig-cap"><b>${escapeHtml((p.handle||'').replace('@',''))}</b> ${richText(post.text)}</div>` +
    `<div class="ig-cap" style="color:var(--ig-dim);font-size:11px;padding-top:0;"><span class="ago">${agoLabel(post.min, nowMin).toUpperCase()} AGO</span></div>`);
  el.appendChild(buildThread(post));
  el.querySelectorAll('.ig-acts span')[1].addEventListener('click', () => fireReply(post));
  const heart = el.querySelector('[data-like]');
  heart.addEventListener('click', () => {
    const on = heart.textContent === '🤍';
    heart.textContent = on ? '❤️' : '🤍';
    post.counts.likes += on ? 1 : -1;
    refreshCounts(post);
  });
  return el;
}

function gradTile(post){
  const g = IG_GRADS[Math.abs(post.text.length) % IG_GRADS.length];
  const d = document.createElement('div');
  d.className = 'ig-grad';
  d.style.background = `linear-gradient(135deg,${g[0]},${g[1]})`;
  d.textContent = post.text.length > 90 ? post.text.slice(0, 90) + '…' : post.text;
  return d;
}

/* ── Staff group chat ────────────────────────────────────────────── */
function buildStaff(post, nowMin){
  const p = post.persona;
  const own = p.type === 'org';
  const el = document.createElement('div');
  el.className = 'st-msg post' + (own ? ' own' : '');
  el.innerHTML =
    `<div class="st-from">${escapeHtml(own ? 'The Kirkwood — Communications' : p.name)}` +
    (own ? '' : `<span class="st-role">${escapeHtml(p.handle || '')}</span>`) + `</div>` +
    `<div class="st-body">${richText(post.text)}</div>` +
    `<div class="st-time"><span class="ago">${clockLabel(post.min)}</span>` +
    (own ? ' ✓✓' : '') + `</div>`;
  return el;
}

/* ── Enquiry inbox ───────────────────────────────────────────────── */
const VIA_CLASS = { 'Email': 'email', 'Phone message': 'phone', 'Reception': 'reception' };

function buildInbox(post, nowMin){
  const p = post.persona;
  const el = document.createElement('div');
  el.className = 'in-item post';
  const via = post.via || 'Enquiry';
  el.innerHTML =
    `<div class="in-top">` +
      `<span class="in-via ${VIA_CLASS[via] || ''}">${escapeHtml(via)}</span>` +
      `<span class="in-from">${escapeHtml(p.name)}</span>` +
      `<span class="in-when">${clockLabel(post.min)}</span>` +
    `</div>` +
    (post.subject ? `<div class="in-subj">${escapeHtml(post.subject)}</div>` : '') +
    `<div class="in-body">${escapeHtml(post.text)}</div>` +
    `<div class="in-actions">` +
      `<button class="in-reply">Reply</button>` +
      `<span class="in-flag">Awaiting response</span>` +
    `</div>`;
  el.querySelector('.in-reply').addEventListener('click', () => fireReply(post));
  const box = document.createElement('div');
  box.className = 'in-sent-wrap';
  el.appendChild(box);
  post.threadEl = box;
  post.renderSent = () => renderSent(post);
  renderSent(post);
  return el;
}

/* Responses show inline beneath the enquiry, and mark it as dealt with. */
function renderSent(post){
  const box = post.threadEl;
  if (!box) return;
  const sent = (post.thread || []).filter(c => c.persona && c.persona.type === 'org');
  box.innerHTML = sent.map(c =>
    `<div class="in-sent"><div class="in-sent-h">Sent ${clockLabel(c.min)}</div>` +
    `<div class="in-sent-b">${escapeHtml(c.text)}</div></div>`).join('');
  if (!post.el) return;
  post.el.classList.toggle('answered', sent.length > 0);
  const flag = post.el.querySelector('.in-flag');
  if (flag){
    flag.classList.toggle('done', sent.length > 0);
    flag.textContent = sent.length
      ? 'Responded' + (post.answeredIn != null ? ' after ' + Math.round(post.answeredIn) + ' min' : '')
      : 'Awaiting response';
  }
}

/* ── Entry point ─────────────────────────────────────────────────── */
export function renderPost(post, nowMin){
  // Staff messages and enquiries carry no public engagement figures.
  if (post.plat === 'staff'){ post.el = buildStaff(post, nowMin); return post.el; }
  if (post.plat === 'inbox'){ post.el = buildInbox(post, nowMin); renderSent(post); return post.el; }

  post.counts = post.counts || seedCounts(post);
  const el = post.plat === 'fb' ? buildFb(post, nowMin)
           : post.plat === 'ig' ? buildIg(post, nowMin)
           : buildX(post, nowMin);
  post.el = el;
  return el;
}

export { renderSent };
