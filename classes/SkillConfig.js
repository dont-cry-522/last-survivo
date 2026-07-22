/**
 * ============================================================
 *  SkillConfig.js - 技能系统全局配置
 * ============================================================
 *  定义稀有度、效果类型、流派分类、技能数据结构、进化条件
 *  不包含任何具体技能数据（空池待填充）
 * ============================================================
 */

class SkillRarity {
    static COMMON = 'common';
    static RARE = 'rare';
    static EPIC = 'epic';
    static LEGENDARY = 'legendary';

    /** 稀有度 → 属性映射 */
    static getProps(rarity) {
        const map = {
            common:    { color: '#9ca3af', name: '普通', weight: 50, maxTier: 3 },
            rare:      { color: '#3b82f6', name: '稀有', weight: 30, maxTier: 2 },
            epic:      { color: '#a855f7', name: '史诗', weight: 15, maxTier: 2 },
            legendary: { color: '#ffd700', name: '传说', weight: 5,  maxTier: 1 },
        };
        return map[rarity] || map.common;
    }

    static getColor(rarity) { return this.getProps(rarity).color; }
    static getName(rarity) { return this.getProps(rarity).name; }
    static getWeight(rarity) { return this.getProps(rarity).weight; }
    static getMaxTier(rarity) { return this.getProps(rarity).maxTier; }
}

/**
 * 效果触发类型 —— 定义技能"何时生效"
 */
class SkillEffectType {
    /** 修改弹道行为（子弹数量/散射/穿透/弹射等） */
    static PROJECTILE_MODIFIER = 'projectile_modifier';

    /** 子弹命中敌人时触发 */
    static ON_HIT = 'on_hit';

    /** 击杀敌人时触发 */
    static ON_KILL = 'on_kill';

    /** 使用 Dash 时触发 */
    static ON_DASH = 'on_dash';

    /** 玩家受到伤害时触发 */
    static ON_DAMAGED = 'on_damaged';

    /** 周期性自动触发 */
    static PERIODIC = 'periodic';

    /** 持续光环效果（每帧更新） */
    static AURA = 'aura';

    /** 召唤物管理 */
    static SUMMON = 'summon';

    /** 被动属性修改（不触发事件，持续生效） */
    static STAT_MODIFIER = 'stat_modifier';

    /** 暴击时触发 */
    static ON_CRIT = 'on_crit';

    /** 暴击率/暴击伤害修改 */
    static CRIT_MODIFIER = 'crit_modifier';

    /** 元素效果（灼烧/冻结/麻痹） */
    static ELEMENTAL = 'elemental';
}

/**
 * 技能流派分类 —— 对应八大进化路线
 */
class SkillCategory {
    static BULLET_STORM = 'bullet_storm';     // 枪弹风暴
    static INFERNO = 'inferno';               // 火焰
    static FROST = 'frost';                   // 冰霜
    static STORM = 'storm';                   // 雷电
    static SHADOW = 'shadow';                 // 暗影行者
    static BASTION = 'bastion';               // 钢铁壁垒
    static REAPER = 'reaper';                 // 死亡收割
    static SUMMONER = 'summoner';             // 召唤

    static getColor(category) {
        const map = {
            bullet_storm: '#00d4ff',
            inferno: '#ff6b6b',
            frost: '#74b9ff',
            storm: '#feca57',
            shadow: '#a855f7',
            bastion: '#7bed9f',
            reaper: '#ee5253',
            summoner: '#ffd700',
        };
        return map[category] || '#ffffff';
    }
}

/**
 * 进化条件类型
 */
class EvolutionCondition {
    static KILL_COUNT = 'kill_count';
    static DAMAGE_ELITE = 'damage_elite';
    static SURVIVAL_TIME = 'survival_time';
    static BOSS_KILLED = 'boss_killed';
    static LEVEL_REACHED = 'level_reached';
}

/**
 * 技能定义模板 —— 每个技能遵循此结构
 *
 * @typedef {Object} SkillDefinition
 * @property {string} id            - 唯一ID (如 'spread_shot')
 * @property {string} name          - 显示名称
 * @property {string} rarity        - SkillRarity 之一
 * @property {string} category      - SkillCategory 之一
 * @property {string} description   - 简短描述
 * @property {string} effectType    - SkillEffectType 之一
 * @property {string[]} synergies   - 可联动的其他技能 ID 列表
 * @property {Object} evolveCondition - { type: EvolutionCondition, value: number }
 * @property {Object[]} tiers       - 每阶参数 [{ desc, params }, ...]
 * @property {Function} apply       - (player, skillManager, params) => void
 */
class SkillConfig {
    /** @type {SkillDefinition[]} */
    static POOL = [
        // ==============================================================
        //  枪弹风暴 Bullet Storm
        // ==============================================================

        // ---- 普通 (Common) ----
        {
            id: 'spread_shot',
            name: '散射射击',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.BULLET_STORM,
            effectType: SkillEffectType.PROJECTILE_MODIFIER,
            description: '子弹变为扇形散射',
            synergies: ['bounce', 'splitter'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '同时发射 3 颗子弹，每颗伤害 60%', params: { bulletCount: 3, damageMul: 0.6, spread: 0.5 } },
                { desc: '5 颗子弹', params: { bulletCount: 5, damageMul: 0.65, spread: 0.5 } },
                { desc: '7 颗子弹，每颗伤害恢复至 80%', params: { bulletCount: 7, damageMul: 0.8, spread: 0.4 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (prevParams) {
                    player.bulletCount -= prevParams.bulletCount;
                    player.bulletDamage /= prevParams.damageMul;
                }
                player.bulletCount += params.bulletCount;
                player.bulletDamage *= params.damageMul;
                player._spreadAngle = params.spread;
            },
        },
        {
            id: 'dual_wield',
            name: '双持',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.BULLET_STORM,
            effectType: SkillEffectType.PROJECTILE_MODIFIER,
            description: '多个方向同时射击',
            synergies: ['spread_shot', 'overheat'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '从左右两侧同时发射，伤害 80%', params: { directions: 2, damageMul: 0.8 } },
                { desc: '伤害恢复至 100%', params: { directions: 2, damageMul: 1.0 } },
                { desc: '额外增加一个方向（3方向齐射）', params: { directions: 3, damageMul: 1.0 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (prevParams) {
                    player._dualWieldDirections = 0;
                }
                player._dualWieldDirections = params.directions;
                if (!prevParams || prevParams.damageMul !== params.damageMul) {
                    if (prevParams) player.bulletDamage /= prevParams.damageMul;
                    player.bulletDamage *= params.damageMul;
                }
            },
        },
        {
            id: 'armor_piercing',
            name: '穿甲弹',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.BULLET_STORM,
            effectType: SkillEffectType.PROJECTILE_MODIFIER,
            description: '穿透并逐次增伤',
            synergies: ['splitter', 'bounce'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '穿透 +2，每穿透一个伤害 +15%', params: { pierce: 2, dmgPerPierce: 0.15 } },
                { desc: '穿透 +3，+20%', params: { pierce: 3, dmgPerPierce: 0.2 } },
                { desc: '穿透 +5，+25%', params: { pierce: 5, dmgPerPierce: 0.25 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (prevParams) {
                    player.pierce -= prevParams.pierce;
                }
                player.pierce += params.pierce;
                player._pierceDmgBonus = params.dmgPerPierce;
            },
        },

        // ---- 稀有 (Rare) ----
        {
            id: 'bounce',
            name: '弹射',
            rarity: SkillRarity.RARE,
            category: SkillCategory.BULLET_STORM,
            effectType: SkillEffectType.ON_HIT,
            description: '子弹命中后弹向其他敌人',
            synergies: ['spread_shot', 'armor_piercing', 'splitter'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '命中后弹向 5m 内另一敌人，弹射 1 次，递减 20%', params: { bounces: 1, range: 250, decay: 0.2 } },
                { desc: '弹射 3 次，递减 10%', params: { bounces: 3, range: 300, decay: 0.1 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_HIT, 'bounce', function(ctx) {
                    const inst = sm.getSkill('bounce');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    let source = ctx.enemy;
                    for (let b = 0; b < p.bounces; b++) {
                        let nearest = null, nd2 = p.range * p.range;
                        for (let i = 0; i < ctx.enemies.length; i++) {
                            const e = ctx.enemies[i];
                            if (!e.active || e === source) continue;
                            const d2 = (source.x - e.x) ** 2 + (source.y - e.y) ** 2;
                            if (d2 < nd2) { nd2 = d2; nearest = e; }
                        }
                        if (!nearest) break;
                        const a = Math.atan2(nearest.y - source.y, nearest.x - source.x);
                        const dmg = ctx.bullet.damage * (1 - p.decay);
                        ctx.bulletManager.fire(source.x, source.y, a, dmg, ctx.bullet.speed, 0, nearest);
                        source = nearest;
                    }
                });
            },
        },
        {
            id: 'splitter',
            name: '分裂弹头',
            rarity: SkillRarity.RARE,
            category: SkillCategory.BULLET_STORM,
            effectType: SkillEffectType.ON_HIT,
            description: '子弹命中时分裂',
            synergies: ['spread_shot', 'armor_piercing', 'bounce'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '命中时向扇形分裂 2 颗小子弹（50% 伤害）', params: { count: 2, spreadAngle: 0.8, damageMul: 0.5 } },
                { desc: '分裂 4 颗，伤害 60%', params: { count: 4, spreadAngle: 0.8, damageMul: 0.6 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_HIT, 'splitter', function(ctx) {
                    const inst = sm.getSkill('splitter');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const baseAngle = Math.atan2(ctx.bullet.vy, ctx.bullet.vx);
                    for (let i = 0; i < p.count; i++) {
                        const spread = p.count > 1 ? (i - (p.count - 1) / 2) * p.spreadAngle / (p.count - 1) : 0;
                        const a = baseAngle + spread;
                        const dmg = ctx.bullet.damage * p.damageMul;
                        ctx.bulletManager.fire(ctx.enemy.x, ctx.enemy.y, a, dmg, ctx.bullet.speed * 0.7, 0, null);
                    }
                });
            },
        },
        {
            id: 'overheat',
            name: '过热连射',
            rarity: SkillRarity.RARE,
            category: SkillCategory.BULLET_STORM,
            effectType: SkillEffectType.ON_KILL,
            description: '击杀后提升攻速',
            synergies: ['spread_shot', 'dual_wield'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '击杀后 1 秒内攻速 +50%，可叠加 3 层', params: { maxStacks: 3, perStackAtkSpeed: 0.5, duration: 1 } },
                { desc: '可叠加 5 层，每层 +60%', params: { maxStacks: 5, perStackAtkSpeed: 0.6, duration: 1 } },
            ],
            apply: function(player, sm, params, prevParams) {
                player._overheat = { maxStacks: params.maxStacks, perStack: params.perStackAtkSpeed, duration: params.duration };
            },
        },

        // ---- 史诗 (Epic) ----
        {
            id: 'rotary_turret',
            name: '旋转枪阵',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.BULLET_STORM,
            effectType: SkillEffectType.SUMMON,
            description: '环绕炮台自动射击',
            synergies: ['overheat', 'spread_shot'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 60 },
            tiers: [
                { desc: '召唤 2 个微型炮台（继承 30% 伤害）', params: { count: 2, damageMul: 0.3 } },
                { desc: '4 个炮台，伤害 40%', params: { count: 4, damageMul: 0.4 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.SUMMON, 'rotary_turret', function(dt, ctx) {
                    const inst = sm.getSkill('rotary_turret');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._turrets) sm.runtimeState._turrets = [];
                    const turrets = sm.runtimeState._turrets;

                    while (turrets.length < p.count) {
                        const a = Math.random() * Math.PI * 2;
                        turrets.push({ angle: a, orbitR: 50, orbitSpeed: 2.5, fireTimer: 0, fireInterval: 0.6 });
                    }
                    while (turrets.length > p.count) turrets.pop();

                    for (const t of turrets) {
                        t.angle += t.orbitSpeed * dt;
                        const tx = ctx.player.x + Math.cos(t.angle) * t.orbitR;
                        const ty = ctx.player.y + Math.sin(t.angle) * t.orbitR;
                        t.fireTimer -= dt;
                        if (t.fireTimer <= 0) {
                            t.fireTimer = t.fireInterval;
                            let nearest = null, nd = 500 * 500;
                            for (const e of ctx.enemies) {
                                if (!e.active) continue;
                                const d2 = (tx - e.x) ** 2 + (ty - e.y) ** 2;
                                if (d2 < nd) { nd = d2; nearest = e; }
                            }
                            if (nearest) {
                                const a2 = Math.atan2(nearest.y - ty, nearest.x - tx);
                                const dmg = ctx.player.bulletDamage * p.damageMul;
                                ctx.bulletManager.fire(tx, ty, a2, dmg, ctx.player.bulletSpeed, ctx.player.pierce, nearest);
                            }
                        }
                    }
                });
            },
        },

        // ---- 传说 (Legendary) ----
        {
            id: 'terminator_barrage',
            name: '终结者弹幕',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.BULLET_STORM,
            effectType: SkillEffectType.PERIODIC,
            description: '移动时洒落地雷',
            synergies: ['spread_shot', 'overheat'],
            evolveCondition: null,
            tiers: [
                { desc: '移动时身后洒落地雷（每秒 3 颗），0.5 秒激活，100% 伤害，150 范围', params: { rate: 3, radius: 150, damageMul: 1.0, armTime: 0.5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.PERIODIC, 'terminator_barrage', function(dt, ctx) {
                    const inst = sm.getSkill('terminator_barrage');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._mines) sm.runtimeState._mines = { timer: 0, mines: [] };
                    const state = sm.runtimeState._mines;

                    const moving = ctx.player.keys.w || ctx.player.keys.a || ctx.player.keys.s || ctx.player.keys.d;
                    if (moving) {
                        state.timer -= dt;
                        if (state.timer <= 0) {
                            state.timer = 1 / p.rate;
                            state.mines.push({
                                x: ctx.player.x, y: ctx.player.y,
                                timer: p.armTime, armed: false, life: 8,
                                radius: p.radius, damage: ctx.player.bulletDamage * p.damageMul,
                            });
                        }
                    }

                    for (let i = state.mines.length - 1; i >= 0; i--) {
                        const m = state.mines[i];
                        if (!m.armed) { m.timer -= dt; if (m.timer <= 0) m.armed = true; continue; }
                        m.life -= dt;
                        if (m.life <= 0) { state.mines.splice(i, 1); continue; }
                        let exploded = false;
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            if ((m.x - e.x) ** 2 + (m.y - e.y) ** 2 < m.radius * m.radius) {
                                e.takeDamage(m.damage);
                                exploded = true;
                                break;
                            }
                        }
                        if (exploded) {
                            ctx.particleManager.spawnExplosion(m.x, m.y, '#ffd700', 10);
                            state.mines.splice(i, 1);
                        }
                    }
                });
            },
        },

        // ==============================================================
        //  火焰流 Inferno
        // ==============================================================

        {
            id: 'spark',
            name: '火种',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.INFERNO,
            effectType: SkillEffectType.ON_HIT,
            description: '子弹几率点燃敌人',
            synergies: ['incendiary', 'scorched_earth'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '30% 概率附加灼烧（3 层，每秒 20% 伤害，持续 2 秒）', params: { chance: 0.3, stacks: 3, dps: 0.2, duration: 2 } },
                { desc: '50% 概率，灼烧 5 层', params: { chance: 0.5, stacks: 5, dps: 0.25, duration: 3 } },
                { desc: '100% 概率，灼烧 8 层，每秒 30% 伤害', params: { chance: 1.0, stacks: 8, dps: 0.3, duration: 3 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.ON_HIT, 'spark', function(ctx) {
                    const inst = sm.getSkill('spark');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (Math.random() < p.chance) {
                        ctx.enemy.burnStacks = Math.min(p.stacks, (ctx.enemy.burnStacks || 0) + 1);
                        ctx.enemy.burnDmgPerStack = player.bulletDamage * p.dps;
                        ctx.enemy.burnTimer = p.duration;
                    }
                });
            },
        },
        {
            id: 'incendiary',
            name: '灼烧弹',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.INFERNO,
            effectType: SkillEffectType.ON_HIT,
            description: '每颗子弹必定灼烧',
            synergies: ['spark', 'chain_burn'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '每次命中叠加 1 层灼烧（上限 5，每秒 25% 伤害，3 秒）', params: { stacks: 1, maxStacks: 5, dps: 0.25, duration: 3 } },
                { desc: '上限 8 层，每秒 30%', params: { stacks: 1, maxStacks: 8, dps: 0.3, duration: 4 } },
                { desc: '上限 12 层，每秒 35%', params: { stacks: 1, maxStacks: 12, dps: 0.35, duration: 4 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.ON_HIT, 'incendiary', function(ctx) {
                    const inst = sm.getSkill('incendiary');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const cur = ctx.enemy.burnStacks || 0;
                    ctx.enemy.burnStacks = Math.min(p.maxStacks, cur + p.stacks);
                    ctx.enemy.burnDmgPerStack = player.bulletDamage * p.dps;
                    ctx.enemy.burnTimer = p.duration;
                });
            },
        },
        {
            id: 'scorched_earth',
            name: '燃烧地面',
            rarity: SkillRarity.RARE,
            category: SkillCategory.INFERNO,
            effectType: SkillEffectType.ON_CRIT,
            description: '暴击留下火焰区域',
            synergies: ['spark', 'hellfire'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '暴击时在命中位置生成火焰区域（120 范围，持续 4 秒，每秒 30% 伤害）', params: { radius: 120, duration: 4, dps: 0.3 } },
                { desc: '范围 180，持续 6 秒，40% 伤害', params: { radius: 180, duration: 6, dps: 0.4 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.ON_CRIT, 'scorched_earth', function(ctx) {
                    const inst = sm.getSkill('scorched_earth');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._fireZones) sm.runtimeState._fireZones = [];
                    sm.runtimeState._fireZones.push({
                        x: ctx.enemy.x, y: ctx.enemy.y,
                        radius: p.radius, life: p.duration,
                        dps: player.bulletDamage * p.dps,
                    });
                });
            },
        },
        {
            id: 'chain_burn',
            name: '连锁灼烧',
            rarity: SkillRarity.RARE,
            category: SkillCategory.INFERNO,
            effectType: SkillEffectType.PERIODIC,
            description: '灼烧敌人向附近传播',
            synergies: ['incendiary', 'firestorm'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 40 },
            tiers: [
                { desc: '每 2 秒，灼烧敌人向 150 范围内敌人传播 1 层灼烧', params: { interval: 2, range: 150, spreadStacks: 1 } },
                { desc: '每 1 秒，范围 200，传播 2 层', params: { interval: 1, range: 200, spreadStacks: 2 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'chain_burn', function(dt, ctx) {
                    const inst = sm.getSkill('chain_burn');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._burnSpread) sm.runtimeState._burnSpread = { timer: 0 };
                    const bs = sm.runtimeState._burnSpread;
                    bs.timer -= dt;
                    if (bs.timer > 0) return;
                    bs.timer = p.interval;
                    for (const e of ctx.enemies) {
                        if (!e.active || !e.burnStacks) continue;
                        for (const t of ctx.enemies) {
                            if (!t.active || t === e || t.burnStacks) continue;
                            const d2 = (e.x - t.x) ** 2 + (e.y - t.y) ** 2;
                            if (d2 < p.range * p.range) {
                                t.burnStacks = p.spreadStacks;
                                t.burnDmgPerStack = e.burnDmgPerStack;
                                t.burnTimer = 2;
                                break;
                            }
                        }
                    }
                });
            },
        },
        {
            id: 'firestorm',
            name: '火焰风暴',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.INFERNO,
            effectType: SkillEffectType.PERIODIC,
            description: '定时召唤陨石',
            synergies: ['chain_burn', 'hellfire'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 60 },
            tiers: [
                { desc: '每 10 次攻击，砸下陨石（250 范围，500% 伤害 + 灼烧 5 层）', params: { attackCount: 10, radius: 250, dmgMul: 5, burnStacks: 5 } },
                { desc: '每 7 次，范围 300，600% 伤害', params: { attackCount: 7, radius: 300, dmgMul: 6, burnStacks: 8 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'firestorm', function(dt, ctx) {
                    const inst = sm.getSkill('firestorm');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    let best = null, bestDensity = 0;
                    const grid = {};
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        const gx = Math.floor(e.x / 80), gy = Math.floor(e.y / 80);
                        const key = gx + ',' + gy;
                        grid[key] = (grid[key] || 0) + 1;
                        if (grid[key] > bestDensity) { bestDensity = grid[key]; best = { x: gx * 80 + 40, y: gy * 80 + 40 }; }
                    }
                    if (!best || !sm.runtimeState._attackCounter) sm.runtimeState._attackCounter = { count: 0 };
                    sm.runtimeState._attackCounter.count += 1;
                    if (sm.runtimeState._attackCounter.count >= p.attackCount) {
                        sm.runtimeState._attackCounter.count = 0;
                        if (!sm.runtimeState._fireZones) sm.runtimeState._fireZones = [];
                        sm.runtimeState._fireZones.push({
                            x: best.x, y: best.y, radius: p.radius, life: 4,
                            dps: player.bulletDamage * p.dmgMul * 0.25,
                        });
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            if ((best.x - e.x) ** 2 + (best.y - e.y) ** 2 < p.radius * p.radius) {
                                e.takeDamage(player.bulletDamage * p.dmgMul);
                                e.burnStacks = p.burnStacks;
                                e.burnDmgPerStack = player.bulletDamage * 0.2;
                                e.burnTimer = 3;
                            }
                        }
                        ctx.particleManager.spawnExplosion(best.x, best.y, '#ff6b00', 30);
                    }
                });
            },
        },
        {
            id: 'hellfire',
            name: '焦土',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.INFERNO,
            effectType: SkillEffectType.STAT_MODIFIER,
            description: '强化所有火焰区域',
            synergies: ['scorched_earth', 'firestorm'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '火焰区域范围 +50%，伤害 +50%，持续时间 +2 秒', params: { radiusMul: 1.5, dpsMul: 1.5, lifeBonus: 2 } },
                { desc: '范围 +100%，伤害 +100%，持续时间 +4 秒', params: { radiusMul: 2.0, dpsMul: 2.0, lifeBonus: 4 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.runtimeState._hellfire = params;
            },
        },
        {
            id: 'supernova',
            name: '超新星',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.INFERNO,
            effectType: SkillEffectType.PERIODIC,
            description: '全屏火焰环清场',
            synergies: ['firestorm', 'hellfire'],
            evolveCondition: null,
            tiers: [
                { desc: '每 60 秒，火焰环从屏幕边缘收缩到中心，灼烧所有敌人 5 层 + 300% 伤害', params: { cooldown: 60, dmgMul: 3, burnStacks: 5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'supernova', function(dt, ctx) {
                    const inst = sm.getSkill('supernova');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._supernova) sm.runtimeState._supernova = { timer: 0 };
                    sm.runtimeState._supernova.timer -= dt;
                    if (sm.runtimeState._supernova.timer > 0) return;
                    sm.runtimeState._supernova.timer = p.cooldown;
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        e.takeDamage(player.bulletDamage * p.dmgMul);
                        e.burnStacks = p.burnStacks;
                        e.burnDmgPerStack = player.bulletDamage * 0.3;
                        e.burnTimer = 5;
                    }
                    ctx.particleManager.spawnExplosion(ctx.player.x, ctx.player.y, '#ff4400', 50);
                });
            },
        },
        {
            id: 'phoenix',
            name: '浴火重生',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.INFERNO,
            effectType: SkillEffectType.ON_DAMAGED,
            description: '致命伤害时复活',
            synergies: ['supernova', 'hellfire'],
            evolveCondition: { type: EvolutionCondition.BOSS_KILLED, value: 1 },
            tiers: [
                { desc: '受到致命伤害时爆炸（250 范围 500% 伤害），回复 50% HP，冷却 180 秒', params: { radius: 250, dmgMul: 5, healPct: 0.5, cooldown: 180 } },
                { desc: '回复 75% HP，冷却 120 秒，范围 350', params: { radius: 350, dmgMul: 6, healPct: 0.75, cooldown: 120 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.ON_DAMAGED, 'phoenix', function(ctx) {
                    const inst = sm.getSkill('phoenix');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._phoenix) sm.runtimeState._phoenix = { onCd: false, timer: 0 };
                    const px = sm.runtimeState._phoenix;
                    if (px.onCd) { px.timer -= 0.016; if (px.timer <= 0) px.onCd = false; return; }
                    if (ctx.player.hp <= 0) {
                        px.onCd = true;
                        px.timer = p.cooldown;
                        ctx.player.hp = Math.floor(ctx.player.maxHp * p.healPct);
                        const x = ctx.player.x, y = ctx.player.y;
                        for (const e of ctx.game?.enemyManager?.pool || []) {
                            if (!e.active) continue;
                            if ((x - e.x) ** 2 + (y - e.y) ** 2 < p.radius * p.radius) {
                                e.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                            }
                        }
                    }
                });
            },
        },
    ];
}

// 共享辅助：确保燃烧处理器已注册
function _ensureBurnProcessor(sm) {
    if (sm.runtimeState._burnProcessorReady) return;
    sm.runtimeState._burnProcessorReady = true;
    sm.registerHandler(SkillEffectType.PERIODIC, '__burn__', function(dt, ctx) {
        const hellfire = sm.runtimeState._hellfire;
        // 处理敌人灼烧伤害
        for (const e of ctx.enemies) {
            if (!e.active || !e.burnStacks) continue;
            const dps = e.burnDmgPerStack * e.burnStacks;
            e.takeDamage(dps * dt);
        }
        // 处理火焰区域
        const zones = sm.runtimeState._fireZones;
        if (zones && zones.length > 0) {
            for (let i = zones.length - 1; i >= 0; i--) {
                const z = zones[i];
                z.life -= dt;
                if (z.life <= 0) { zones.splice(i, 1); continue; }
                const r = hellfire ? z.radius * hellfire.radiusMul : z.radius;
                const d = hellfire ? z.dps * hellfire.dpsMul : z.dps;
                const l = hellfire ? z.life + hellfire.lifeBonus : z.life;
                for (const e of ctx.enemies) {
                    if (!e.active) continue;
                    if ((z.x - e.x) ** 2 + (z.y - e.y) ** 2 < r * r) {
                        e.takeDamage(d * dt);
                        e.burnStacks = Math.min(5, (e.burnStacks || 0) + 1);
                        e.burnDmgPerStack = ctx.player.bulletDamage * 0.15;
                        e.burnTimer = Math.max(e.burnTimer || 0, 1);
                    }
                }
                if (hellfire) { z.radius = z.radius; z.life = l; z.dps = d; }
            }
        }
    });
}

if (typeof window !== 'undefined') {
    window.SkillRarity = SkillRarity;
    window.SkillEffectType = SkillEffectType;
    window.SkillCategory = SkillCategory;
    window.EvolutionCondition = EvolutionCondition;
    window.SkillConfig = SkillConfig;
}
