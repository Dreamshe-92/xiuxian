/**
 * SaveManager.js — 本地存档读写（localStorage）
 * 结构：{ v: 版本号, t: 保存时间, d: GameState.data }——带版本号为将来迁移留口（评审建议）。
 * M0 为骨架：M1 创建流程完成后首次真实存档。
 */
(function () {
  'use strict';

  const C = () => Xuxian.config.constants;

  const SaveManager = {
    /** 是否存在存档 */
    hasSave() {
      try { return localStorage.getItem(C().SAVE.SLOT_KEY) !== null; }
      catch (e) { return false; }
    },

    /** 存档：把 GameState.data 打包写入 */
    save() {
      const data = Xuxian.core.GameState.data;
      data.meta.lastSavedAt = Date.now();
      if (!data.meta.createdAt) data.meta.createdAt = data.meta.lastSavedAt;
      const payload = { v: C().SAVE.SCHEMA_VERSION, t: Date.now(), d: data };
      try {
        localStorage.setItem(C().SAVE.SLOT_KEY, JSON.stringify(payload));
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: 'storage-unavailable' }; // 隐私模式/满额
      }
    },

    /**
     * 读档：返回 { ok, version, data } 或 { ok:false, reason }
     * 版本不匹配时不直接写入（留 M5 做迁移器），仅提示。
     */
    load() {
      let raw;
      try { raw = localStorage.getItem(C().SAVE.SLOT_KEY); } catch (e) { return { ok: false, reason: 'storage-unavailable' }; }
      if (!raw) return { ok: false, reason: 'no-save' };
      let payload;
      try { payload = JSON.parse(raw); } catch (e) { return { ok: false, reason: 'corrupted' }; }
      if (!payload || typeof payload.v !== 'number' || !payload.d) return { ok: false, reason: 'corrupted' };
      if (payload.v !== C().SAVE.SCHEMA_VERSION) return { ok: false, reason: 'version-mismatch', version: payload.v };
      return { ok: true, version: payload.v, data: payload.d };
    },

    /** 删档（确认弹窗后调用） */
    clear() {
      try { localStorage.removeItem(C().SAVE.SLOT_KEY); return true; } catch (e) { return false; }
    },
  };

  Xuxian.core.SaveManager = SaveManager;
})();
