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
                { desc: '30% 概率附加灼烧（2 层，每秒 10% 伤害，持续 2 秒）', params: { chance: 0.3, stacks: 2, dps: 0.10, duration: 2 } },
                { desc: '50% 概率，灼烧 3 层，15% 伤害', params: { chance: 0.5, stacks: 3, dps: 0.12, duration: 3 } },
                { desc: '100% 概率，灼烧 5 层，每秒 18% 伤害', params: { chance: 1.0, stacks: 5, dps: 0.18, duration: 3 } },
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
                { desc: '每次命中叠加 1 层灼烧（上限 4，每秒 12% 伤害，3 秒）', params: { stacks: 1, maxStacks: 4, dps: 0.12, duration: 3 } },
                { desc: '上限 6 层，每秒 15%', params: { stacks: 1, maxStacks: 6, dps: 0.15, duration: 4 } },
                { desc: '上限 8 层，每秒 18%', params: { stacks: 1, maxStacks: 8, dps: 0.18, duration: 4 } },
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
                { desc: '暴击时在命中位置生成火焰区域（100 范围，持续 3 秒，每秒 15% 伤害）', params: { radius: 100, duration: 3, dps: 0.15 } },
                { desc: '范围 140，持续 4 秒，20% 伤害', params: { radius: 140, duration: 4, dps: 0.20 } },
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
                { desc: '每 4 秒在周围随机区域降下陨石（150 范围，200% 伤害 + 灼烧 3 层）', params: { cooldown: 4, radius: 150, dmgMul: 2, burnStacks: 3 } },
                { desc: '每 3 秒，范围 180，250% 伤害', params: { cooldown: 3, radius: 180, dmgMul: 2.5, burnStacks: 5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'firestorm', function(dt, ctx) {
                    const inst = sm.getSkill('firestorm');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._firestormTimer) sm.runtimeState._firestormTimer = 0;
                    sm.runtimeState._firestormTimer -= dt;
                    if (sm.runtimeState._firestormTimer > 0) return;
                    sm.runtimeState._firestormTimer = p.cooldown;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 80 + Math.random() * 200;
                    const fx = ctx.player.x + Math.cos(angle) * dist;
                    const fy = ctx.player.y + Math.sin(angle) * dist;
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        if ((fx - e.x) ** 2 + (fy - e.y) ** 2 < p.radius * p.radius) {
                            e.takeDamage(player.bulletDamage * p.dmgMul);
                            e.burnStacks = p.burnStacks;
                            e.burnDmgPerStack = player.bulletDamage * 0.1;
                            e.burnTimer = 3;
                        }
                    }
                    if (!sm.runtimeState._fireZones) sm.runtimeState._fireZones = [];
                    sm.runtimeState._fireZones.push({ x: fx, y: fy, radius: p.radius, life: 3, dps: player.bulletDamage * p.dmgMul * 0.1 });
                    ctx.particleManager.spawnExplosion(fx, fy, '#ff6600', 20);
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
                { desc: '火焰区域范围 +30%，伤害 +30%，持续时间 +1 秒', params: { radiusMul: 1.3, dpsMul: 1.3, lifeBonus: 1 } },
                { desc: '范围 +60%，伤害 +60%，持续时间 +2 秒', params: { radiusMul: 1.6, dpsMul: 1.6, lifeBonus: 2 } },
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
                { desc: '每 60 秒，火焰环从屏幕边缘收缩到中心，灼烧所有敌人 3 层 + 200% 伤害', params: { cooldown: 60, dmgMul: 2, burnStacks: 3 } },
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
                { desc: '受到致命伤害时爆炸（200 范围 300% 伤害），回复 40% HP，冷却 240 秒', params: { radius: 200, dmgMul: 3, healPct: 0.4, cooldown: 240 } },
                { desc: '回复 60% HP，冷却 180 秒，范围 250', params: { radius: 250, dmgMul: 4, healPct: 0.6, cooldown: 180 } },
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

        // ==============================================================
        //  冰霜流 Frost
        // ==============================================================

        {
            id: 'frost_rounds',
            name: '霜弹',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.FROST,
            effectType: SkillEffectType.ON_HIT,
            description: '子弹减速敌人',
            synergies: ['freeze', 'shatter'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '命中减速 30%，持续 2 秒，额外 10% 伤害', params: { slow: 0.3, duration: 2, dmgBonus: 0.1 } },
                { desc: '减速 50%，持续 3 秒，+20% 伤害', params: { slow: 0.5, duration: 3, dmgBonus: 0.2 } },
                { desc: '减速 70%，首次命中冻结 0.5 秒，+30% 伤害', params: { slow: 0.7, duration: 3, freeze: 0.5, dmgBonus: 0.3 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_HIT, 'frost_rounds', function(ctx) {
                    const inst = sm.getSkill('frost_rounds');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    ctx.enemy.slowAmount = Math.max(ctx.enemy.slowAmount || 0, p.slow);
                    ctx.bullet.damage *= (1 + p.dmgBonus);
                    if (p.freeze && !ctx.enemy.slowAmount) {
                        ctx.enemy.frozen = true;
                        ctx.enemy.frozenTimer = p.freeze;
                    }
                });
            },
        },
        {
            id: 'freeze',
            name: '冻结',
            rarity: SkillRarity.RARE,
            category: SkillCategory.FROST,
            effectType: SkillEffectType.ON_HIT,
            description: '多次命中冻结敌人',
            synergies: ['frost_rounds', 'shatter'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '减速敌人 1 秒内被命中 3 次 → 冻结 1.5 秒', params: { hitsNeeded: 3, window: 1, freezeDuration: 1.5 } },
                { desc: '命中 2 次 → 冻结 2.5 秒', params: { hitsNeeded: 2, window: 1, freezeDuration: 2.5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_HIT, 'freeze', function(ctx) {
                    const inst = sm.getSkill('freeze');
                    if (!inst) return;
                    if (!ctx.enemy.slowAmount) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._freezeHits) sm.runtimeState._freezeHits = {};
                    const key = ctx.enemy.x.toFixed(0) + ',' + ctx.enemy.y.toFixed(0);
                    const now = performance.now() / 1000;
                    if (!sm.runtimeState._freezeHits[key]) sm.runtimeState._freezeHits[key] = { hits: 0, time: now };
                    const h = sm.runtimeState._freezeHits[key];
                    if (now - h.time > p.window) { h.hits = 0; h.time = now; }
                    h.hits++;
                    if (h.hits >= p.hitsNeeded) {
                        ctx.enemy.frozen = true;
                        ctx.enemy.frozenTimer = p.freezeDuration;
                        h.hits = 0;
                    }
                });
            },
        },
        {
            id: 'shatter',
            name: '碎冰',
            rarity: SkillRarity.RARE,
            category: SkillCategory.FROST,
            effectType: SkillEffectType.ON_CRIT,
            description: '冻结敌人受伤加倍',
            synergies: ['frost_rounds', 'freeze'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '攻击冻结敌人必定暴击，暴击伤害 +150%', params: { critDmgBonus: 1.5 } },
                { desc: '暴击伤害 +300%，碎冰时冰环（180 范围 120% 伤害）', params: { critDmgBonus: 3.0, novaRadius: 180, novaDmg: 1.2 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_HIT, 'shatter', function(ctx) {
                    const inst = sm.getSkill('shatter');
                    if (!inst) return;
                    if (!ctx.enemy.frozen) return;
                    const p = inst.getCurrentEffect().params;
                    ctx.bullet.isCrit = true;
                    ctx.bullet.damage *= (1 + p.critDmgBonus);
                    if (p.novaRadius) {
                        for (const e of ctx.enemies) {
                            if (!e.active || e === ctx.enemy) continue;
                            if ((ctx.enemy.x - e.x) ** 2 + (ctx.enemy.y - e.y) ** 2 < p.novaRadius * p.novaRadius) {
                                e.takeDamage(ctx.bullet.damage * p.novaDmg);
                                e.slowAmount = 0.5;
                            }
                        }
                        ctx.particleManager.spawnExplosion(ctx.enemy.x, ctx.enemy.y, '#88ccff', 12);
                    }
                });
            },
        },
        {
            id: 'frost_aura',
            name: '冰霜光环',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.FROST,
            effectType: SkillEffectType.AURA,
            description: '周围敌人持续减速',
            synergies: ['freeze', 'deep_freeze'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '自身周围 250 范围敌人每秒增加 20% 减速', params: { radius: 250, slowPerSec: 0.2 } },
                { desc: '范围 350，每秒 30% 减速', params: { radius: 350, slowPerSec: 0.3 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'frost_aura', function(dt, ctx) {
                    const inst = sm.getSkill('frost_aura');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        const d2 = (ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2;
                        if (d2 < p.radius * p.radius) {
                            e.slowAmount = Math.min(0.8, (e.slowAmount || 0) + p.slowPerSec * dt);
                        }
                    }
                });
            },
        },
        {
            id: 'ice_nova',
            name: '冰爆',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.FROST,
            effectType: SkillEffectType.ON_KILL,
            description: '击杀触发冰环',
            synergies: ['frost_rounds', 'absolute_zero'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 40 },
            tiers: [
                { desc: '每击杀 8 个敌人释放冰环（200 范围，减速 80%+60% 伤害）', params: { killsNeeded: 8, radius: 200, slow: 0.8, dmgMul: 0.6 } },
                { desc: '每 6 个，范围 250，80% 伤害', params: { killsNeeded: 6, radius: 250, slow: 0.8, dmgMul: 0.8 } },
                { desc: '每 4 个，范围 300，120% 伤害', params: { killsNeeded: 4, radius: 300, slow: 0.8, dmgMul: 1.2 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._iceNova) sm.runtimeState._iceNova = { kills: 0 };
                sm.runtimeState._iceNova.kills = 0;
                sm.registerHandler(SkillEffectType.ON_KILL, 'ice_nova', function(ctx) {
                    const inst = sm.getSkill('ice_nova');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._iceNova) sm.runtimeState._iceNova = { kills: 0 };
                    sm.runtimeState._iceNova.kills += ctx.count || 1;
                    if (sm.runtimeState._iceNova.kills >= p.killsNeeded) {
                        sm.runtimeState._iceNova.kills = 0;
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            const d2 = (ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2;
                            if (d2 < p.radius * p.radius) {
                            e.slowAmount = p.slow;
                            e.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                            }
                        }
                        ctx.particleManager.spawnExplosion(ctx.player.x, ctx.player.y, '#aaddff', 15);
                    }
                });
            },
        },
        {
            id: 'absolute_zero',
            name: '绝对零度',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.FROST,
            effectType: SkillEffectType.PERIODIC,
            description: '冻结死亡链式爆炸',
            synergies: ['ice_nova', 'deep_freeze'],
            evolveCondition: null,
            tiers: [
                { desc: '冻结敌人死亡时爆炸冻结周围 200 范围敌人 2 秒', params: { radius: 200, freezeDuration: 2 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.PERIODIC, 'absolute_zero', function(dt, ctx) {
                    const inst = sm.getSkill('absolute_zero');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    for (const e of ctx.enemies) {
                        if (!e.active || !e.frozen || e.hp > 0) continue;
                        e.hp = 0; e.active = false;
                        ctx.particleManager.spawnExplosion(e.x, e.y, '#88ccff', 10);
                        for (const t of ctx.enemies) {
                            if (!t.active || t === e) continue;
                            if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 < p.radius * p.radius) {
                                t.frozen = true;
                                t.frozenTimer = p.freezeDuration;
                                t.slowAmount = 0.5;
                            }
                        }
                    }
                });
            },
        },
        {
            id: 'ice_armor',
            name: '寒冰护甲',
            rarity: SkillRarity.RARE,
            category: SkillCategory.FROST,
            effectType: SkillEffectType.ON_DAMAGED,
            description: '周期性获得冰甲',
            synergies: ['frost_aura', 'deep_freeze'],
            evolveCondition: { type: EvolutionCondition.SURVIVAL_TIME, value: 120 },
            tiers: [
                { desc: '每 10 秒获得冰甲，抵消一次伤害并冻结攻击者 1 秒', params: { interval: 10, freezeDuration: 1 } },
                { desc: '每 7 秒，冻结 2 秒 + 减速 50%', params: { interval: 7, freezeDuration: 2, slow: 0.5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._iceArmor) sm.runtimeState._iceArmor = { timer: 0, active: false };
                sm.runtimeState._iceArmor._timer = 0;
                sm.registerHandler(SkillEffectType.ON_DAMAGED, 'ice_armor', function(ctx) {
                    const inst = sm.getSkill('ice_armor');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._iceArmor) sm.runtimeState._iceArmor = { timer: 0, active: false };
                    const ia = sm.runtimeState._iceArmor;
                    if (ia.active) {
                        ia.active = false;
                        ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + ctx.amount);
                        ctx.player.hp = Math.max(ctx.player.hp, 1);
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            const d2 = (ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2;
                            if (d2 < 150 * 150) {
                                e.frozen = true;
                                e.frozenTimer = p.freezeDuration;
                                if (p.slow) e.slowAmount = p.slow;
                            }
                        }
                        return;
                    }
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'ice_armor_timer', function(dt) {
                    const inst = sm.getSkill('ice_armor');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._iceArmor) sm.runtimeState._iceArmor = { timer: 0, active: false };
                    const ia = sm.runtimeState._iceArmor;
                    if (!ia.active) {
                        ia.timer -= dt;
                        if (ia.timer <= 0) { ia.active = true; ia.timer = p.interval; }
                    }
                });
            },
        },
        {
            id: 'deep_freeze',
            name: '深寒',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.FROST,
            effectType: SkillEffectType.STAT_MODIFIER,
            description: '强化冻结效果',
            synergies: ['freeze', 'absolute_zero'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '冻结时间 +1 秒，冻结敌人每秒受到 4% 最大生命伤害', params: { freezeBonus: 1, hpDps: 0.04 } },
                { desc: '冻结时间 +2 秒，每秒 6% 最大生命伤害', params: { freezeBonus: 2, hpDps: 0.06 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.runtimeState._deepFreeze = params;
                sm.registerHandler(SkillEffectType.PERIODIC, 'deep_freeze', function(dt, ctx) {
                    const inst = sm.getSkill('deep_freeze');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    for (const e of ctx.enemies) {
                        if (!e.active || !e.frozen) continue;
                        e.takeDamage(e.maxHp * p.hpDps * dt);
                    }
                });
            },
        },

        // ==============================================================
        //  雷电流 Storm
        // ==============================================================

        {
            id: 'tesla_rounds',
            name: '电击弹',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.STORM,
            effectType: SkillEffectType.ON_HIT,
            description: '子弹几率麻痹 + 额外电击伤害',
            synergies: ['chain_lightning', 'storm_cloud'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '30% 概率附带 30% 电击伤害 + 麻痹 0.3 秒', params: { chance: 0.3, elecDmg: 0.3, paralyze: 0.3 } },
                { desc: '50% 概率，电击 40%，麻痹 0.5 秒', params: { chance: 0.5, elecDmg: 0.4, paralyze: 0.5 } },
                { desc: '70% 概率，电击 50%，麻痹 0.6 秒 + 传导 1m 内另一个敌人', params: { chance: 0.7, elecDmg: 0.5, paralyze: 0.6, spread: 1 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.ON_HIT, 'tesla_rounds', function(ctx) {
                    const inst = sm.getSkill('tesla_rounds');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (Math.random() >= p.chance) return;
                    ctx.enemy.paralyzed = true;
                    ctx.enemy.paralyzeTimer = p.paralyze;
                    ctx.enemy.takeDamage(player.bulletDamage * p.elecDmg);
                    if (p.spread) {
                        for (const e of ctx.enemies) {
                            if (!e.active || e === ctx.enemy) continue;
                            if ((ctx.enemy.x - e.x) ** 2 + (ctx.enemy.y - e.y) ** 2 < 100 * 100) {
                                e.paralyzed = true; e.paralyzeTimer = p.paralyze * 0.5;
                                e.takeDamage(player.bulletDamage * p.elecDmg * 0.5);
                                ctx.particleManager.spawnHit(e.x, e.y, '#ffee44', 3);
                                break;
                            }
                        }
                    }
                    ctx.particleManager.spawnHit(ctx.enemy.x, ctx.enemy.y, '#ffff44', 4);
                });
            },
        },
        {
            id: 'chain_lightning',
            name: '连锁闪电',
            rarity: SkillRarity.RARE,
            category: SkillCategory.STORM,
            effectType: SkillEffectType.ON_HIT,
            description: '闪电链传导',
            synergies: ['tesla_rounds', 'storm_cloud'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '命中后闪电跳向 180 内另一敌人，跳 2 次，每次 70% 伤害', params: { range: 180, bounces: 2, dmgMul: 0.7 } },
                { desc: '跳 4 次，范围 250，80% 伤害', params: { range: 250, bounces: 4, dmgMul: 0.8 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.ON_HIT, 'chain_lightning', function(ctx) {
                    const inst = sm.getSkill('chain_lightning');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    let source = ctx.enemy;
                    const hit = new Set();
                    hit.add(source);
                    for (let b = 0; b < p.bounces; b++) {
                        let nearest = null, nd2 = p.range * p.range;
                        for (const e of ctx.enemies) {
                            if (!e.active || hit.has(e)) continue;
                            const d2 = (source.x - e.x) ** 2 + (source.y - e.y) ** 2;
                            if (d2 < nd2) { nd2 = d2; nearest = e; }
                        }
                        if (!nearest) break;
                        hit.add(nearest);
                        nearest.takeDamage(player.bulletDamage * p.dmgMul);
                        nearest.paralyzed = true; nearest.paralyzeTimer = 0.3;
                        ctx.particleManager.spawnHit(nearest.x, nearest.y, '#ffff66', 5);
                        source = nearest;
                    }
                });
            },
        },
        {
            id: 'storm_cloud',
            name: '雷暴云',
            rarity: SkillRarity.RARE,
            category: SkillCategory.STORM,
            effectType: SkillEffectType.PERIODIC,
            description: '头顶雷云自动雷击',
            synergies: ['chain_lightning', 'ion_cannon'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 40 },
            tiers: [
                { desc: '每 2 秒对身下随机敌人释放闪电（120% 伤害 + 麻痹 0.5 秒）', params: { interval: 2, dmgMul: 1.2, paralyze: 0.5 } },
                { desc: '每 1 秒，150% 伤害，麻痹 0.8 秒', params: { interval: 1, dmgMul: 1.5, paralyze: 0.8 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'storm_cloud', function(dt, ctx) {
                    const inst = sm.getSkill('storm_cloud');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._stormCloud) sm.runtimeState._stormCloud = { timer: 0 };
                    const sc = sm.runtimeState._stormCloud;
                    sc.timer -= dt;
                    if (sc.timer > 0) return;
                    const ion = sm.getSkill('ion_cannon');
                    sc.timer = ion ? p.interval * 0.6 : p.interval;
                    const candidates = [];
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        const d2 = (ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2;
                        if (d2 < 300 * 300) candidates.push(e);
                    }
                    if (candidates.length > 0) {
                        const t = candidates[Math.floor(Math.random() * candidates.length)];
                        t.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                        t.paralyzed = true; t.paralyzeTimer = p.paralyze;
                        ctx.particleManager.spawnExplosion(t.x, t.y, '#ffff66', 8);
                    }
                });
            },
        },
        {
            id: 'thunder_strike',
            name: '落雷',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.STORM,
            effectType: SkillEffectType.PERIODIC,
            description: '定时重雷打击',
            synergies: ['storm_cloud', 'wrath'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '每 8 秒对最密敌人区域降下巨雷（250 范围，300% 伤害 + 麻痹 1 秒）', params: { cooldown: 8, radius: 250, dmgMul: 3, paralyze: 1 } },
                { desc: '每 5 秒，范围 300，400% 伤害', params: { cooldown: 5, radius: 300, dmgMul: 4, paralyze: 1 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'thunder_strike', function(dt, ctx) {
                    const inst = sm.getSkill('thunder_strike');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._thunder) sm.runtimeState._thunder = { timer: 0 };
                    sm.runtimeState._thunder.timer -= dt;
                    if (sm.runtimeState._thunder.timer > 0) return;
                    sm.runtimeState._thunder.timer = p.cooldown;
                    const grid = {}; let best = null, bestN = 0;
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        const gx = Math.floor(e.x / 80), gy = Math.floor(e.y / 80), k = gx + ',' + gy;
                        grid[k] = (grid[k] || 0) + 1;
                        if (grid[k] > bestN) { bestN = grid[k]; best = { x: gx * 80 + 40, y: gy * 80 + 40 }; }
                    }
                    if (!best) return;
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        if ((best.x - e.x) ** 2 + (best.y - e.y) ** 2 < p.radius * p.radius) {
                            e.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                            e.paralyzed = true; e.paralyzeTimer = p.paralyze;
                        }
                    }
                    for (let i = 0; i < 8; i++) {
                        ctx.particleManager.spawnTrail(
                            best.x + (Math.random() - 0.5) * p.radius, best.y + (Math.random() - 0.5) * p.radius,
                            Math.PI / 2 + Math.random() * 0.3, '#ffff66'
                        );
                    }
                });
            },
        },
        {
            id: 'ion_cannon',
            name: '离子炮',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.STORM,
            effectType: SkillEffectType.STAT_MODIFIER,
            description: '强化所有雷电效果',
            synergies: ['chain_lightning', 'storm_cloud'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '连锁闪电 +2 跳，雷暴云 +40% 速度，所有电击伤害 +30%', params: { extraBounces: 2, cloudSpeedMul: 0.6, dmgBonus: 0.3 } },
                { desc: '连锁 +4 跳，雷云 +60% 速度，电击 +50%', params: { extraBounces: 4, cloudSpeedMul: 0.5, dmgBonus: 0.5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.runtimeState._ionCannon = params;
            },
        },
        {
            id: 'static_field',
            name: '静电领域',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.STORM,
            effectType: SkillEffectType.AURA,
            description: '周围敌人自动连锁',
            synergies: ['chain_lightning', 'tesla_rounds'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '周围 200 内超过 4 个敌人时自动释放闪电链（2 跳，80% 伤害）', params: { radius: 200, threshold: 4, bounces: 2, dmgMul: 0.8 } },
                { desc: '超过 3 个，范围 250，4 跳，100% 伤害', params: { radius: 250, threshold: 3, bounces: 4, dmgMul: 1.0 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'static_field', function(dt, ctx) {
                    const inst = sm.getSkill('static_field');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._staticField) sm.runtimeState._staticField = { timer: 0 };
                    sm.runtimeState._staticField.timer -= dt;
                    if (sm.runtimeState._staticField.timer > 0) return;
                    sm.runtimeState._staticField.timer = 1.5;
                    const nearby = [];
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        if ((ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2 < p.radius * p.radius) nearby.push(e);
                    }
                    if (nearby.length < p.threshold) return;
                    let source = nearby[Math.floor(Math.random() * nearby.length)];
                    const hit = new Set(); hit.add(source);
                    for (let b = 0; b < p.bounces; b++) {
                        let nearest = null, nd2 = p.radius * p.radius;
                        for (const e of nearby) {
                            if (hit.has(e)) continue;
                            const d2 = (source.x - e.x) ** 2 + (source.y - e.y) ** 2;
                            if (d2 < nd2) { nd2 = d2; nearest = e; }
                        }
                        if (!nearest) break;
                        hit.add(nearest);
                        nearest.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                        nearest.paralyzed = true; nearest.paralyzeTimer = 0.3;
                        ctx.particleManager.spawnHit(nearest.x, nearest.y, '#ffff88', 4);
                        source = nearest;
                    }
                });
            },
        },
        {
            id: 'emp',
            name: '电磁脉冲',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.STORM,
            effectType: SkillEffectType.ON_KILL,
            description: '击杀释放电磁脉冲',
            synergies: ['chain_lightning', 'static_field'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 40 },
            tiers: [
                { desc: '击杀时对周围 180 敌人释放 60% 伤害 + 麻痹 0.5 秒', params: { radius: 180, dmgMul: 0.6, paralyze: 0.5 } },
                { desc: '范围 220，80% 伤害', params: { radius: 220, dmgMul: 0.8, paralyze: 0.6 } },
                { desc: '范围 280，100% 伤害 + 连锁 1 次', params: { radius: 280, dmgMul: 1.0, paralyze: 0.7, chain: 1 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.ON_KILL, 'emp', function(ctx) {
                    const inst = sm.getSkill('emp');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const x = ctx.player.x, y = ctx.player.y;
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        if ((x - e.x) ** 2 + (y - e.y) ** 2 < p.radius * p.radius) {
                            e.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                            e.paralyzed = true; e.paralyzeTimer = p.paralyze;
                        }
                    }
                    ctx.particleManager.spawnExplosion(x, y, '#ffff44', 20);
                });
            },
        },
        {
            id: 'wrath',
            name: '天罚',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.STORM,
            effectType: SkillEffectType.PERIODIC,
            description: '全屏雷击审判',
            synergies: ['thunder_strike', 'ion_cannon'],
            evolveCondition: null,
            tiers: [
                { desc: '每 45 秒，对全屏随机敌人连续降下 10 道巨雷（200 范围，300% 伤害 + 麻痹 1 秒）', params: { cooldown: 45, count: 10, radius: 200, dmgMul: 3, paralyze: 1 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.registerHandler(SkillEffectType.PERIODIC, 'wrath', function(dt, ctx) {
                    const inst = sm.getSkill('wrath');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._wrath) sm.runtimeState._wrath = { timer: p.cooldown };
                    const w = sm.runtimeState._wrath;
                    w.timer -= dt;
                    if (w.timer > 0) return;
                    w.timer = p.cooldown;
                    for (let i = 0; i < p.count; i++) {
                        const candidates = [];
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            candidates.push(e);
                        }
                        if (candidates.length === 0) break;
                        const t = candidates[Math.floor(Math.random() * candidates.length)];
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            if ((t.x - e.x) ** 2 + (t.y - e.y) ** 2 < p.radius * p.radius) {
                                e.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                                e.paralyzed = true; e.paralyzeTimer = p.paralyze;
                            }
                        }
                        ctx.particleManager.spawnExplosion(t.x, t.y, '#ffff66', 10);
                    }
                });
            },
        },

        // ==============================================================
        //  钢铁壁垒 Bastion
        // ==============================================================

        {
            id: 'reinforced_shield',
            name: '强化护盾',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.BASTION,
            effectType: SkillEffectType.STAT_MODIFIER,
            description: '护盾吸收伤害 + 自动回复',
            synergies: ['thorns', 'sanctuary'],
            evolveCondition: { type: EvolutionCondition.SURVIVAL_TIME, value: 120 },
            tiers: [
                { desc: '获得 80 点护盾，护盾存在时每秒回复 3 点', params: { shield: 80, regen: 3 } },
                { desc: '120 护盾，回复 5/秒', params: { shield: 120, regen: 5 } },
                { desc: '180 护盾，回复 8/秒，护盾存在时攻击 +15%', params: { shield: 180, regen: 8, atkBonus: 0.15 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (prevParams) player.shield = Math.max(0, player.shield - prevParams.shield);
                player.shield += params.shield;
                sm.runtimeState._shieldRegen = params.regen;
                sm.runtimeState._shieldMax = player.shield;
                if (params.atkBonus) { player.attackSpeed *= (1 + params.atkBonus) / (1 + (prevParams?.atkBonus || 0)); }
            },
        },
        {
            id: 'thorns',
            name: '荆棘之甲',
            rarity: SkillRarity.RARE,
            category: SkillCategory.BASTION,
            effectType: SkillEffectType.ON_DAMAGED,
            description: '受伤反弹伤害',
            synergies: ['reinforced_shield', 'holy_aura'],
            evolveCondition: { type: EvolutionCondition.SURVIVAL_TIME, value: 180 },
            tiers: [
                { desc: '受到近战伤害时反弹 200% 给攻击者', params: { reflectMul: 2.0 } },
                { desc: '反弹 400%，范围伤害 150', params: { reflectMul: 4.0, radius: 150 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_DAMAGED, 'thorns', function(ctx) {
                    const inst = sm.getSkill('thorns');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        const d2 = (ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2;
                        if (d2 < (p.radius || 60) * (p.radius || 60)) {
                            e.takeDamage(ctx.amount * p.reflectMul);
                        }
                    }
                });
            },
        },
        {
            id: 'sanctuary',
            name: '庇护所',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.BASTION,
            effectType: SkillEffectType.STAT_MODIFIER,
            description: '站桩减伤回血',
            synergies: ['reinforced_shield', 'counter_stance'],
            evolveCondition: { type: EvolutionCondition.SURVIVAL_TIME, value: 120 },
            tiers: [
                { desc: '原地站立 1.5 秒后伤害减免 30%，移动后衰减', params: { reduction: 0.3, standTime: 1.5 } },
                { desc: '减免 50%，站立 0.8 秒', params: { reduction: 0.5, standTime: 0.8 } },
                { desc: '减免 65%，站立时每秒回复 2% 最大生命', params: { reduction: 0.65, standTime: 0.8, healPct: 0.02 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._sanctuary) sm.runtimeState._sanctuary = { standTimer: 0, active: false };
                sm.runtimeState._sanctuary.active = false;
                sm.runtimeState._sanctuary.standTimer = 0;
                sm.registerHandler(SkillEffectType.PERIODIC, 'sanctuary', function(dt, ctx) {
                    const inst = sm.getSkill('sanctuary');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._sanctuary) sm.runtimeState._sanctuary = { standTimer: 0, active: false };
                    const s = sm.runtimeState._sanctuary;
                    const moving = ctx.player.keys.w || ctx.player.keys.a || ctx.player.keys.s || ctx.player.keys.d;
                    if (moving) { s.standTimer = 0; s.active = false; }
                    else { s.standTimer += dt; }
                    s.active = s.standTimer >= p.standTime;
                    if (s.active && p.healPct) {
                        ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + ctx.player.maxHp * p.healPct * dt);
                    }
                });
            },
        },
        {
            id: 'reflect_shield',
            name: '反弹护盾',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.BASTION,
            effectType: SkillEffectType.PERIODIC,
            description: '周期性无敌反弹',
            synergies: ['reinforced_shield', 'thorns'],
            evolveCondition: { type: EvolutionCondition.BOSS_KILLED, value: 1 },
            tiers: [
                { desc: '每 15 秒获得 2 秒无敌，期间全额反弹伤害', params: { cooldown: 15, duration: 2 } },
                { desc: '每 10 秒，持续 3 秒 + 反弹 300%', params: { cooldown: 10, duration: 3, reflectMul: 3 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._reflectShield) sm.runtimeState._reflectShield = { timer: 0, active: false, activeTimer: 0 };
                sm.registerHandler(SkillEffectType.PERIODIC, 'reflect_shield', function(dt) {
                    const inst = sm.getSkill('reflect_shield');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const rs = sm.runtimeState._reflectShield;
                    if (rs.active) { rs.activeTimer -= dt; if (rs.activeTimer <= 0) rs.active = false; return; }
                    rs.timer -= dt;
                    if (rs.timer <= 0) { rs.active = true; rs.activeTimer = p.duration; rs.timer = p.cooldown; }
                });
            },
        },
        {
            id: 'unbreakable',
            name: '不坏金身',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.BASTION,
            effectType: SkillEffectType.ON_DAMAGED,
            description: '大伤害上限',
            synergies: ['reinforced_shield', 'holy_aura'],
            evolveCondition: null,
            tiers: [
                { desc: '受到超过 30% 最大生命伤害时，降至 30%，冷却 15 秒', params: { threshold: 0.3, cap: 0.3, cooldown: 15 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._unbreakable) sm.runtimeState._unbreakable = { onCd: false, timer: 0 };
                sm.registerHandler(SkillEffectType.ON_DAMAGED, 'unbreakable', function(ctx) {
                    const inst = sm.getSkill('unbreakable');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const ub = sm.runtimeState._unbreakable;
                    if (ub.onCd) { ub.timer -= 0.016; if (ub.timer <= 0) ub.onCd = false; return; }
                    if (ctx.amount > ctx.player.maxHp * p.threshold) {
                        const capped = ctx.player.maxHp * p.cap;
                        ctx.player.hp = Math.max(1, ctx.player.hp + ctx.amount - capped);
                        ub.onCd = true; ub.timer = p.cooldown;
                    }
                });
            },
        },
        {
            id: 'life_leech',
            name: '生命汲取',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.BASTION,
            effectType: SkillEffectType.ON_KILL,
            description: '击杀回复生命',
            synergies: ['thorns', 'holy_aura'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '击杀回复 3 点生命', params: { heal: 3 } },
                { desc: '击杀回复 5 点', params: { heal: 5 } },
                { desc: '击杀回复 8 点，精英回复 30 点', params: { heal: 8, eliteHeal: 30 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_KILL, 'life_leech', function(ctx) {
                    const inst = sm.getSkill('life_leech');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + p.heal);
                });
            },
        },
        {
            id: 'counter_stance',
            name: '反击姿态',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.BASTION,
            effectType: SkillEffectType.ON_DASH,
            description: '冲刺留嘲讽幻象 + 冲击波',
            synergies: ['sanctuary', 'reflect_shield'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 40 },
            tiers: [
                { desc: '冲刺留下嘲讽幻象（持续 2 秒，150 范围），结束时冲击波 200% 伤害', params: { duration: 2, radius: 150, dmgMul: 2 } },
                { desc: '幻象 4 秒，范围 200，冲击波 350%', params: { duration: 4, radius: 200, dmgMul: 3.5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._phantoms) sm.runtimeState._phantoms = [];
                sm.registerHandler(SkillEffectType.ON_DASH, 'counter_stance', function(ctx) {
                    const inst = sm.getSkill('counter_stance');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    sm.runtimeState._phantoms.push({
                        x: ctx.player.x, y: ctx.player.y, life: p.duration,
                    });
                    ctx.particleManager.spawnExplosion(ctx.player.x, ctx.player.y, '#88ff88', 8);
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'counter_stance', function(dt, ctx) {
                    const inst = sm.getSkill('counter_stance');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const phantoms = sm.runtimeState._phantoms;
                    for (let i = phantoms.length - 1; i >= 0; i--) {
                        const ph = phantoms[i];
                        ph.life -= dt;
                        if (ph.life <= 0) {
                            for (const e of ctx.enemies) {
                                if (!e.active) continue;
                                if ((ph.x - e.x) ** 2 + (ph.y - e.y) ** 2 < p.radius * p.radius) {
                                    e.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                                }
                            }
                            ctx.particleManager.spawnExplosion(ph.x, ph.y, '#88ff88', 15);
                            phantoms.splice(i, 1);
                        }
                    }
                });
            },
        },
        {
            id: 'holy_aura',
            name: '神圣光环',
            rarity: SkillRarity.RARE,
            category: SkillCategory.BASTION,
            effectType: SkillEffectType.PERIODIC,
            description: '周期性回血 + 伤害波',
            synergies: ['life_leech', 'thorns'],
            evolveCondition: { type: EvolutionCondition.SURVIVAL_TIME, value: 180 },
            tiers: [
                { desc: '每 25 秒回复 25% 已损失生命', params: { cooldown: 25, healPct: 0.25 } },
                { desc: '每 18 秒，回复 35% + 冲击波（180 范围 150% 伤害）', params: { cooldown: 18, healPct: 0.35, waveDmg: 1.5, waveRadius: 180 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._holyAura) sm.runtimeState._holyAura = { timer: 0 };
                sm.registerHandler(SkillEffectType.PERIODIC, 'holy_aura', function(dt, ctx) {
                    const inst = sm.getSkill('holy_aura');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const ha = sm.runtimeState._holyAura;
                    ha.timer -= dt;
                    if (ha.timer > 0) return;
                    ha.timer = p.cooldown;
                    const lost = ctx.player.maxHp - ctx.player.hp;
                    ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + lost * p.healPct);
                    if (p.waveDmg) {
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            if ((ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2 < p.waveRadius * p.waveRadius) {
                                e.takeDamage(ctx.player.bulletDamage * p.waveDmg);
                            }
                        }
                        ctx.particleManager.spawnExplosion(ctx.player.x, ctx.player.y, '#aaffaa', 20);
                    }
                });
            },
        },

        // ==============================================================
        //  暗影行者 Shadow
        // ==============================================================

        {
            id: 'afterimage_blast',
            name: '残影爆破',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.SHADOW,
            effectType: SkillEffectType.ON_DASH,
            description: '冲刺留下爆炸残影',
            synergies: ['quantum_dash', 'void_walker'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '冲刺路径留下 3 个残影，各 80% 伤害爆炸（100 范围）', params: { count: 3, dmgMul: 0.8, radius: 100 } },
                { desc: '5 个残影，120% 伤害', params: { count: 5, dmgMul: 1.2, radius: 100 } },
                { desc: '7 个残影，150% 伤害 + 残影区留伤害场（1 秒 50%/秒）', params: { count: 7, dmgMul: 1.5, radius: 120, field: true } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._afterimages) sm.runtimeState._afterimages = [];
                sm.registerHandler(SkillEffectType.ON_DASH, 'afterimage_blast', function(ctx) {
                    const inst = sm.getSkill('afterimage_blast');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    for (let i = 0; i < p.count; i++) {
                        const t = (i / (p.count - 1)) * 0.4 - 0.2;
                        const ax = ctx.player.x - ctx.player.dashDirection.x * 40 + (Math.random() - 0.5) * 60;
                        const ay = ctx.player.y - ctx.player.dashDirection.y * 40 + (Math.random() - 0.5) * 60;
                        sm.runtimeState._afterimages.push({ x: ax, y: ay, life: 0.4 + t, radius: p.radius, dmg: ctx.player.bulletDamage * p.dmgMul, field: p.field });
                    }
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'afterimage_blast', function(dt, ctx) {
                    const inst = sm.getSkill('afterimage_blast');
                    if (!inst) return;
                    const images = sm.runtimeState._afterimages || [];
                    for (let i = images.length - 1; i >= 0; i--) {
                        const im = images[i];
                        im.life -= dt;
                        if (im.life <= 0) {
                            for (const e of ctx.enemies) {
                                if (!e.active) continue;
                                if ((im.x - e.x) ** 2 + (im.y - e.y) ** 2 < im.radius * im.radius) {
                                    e.takeDamage(im.dmg);
                                }
                            }
                            ctx.particleManager.spawnExplosion(im.x, im.y, '#aa66ff', 10);
                            images.splice(i, 1);
                        }
                    }
                });
            },
        },
        {
            id: 'quantum_dash',
            name: '量子穿梭',
            rarity: SkillRarity.RARE,
            category: SkillCategory.SHADOW,
            effectType: SkillEffectType.ON_DASH,
            description: '冲刺穿过敌人造成伤害',
            synergies: ['afterimage_blast', 'blink'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '冲刺穿过敌人造成 150% 伤害 + 标记 5 秒（伤害 +30%）', params: { dmgMul: 1.5, markMul: 0.3, markDuration: 5 } },
                { desc: '伤害 250%，标记 +50%', params: { dmgMul: 2.5, markMul: 0.5, markDuration: 5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._marked) sm.runtimeState._marked = {};
                sm.registerHandler(SkillEffectType.ON_DASH, 'quantum_dash', function(ctx) {
                    const inst = sm.getSkill('quantum_dash');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const dashLen = 120;
                    for (const e of ctx.enemies || []) {
                        if (!e.active || sm.runtimeState._marked[e]) continue;
                        const d2 = (ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2;
                        if (d2 < dashLen * dashLen) {
                            e.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                            sm.runtimeState._marked[e] = p.markDuration;
                        }
                    }
                });
                sm.registerHandler(SkillEffectType.ON_HIT, 'quantum_mark', function(ctx) {
                    const inst = sm.getSkill('quantum_dash');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const marked = sm.runtimeState._marked;
                    if (marked && marked[ctx.enemy]) {
                        ctx.bullet.damage *= (1 + p.markMul);
                    }
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'quantum_tick', function(dt) {
                    const marked = sm.runtimeState._marked;
                    if (!marked) return;
                    for (const key in marked) { marked[key] -= dt; if (marked[key] <= 0) delete marked[key]; }
                });
            },
        },
        {
            id: 'shadow_step',
            name: '暗影步',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.SHADOW,
            effectType: SkillEffectType.STAT_MODIFIER,
            description: '冲刺 CD 降至 1 秒',
            synergies: ['void_walker', 'afterimage_blast'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '冲刺冷却降为 1 秒，每次冲刺消耗 3% 当前生命，落点 200% 暗影冲击', params: { cd: 1, hpCost: 0.03, blastDmg: 2 } },
                { desc: '冲刺冷却 0.7 秒，消耗 2%，冲击 300%', params: { cd: 0.7, hpCost: 0.02, blastDmg: 3 } },
            ],
            apply: function(player, sm, params, prevParams) {
                player.dashCooldownMax = params.cd;
                sm.runtimeState._shadowStep = params;
                sm.registerHandler(SkillEffectType.ON_DASH, 'shadow_step_blast', function(ctx) {
                    const inst = sm.getSkill('shadow_step');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    ctx.player.hp = Math.max(1, ctx.player.hp - ctx.player.maxHp * p.hpCost);
                    for (const e of ctx.enemies || []) {
                        if (!e.active) continue;
                        if ((ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2 < 150 * 150) {
                            e.takeDamage(ctx.player.bulletDamage * p.blastDmg);
                        }
                    }
                    ctx.particleManager.spawnExplosion(ctx.player.x, ctx.player.y, '#9966ff', 15);
                });
            },
        },
        {
            id: 'time_echo',
            name: '时间幻象',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.SHADOW,
            effectType: SkillEffectType.ON_DASH,
            description: '冲刺召唤反向分身',
            synergies: ['phantom_gunner', 'shadow_step'],
            evolveCondition: null,
            tiers: [
                { desc: '冲刺后分身沿路径反向攻击（继承 60% 伤害），持续 4 秒', params: { duration: 4, dmgMul: 0.6 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._echoes) sm.runtimeState._echoes = [];
                sm.registerHandler(SkillEffectType.ON_DASH, 'time_echo', function(ctx) {
                    const inst = sm.getSkill('time_echo');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    sm.runtimeState._echoes.push({
                        x: ctx.player.x, y: ctx.player.y,
                        life: p.duration, dmgMul: p.dmgMul, fireTimer: 0
                    });
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'time_echo', function(dt, ctx) {
                    const inst = sm.getSkill('time_echo');
                    if (!inst) return;
                    const echoes = sm.runtimeState._echoes || [];
                    for (let i = echoes.length - 1; i >= 0; i--) {
                        const ec = echoes[i];
                        ec.life -= dt; if (ec.life <= 0) { echoes.splice(i, 1); continue; }
                        ec.fireTimer -= dt;
                        if (ec.fireTimer <= 0) {
                            ec.fireTimer = 0.5;
                            let nearest = null, nd = 400 * 400;
                            for (const e of ctx.enemies) {
                                if (!e.active) continue;
                                const d2 = (ec.x - e.x) ** 2 + (ec.y - e.y) ** 2;
                                if (d2 < nd) { nd = d2; nearest = e; }
                            }
                            if (nearest) {
                                ctx.bulletManager.fire(ec.x, ec.y, Math.atan2(nearest.y - ec.y, nearest.x - ec.x), ctx.player.bulletDamage * ec.dmgMul, ctx.player.bulletSpeed, ctx.player.pierce, nearest);
                            }
                        }
                    }
                });
            },
        },
        {
            id: 'trap_rune',
            name: '残影陷阱',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.SHADOW,
            effectType: SkillEffectType.ON_DASH,
            description: '冲刺留下爆炸陷阱',
            synergies: ['afterimage_blast', 'void_walker'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '冲刺留下陷阱（6 秒，100% 伤害，120 范围）', params: { life: 6, dmgMul: 1, radius: 120 } },
                { desc: '陷阱持续 10 秒，150% 伤害', params: { life: 10, dmgMul: 1.5, radius: 120 } },
                { desc: '陷阱击杀敌人也留陷阱', params: { life: 10, dmgMul: 1.5, radius: 140, chain: true } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._traps) sm.runtimeState._traps = [];
                sm.registerHandler(SkillEffectType.ON_DASH, 'trap_rune', function(ctx) {
                    const inst = sm.getSkill('trap_rune');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    sm.runtimeState._traps.push({
                        x: ctx.player.x, y: ctx.player.y, life: p.life, dmgMul: p.dmgMul, radius: p.radius, chain: p.chain
                    });
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'trap_rune', function(dt, ctx) {
                    const inst = sm.getSkill('trap_rune');
                    if (!inst) return;
                    const traps = sm.runtimeState._traps || [];
                    for (let i = traps.length - 1; i >= 0; i--) {
                        const tr = traps[i];
                        tr.life -= dt; if (tr.life <= 0) { traps.splice(i, 1); continue; }
                        let triggered = false;
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            if ((tr.x - e.x) ** 2 + (tr.y - e.y) ** 2 < tr.radius * tr.radius) {
                                e.takeDamage(ctx.player.bulletDamage * tr.dmgMul);
                                triggered = true;
                                if (tr.chain) traps.push({ x: e.x, y: e.y, life: tr.life, dmgMul: tr.dmgMul, radius: tr.radius });
                                break;
                            }
                        }
                        if (triggered) {
                            ctx.particleManager.spawnExplosion(tr.x, tr.y, '#9966ff', 10);
                            traps.splice(i, 1);
                        }
                    }
                });
            },
        },
        {
            id: 'blink',
            name: '闪现',
            rarity: SkillRarity.RARE,
            category: SkillCategory.SHADOW,
            effectType: SkillEffectType.ON_DASH,
            description: '闪现后必暴击',
            synergies: ['quantum_dash', 'phantom_gunner'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '冲刺后 1 秒内下次攻击必暴击 + 暴击伤害 +100%', params: { duration: 1, critBonus: 1 } },
                { desc: '2 秒内必暴击 + 暴击伤害 +200%', params: { duration: 2, critBonus: 2 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_DASH, 'blink', function(ctx) {
                    const inst = sm.getSkill('blink');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    player._blinkCrit = { timer: p.duration, bonus: p.critBonus };
                });
            },
        },
        {
            id: 'phantom_gunner',
            name: '幻影射手',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.SHADOW,
            effectType: SkillEffectType.SUMMON,
            description: '周期召唤幻影射击',
            synergies: ['blink', 'time_echo'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '每 5 秒召唤幻影（继承 50% 伤害，持续 3 秒）', params: { cooldown: 5, duration: 3, dmgMul: 0.5 } },
                { desc: '每 3 秒，伤害 70%，持续 4 秒', params: { cooldown: 3, duration: 4, dmgMul: 0.7 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._phantoms2) sm.runtimeState._phantoms2 = [];
                sm.registerHandler(SkillEffectType.PERIODIC, 'phantom_gunner', function(dt, ctx) {
                    const inst = sm.getSkill('phantom_gunner');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._pgTimer) sm.runtimeState._pgTimer = 0;
                    sm.runtimeState._pgTimer -= dt;
                    if (sm.runtimeState._pgTimer <= 0) {
                        sm.runtimeState._pgTimer = p.cooldown;
                        sm.runtimeState._phantoms2.push({
                            x: ctx.player.x + (Math.random() - 0.5) * 100, y: ctx.player.y + (Math.random() - 0.5) * 100,
                            life: p.duration, dmgMul: p.dmgMul, fireTimer: 0
                        });
                    }
                    const p2 = sm.runtimeState._phantoms2;
                    for (let i = p2.length - 1; i >= 0; i--) {
                        const ph = p2[i];
                        ph.life -= dt; if (ph.life <= 0) { p2.splice(i, 1); continue; }
                        ph.fireTimer -= dt;
                        if (ph.fireTimer <= 0) {
                            ph.fireTimer = 0.4;
                            let nearest = null, nd = 350 * 350;
                            for (const e of ctx.enemies) {
                                if (!e.active) continue;
                                const d2 = (ph.x - e.x) ** 2 + (ph.y - e.y) ** 2;
                                if (d2 < nd) { nd = d2; nearest = e; }
                            }
                            if (nearest) {
                                ctx.bulletManager.fire(ph.x, ph.y, Math.atan2(nearest.y - ph.y, nearest.x - ph.x), ctx.player.bulletDamage * ph.dmgMul, ctx.player.bulletSpeed, 0, nearest);
                            }
                        }
                    }
                });
            },
        },
        {
            id: 'void_walker',
            name: '虚空行走',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.SHADOW,
            effectType: SkillEffectType.ON_DASH,
            description: 'Dash 叠加伤害层数',
            synergies: ['shadow_step', 'afterimage_blast'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '每次冲刺叠 1 层虚空能量（上限 5），每层 +20% 伤害，攻击后清零', params: { maxStacks: 5, perStack: 0.2 } },
                { desc: '上限 8 层，每层 +25%', params: { maxStacks: 8, perStack: 0.25 } },
                { desc: '上限 10 层，每层 +30%，Dash 后自动发射满层攻击', params: { maxStacks: 10, perStack: 0.3, autoFire: true } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._voidStacks) sm.runtimeState._voidStacks = 0;
                sm.runtimeState._voidStacks = 0;
                sm.registerHandler(SkillEffectType.ON_DASH, 'void_walker', function(ctx) {
                    const inst = sm.getSkill('void_walker');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    sm.runtimeState._voidStacks = Math.min(p.maxStacks, (sm.runtimeState._voidStacks || 0) + 1);
                });
            },
        },

        // ==============================================================
        //  死亡收割 Reaper
        // ==============================================================

        {
            id: 'weakness_exploit',
            name: '弱点洞悉',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.REAPER,
            effectType: SkillEffectType.CRIT_MODIFIER,
            description: '低血量必定暴击',
            synergies: ['execute', 'death_mark'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '暴击率 +10%，生命低于 30% 敌人必定暴击', params: { critBonus: 0.1, threshold: 0.3 } },
                { desc: '暴击率 +15%，阈值 40%', params: { critBonus: 0.15, threshold: 0.4 } },
                { desc: '暴击率 +20%，阈值 50%，暴击伤害 +40%', params: { critBonus: 0.2, threshold: 0.5, critDmgBonus: 0.4 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (prevParams) player.critRate -= prevParams.critBonus;
                player.critRate += params.critBonus;
                sm.runtimeState._weakness = { threshold: params.threshold, critDmgBonus: params.critDmgBonus || 0 };
            },
        },
        {
            id: 'execute',
            name: '处决',
            rarity: SkillRarity.RARE,
            category: SkillCategory.REAPER,
            effectType: SkillEffectType.ON_HIT,
            description: '低血量敌人受伤加倍',
            synergies: ['weakness_exploit', 'soul_harvest'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 40 },
            tiers: [
                { desc: '生命低于 20% 敌人受到 3 倍伤害', params: { threshold: 0.2, dmgMul: 3 } },
                { desc: '阈值 28%，4 倍伤害 + 击杀回复 8% 最大生命', params: { threshold: 0.28, dmgMul: 4, healPct: 0.08 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_HIT, 'execute', function(ctx) {
                    const inst = sm.getSkill('execute');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const hpPct = ctx.enemy.hp / ctx.enemy.maxHp;
                    if (hpPct <= p.threshold) {
                        ctx.bullet.damage *= p.dmgMul;
                        if (p.healPct && ctx.enemy.hp <= 0) {
                            player.hp = Math.min(player.maxHp, player.hp + player.maxHp * p.healPct);
                        }
                    }
                });
            },
        },
        {
            id: 'death_mark',
            name: '死亡印记',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.REAPER,
            effectType: SkillEffectType.ON_CRIT,
            description: '暴击标记，死亡传染',
            synergies: ['weakness_exploit', 'reap'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '暴击施加死亡印记（5 秒，受伤 +50%），死亡跳向 200 范围最近敌人', params: { duration: 5, dmgAmp: 0.5, range: 200 } },
                { desc: '受伤 +80%，范围 250，跳转数量 +1', params: { duration: 5, dmgAmp: 0.8, range: 250, spread: 1 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._marks) sm.runtimeState._marks = {};
                sm.registerHandler(SkillEffectType.ON_CRIT, 'death_mark', function(ctx) {
                    const inst = sm.getSkill('death_mark');
                    if (!inst) return;
                    sm.runtimeState._marks[ctx.enemy] = true;
                });
                sm.registerHandler(SkillEffectType.ON_HIT, 'death_mark_amp', function(ctx) {
                    const inst = sm.getSkill('death_mark');
                    if (!inst || !sm.runtimeState._marks[ctx.enemy]) return;
                    const p = inst.getCurrentEffect().params;
                    ctx.bullet.damage *= (1 + p.dmgAmp);
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'death_mark_spread', function(dt, ctx) {
                    const inst = sm.getSkill('death_mark');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const marks = sm.runtimeState._marks || {};
                    for (const key in marks) {
                        const e = key; // key is object reference string
                        for (const enemy of ctx.enemies) {
                            if (!enemy.active || enemy.hp > 0) continue;
                            if (marks[enemy]) {
                                delete marks[enemy];
                                let nearest = null, nd2 = p.range * p.range;
                                for (const t of ctx.enemies) {
                                    if (!t.active || t === enemy || marks[t]) continue;
                                    const d2 = (enemy.x - t.x) ** 2 + (enemy.y - t.y) ** 2;
                                    if (d2 < nd2) { nd2 = d2; nearest = t; }
                                }
                                if (nearest) marks[nearest] = true;
                            }
                        }
                    }
                });
            },
        },
        {
            id: 'reap',
            name: '收割',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.REAPER,
            effectType: SkillEffectType.ON_KILL,
            description: '处决重置冲刺',
            synergies: ['execute', 'death_mark'],
            evolveCondition: null,
            tiers: [
                { desc: '击杀低血量（20%）敌人重置冲刺冷却 + 攻速 +50% 持续 2 秒', params: { threshold: 0.2, atkBoost: 0.5, duration: 2 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.registerHandler(SkillEffectType.ON_KILL, 'reap', function(ctx) {
                    const inst = sm.getSkill('reap');
                    if (!inst) return;
                    player.dashCooldown = 0;
                    player.attackSpeed *= (1 + inst.getCurrentEffect().params.atkBoost);
                    setTimeout(() => { player.attackSpeed /= (1 + inst.getCurrentEffect().params.atkBoost); }, inst.getCurrentEffect().params.duration * 1000);
                });
            },
        },
        {
            id: 'blood_frenzy',
            name: '鲜血狂怒',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.REAPER,
            effectType: SkillEffectType.ON_KILL,
            description: '击杀叠加暴伤',
            synergies: ['weakness_exploit', 'soul_harvest'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 40 },
            tiers: [
                { desc: '击杀叠 1 层狂怒（上限 5，每层 +30% 暴击伤害，持续 3 秒）', params: { maxStacks: 5, perStack: 0.3, duration: 3 } },
                { desc: '上限 8 层，每层 +40%', params: { maxStacks: 8, perStack: 0.4, duration: 4 } },
                { desc: '上限 10 层，3 层时全攻击必暴击 1 秒（15 秒 CD）', params: { maxStacks: 10, perStack: 0.5, duration: 4, furyCD: 15 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._frenzy) sm.runtimeState._frenzy = { stacks: 0, timer: 0 };
                sm.runtimeState._frenzy.stacks = 0; sm.runtimeState._frenzy.timer = 0;
                sm.registerHandler(SkillEffectType.ON_KILL, 'blood_frenzy', function() {
                    const inst = sm.getSkill('blood_frenzy');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const f = sm.runtimeState._frenzy;
                    f.stacks = Math.min(p.maxStacks, f.stacks + 1);
                    f.timer = p.duration;
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'blood_frenzy', function(dt) {
                    const f = sm.runtimeState._frenzy;
                    if (!f) return;
                    f.timer -= dt; if (f.timer <= 0) f.stacks = 0;
                });
            },
        },
        {
            id: 'curse',
            name: '咒怨',
            rarity: SkillRarity.RARE,
            category: SkillCategory.REAPER,
            effectType: SkillEffectType.ON_HIT,
            description: '首击施加永久易伤',
            synergies: ['death_mark', 'assassinate'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 40 },
            tiers: [
                { desc: '对每个敌人的首次攻击施加咒怨（永久 +25% 受伤）', params: { dmgAmp: 0.25 } },
                { desc: '+40% 受伤，每个咒怨敌人 +5% 移速', params: { dmgAmp: 0.4, speedPerCurse: 0.05 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._cursed) sm.runtimeState._cursed = new Set();
                sm.registerHandler(SkillEffectType.ON_HIT, 'curse', function(ctx) {
                    const inst = sm.getSkill('curse');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (!sm.runtimeState._cursed.has(ctx.enemy)) {
                        sm.runtimeState._cursed.add(ctx.enemy);
                    } else {
                        ctx.bullet.damage *= (1 + p.dmgAmp);
                    }
                });
            },
        },
        {
            id: 'soul_harvest',
            name: '灵魂收割',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.REAPER,
            effectType: SkillEffectType.ON_KILL,
            description: '击杀收集灵魂增伤',
            synergies: ['blood_frenzy', 'execute'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '击杀收集灵魂（上限 20），每层 +1.5% 暴击伤害', params: { maxSouls: 20, perStack: 0.015 } },
                { desc: '上限 40，每层 +2%，死亡消耗全部灵魂复活（每层 3% HP）', params: { maxSouls: 40, perStack: 0.02, revive: 0.03 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._souls) sm.runtimeState._souls = 0;
                sm.runtimeState._souls = 0;
                sm.registerHandler(SkillEffectType.ON_KILL, 'soul_harvest', function() {
                    const inst = sm.getSkill('soul_harvest');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    sm.runtimeState._souls = Math.min(p.maxSouls, (sm.runtimeState._souls || 0) + 1);
                });
            },
        },
        {
            id: 'assassinate',
            name: '暗杀',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.REAPER,
            effectType: SkillEffectType.ON_HIT,
            description: '满血敌人首击爆发',
            synergies: ['curse', 'execute'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '满血敌人首次攻击 300% 伤害 + 必暴击', params: { dmgMul: 3 } },
                { desc: '400% 伤害 + 减速 80% 1 秒', params: { dmgMul: 4, slow: 0.8 } },
                { desc: '500% 伤害 + 立即施加 1 层灼烧 5 层', params: { dmgMul: 5, burn: 5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._assassinated) sm.runtimeState._assassinated = new Set();
                sm.registerHandler(SkillEffectType.ON_HIT, 'assassinate', function(ctx) {
                    const inst = sm.getSkill('assassinate');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    if (ctx.enemy.hp >= ctx.enemy.maxHp && !sm.runtimeState._assassinated.has(ctx.enemy)) {
                        sm.runtimeState._assassinated.add(ctx.enemy);
                        ctx.bullet.isCrit = true;
                        ctx.bullet.damage *= p.dmgMul;
                        if (p.slow) { ctx.enemy.slowAmount = p.slow; }
                        if (p.burn) { ctx.enemy.burnStacks = p.burn; ctx.enemy.burnDmgPerStack = player.bulletDamage * 0.15; ctx.enemy.burnTimer = 3; }
                    }
                });
            },
        },

        // ==============================================================
        //  召唤流 Summoner
        // ==============================================================

        {
            id: 'drone',
            name: '浮游炮',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.SUMMONER,
            effectType: SkillEffectType.SUMMON,
            description: '自动攻击的浮游炮',
            synergies: ['swarm', 'laser_target'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '召唤 1 个浮游炮（继承 40% 伤害，每 0.8 秒射击）', params: { count: 1, dmgMul: 0.4, fireRate: 0.8 } },
                { desc: '2 个浮游炮，伤害 50%', params: { count: 2, dmgMul: 0.5, fireRate: 0.7 } },
                { desc: '3 个浮游炮，伤害 60%，发射穿透弹', params: { count: 3, dmgMul: 0.6, fireRate: 0.6, pierce: true } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._drones) sm.runtimeState._drones = [];
                const drones = sm.runtimeState._drones;
                while (drones.length < params.count) drones.push({ angle: Math.random() * Math.PI * 2, orbitR: 60, fireTimer: 0 });
                while (drones.length > params.count) drones.pop();
                sm.registerHandler(SkillEffectType.PERIODIC, 'drone', function(dt, ctx) {
                    const inst = sm.getSkill('drone');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const drones = sm.runtimeState._drones || [];
                    while (drones.length < p.count) drones.push({ angle: Math.random() * Math.PI * 2, orbitR: 60, fireTimer: 0 });
                    while (drones.length > p.count) drones.pop();
                    for (const d of drones) {
                        d.angle += 1.5 * dt;
                        d.fireTimer -= dt;
                        if (d.fireTimer > 0) continue;
                        d.fireTimer = p.fireRate;
                        const dx = ctx.player.x + Math.cos(d.angle) * d.orbitR;
                        const dy = ctx.player.y + Math.sin(d.angle) * d.orbitR;
                        let nearest = null, nd = 400 * 400;
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            const d2 = (dx - e.x) ** 2 + (dy - e.y) ** 2;
                            if (d2 < nd) { nd = d2; nearest = e; }
                        }
                        if (nearest) {
                            ctx.bulletManager.fire(dx, dy, Math.atan2(nearest.y - dy, nearest.x - dx), ctx.player.bulletDamage * p.dmgMul, ctx.player.bulletSpeed, p.pierce ? ctx.player.pierce : 0, nearest);
                        }
                    }
                });
            },
        },
        {
            id: 'swarm',
            name: '无人机群',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.SUMMONER,
            effectType: SkillEffectType.SUMMON,
            description: '无人机群 + 扫射',
            synergies: ['drone', 'laser_target'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '无人机数量上限 +2（总计 5），每 5 秒齐射一轮（300%×5）', params: { extraCount: 2, strafeCD: 5, strafeMul: 3 } },
                { desc: '+3 无人机（总计 6），齐射 400%，每 4 秒', params: { extraCount: 3, strafeCD: 4, strafeMul: 4 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._swarm) sm.runtimeState._swarm = { timer: 0 };
                sm.runtimeState._swarm.timer = 0;
                sm.runtimeState._swarmConfig = params;
                sm.registerHandler(SkillEffectType.PERIODIC, 'swarm', function(dt, ctx) {
                    const inst = sm.getSkill('swarm');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const sw = sm.runtimeState._swarm || {};
                    sw.timer -= dt;
                    if (sw.timer > 0) return;
                    sw.timer = p.strafeCD;
                    const drones = sm.runtimeState._drones || [];
                    for (const d of drones) {
                        const dx = ctx.player.x + Math.cos(d.angle) * 60;
                        const dy = ctx.player.y + Math.sin(d.angle) * 60;
                        const a = Math.random() * Math.PI * 2;
                        for (let i = 0; i < 3; i++) {
                            ctx.bulletManager.fire(dx, dy, a + (i - 1) * 0.3, ctx.player.bulletDamage * p.strafeMul * 0.3, ctx.player.bulletSpeed, 0, null);
                        }
                    }
                });
            },
        },
        {
            id: 'laser_target',
            name: '激光瞄准',
            rarity: SkillRarity.RARE,
            category: SkillCategory.SUMMONER,
            effectType: SkillEffectType.ON_HIT,
            description: '标记敌人被集火',
            synergies: ['drone', 'swarm'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 30 },
            tiers: [
                { desc: '命中敌人标记 3 秒，无人机优先攻击标记目标 + 伤害 +40%', params: { duration: 3, dmgBonus: 0.4 } },
                { desc: '标记 5 秒，伤害 +70%', params: { duration: 5, dmgBonus: 0.7 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (!sm.runtimeState._laserTarget) sm.runtimeState._laserTarget = { target: null, timer: 0 };
                sm.registerHandler(SkillEffectType.ON_HIT, 'laser_target', function(ctx) {
                    const inst = sm.getSkill('laser_target');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    sm.runtimeState._laserTarget = { target: ctx.enemy, timer: p.duration, dmgBonus: p.dmgBonus };
                });
                sm.registerHandler(SkillEffectType.PERIODIC, 'laser_target', function(dt) {
                    const lt = sm.runtimeState._laserTarget;
                    if (!lt || !lt.timer) return;
                    lt.timer -= dt; if (lt.timer <= 0) lt.target = null;
                });
            },
        },
        {
            id: 'bomber',
            name: '轰炸编队',
            rarity: SkillRarity.EPIC,
            category: SkillCategory.SUMMONER,
            effectType: SkillEffectType.SUMMON,
            description: '无人机定期投弹',
            synergies: ['swarm', 'orbital'],
            evolveCondition: { type: EvolutionCondition.KILL_COUNT, value: 50 },
            tiers: [
                { desc: '无人机数量 +1，每 3 秒投弹（150 范围，200% 伤害）', params: { extraCount: 1, bombCD: 3, bombDmg: 2, bombRadius: 150 } },
                { desc: '+2 无人机，每 2 秒，250% 伤害', params: { extraCount: 2, bombCD: 2, bombDmg: 2.5, bombRadius: 170 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._bomber) sm.runtimeState._bomber = { timer: 0 };
                sm.runtimeState._bomberConfig = params;
                sm.registerHandler(SkillEffectType.PERIODIC, 'bomber', function(dt, ctx) {
                    const inst = sm.getSkill('bomber');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const bm = sm.runtimeState._bomber || {};
                    bm.timer -= dt;
                    if (bm.timer > 0) return;
                    bm.timer = p.bombCD;
                    const drones = sm.runtimeState._drones || [];
                    for (const d of drones) {
                        const dx = ctx.player.x + Math.cos(d.angle) * 60;
                        const dy = ctx.player.y + Math.sin(d.angle) * 60;
                        for (const e of ctx.enemies) {
                            if (!e.active) continue;
                            if ((dx - e.x) ** 2 + (dy - e.y) ** 2 < p.bombRadius * p.bombRadius) {
                                e.takeDamage(ctx.player.bulletDamage * p.bombDmg);
                            }
                        }
                        ctx.particleManager.spawnExplosion(dx, dy, '#ffaa00', 12);
                    }
                });
            },
        },
        {
            id: 'mothership',
            name: '母舰',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.SUMMONER,
            effectType: SkillEffectType.SUMMON,
            description: '空投拦截机',
            synergies: ['swarm', 'orbital'],
            evolveCondition: null,
            tiers: [
                { desc: '每 6 秒空投 3 架拦截机（持续 8 秒，60% 伤害），可超上限', params: { cooldown: 6, count: 3, life: 8, dmgMul: 0.6 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._mothership) sm.runtimeState._mothership = { timer: 0, interceptors: [] };
                sm.registerHandler(SkillEffectType.PERIODIC, 'mothership', function(dt, ctx) {
                    const inst = sm.getSkill('mothership');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const ms = sm.runtimeState._mothership || {};
                    ms.timer -= dt;
                    if (ms.timer <= 0) {
                        ms.timer = p.cooldown;
                        for (let i = 0; i < p.count; i++) {
                            ms.interceptors.push({
                                x: ctx.player.x + (Math.random() - 0.5) * 200, y: ctx.player.y + (Math.random() - 0.5) * 200,
                                life: p.life, dmgMul: p.dmgMul, fireTimer: 0
                            });
                        }
                    }
                    for (let i = ms.interceptors.length - 1; i >= 0; i--) {
                        const ic = ms.interceptors[i];
                        ic.life -= dt; if (ic.life <= 0) { ms.interceptors.splice(i, 1); continue; }
                        ic.fireTimer -= dt;
                        if (ic.fireTimer <= 0) {
                            ic.fireTimer = 0.5;
                            let nearest = null, nd = 350 * 350;
                            for (const e of ctx.enemies) {
                                if (!e.active) continue;
                                const d2 = (ic.x - e.x) ** 2 + (ic.y - e.y) ** 2;
                                if (d2 < nd) { nd = d2; nearest = e; }
                            }
                            if (nearest) {
                                ctx.bulletManager.fire(ic.x, ic.y, Math.atan2(nearest.y - ic.y, nearest.x - ic.x), ctx.player.bulletDamage * ic.dmgMul, ctx.player.bulletSpeed, 0, nearest);
                            }
                        }
                    }
                });
            },
        },
        {
            id: 'orbital',
            name: '轨道打击',
            rarity: SkillRarity.LEGENDARY,
            category: SkillCategory.SUMMONER,
            effectType: SkillEffectType.PERIODIC,
            description: '从天而降的激光',
            synergies: ['mothership', 'bomber'],
            evolveCondition: null,
            tiers: [
                { desc: '每 20 秒从屏幕顶端射下激光（200 范围，600% 伤害），沿玩家位置横扫', params: { cooldown: 20, radius: 200, dmgMul: 6 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                if (!sm.runtimeState._orbital) sm.runtimeState._orbital = { timer: 0 };
                sm.registerHandler(SkillEffectType.PERIODIC, 'orbital', function(dt, ctx) {
                    const inst = sm.getSkill('orbital');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const ob = sm.runtimeState._orbital || {};
                    ob.timer -= dt;
                    if (ob.timer > 0) return;
                    ob.timer = p.cooldown;
                    for (const e of ctx.enemies) {
                        if (!e.active) continue;
                        if (Math.abs(ctx.player.x - e.x) < p.radius) {
                            e.takeDamage(ctx.player.bulletDamage * p.dmgMul);
                        }
                    }
                    for (let i = -3; i <= 3; i++) {
                        ctx.particleManager.spawnExplosion(ctx.player.x + i * 40, ctx.player.y - 300, '#ffdd44', 5);
                    }
                });
            },
        },
        {
            id: 'repair_drone',
            name: '修理机器人',
            rarity: SkillRarity.COMMON,
            category: SkillCategory.SUMMONER,
            effectType: SkillEffectType.PERIODIC,
            description: '无人机周期性回血',
            synergies: ['drone', 'mothership'],
            evolveCondition: { type: EvolutionCondition.SURVIVAL_TIME, value: 120 },
            tiers: [
                { desc: '每有 1 架无人机，每秒回复 0.5 HP', params: { regenPerDrone: 0.5 } },
                { desc: '每架回复 1 HP，无人机总数 +1', params: { regenPerDrone: 1, extraDrone: 1 } },
                { desc: '每架回复 1.5 HP，无人机 +2', params: { regenPerDrone: 1.5, extraDrone: 2 } },
            ],
            apply: function(player, sm, params, prevParams) {
                _ensureBurnProcessor(sm);
                sm.runtimeState._repairDrone = params;
                sm.registerHandler(SkillEffectType.PERIODIC, 'repair_drone', function(dt, ctx) {
                    const inst = sm.getSkill('repair_drone');
                    if (!inst) return;
                    const p = inst.getCurrentEffect().params;
                    const count = (sm.runtimeState._drones?.length || 0) + (sm.runtimeState._mothership?.interceptors?.length || 0);
                    ctx.player.hp = Math.min(ctx.player.maxHp, ctx.player.hp + count * p.regenPerDrone * dt);
                });
            },
        },
        {
            id: 'overcharge',
            name: '过载',
            rarity: SkillRarity.RARE,
            category: SkillCategory.SUMMONER,
            effectType: SkillEffectType.STAT_MODIFIER,
            description: '强化所有无人机',
            synergies: ['drone', 'swarm', 'bomber'],
            evolveCondition: { type: EvolutionCondition.DAMAGE_ELITE, value: 1 },
            tiers: [
                { desc: '无人机伤害 +30%，射速 +30%，环绕半径 +20', params: { dmgBonus: 0.3, speedBonus: 0.3, rangeBonus: 20 } },
                { desc: '伤害 +60%，射速 +50%，半径 +30', params: { dmgBonus: 0.6, speedBonus: 0.5, rangeBonus: 30 } },
            ],
            apply: function(player, sm, params, prevParams) {
                sm.runtimeState._overcharge = params;
            },
        },
    ];
}

// 共享辅助：确保燃烧处理器已注册
function _ensureBurnProcessor(sm) {
    if (sm.runtimeState._burnProcessorReady) return;
    sm.runtimeState._burnProcessorReady = true;
    // 护盾回复处理器
    sm.registerHandler(SkillEffectType.PERIODIC, '__shield_regen__', function(dt, ctx) {
        if (sm.runtimeState._shieldRegen && ctx.player.shield > 0) {
            ctx.player.shield = Math.min(sm.runtimeState._shieldMax || ctx.player.shield, ctx.player.shield + sm.runtimeState._shieldRegen * dt);
        }
    });
    // 庇护所减伤 + 反弹护盾无敌
    sm.registerHandler(SkillEffectType.PERIODIC, '__defense__', function(dt, ctx) {
        const sanc = sm.runtimeState._sanctuary;
        const rs = sm.runtimeState._reflectShield;
        if (sanc && sanc.active) {
            ctx.player._sanctuaryActive = true;
            ctx.player._sanctuaryReduction = sm.getSkill('sanctuary')?.getCurrentEffect().params.reduction || 0;
        } else {
            ctx.player._sanctuaryActive = false;
        }
        ctx.player._reflectActive = rs?.active || false;
    });
    sm.registerHandler(SkillEffectType.ON_DAMAGED, '__defense_damage__', function(ctx) {
        const rs = sm.runtimeState._reflectShield;
        if (rs && rs.active) {
            ctx.player.hp += ctx.amount; // undo damage
            ctx.amount = 0;
            const reflectMul = sm.getSkill('reflect_shield')?.getCurrentEffect().params.reflectMul || 1;
            for (const e of ctx.enemies) {
                if (!e.active) continue;
                const d2 = (ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2;
                if (d2 < 200 * 200) {
                    e.takeDamage(ctx.player.bulletDamage * reflectMul);
                }
            }
        }
    });
    sm.registerHandler(SkillEffectType.ON_DAMAGED, '__sanctuary_reduce__', function(ctx) {
        if (ctx.player._sanctuaryActive && ctx.player._sanctuaryReduction) {
            const reduced = ctx.amount * ctx.player._sanctuaryReduction;
            ctx.player.hp += reduced; // partially undo
        }
    });
    sm.registerHandler(SkillEffectType.PERIODIC, '__burn__', function(dt, ctx) {
        const hellfire = sm.runtimeState._hellfire;
        // 处理敌人灼烧伤害
        for (const e of ctx.enemies) {
            if (!e.active || !e.burnStacks) continue;
            const dps = e.burnDmgPerStack * e.burnStacks;
            e.takeDamage(dps * dt);
            if (ctx.particleManager && Math.random() < 0.3) {
                ctx.particleManager.spawnTrail(
                    e.x + (Math.random() - 0.5) * e.size, e.y + (Math.random() - 0.5) * e.size,
                    -Math.PI / 2 + Math.random() * 0.5, '#ff6600'
                );
            }
        }
        // 处理冰霜粒子
        for (const e of ctx.enemies) {
            if (!e.active) continue;
            if (e.frozen && ctx.particleManager && Math.random() < 0.7) {
                ctx.particleManager.spawnTrail(
                    e.x + (Math.random() - 0.5) * e.size * 1.5, e.y + (Math.random() - 0.5) * e.size * 1.5,
                    Math.PI / 2 + Math.random() * 0.5, '#88ddff'
                );
            } else if (e.slowAmount > 0 && ctx.particleManager && Math.random() < 0.3) {
                ctx.particleManager.spawnHit(
                    e.x + (Math.random() - 0.5) * e.size, e.y + (Math.random() - 0.5) * e.size,
                    '#aaddff', 2
                );
            }
        }
        // 处理麻痹粒子
        for (const e of ctx.enemies) {
            if (!e.active || !e.paralyzed || !ctx.particleManager) continue;
            if (Math.random() < 0.6) {
                ctx.particleManager.spawnHit(
                    e.x + (Math.random() - 0.5) * e.size, e.y + (Math.random() - 0.5) * e.size,
                    '#ffff88', 2
                );
            }
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
                        e.burnDmgPerStack = ctx.player.bulletDamage * 0.10;
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
