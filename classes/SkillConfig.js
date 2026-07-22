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
    static POOL = [];
}

if (typeof window !== 'undefined') {
    window.SkillRarity = SkillRarity;
    window.SkillEffectType = SkillEffectType;
    window.SkillCategory = SkillCategory;
    window.EvolutionCondition = EvolutionCondition;
    window.SkillConfig = SkillConfig;
}
