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
                { desc: '同时发射 3 颗子弹，每颗伤害 60%', params: { bulletCount: 3, damageMul: 0.6, spread: 0.3 } },
                { desc: '5 颗子弹', params: { bulletCount: 5, damageMul: 0.65, spread: 0.3 } },
                { desc: '7 颗子弹，每颗伤害恢复至 80%', params: { bulletCount: 7, damageMul: 0.8, spread: 0.25 } },
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
                { desc: '命中后弹向 5m 内另一敌人，弹射 1 次，递减 20%', params: { bounces: 1, range: 5, decay: 0.2 } },
                { desc: '弹射 3 次，递减 10%', params: { bounces: 3, range: 6, decay: 0.1 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (prevParams) {
                    player._bounce = null;
                }
                player._bounce = { bounces: params.bounces, range: params.range, decay: params.decay };
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
                { desc: '命中时向 45° 扇形分裂 2 颗小子弹（50% 伤害）', params: { count: 2, spreadAngle: 0.8, damageMul: 0.5 } },
                { desc: '分裂 4 颗，伤害 60%', params: { count: 4, spreadAngle: 0.8, damageMul: 0.6 } },
            ],
            apply: function(player, sm, params, prevParams) {
                if (prevParams) {
                    player._splitter = null;
                }
                player._splitter = { count: params.count, spreadAngle: params.spreadAngle, damageMul: params.damageMul };
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
                if (prevParams) {
                    player._turrets = null;
                }
                player._turrets = { count: params.count, damageMul: params.damageMul };
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
                { desc: '移动时身后洒落地雷（每秒 3 颗），0.5 秒激活，2m 范围', params: { rate: 3, radius: 2, damageMul: 1.0, armTime: 0.5 } },
            ],
            apply: function(player, sm, params, prevParams) {
                player._mines = { rate: params.rate, radius: params.radius, damageMul: params.damageMul, armTime: params.armTime };
            },
        },
    ];
}

if (typeof window !== 'undefined') {
    window.SkillRarity = SkillRarity;
    window.SkillEffectType = SkillEffectType;
    window.SkillCategory = SkillCategory;
    window.EvolutionCondition = EvolutionCondition;
    window.SkillConfig = SkillConfig;
}
