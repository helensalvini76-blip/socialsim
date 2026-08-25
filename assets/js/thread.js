/* Comment threads.

   Every post carries a thread underneath it that the comms team can open and
   reply into. This matters more than it sounds: in a real incident the damage
   is rarely in the post itself, it is forty comments deep where the
   organisation is being talked about rather than talked to. */

import { makeAvatar, richText, escapeHtml, agoLabel } from './util.js?v=4';

/* One shared reply target handler, used by posts and by individual comments. */
let replyHandler = () => {};
export function setReplyHandler(fn){ replyHandler = fn; }
export function fireReply(target){ replyHandler(target); }

const VISIBLE = 2;          // comments shown before "view all"

/* Threads need the exercise clock to age their timestamps; without it every
   comment reads "now" forever, which is the first thing that looks fake. */
let nowFn = () => 0;
export function setThreadClock(fn){ nowFn = fn; }

export function buildThread(post){
  const wrap = document.createElement('div');
  wrap.className = 'thread th-' + post.plat;
  post.threadEl = wrap;
  post.thread = post.thread || [];
  renderThread(post);
  return wrap;
}

export function renderThread(post){
  const wrap = post.threadEl;
  if (!wrap) return;
  const items = post.thread || [];
  wrap.innerHTML = '';
  if (!items.length) return;

  const expanded = post.threadExpanded || items.length <= VISIBLE;
  const shown = expanded ? items : items.slice(-VISIBLE);

  if (!expanded){
    const more = document.createElement('div');
    more.className = 'cmore';
    more.textContent = post.plat === 'x'
      ? `Show ${items.length - VISIBLE} more replies`
      : `View all ${items.length} comments`;
    more.addEventListener('click', () => { post.threadExpanded = true; renderThread(post); });
    wrap.appendChild(more);
  }

  shown.forEach(c => wrap.appendChild(commentRow(post, c)));
}

function commentRow(post, c){
  const row = document.createElement('div');
  row.className = 'cmt' + (c.own ? ' cmt-own' : '') + (c.isNew ? ' newflash' : '');
  c.isNew = false;
  row.appendChild(makeAvatar(c.persona));

  const right = document.createElement('div');
  right.className = 'cmt-r';
  const badge = c.persona.type === 'org' ? '<span class="fb-official">OFFICIAL</span>' : '';
  right.innerHTML =
    `<div class="cmt-bub"><b>${escapeHtml(c.persona.name)} ${badge}</b>` +
    `<span class="cmt-txt">${richText(c.text)}</span></div>` +
    `<div class="cmt-meta"><span>${agoLabel(c.min, Math.max(nowFn(), c.min))}</span>` +
    `<button class="cmt-act">Like</button><button class="cmt-act cmt-reply">Reply</button>` +
    `<span class="cmt-likes"></span></div>`;

  const likes = c.likes == null ? Math.floor(Math.random() * 14) : c.likes;
  if (likes > 0) right.querySelector('.cmt-likes').textContent = '👍 ' + likes;

  right.querySelector('.cmt-reply').addEventListener('click', () => {
    // Give the comment enough of a post's shape for the composer to handle it.
    c.plat = post.plat;
    c.isComment = true;
    c.parentPost = post;
    fireReply(c);
  });
  right.querySelector('.cmt-act').addEventListener('click', function(){
    this.classList.toggle('on');
    c.likes = (c.likes == null ? likes : c.likes) + (this.classList.contains('on') ? 1 : -1);
    right.querySelector('.cmt-likes').textContent = c.likes > 0 ? '👍 ' + c.likes : '';
  });

  row.appendChild(right);

  // Nested replies to this comment
  const kids = document.createElement('div');
  kids.className = 'cmt-kids';
  c.repliesEl = kids;
  (c.replies || []).forEach(k => kids.appendChild(commentRow(post, k)));
  right.appendChild(kids);

  return row;
}

/* Add a new top-level comment to a post. */
export function pushComment(post, persona, text, opts = {}){
  post.thread = post.thread || [];
  post.thread.push({ persona, text, min: opts.min ?? 0, nowMin: opts.min ?? 0, own: !!opts.own, isNew: true, replies: [] });
  post.threadExpanded = true;         // once it is live, keep it open
  renderThread(post);
  if (post.counts){
    post.counts.replies += 1;
    post.refresh && post.refresh();
  }
}

/* Add a reply underneath one specific comment. */
export function pushCommentReply(comment, persona, text, opts = {}){
  comment.replies = comment.replies || [];
  const kid = { persona, text, min: opts.min ?? 0, nowMin: opts.min ?? 0, own: !!opts.own, isNew: true, replies: [] };
  comment.replies.push(kid);
  const post = comment.parentPost;
  if (post){
    post.threadExpanded = true;
    renderThread(post);
    if (post.counts){
      post.counts.replies += 1;
      post.refresh && post.refresh();
    }
  }
}
