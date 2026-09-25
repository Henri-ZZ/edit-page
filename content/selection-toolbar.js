(() => {
  if (window._editPageSelectionToolbarInit) return;

  const HOST_ID = "edit-page-selection-toolbar";
  const BLOCKS = "p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,figcaption,button,a,label,div";
  const COLORS = ["#111827", "#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#4f46e5", "#a855f7"];
  const BACKGROUNDS = ["transparent", "#fef08a", "#fed7aa", "#fecaca", "#bbf7d0", "#bae6fd", "#c7d2fe", "#e9d5ff"];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  window._editPageSelectionToolbarInit = (labels = {}) => {
    window._editPageSelectionToolbar?.destroy();
    let savedRange = null;
    let popoverOpen = false;
    let applyingFormat = false;
    let raf = 0;
    const host = document.createElement("div");
    host.id = HOST_ID;
    host.contentEditable = "false";
    const shadow = host.attachShadow({ mode: "open" });
    const clearIconUrl = chrome.runtime.getURL("assets/clear.png");
    shadow.innerHTML = `<style>
      :host{all:initial;position:fixed;z-index:2147483647;display:none;left:0;top:0;font:13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033}
      *,*::before,*::after{box-sizing:border-box}button,input{font:inherit}button{border:0;cursor:pointer}
      .bar{display:flex;align-items:center;gap:3px;padding:5px;background:#fff;border:1px solid #dbe2ef;border-radius:11px;box-shadow:0 8px 28px #0f172a30;white-space:nowrap}
      .sep{width:1px;height:24px;background:#e2e8f0;margin:0 2px}.btn{height:30px;min-width:30px;padding:0 8px;border-radius:7px;background:transparent;color:#334155;font-weight:650}.btn:hover,.btn.active{background:#eef2ff;color:#4338ca}.btn.mixed{box-shadow:inset 0 -2px #a5b4fc}.size{min-width:43px;text-align:center;color:#475569;font-variant-numeric:tabular-nums}.strike{text-decoration:line-through}.under{text-decoration:underline}.italic{font-style:italic}.color{position:relative;font-size:16px}.color::after{content:"";position:absolute;left:7px;right:7px;bottom:3px;height:3px;border-radius:2px;background:var(--current-color,#111827)}.clear-icon{display:block;width:18px;height:18px;object-fit:contain}.tooltip{position:relative}.tooltip::after{content:attr(data-tooltip);position:absolute;top:calc(100% + 7px);right:0;width:max-content;max-width:180px;padding:5px 7px;color:#fff;font:500 11px/1.25 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:nowrap;background:#172033;border-radius:6px;box-shadow:0 4px 12px #0f172a33;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-2px);transition:opacity 80ms ease 150ms,transform 80ms ease 150ms,visibility 0s linear 230ms}.tooltip:hover::after,.tooltip:focus-visible::after{opacity:1;visibility:visible;transform:translateY(0);transition-delay:150ms,150ms,0s}
      .pop{position:absolute;display:none;width:220px;padding:10px;top:42px;right:0;background:#fff;border:1px solid #dbe2ef;border-radius:11px;box-shadow:0 12px 32px #0f172a33}.pop.open{display:block}.heading{margin:0 0 7px;font-size:11px;font-weight:700;color:#64748b}.heading.bg{margin-top:10px}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:5px}.swatch{width:20px;height:20px;padding:0;border:1px solid #cbd5e1;border-radius:5px;background:var(--swatch)}.swatch.selected{outline:2px solid #4f46e5;outline-offset:1px}.swatch.none{background:linear-gradient(135deg,transparent 46%,#ef4444 47%,#ef4444 53%,transparent 54%),#fff}.custom-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px;color:#64748b;font-size:11px;font-weight:650}.custom{appearance:none;-webkit-appearance:none;display:block;flex:none;width:32px;height:24px;padding:0;border:0;border-radius:5px;background:transparent;overflow:hidden}.custom::-webkit-color-swatch-wrapper{padding:0}.custom::-webkit-color-swatch{border:0;border-radius:5px}.custom::-moz-color-swatch{border:0;border-radius:5px}.reset-row{display:flex;justify-content:center;border-top:1px solid #e2e8f0;margin-top:10px;padding-top:8px}.reset{width:auto;min-width:72px;height:26px;padding:0 14px;border-radius:7px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:650}
    </style><div class="bar" role="toolbar">
      <button class="btn" data-action="smaller">−</button><span class="size">—</span><button class="btn" data-action="larger">+</button><span class="sep"></span>
      <button class="btn" data-action="bold"><b>B</b></button><button class="btn strike" data-action="strike">S</button><button class="btn italic" data-action="italic">I</button><button class="btn under" data-action="underline">U</button><button class="btn color" data-action="color">A</button><span class="sep"></span><button class="btn tooltip" data-action="restore-format" data-tooltip="${labels.restoreOriginalFormatting || "Restore original formatting"}" aria-label="${labels.restoreOriginalFormatting || "Restore original formatting"}"><img class="clear-icon" src="${clearIconUrl}" alt=""></button>
      <div class="pop"><div class="heading">${labels.textColor || "Text color"}</div><div class="grid text-colors"></div><label class="custom-row"><span>${labels.customColor || "Custom"}</span><input class="custom text-custom" type="color" aria-label="${labels.customTextColor || "Custom text color"}"></label><div class="heading bg">${labels.backgroundColor || "Background color"}</div><div class="grid bg-colors"></div><label class="custom-row"><span>${labels.customColor || "Custom"}</span><input class="custom bg-custom" type="color" aria-label="${labels.customBackgroundColor || "Custom background color"}"></label><div class="reset-row"><button class="reset">${labels.reset || "Reset"}</button></div></div>
    </div>`;
    document.documentElement.appendChild(host);
    const $ = (selector) => shadow.querySelector(selector);
    const bar = $(".bar");
    const pop = $(".pop");

    const selectionNodes = (range = savedRange) => {
      if (!range || !range.commonAncestorContainer.isConnected) return [];
      const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode(node) { return node.data.trim() && range.intersectsNode(node) && !node.parentElement?.closest(`#${HOST_ID},#edit-page-history-toolbar`) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      if (root.nodeType === Node.TEXT_NODE && root.data.trim()) nodes.push(root);
      return [...new Set(nodes)];
    };
    const restore = () => { if (!savedRange) return false; const selection = getSelection(); selection.removeAllRanges(); selection.addRange(savedRange); return true; };
    const values = (getter) => selectionNodes().map((node) => getter(getComputedStyle(node.parentElement)));
    const state = (getter, yes) => { const list = values(getter); return { active: !!list.length && list.every(yes), mixed: list.some(yes) && !list.every(yes), value: new Set(list).size === 1 ? list[0] : null }; };
    const updateState = () => {
      const set = (name, data) => { const button = $(`[data-action="${name}"]`); button.classList.toggle("active", data.active); button.classList.toggle("mixed", data.mixed); };
      set("bold", state((s) => s.fontWeight, (v) => Number.parseInt(v, 10) >= 600 || v === "bold"));
      set("italic", state((s) => s.fontStyle, (v) => v === "italic" || v === "oblique"));
      set("underline", state((s) => s.textDecorationLine, (v) => v.includes("underline")));
      set("strike", state((s) => s.textDecorationLine, (v) => v.includes("line-through")));
      const size = state((s) => Math.round(Number.parseFloat(s.fontSize)), () => false); $(".size").textContent = size.value ? `${size.value}px` : (labels.mixed || "Mixed");
      const color = state((s) => s.color, () => false); $(".color").style.setProperty("--current-color", color.value || "#111827");
    };
    const position = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (!savedRange) return; const rect = savedRange.getBoundingClientRect(); if (!rect.width && !rect.height) return hide(); host.style.display = "block"; const box = bar.getBoundingClientRect(); let top = rect.top - box.height - 8; if (top < 8) top = rect.bottom + 8; host.style.left = `${clamp(rect.left + rect.width / 2 - box.width / 2, 8, innerWidth - box.width - 8)}px`; host.style.top = `${clamp(top, 8, innerHeight - box.height - 8)}px`; }); };
    const hide = () => { host.style.display = "none"; pop.classList.remove("open"); popoverOpen = false; };
    const track = () => { if (applyingFormat || shadow.activeElement instanceof HTMLInputElement) return; const selection = getSelection(); if (!document.body.isContentEditable || !selection?.rangeCount || selection.isCollapsed || !document.body.contains(selection.anchorNode)) return hide(); const range = selection.getRangeAt(0); if (host.contains(range.commonAncestorContainer)) return; savedRange = range.cloneRange(); updateState(); position(); };

    const snapshots = (nodes) => [...new Set(nodes.map((n) => n.parentElement.closest(BLOCKS) || n.parentElement))].filter((e) => e && !e.closest(`#${HOST_ID}`)).map((element) => ({ element, before: element.innerHTML }));
    const wrap = (node, property, value) => { const span = document.createElement("span"); span.dataset.editPageFormat = property; span.style[property] = value; node.parentNode.insertBefore(span, node); span.appendChild(node); };
    const isolateBoundaries = () => {
      const selection = getSelection();
      if (!selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      const sameTextNode = range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE;
      const originalEndOffset = range.endOffset;
      const originalStartOffset = range.startOffset;
      if (range.endContainer.nodeType === Node.TEXT_NODE && range.endOffset < range.endContainer.length)
        range.endContainer.splitText(range.endOffset);
      if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
        const original = range.startContainer;
        const offset = range.startOffset;
        const selected = original.splitText(offset);
        range.setStart(selected, 0);
        if (sameTextNode) range.setEnd(selected, originalEndOffset - originalStartOffset);
      }
      savedRange = range.cloneRange();
    };
    const apply = (property, getValue) => {
      if (!restore()) return; applyingFormat = true;
      try {
        isolateBoundaries(); const nodes = selectionNodes(); if (!nodes.length) return; const records = snapshots(nodes);
        for (const node of nodes) wrap(node, property, getValue(getComputedStyle(node.parentElement)));
        const range = document.createRange(); range.setStart(nodes[0], 0); range.setEnd(nodes[nodes.length - 1], nodes[nodes.length - 1].length);
        const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); savedRange = range.cloneRange();
        for (const record of records) record.after = record.element.innerHTML;
        window._editPageHistory?.push({ type: "format", records, time: Date.now() });
        updateState(); position();
      } finally { applyingFormat = false; }
    };
    const clearToolFormatting = (properties, decorationToken = null) => {
      if (!restore()) return; applyingFormat = true;
      try {
        isolateBoundaries(); const nodes = selectionNodes(); if (!nodes.length) return; const records = snapshots(nodes);
        for (const node of nodes) {
          for (const property of properties) {
            let span = node.parentElement?.closest(`span[data-edit-page-format="${property}"]`);
            while (span) {
              const next = span.parentElement?.closest(`span[data-edit-page-format="${property}"]`);
              if (property === "textDecorationLine" && decorationToken) {
                const parts = new Set(span.style.textDecorationLine.split(/\s+/).filter((value) => value && value !== "none"));
                parts.delete(decorationToken); span.style.textDecorationLine = [...parts].join(" ");
              } else span.style[property] = "";
              if (!span.getAttribute("style")) span.replaceWith(...span.childNodes);
              span = next;
            }
          }
        }
        const range = document.createRange(); range.setStart(nodes[0], 0); range.setEnd(nodes[nodes.length - 1], nodes[nodes.length - 1].length);
        const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); savedRange = range.cloneRange();
        for (const record of records) record.after = record.element.innerHTML;
        if (records.some((record) => record.before !== record.after)) window._editPageHistory?.push({ type: "format", records, time: Date.now() });
        updateState(); position();
      } finally { applyingFormat = false; }
    };
    const toggle = (name) => { const current = state((s) => name === "fontWeight" ? s.fontWeight : name === "fontStyle" ? s.fontStyle : s.textDecorationLine, (v) => name === "fontWeight" ? Number.parseInt(v,10)>=600 || v==="bold" : name === "fontStyle" ? /italic|oblique/.test(v) : v.includes(name)); if ((name === "underline" || name === "line-through") && current.active) { clearToolFormatting(["textDecorationLine"], name); return; } apply(name === "underline" || name === "line-through" ? "textDecorationLine" : name, (s) => { if (name === "fontWeight") return current.active ? "400" : "700"; if (name === "fontStyle") return current.active ? "normal" : "italic"; const parts = new Set(s.textDecorationLine.split(/\s+/).filter((v) => v !== "none")); parts.add(name); return [...parts].join(" ") || "none"; }); };
    const setColor = (property, value) => apply(property, () => value);
    const consumeFormattingUse = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: "consume-text-formatting-use" });
        return response?.allowed === true;
      } catch (error) {
        console.warn("Edit Page could not update the text-formatting quota", error);
        return false;
      }
    };
    COLORS.forEach((color) => { const button = document.createElement("button"); button.className="swatch"; button.style.setProperty("--swatch",color); button.dataset.value=color; $(".text-colors").appendChild(button); });
    BACKGROUNDS.forEach((color) => { const button=document.createElement("button"); button.className=`swatch${color==="transparent"?" none":""}`; button.style.setProperty("--swatch",color); button.dataset.value=color; $(".bg-colors").appendChild(button); });
    shadow.addEventListener("pointerdown", (event) => { if (!(event.target instanceof HTMLInputElement)) event.preventDefault(); event.stopPropagation(); });
    shadow.addEventListener("click", async (event) => {
      event.stopPropagation();
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "color") {
        popoverOpen = !popoverOpen; pop.classList.toggle("open", popoverOpen); position(); return;
      }
      const swatch = event.target.closest(".swatch");
      const reset = event.target.closest(".reset");
      const changesFormatting = ["bold", "italic", "underline", "strike", "smaller", "larger", "restore-format"].includes(action) || swatch || reset;
      if (!changesFormatting || !(await consumeFormattingUse())) return;
      if (action === "bold") toggle("fontWeight");
      else if (action === "italic") toggle("fontStyle");
      else if (action === "underline") toggle("underline");
      else if (action === "strike") toggle("line-through");
      else if (action === "smaller" || action === "larger") {
        const size = state((style) => Math.round(parseFloat(style.fontSize)), () => false);
        apply("fontSize", () => `${clamp((size.value || 16) + (action === "larger" ? 1 : -1), 8, 96)}px`);
      } else if (action === "restore-format") {
        clearToolFormatting(["fontSize", "fontWeight", "fontStyle", "textDecorationLine", "color", "backgroundColor"]);
      }
      if (swatch) setColor(swatch.closest(".text-colors") ? "color" : "backgroundColor", swatch.dataset.value);
      if (reset) clearToolFormatting(["color", "backgroundColor"]);
    });
    $(".text-custom").addEventListener("change", async (event) => {
      if (await consumeFormattingUse()) setColor("color", event.target.value);
    });
    $(".bg-custom").addEventListener("change", async (event) => {
      if (await consumeFormattingUse()) setColor("backgroundColor", event.target.value);
    });
    document.addEventListener("selectionchange", track); window.addEventListener("scroll", position, true); window.addEventListener("resize", position);
    const destroy = () => { document.removeEventListener("selectionchange",track); window.removeEventListener("scroll",position,true); window.removeEventListener("resize",position); cancelAnimationFrame(raf); savedRange=null; host.remove(); };
    window._editPageSelectionToolbar = { destroy, hide };
  };
})();
