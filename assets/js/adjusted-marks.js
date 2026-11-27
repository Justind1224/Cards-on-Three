/* ── Adjusted-time asterisks ─────────────────────────────────────────────
   Used by the all-time list and the records page.

   A meet name ending in "*" marks a time with one adjustment; "**" (or
   "* **") marks a time with both. formatMeet() swaps the stars for a small
   badge that shows an explanation on hover, keyboard focus, or tap.

   Only timed events get the badge. Field marks keep their plain asterisk,
   since the explanation is about times.
───────────────────────────────────────────────────────────────────────────*/
const ADJ_TIPS = {
  one: "Time has been slightly adjusted in the conversion from yards to meters, or to account for hand timed human error.",
  both: "Time has been slightly adjusted in the conversion from yards to meters, and to account for hand timed human error.",
};

// "Lakota Relays*" -> 'Lakota Relays<span class="adj-mark" ...>*</span>'
function formatMeet(v) {
  const s = String(v ?? "");
  const m = s.match(/\s*[*\s]*\*\s*$/);
  if (!m) return s;
  const kind = m[0].match(/\*/g).length >= 2 ? "both" : "one";
  const stars = kind === "both" ? "**" : "*";
  return `${s.slice(0, m.index)}<span class="adj-mark" tabindex="0" role="note" aria-label="${ADJ_TIPS[kind]}" data-tip="${kind}">${stars}</span>`;
}

// "10.65" / "4:09.09" / "17:38.06"
function isTime(v) {
  return /^(\d+:)?\d+(\.\d+)?$/.test(String(v ?? "").trim());
}

// ── Styles (shared so both pages match) ──
document.head.insertAdjacentHTML("beforeend", `<style>
  .adj-mark {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.25rem; height: 1.125rem; padding: 0 0.3rem; margin-left: 0.375rem;
    border-radius: 999px; background: rgba(192,24,42,0.08); border: 1px solid rgba(192,24,42,0.2);
    color: #C0182A; font-size: 0.8125rem; font-weight: 700; line-height: 1;
    cursor: help; vertical-align: 0.05em; user-select: none;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease;
  }
  .chip .adj-mark { min-width: 1rem; height: 0.95rem; margin-left: 0.25rem; font-size: 0.6875rem; padding: 0 0.25rem; }
  .adj-mark:hover { transform: scale(1.12); }
  .adj-mark:active { transform: scale(0.95); }
  .adj-mark:focus-visible { outline: 2px solid #C0182A; outline-offset: 2px; }
  #adj-tip {
    position: fixed; z-index: 100; max-width: 260px; pointer-events: none;
    background: #0D1730; color: #E2E8F0; font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.75rem; font-weight: 400; line-height: 1.5; letter-spacing: 0;
    padding: 0.5rem 0.75rem; border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(13,23,48,0.18), 0 12px 28px rgba(13,23,48,0.14);
    opacity: 0; transform: translateY(4px);
    transition: opacity 0.15s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  #adj-tip.show { opacity: 1; transform: translateY(0); }
</style>`);

// ── Tooltip (one shared element, fixed so table/card overflow can't clip it) ──
const adjTip = document.createElement("div");
adjTip.id = "adj-tip";
adjTip.setAttribute("aria-hidden", "true");
document.body.appendChild(adjTip);

function showAdjTip(el) {
  adjTip.textContent = ADJ_TIPS[el.dataset.tip];
  const r = el.getBoundingClientRect();
  const t = adjTip.getBoundingClientRect();
  let top = r.top - t.height - 8;
  if (top < 8) top = r.bottom + 8; // no room above: show below
  const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
  adjTip.style.top = top + "px";
  adjTip.style.left = left + "px";
  adjTip.classList.add("show");
}
const hideAdjTip = () => adjTip.classList.remove("show");

document.addEventListener("mouseover", e => {
  const el = e.target.closest(".adj-mark");
  if (el) showAdjTip(el);
});
document.addEventListener("mouseout", e => {
  if (e.target.closest(".adj-mark")) hideAdjTip();
});
document.addEventListener("focusin", e => {
  const el = e.target.closest(".adj-mark");
  el ? showAdjTip(el) : hideAdjTip();
});
document.addEventListener("focusout", hideAdjTip);
window.addEventListener("scroll", hideAdjTip, { passive: true });

// ── Records page: badge the meet chips on timed records ──
document.querySelectorAll(".record-card").forEach(card => {
  const mark = card.querySelector(".record-mark");
  if (!mark || !isTime(mark.textContent)) return;
  card.querySelectorAll(".chip").forEach(chip => {
    if (/\*\s*$/.test(chip.textContent)) chip.innerHTML = formatMeet(chip.textContent);
  });
});
