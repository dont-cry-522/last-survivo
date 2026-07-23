/**
 * SkillTypes.js — 技能枚举定义
 * 防御性声明：如果旧版 SkillConfig.js 已定义，则复用
 */
(function() {
    if (!window.SkillRarity) {
        window.SkillRarity = class {
            static COMMON = 'common';
            static RARE = 'rare';
            static EPIC = 'epic';
            static LEGENDARY = 'legendary';
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
        };
    }
    SkillRarity = window.SkillRarity;

    if (!window.SkillEffectType) {
        window.SkillEffectType = class {
            static PROJECTILE_MODIFIER = 'projectile_modifier';
            static ON_HIT = 'on_hit';
            static ON_KILL = 'on_kill';
            static ON_DASH = 'on_dash';
            static ON_DAMAGED = 'on_damaged';
            static PERIODIC = 'periodic';
            static AURA = 'aura';
            static SUMMON = 'summon';
            static STAT_MODIFIER = 'stat_modifier';
            static ON_CRIT = 'on_crit';
            static CRIT_MODIFIER = 'crit_modifier';
            static ELEMENTAL = 'elemental';
        };
    }
    SkillEffectType = window.SkillEffectType;

    if (!window.SkillCategory) {
        window.SkillCategory = class {
            static BULLET_STORM = 'bullet_storm';
            static INFERNO = 'inferno';
            static FROST = 'frost';
            static STORM = 'storm';
            static SHADOW = 'shadow';
            static BASTION = 'bastion';
            static REAPER = 'reaper';
            static SUMMONER = 'summoner';
            static getColor(category) {
                const map = {
                    bullet_storm: '#00d4ff', inferno: '#ff6b6b', frost: '#74b9ff',
                    storm: '#feca57', shadow: '#a855f7', bastion: '#7bed9f',
                    reaper: '#ee5253', summoner: '#ffd700',
                };
                return map[category] || '#ffffff';
            }
        };
    }
    SkillCategory = window.SkillCategory;

    if (!window.EvolutionCondition) {
        window.EvolutionCondition = class {
            static KILL_COUNT = 'kill_count';
            static DAMAGE_ELITE = 'damage_elite';
            static SURVIVAL_TIME = 'survival_time';
            static BOSS_KILLED = 'boss_killed';
            static LEVEL_REACHED = 'level_reached';
        };
    }
    EvolutionCondition = window.EvolutionCondition;
})();
