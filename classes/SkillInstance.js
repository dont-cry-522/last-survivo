/**
 * ============================================================
 *  SkillInstance.js - 技能运行时实例
 * ============================================================
 *  管理单个已获得技能的当前状态：
 *    当前阶级 / 进化条件进度 / 进化判断
 * ============================================================
 */

class SkillInstance {
    /**
     * @param {SkillDefinition} config - 来自 SkillConfig.POOL
     */
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.rarity = config.rarity;
        this.category = config.category;
        this.effectType = config.effectType;
        this.synergies = config.synergies || [];

        this.currentTier = 1;
        this.maxTier = SkillRarity.getMaxTier(this.rarity);
        this.config = config;

        /** 进化条件追踪 */
        this.killCount = 0;
        this.hasDamagedElite = false;

        /** 是否已完成最高进化 */
        this.isMaxed = (this.currentTier >= this.maxTier);
    }

    /**
     * 获取当前阶级的描述和参数
     */
    getCurrentEffect() {
        const idx = Math.min(this.currentTier - 1, this.config.tiers.length - 1);
        return this.config.tiers[idx];
    }

    /**
     * 判断是否可以进化到下一阶
     * @param {Object} gameState - { survivalTime, player }
     * @returns {{ canEvolve: boolean, reason: string, progress: number, target: number }}
     */
    checkEvolution(gameState) {
        if (this.currentTier >= this.maxTier) {
            return { canEvolve: false, reason: '已满级', progress: 1, target: 1 };
        }
        if (this.currentTier < 3) {
            return { canEvolve: true, reason: '', progress: 1, target: 1 };
        }

        const cond = this.config.evolveCondition;
        if (!cond) {
            return { canEvolve: true, reason: '', progress: 1, target: 1 };
        }

        switch (cond.type) {
            case EvolutionCondition.KILL_COUNT:
                return {
                    canEvolve: this.killCount >= cond.value,
                    reason: `需击杀 ${cond.value} 个敌人`,
                    progress: this.killCount,
                    target: cond.value,
                };

            case EvolutionCondition.DAMAGE_ELITE:
                return {
                    canEvolve: this.hasDamagedElite,
                    reason: '需对精英/Boss造成过伤害',
                    progress: this.hasDamagedElite ? 1 : 0,
                    target: 1,
                };

            case EvolutionCondition.SURVIVAL_TIME:
                return {
                    canEvolve: (gameState.survivalTime || 0) >= cond.value,
                    reason: `需存活 ${cond.value} 秒`,
                    progress: Math.min(gameState.survivalTime || 0, cond.value),
                    target: cond.value,
                };

            case EvolutionCondition.BOSS_KILLED:
                const bossKilled = (gameState.player && gameState.player.bossKills > 0);
                return {
                    canEvolve: bossKilled,
                    reason: '需击杀一个Boss',
                    progress: bossKilled ? 1 : 0,
                    target: 1,
                };

            case EvolutionCondition.LEVEL_REACHED:
                return {
                    canEvolve: (gameState.player && gameState.player.level >= cond.value),
                    reason: `需达到等级 ${cond.value}`,
                    progress: gameState.player ? Math.min(gameState.player.level, cond.value) : 0,
                    target: cond.value,
                };

            default:
                return { canEvolve: true, reason: '', progress: 1, target: 1 };
        }
    }

    /**
     * 执行进化
     */
    evolve() {
        if (this.currentTier >= this.maxTier) return false;
        this.currentTier++;
        if (this.currentTier >= this.maxTier) {
            this.isMaxed = true;
        }
        return true;
    }

    /**
     * 当此技能击杀敌人时调用（进化追踪）
     */
    onKill() {
        this.killCount++;
    }

    /**
     * 当此技能对精英造成伤害时调用（进化追踪）
     */
    onDamageElite() {
        this.hasDamagedElite = true;
    }

    /**
     * 获得复选时的强化信息（条件不够进化时）
     */
    getEnhanceDescription() {
        if (this.currentTier >= this.maxTier) return null;
        const nextTier = this.config.tiers[this.currentTier]; // 0-indexed for next tier
        return nextTier ? nextTier.desc : null;
    }

    /**
     * 获取下一阶的进化信息
     */
    getNextEvolution() {
        if (this.currentTier >= this.maxTier) return null;
        const idx = this.currentTier;
        if (idx >= this.config.tiers.length) return null;
        return {
            tier: this.currentTier + 1,
            desc: this.config.tiers[idx].desc,
            params: this.config.tiers[idx].params,
        };
    }
}

if (typeof window !== 'undefined') {
    window.SkillInstance = SkillInstance;
}
