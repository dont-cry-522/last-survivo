/**
 * ============================================================
 *  SkillConfig.js - 技能系统全局配置
 * ============================================================
 *  定义稀有度、效果类型、流派分类、进化条件
 *  具体技能数据按流派拆分到 skills/ 目录
 * ============================================================
 */

class SkillRarity {
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
}

class SkillEffectType {
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
}

class SkillCategory {
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
}

class EvolutionCondition {
    static KILL_COUNT = 'kill_count';
    static DAMAGE_ELITE = 'damage_elite';
    static SURVIVAL_TIME = 'survival_time';
    static BOSS_KILLED = 'boss_killed';
    static LEVEL_REACHED = 'level_reached';
}

class SkillConfig {
    static POOL = [].concat(
        BulletStormSkills.POOL,
        InfernoSkills.POOL,
        FrostSkills.POOL,
        StormSkills.POOL,
        BastionSkills.POOL,
        ShadowSkills.POOL,
        ReaperSkills.POOL,
        SummonerSkills.POOL
    );
}

function _ensureBurnProcessor(sm) {
    if (sm.runtimeState._burnProcessorReady) return;
    sm.runtimeState._burnProcessorReady = true;
    // 火焰区域视觉
    sm.registerDraw('fireZones', function(ctx, cx, cy, p) {
        const zones = sm.runtimeState._fireZones;
        if (!zones) return;
        for (const z of zones) {
            const zx = z.x - cx, zy = z.y - cy;
            ctx.save(); ctx.globalAlpha = 0.25 + Math.sin(Date.now() * 0.01) * 0.1;
            const grad = ctx.createRadialGradient(zx, zy, 0, zx, zy, z.radius);
            grad.addColorStop(0, '#ff4400'); grad.addColorStop(0.5, '#ff6600'); grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(zx, zy, z.radius, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    });
    sm.registerHandler(SkillEffectType.PERIODIC, '__shield_regen__', function(dt, ctx) {
        if (sm.runtimeState._shieldRegen && ctx.player.shield > 0) {
            ctx.player.shield = Math.min(sm.runtimeState._shieldMax || ctx.player.shield, ctx.player.shield + sm.runtimeState._shieldRegen * dt);
        }
    });
    sm.registerHandler(SkillEffectType.PERIODIC, '__defense__', function(dt, ctx) {
        const sanc = sm.runtimeState._sanctuary;
        const rs = sm.runtimeState._reflectShield;
        if (sanc && sanc.active) {
            ctx.player._sanctuaryActive = true;
            ctx.player._sanctuaryReduction = sm.getSkill('sanctuary')?.getCurrentEffect().params.reduction || 0;
        } else { ctx.player._sanctuaryActive = false; }
        ctx.player._reflectActive = rs?.active || false;
    });
    sm.registerHandler(SkillEffectType.ON_DAMAGED, '__defense_damage__', function(ctx) {
        const rs = sm.runtimeState._reflectShield;
        if (rs && rs.active) {
            ctx.player.hp += ctx.amount; ctx.amount = 0;
            const reflectMul = sm.getSkill('reflect_shield')?.getCurrentEffect().params.reflectMul || 1;
            for (const e of ctx.enemies) {
                if (!e.active) continue;
                if ((ctx.player.x - e.x) ** 2 + (ctx.player.y - e.y) ** 2 < 200 * 200) {
                    e.takeDamage(ctx.player.bulletDamage * reflectMul);
                }
            }
        }
    });
    sm.registerHandler(SkillEffectType.ON_DAMAGED, '__sanctuary_reduce__', function(ctx) {
        if (ctx.player._sanctuaryActive && ctx.player._sanctuaryReduction) {
            ctx.player.hp += ctx.amount * ctx.player._sanctuaryReduction;
        }
    });
    sm.registerHandler(SkillEffectType.PERIODIC, '__burn__', function(dt, ctx) {
        for (const e of ctx.enemies) {
            if (!e.active || !e.burnStacks) continue;
            e.takeDamage(e.burnDmgPerStack * e.burnStacks * dt);
            if (ctx.particleManager && Math.random() < 0.3) {
                ctx.particleManager.spawnTrail(e.x + (Math.random()-0.5)*e.size, e.y + (Math.random()-0.5)*e.size, -Math.PI/2+Math.random()*0.5, '#ff6600');
            }
        }
        for (const e of ctx.enemies) {
            if (!e.active) continue;
            if (e.frozen && ctx.particleManager && Math.random() < 0.7) {
                ctx.particleManager.spawnTrail(e.x+(Math.random()-0.5)*e.size*1.5, e.y+(Math.random()-0.5)*e.size*1.5, Math.PI/2+Math.random()*0.5, '#88ddff');
            } else if (e.slowAmount > 0 && ctx.particleManager && Math.random() < 0.3) {
                ctx.particleManager.spawnHit(e.x+(Math.random()-0.5)*e.size, e.y+(Math.random()-0.5)*e.size, '#aaddff', 2);
            }
        }
        for (const e of ctx.enemies) {
            if (!e.active || !e.paralyzed || !ctx.particleManager) continue;
            if (Math.random() < 0.6) ctx.particleManager.spawnHit(e.x+(Math.random()-0.5)*e.size, e.y+(Math.random()-0.5)*e.size, '#ffff88', 2);
        }
        const zones = sm.runtimeState._fireZones;
        if (zones) {
            const hellfire = sm.runtimeState._hellfire;
            for (let i = zones.length-1; i >= 0; i--) {
                const z = zones[i]; z.life -= dt;
                if (z.life <= 0) { zones.splice(i,1); continue; }
                const r = hellfire ? z.radius*hellfire.radiusMul : z.radius;
                const d = hellfire ? z.dps*hellfire.dpsMul : z.dps;
                for (const e of ctx.enemies) {
                    if (!e.active) continue;
                    if ((z.x-e.x)**2+(z.y-e.y)**2 < r*r) {
                        e.takeDamage(d*dt); e.burnStacks=Math.min(5,(e.burnStacks||0)+1);
                        e.burnDmgPerStack=ctx.player.bulletDamage*0.10; e.burnTimer=Math.max(e.burnTimer||0,1);
                    }
                }
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
