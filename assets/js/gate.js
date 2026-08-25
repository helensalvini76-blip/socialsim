/* Access gate for the facilitator dashboard.

   This is obfuscation, not security. The page is static and served publicly, so
   anyone determined can read the passphrase out of the source. What it does
   stop is the realistic problem: a participant who has been given the wrong
   link, or someone wandering past the ICC laptop, opening the controls and
   resetting a live exercise.

   Anything that genuinely must be secret cannot live in a static site.

   To change the passphrase, run hash('your new phrase') in the console and
   replace PASS_HASH below. */

import { hash } from './rng.js?v=22';

const PASS_HASH = 3032784028;          // "jupiter2026"
const KEY = 'jupiter-facilitator-key';

export function requireFacilitator(){
  const url = new URLSearchParams(location.search).get('key');
  if (url && hash(url) === PASS_HASH){
    try { sessionStorage.setItem(KEY, String(PASS_HASH)); } catch (e) {}
    return true;
  }
  try {
    if (sessionStorage.getItem(KEY) === String(PASS_HASH)) return true;
  } catch (e) {}
  return false;
}

export function showLock(onUnlock){
  const wrap = document.createElement('div');
  wrap.id = 'lock';
  wrap.innerHTML =
    '<div class="lock-card">' +
      '<div class="lock-title">Exercise Jupiter</div>' +
      '<div class="lock-sub">Facilitator controls</div>' +
      '<input type="password" id="lock-input" placeholder="Passphrase" autocomplete="off">' +
      '<button id="lock-go">Unlock</button>' +
      '<div class="lock-err" id="lock-err"></div>' +
    '</div>';
  document.body.appendChild(wrap);

  const input = wrap.querySelector('#lock-input');
  const err = wrap.querySelector('#lock-err');

  function attempt(){
    if (hash(input.value.trim()) === PASS_HASH){
      try { sessionStorage.setItem(KEY, String(PASS_HASH)); } catch (e) {}
      wrap.remove();
      onUnlock();
    } else {
      err.textContent = 'Not recognised';
      input.value = '';
      input.focus();
    }
  }

  wrap.querySelector('#lock-go').addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  setTimeout(() => input.focus(), 50);
}
