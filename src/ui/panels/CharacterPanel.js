/**
 * ui/panels/CharacterPanel.js — 道身面板（只读展示：身份/灵根/六维派生/命格/心念/身世）
 */
(function () {
  'use strict';

  Xuxian.ui.panels.CharacterPanel = {
    render(el, api) {
      const gs = Xuxian.core.GameState.data;
      const p = gs.player || {};
      const s = Xuxian.systems.stats.RealmProgress.get();
      const derived = Xuxian.systems.stats.AttributeCalc.derive(s.attributes);
      const root = p.spiritRoot || {};
      const fateDetail = (p.fateDetail || []).map((f) =>
        `<span class="xl-fate-chip tier-${f.tier}">${f.name}<i>${f.tier}</i></span>`).join('');

      el.innerHTML = `
        <div class="xl-step-tag"><span class="xl-kicker">洞府 · 道身</span></div>
        <div class="xl-char-grid">
          <div>
            <h2 class="xl-char-name">${p.name || '—'}</h2>
            <div class="xl-sub xl-sub--left" style="margin-top:0;">${Xuxian.systems.stats.RealmProgress.realmName()} · ${p.age || '?'}岁 · 寿元 ${Xuxian.systems.cultivation.CultivationState.lifespanLeft().toFixed(1)}载</div>
            <div class="xl-row" style="margin-top:12px;"><span class="xl-label">灵根</span>
              <b>${root.tierName || '—'}</b>（${(root.elements || []).join('、')}）· 强度 ${root.strength || '?'} · 修炼 ×${root.speedMult || 1}</div>
            <div class="xl-row"><span class="xl-label">心念</span>「${p.intent || '—'}」</div>
            <div class="xl-story">${(p.background && p.background.story) || ''}</div>
            <div class="xl-comment">天道评语：${root.commentary || ''}</div>
          </div>
          <div>
            <div class="xl-sheet-title">六维根基 <span class="xl-sub-inline">待分配 ${s.pendingPoints} 点</span></div>
            ${Object.keys(s.attributes).map((k) => `
              <div class="xl-attr-row"><span class="xl-label">${k}</span>
                <span class="xl-bar xl-bar-wide"><i style="width:${Math.min(100, s.attributes[k] / 60 * 100)}%"></i></span>
                <b>${s.attributes[k]}</b></div>`).join('')}
            <div class="xl-sheet-title" style="margin-top:14px;">派生属性</div>
            <div class="xl-derive">气血 ${derived.hpMax} · 法力 ${derived.mpMax} · 物攻 ${derived.atk} · 物防 ${Math.round(derived.def)} · 速度 ${Math.round(derived.spd)} · 神识 ${Math.round(derived.sense)}</div>
            <div class="xl-sheet-title" style="margin-top:14px;">先天命格</div>
            <div class="xl-fate-chips">${fateDetail || '—'}</div>
          </div>
        </div>
        <button class="xl-btn" id="char-close">返 回 洞 府</button>
      `;
      el.querySelector('#char-close').addEventListener('click', () => api.close());
    },
  };
})();
