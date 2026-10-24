/**
 * panels/CreationPanel.js — 凝气篇·角色创建面板（DOM 覆盖层）
 * 流程（需求确认第三轮）：①心念输入 → ②道身骨架+命格6选3（可无限重凝）→ ③道身预览 → [落字入世]。
 * AI 增强为降级版（模板拼接身世 + 固定天道评语）；M5 接真 AI。
 * 事件：CREATE_DONE（携带完整玩家档案）→ StoryScene 接收入世。
 */
(function () {
  'use strict';

  const E = () => Xuxian.config.constants.EVENTS;
  const TIER_CLASS = { '凡': 'tier-fan', '灵': 'tier-ling', '天': 'tier-tian' };

  Xuxian.ui.panels.CreationPanel = {
    /** 面板内部状态 */
    _state: null,

    _reset() {
      this._state = { step: 1, intent: '', skeleton: null, fateCards: [], fateChoice: [] };
    },

    render(el, api) {
      if (!this._state) this._reset();
      this._el = el; this._api = api;
      this._renderStep();
    },

    // ---------- 各步骤渲染 ----------
    _renderStep() {
      const s = this._state;
      const el = this._el;
      if (s.step === 1) this._renderIntent(el);
      else if (s.step === 2) this._renderForge(el);
      else this._renderPreview(el);
    },

    /** ① 以心念唤道 */
    _renderIntent(el) {
      el.innerHTML = `
        <div class="xl-step-tag">凝气篇 · 一</div>
        <h2 style="font-size:24px; letter-spacing:8px;">以 心 念 唤 道</h2>
        <p class="xl-hint">以一句心念描摹真身，凝气成形后参阅天机。</p>
        <textarea class="xl-textarea" maxlength="200" rows="3"
          placeholder="例：我想成为一位靠炼丹逆袭的废柴少主……">${this._state.intent}</textarea>
        <div class="xl-counter"><span id="intent-len">0</span> / 200</div>
        <button class="xl-btn" id="btn-forge">凝 气 成 形</button>
        <div class="xl-sub">心念将真实影响灵根与命格 —— 写下你想要的道。</div>
      `;
      const ta = el.querySelector('.xl-textarea');
      const len = el.querySelector('#intent-len');
      const btn = el.querySelector('#btn-forge');
      const sync = () => { len.textContent = ta.value.trim().length; btn.disabled = ta.value.trim().length < 2; };
      ta.addEventListener('input', sync); sync();
      btn.addEventListener('click', () => {
        this._state.intent = ta.value.trim();
        this._roll(); // 生成骨架 + 命格候选
        this._state.step = 2;
        this._renderStep();
      });
    },

    /** ② 凝气成形：道身骨架 + 命格六选三 */
    _renderForge(el) {
      const s = this._state;
      const sk = s.skeleton;
      const root = sk.spiritRoot;
      el.innerHTML = `
        <div class="xl-step-tag">凝气篇 · 二</div>
        <h2 style="font-size:24px; letter-spacing:8px; margin-bottom:10px;">道 身 初 成</h2>
        <div class="xl-forge-grid">
          <div class="xl-sheet">
            <div class="xl-row"><span class="xl-label">姓名</span>
              <input class="xl-name-input" value="${sk.name}" maxlength="12"></div>
            <div class="xl-story">${sk.background.story}</div>
            <div class="xl-row"><span class="xl-label">灵根</span>
              <b>${root.tierName}</b> · ${root.elements.join('、')}
              <span class="xl-sub-inline">强度 ${root.strength} · 修炼 ×${root.speedMult}</span></div>
            <div class="xl-row"><span class="xl-label">根基</span>六维皆 15 · 待分配 <b>${sk.pendingPoints}</b> 点（入世后分配）</div>
            <div class="xl-row"><span class="xl-label">年岁</span>${sk.age} 岁 · 寿元上限约 ${sk.lifespanMax} 载</div>
            <div class="xl-comment">天道评语：${root.commentary}</div>
            <button class="xl-btn xl-btn-ghost" id="btn-reroll">重 凝（骨架无限随）</button>
          </div>
          <div class="xl-fates">
            <div class="xl-fates-title">先天命格 · 已选 <span id="fate-n">0</span> / 3</div>
            <div class="xl-fate-grid">
              ${s.fateCards.map((f) => `
                <div class="xl-fate-card ${TIER_CLASS[f.tier]}" data-id="${f.id}">
                  <div class="xl-fate-name">${f.name}<span class="xl-fate-tier">${f.tier}</span></div>
                  <div class="xl-fate-effect">${f.effect}</div>
                  <div class="xl-fate-flavor">${f.flavor}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>
        <div style="display:flex; gap:10px; margin-top:6px;">
          <button class="xl-btn xl-btn-ghost" id="btn-back" style="flex:0 0 120px;">改心念</button>
          <button class="xl-btn" id="btn-next" disabled>择定命格 · 参阅道身</button>
        </div>
      `;

      // 姓名可编辑（同步进骨架）
      el.querySelector('.xl-name-input').addEventListener('input', (e) => {
        sk.name = e.target.value.trim() || sk.name;
      });

      // 重凝：新种子重 roll 骨架与命格（心念保留）
      el.querySelector('#btn-reroll').addEventListener('click', () => {
        this._roll(); this._renderStep();
      });
      el.querySelector('#btn-back').addEventListener('click', () => {
        this._state.step = 1; this._renderStep();
      });

      // 命格三选
      const cards = el.querySelectorAll('.xl-fate-card');
      const counter = el.querySelector('#fate-n');
      const next = el.querySelector('#btn-next');
      const sync = () => {
        counter.textContent = s.fateChoice.length;
        next.disabled = s.fateChoice.length !== 3;
      };
      cards.forEach((card) => {
        card.addEventListener('click', () => {
          const id = card.dataset.id;
          const i = s.fateChoice.indexOf(id);
          if (i >= 0) { s.fateChoice.splice(i, 1); card.classList.remove('picked'); }
          else if (s.fateChoice.length < 3) { s.fateChoice.push(id); card.classList.add('picked'); }
          sync();
        });
      });
      sync();

      next.addEventListener('click', () => { s.step = 3; this._renderStep(); });
    },

    /** ③ 道身预览 · 落字入世 */
    _renderPreview(el) {
      const s = this._state;
      const sk = s.skeleton;
      const root = sk.spiritRoot;
      const picked = s.fateCards.filter((f) => s.fateChoice.includes(f.id));
      el.innerHTML = `
        <div class="xl-step-tag">凝气篇 · 三</div>
        <h2 style="font-size:24px; letter-spacing:8px; margin-bottom:12px;">以此真身入世？</h2>
        <div class="xl-sheet" style="text-align:left;">
          <div class="xl-row"><span class="xl-label">姓名</span><b>${sk.name}</b></div>
          <div class="xl-row"><span class="xl-label">境界</span>炼气 · 初期</div>
          <div class="xl-row"><span class="xl-label">灵根</span>${root.tierName}（${root.elements.join('、')}）· 强度 ${root.strength}</div>
          <div class="xl-row"><span class="xl-label">寿元</span>${sk.age} / ${sk.lifespanMax} 载</div>
          <div class="xl-row"><span class="xl-label">命格</span>${picked.map((f) => f.name + '（' + f.tier + '）').join('、')}</div>
          <div class="xl-row"><span class="xl-label">心念</span>「${s.intent}」</div>
        </div>
        <div style="display:flex; gap:10px; margin-top:6px;">
          <button class="xl-btn xl-btn-ghost" id="btn-back2" style="flex:0 0 120px;">返回调整</button>
          <button class="xl-btn" id="btn-enter">落 字 入 世</button>
        </div>
      `;
      el.querySelector('#btn-back2').addEventListener('click', () => { s.step = 2; this._renderStep(); });
      el.querySelector('#btn-enter').addEventListener('click', () => {
        // 组装玩家档案（心念原文永久存档——道心系统的数据地基）
        const player = Object.assign({}, sk, {
          intent: s.intent,
          fate: s.fateChoice.slice(),
          fateDetail: picked,
          realm: '炼气初期',
        });
        this._api.emit(E().CREATE_DONE, player);
      });
    },

    // ---------- 生成 ----------
    _roll() {
      const s = this._state;
      const parse = Xuxian.systems.creation.HeartIntentParser.parse(s.intent);
      const seeder = new Xuxian.systems.creation.CharacterSeeder(Date.now() % 2147483647);
      s.skeleton = seeder.rollSkeleton(s.intent, parse);
      s.fateCards = Xuxian.systems.creation.FateDealer.draw(seeder.rng, parse);
      s.fateChoice = [];
    },
  };
})();
