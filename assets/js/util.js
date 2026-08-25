/* Small shared helpers. */

const AVC = ['#1d9bf0','#00ba7c','#f4212e','#e8a33d','#7856ff','#ff6b35','#17bf63','#e0245e','#1877f2','#e1306c'];

export function avColour(s){
  let h = 0;
  for (const c of s || 'U') h = (h * 31 + c.charCodeAt(0)) % AVC.length;
  return AVC[h];
}

export function initials(n){
  return (n || 'U').trim().split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
}

export function fmtCount(n){
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0','') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace('.0','') + 'K';
  return String(n);
}

export function rnd(a, b){ return Math.floor(Math.random() * (b - a + 1)) + a; }

export function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

/* Pick n distinct items from an array (or as many as exist). */
export function sample(arr, n){
  const copy = arr.slice();
  const out = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  return out;
}

export function escapeHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Escape first, then colour hashtags and handles. */
export function richText(s){
  return escapeHtml(s).replace(/(#[\w]+)/g, '<span class="h">$1</span>')
                      .replace(/(@[\w]+)/g, '<span class="h">$1</span>');
}

/* Exercise minute -> wall-clock label. T+0 is 13:00 on the day. */
export function clockLabel(min, startHour = 13, startMin = 0){
  const total = startHour * 60 + startMin + Math.round(min);
  const h = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const m = ((total % 60) + 60) % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

/* Relative age label, the way the real apps show it. */
export function agoLabel(postedMin, nowMin){
  const d = Math.max(0, Math.round(nowMin - postedMin));
  if (d < 1)  return 'now';
  if (d < 60) return d + 'm';
  const h = Math.floor(d / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd';
}

/* Avatar element — photo if we have one, coloured initials if not. */
export function makeAvatar(p, cls = ''){
  const el = document.createElement('div');
  el.className = 'av ' + cls;
  const usable = p.photo && /\.(jpg|jpeg|png|webp|gif)$/i.test(p.photo);
  if (usable){
    const img = document.createElement('img');
    img.src = p.photo;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    img.onerror = () => { el.textContent = initials(p.name); el.style.background = avColour(p.name); img.remove(); };
    el.appendChild(img);
  } else {
    el.textContent = initials(p.name);
    el.style.background = avColour(p.name);
  }
  return el;
}

export const VERIFIED_SVG =
  '<svg class="ver" viewBox="0 0 24 24" fill="#1d9bf0"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/></svg>';
