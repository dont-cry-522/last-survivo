/**
 * ============================================================
 *  SkillManager.js - 技能系统核心管理器
 * ============================================================
 *  管理所有已获得技能、生成升级选项、处理进化、维护效果注册表
 *
 *  职责：
 *    1. 持有所有 SkillInstance
 *    2. 按权重随机生成升级选项
 *    3. 获取技能（首次获得 → T1 / 复选 → 进化或强化）
 *    4. 维护 effectType → [SkillInstance] 注册表
 *    5. 检测技能间联动（Synergy）
 *    6. 提供 getActiveEffects(type) 给游戏系统查询
 * ============================================================
 */

class SkillManager {
    constructor() {
        this.skills = [];
        this.effectRegistry = {};
        this.activeSynergies = [];
        this.rerollsRemaining = 1;
        this.lastChoices = [];

        /** 效果处理器: { effectType: { skillId: callback } } */
        this.handlers = {};

        /** 运行时状态（召唤物、计时器等） */
        this.runtimeState = {};

        /** 激活的 Buff 列表（供 UI 显示） */
        this.activeBuffs = [];
    }

    // ================================================================
    //  升级选项生成
    // ================================================================

    /**
     * 生成新一轮升级选项
     * @param {number} count - 展示数量（默认4）
     * @returns {Array<{config: SkillDefinition, instance: SkillInstance|null, isEvolution: boolean, evolution: object|null}>}
     */
    generateChoices(count = 4) {
        if (SkillConfig.POOL.length === 0) {
            return [];
        }

        const choices = [];
        const ownedIds = new Set(this.skills.map(s => s.id));
        const ownedCategories = new Set(this.skills.map(s => s.category));

        // 构建权重池
        const weightedPool = this._buildWeightedPool(ownedIds, ownedCategories);

        // 抽取不重复的选项
        const selected = new Set();
        let attempts = 0;
        while (choices.length < count && attempts < 100) {
            attempts++;
            const candidate = this._weightedRandom(weightedPool);
            if (!candidate || selected.has(candidate.id)) continue;
            selected.add(candidate.id);

            const existing = this._findOwned(candidate.id);
            choices.push({
                config: candidate,
                instance: existing,
                isEvolution: existing !== null,
                evolution: existing ? existing.getNextEvolution() : null,
            });
        }

        this.lastChoices = choices;
        return choices;
    }

    /**
     * 构建按稀有度加权的技能池
     * 优先展示：已有流派的下一阶进化 > 新流派 T1 > 通用强化
     */
    _buildWeightedPool(ownedIds, ownedCategories) {
        const pool = [];

        for (const def of SkillConfig.POOL) {
            let weight = SkillRarity.getWeight(def.rarity);

            // 已有流派 → 权重翻倍（鼓励深度发展）
            if (ownedCategories.has(def.category)) {
                weight *= 2;
            }

            // 已有技能 → 大幅提权（鼓励复选进化）
            if (ownedIds.has(def.id)) {
                const existing = this._findOwned(def.id);
                if (existing && !existing.isMaxed) {
                    weight *= 4;
                }
            }

            // 新流派 T1 → 基础权重（鼓励探索）
            // 已是最高阶 → 权重降为0（不再出现）
            if (ownedIds.has(def.id)) {
                const existing = this._findOwned(def.id);
                if (existing && existing.isMaxed) {
                    weight = 0;
                }
            }

            if (weight > 0) {
                pool.push({ def, weight });
            }
        }

        return pool;
    }

    _weightedRandom(pool) {
        const total = pool.reduce((sum, p) => sum + p.weight, 0);
        let r = Math.random() * total;
        for (const p of pool) {
            r -= p.weight;
            if (r <= 0) return p.def;
        }
        return pool.length > 0 ? pool[pool.length - 1].def : null;
    }

    // ================================================================
    //  技能获取
    // ================================================================

    /**
     * 获取一个技能（首次获得 / 复选进化）
     * @param {string} skillId
     * @param {Object} gameState - { survivalTime, player }
     * @returns {{ action: 'added'|'evolved'|'enhanced'|'maxed', instance: SkillInstance }}
     */
    acquire(skillId, gameState) {
        const existing = this._findOwned(skillId);
        const player = gameState ? gameState.player : null;

        if (existing) {
            if (existing.isMaxed) {
                return { action: 'maxed', instance: existing };
            }

            const check = existing.checkEvolution(gameState);
            const prevParams = existing.getCurrentEffect().params;
            if (check.canEvolve) {
                existing.evolve();
                this._updateRegistry(existing);
                if (existing.config.apply && player) {
                    existing.config.apply(player, this, existing.getCurrentEffect().params, prevParams);
                }
                return { action: 'evolved', instance: existing };
            } else {
                existing.evolve();
                this._updateRegistry(existing);
                if (existing.config.apply && player) {
                    existing.config.apply(player, this, existing.getCurrentEffect().params, prevParams);
                }
                return { action: 'enhanced', instance: existing };
            }
        }

        const def = SkillConfig.POOL.find(d => d.id === skillId);
        if (!def) return null;

        const instance = new SkillInstance(def);
        this.skills.push(instance);
        this._updateRegistry(instance);

        if (def.apply && player) {
            def.apply(player, this, instance.getCurrentEffect().params);
        }

        this._checkSynergies();
        return { action: 'added', instance };
    }

    // ================================================================
    //  效果注册表
    // ================================================================

    _updateRegistry(instance) {
        const type = instance.effectType;
        if (!this.effectRegistry[type]) {
            this.effectRegistry[type] = [];
        }
        const list = this.effectRegistry[type];
        const existing = list.findIndex(s => s.id === instance.id);
        if (existing >= 0) {
            list[existing] = instance;
        } else {
            list.push(instance);
        }
    }

    /**
     * 获取指定类型的所有活跃效果
     * @param {string} effectType - SkillEffectType 之一
     * @returns {SkillInstance[]}
     */
    getActiveEffects(effectType) {
        return this.effectRegistry[effectType] || [];
    }

    /**
     * 检查是否拥有某个技能
     */
    hasSkill(id) {
        return this._findOwned(id) !== null;
    }

    /**
     * 获取指定技能实例
     */
    getSkill(id) {
        return this._findOwned(id);
    }

    // ================================================================
    //  联动检测
    // ================================================================

    /**
     * 检查所有技能对之间的联动
     */
    _checkSynergies() {
        this.activeSynergies = [];
        for (let i = 0; i < this.skills.length; i++) {
            for (let j = i + 1; j < this.skills.length; j++) {
                const a = this.skills[i];
                const b = this.skills[j];
                if (a.synergies.includes(b.id) || b.synergies.includes(a.id)) {
                    this.activeSynergies.push({ skillA: a, skillB: b });
                }
            }
        }
    }

    /**
     * 获取当前激活的联动
     */
    getActiveSynergies() {
        return this.activeSynergies;
    }

    // ================================================================
    //  辅助方法
    // ================================================================

    _findOwned(id) {
        return this.skills.find(s => s.id === id) || null;
    }

    /**
     * 获取已获得的技能数量
     */
    getSkillCount() {
        return this.skills.length;
    }

    /**
     * 获取某流派的技能数量
     */
    getCategoryCount(category) {
        return this.skills.filter(s => s.category === category).length;
    }

    /**
     * 重置（新游戏开始时调用）
     */
    reset() {
        this.skills = [];
        this.effectRegistry = {};
        this.activeSynergies = [];
        this.rerollsRemaining = 1;
        this.lastChoices = [];
    }

    /**
     * 刷新当前升级选项（消耗 reroll 次数）
     */
    reroll() {
        if (this.rerollsRemaining <= 0) return null;
        this.rerollsRemaining--;
        return this.generateChoices(4);
    }

    /**
     * 获取当前流派分布（供 UI 展示）
     */
    getCategorySummary() {
        const summary = {};
        for (const s of this.skills) {
            if (!summary[s.category]) {
                summary[s.category] = { count: 0, color: SkillCategory.getColor(s.category) };
            }
            summary[s.category].count++;
        }
        return summary;
    }

    // ================================================================
    //  效果触发系统
    // ================================================================

    /**
     * 追踪击杀（进化条件用）
     */
    trackKill() {
        for (const inst of this.skills) {
            inst.onKill();
        }
    }

    /**
     * 追踪精英伤害（进化条件用）
     */
    trackEliteHit() {
        for (const inst of this.skills) {
            inst.onDamageElite();
        }
    }

    /**
     * 注册技能效果处理器（由 apply 函数调用）
     * @param {string} effectType - SkillEffectType
     * @param {string} skillId
     * @param {Function} handler - 回调函数，接收 context 参数
     */
    registerHandler(effectType, skillId, handler) {
        if (!this.handlers[effectType]) this.handlers[effectType] = {};
        this.handlers[effectType][skillId] = handler;
    }

    /**
     * 触发指定类型的所有已注册效果
     * @param {string} effectType
     * @param {Object} context - 传递给每个 handler 的数据
     */
    trigger(effectType, context) {
        const handlers = this.handlers[effectType] || {};
        for (const skillId in handlers) {
            const inst = this._findOwned(skillId);
            if (!inst) continue;
            handlers[skillId](context, inst);
        }
    }

    /**
     * 每帧更新（处理 PERIODIC / SUMMON 效果）
     * @param {number} deltaTime
     * @param {Object} gameContext - { player, enemies, bulletManager, particleManager }
     */
    update(deltaTime, gameContext) {
        // 懒初始化：首次 update 时注册视觉处理器
        if (!this.runtimeState._visualsReady) {
            this.runtimeState._visualsReady = true;
            if (typeof _ensureBurnProcessor === 'function') {
                _ensureBurnProcessor(this);
            }
        }

        // 系统级 PERIODIC 处理器（如燃烧系统）+ 跨类型注册的处理器
        const sysHandlers = this.handlers[SkillEffectType.PERIODIC] || {};
        for (const skillId in sysHandlers) {
            if (skillId.startsWith('__')) {
                sysHandlers[skillId](deltaTime, gameContext);
            } else if (this._findOwned(skillId) && !this.effectRegistry[SkillEffectType.PERIODIC]?.some(i => i.id === skillId)) {
                sysHandlers[skillId](deltaTime, gameContext);
            }
        }

        // PERIODIC 效果（技能实例）
        const periodics = this.effectRegistry[SkillEffectType.PERIODIC] || [];
        for (const inst of periodics) {
            const handler = sysHandlers[inst.id];
            if (handler) handler(deltaTime, gameContext, inst);
        }

        // SUMMON 效果
        const summonHandlers = this.handlers[SkillEffectType.SUMMON] || {};
        for (const skillId in summonHandlers) {
            if (this._findOwned(skillId) && !this.effectRegistry[SkillEffectType.SUMMON]?.some(i => i.id === skillId)) {
                summonHandlers[skillId](deltaTime, gameContext);
            }
        }
        const summons = this.effectRegistry[SkillEffectType.SUMMON] || [];
        for (const inst of summons) {
            const handler = summonHandlers[inst.id];
            if (handler) handler(deltaTime, gameContext, inst);
        }
    }

    // ================================================================
    //  Buff 显示
    // ================================================================

    /**
     * 获取当前激活的 Buff 列表（供 UI 渲染）
     * @returns {Array<{id, name, tier, category, rarity}>}
     */
    getActiveBuffs() {
        return this.skills.map(s => ({
            id: s.id,
            name: s.name,
            tier: s.currentTier,
            category: s.category,
            rarity: s.rarity,
        }));
    }

    // ================================================================
    //  存档接口（预留）
    // ================================================================

    serialize() {
        return {
            skills: this.skills.map(s => ({
                id: s.id, currentTier: s.currentTier,
                killCount: s.killCount, hasDamagedElite: s.hasDamagedElite,
            })),
            rerollsRemaining: this.rerollsRemaining,
        };
    }

    deserialize(data) {
        this.reset();
        if (!data || !data.skills) return;
        for (const saved of data.skills) {
            const def = SkillConfig.POOL.find(d => d.id === saved.id);
            if (!def) continue;
            const inst = new SkillInstance(def);
            inst.currentTier = saved.currentTier;
            inst.killCount = saved.killCount || 0;
            inst.hasDamagedElite = saved.hasDamagedElite || false;
            inst.isMaxed = inst.currentTier >= inst.maxTier;
            this.skills.push(inst);
            this._updateRegistry(inst);
            if (def.apply) {
                def.apply(null, this, inst.getCurrentEffect().params);
            }
        }
        this.rerollsRemaining = data.rerollsRemaining || 1;
        this._checkSynergies();
    }

    /**
     * 重置
     */
    reset() {
        this.skills = [];
        this.effectRegistry = {};
        this.activeSynergies = [];
        this.runtimeState = {};
        this.activeBuffs = [];
    }

    /**
     * 绘制技能视觉效果
     */
    drawVisuals(ctx, cameraX, cameraY, player) {
        const rs = this.runtimeState;

        // 雷暴云
        if (rs._stormCloud) {
            const cx = player.x - cameraX, cy = player.y - cameraY - 40;
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#667799';
            ctx.beginPath(); ctx.arc(cx - 12, cy + 4, 14, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 14, cy + 2, 16, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 2, cy - 4, 18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#8899bb';
            ctx.beginPath(); ctx.arc(cx + 26, cy + 8, 12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx - 20, cy + 10, 10, 0, Math.PI * 2); ctx.fill();
            // lightning flicker
            if (Math.random() < 0.2) {
                ctx.strokeStyle = '#ffff88'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(cx, cy + 18); ctx.lineTo(cx + (Math.random() - 0.5) * 30, player.y - cameraY + (Math.random() * 30)); ctx.stroke();
            }
            ctx.restore();
        }

        // 火焰区域
        const zones = rs._fireZones;
        if (zones) {
            for (const z of zones) {
                const zx = z.x - cameraX, zy = z.y - cameraY;
                ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(Date.now() * 0.01) * 0.1;
                const grad = ctx.createRadialGradient(zx, zy, 0, zx, zy, z.radius);
                grad.addColorStop(0, '#ff4400'); grad.addColorStop(0.5, '#ff6600'); grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(zx, zy, z.radius, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // 旋转炮台
        const turrets = rs._turrets;
        if (turrets) {
            for (const t of turrets) {
                const tx = player.x + Math.cos(t.angle) * t.orbitR - cameraX;
                const ty = player.y + Math.sin(t.angle) * t.orbitR - cameraY;
                ctx.save(); ctx.fillStyle = '#00aacc'; ctx.shadowBlur = 8; ctx.shadowColor = '#00ddff';
                ctx.beginPath(); ctx.arc(tx, ty, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // 地雷
        const mines = rs._mines?.mines;
        if (mines) {
            for (const m of mines) {
                const mx = m.x - cameraX, my = m.y - cameraY;
                const alpha = m.armed ? 0.8 : 0.3;
                ctx.save(); ctx.globalAlpha = alpha;
                ctx.fillStyle = m.armed ? '#ff4400' : '#ffaa00';
                ctx.shadowBlur = m.armed ? 8 : 3; ctx.shadowColor = '#ff4400';
                ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill();
                if (m.armed) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx, my, 2, 0, Math.PI * 2); ctx.fill(); }
                ctx.restore();
            }
        }

        // 反击幻象
        const phantoms = rs._phantoms;
        if (phantoms) {
            for (const p of phantoms) {
                const px = p.x - cameraX, py = p.y - cameraY;
                const fade = Math.max(0.1, p.life / 4);
                ctx.save(); ctx.globalAlpha = fade * 0.6;
                ctx.strokeStyle = '#88ff88'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(px, py, 25, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#88ff88'; ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // 残影爆炸
        const afterimages = rs._afterimages;
        if (afterimages) {
            for (const im of afterimages) {
                const ax = im.x - cameraX, ay = im.y - cameraY;
                const fade = Math.max(0, im.life / 0.5);
                ctx.save(); ctx.globalAlpha = fade * 0.8;
                ctx.fillStyle = '#aa66ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#9966ff';
                ctx.beginPath(); ctx.arc(ax, ay, 8, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // 残影陷阱
        const traps = rs._traps;
        if (traps) {
            for (const tr of traps) {
                const tx = tr.x - cameraX, ty = tr.y - cameraY;
                ctx.save(); ctx.globalAlpha = 0.6;
                ctx.strokeStyle = '#9966ff'; ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath(); ctx.arc(tx, ty, tr.radius, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#9966ff';
                ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // 时间幻象 / 幻影射手
        const echoes = rs._echoes;
        if (echoes) {
            for (const ec of echoes) {
                const ex = ec.x - cameraX, ey = ec.y - cameraY;
                ctx.save(); ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#cc99ff'; ctx.shadowBlur = 6; ctx.shadowColor = '#9966ff';
                ctx.beginPath(); ctx.arc(ex, ey, 10, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }
        const phantoms2 = rs._phantoms2;
        if (phantoms2) {
            for (const ph of phantoms2) {
                const px = ph.x - cameraX, py = ph.y - cameraY;
                ctx.save(); ctx.globalAlpha = 0.4;
                ctx.strokeStyle = '#9999ff'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#9999ff'; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        // 火焰环（超新星）
        if (rs._supernova && rs._supernova.timer < 2 && rs._supernova.timer > 0) {
            const snap = Math.max(0, 2 - rs._supernova.timer) / 2;
            ctx.save(); ctx.globalAlpha = snap * 0.6;
            ctx.strokeStyle = '#ff4400'; ctx.lineWidth = 6;
            ctx.shadowBlur = 20; ctx.shadowColor = '#ff2200';
            ctx.beginPath(); ctx.arc(player.x - cameraX, player.y - cameraY, 600 * (1 - snap), 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.SkillManager = SkillManager;
}
