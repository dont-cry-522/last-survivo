class EffectDispatcher {
    constructor(sm) {
        this.sm = sm;
        this.handlers = {};
        this._drawFns = {};
        this._systemReady = false;
    }

    ensureSystemEffects() {
        if (this._systemReady) return;
        this._systemReady = true;
        const sm = this.sm;

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

    registerHandler(effectType, skillId, handler) {
        if (!this.handlers[effectType]) this.handlers[effectType] = {};
        this.handlers[effectType][skillId] = handler;
    }

    trigger(effectType, context) {
        const handlers = this.handlers[effectType] || {};
        for (const skillId in handlers) {
            const inst = this.sm._findOwned(skillId);
            if (!inst) continue;
            handlers[skillId](context, inst);
        }
    }

    update(deltaTime, gameContext) {
        const sm = this.sm;
        const sysHandlers = this.handlers[SkillEffectType.PERIODIC] || {};
        for (const skillId in sysHandlers) {
            if (skillId.startsWith('__')) {
                sysHandlers[skillId](deltaTime, gameContext);
            } else if (sm._findOwned(skillId) && !sm.effectRegistry[SkillEffectType.PERIODIC]?.some(i => i.id === skillId)) {
                sysHandlers[skillId](deltaTime, gameContext);
            }
        }

        const periodics = sm.effectRegistry[SkillEffectType.PERIODIC] || [];
        for (const inst of periodics) {
            const handler = sysHandlers[inst.id];
            if (handler) handler(deltaTime, gameContext, inst);
        }

        const summonHandlers = this.handlers[SkillEffectType.SUMMON] || {};
        for (const skillId in summonHandlers) {
            if (sm._findOwned(skillId) && !sm.effectRegistry[SkillEffectType.SUMMON]?.some(i => i.id === skillId)) {
                summonHandlers[skillId](deltaTime, gameContext);
            }
        }
        const summons = sm.effectRegistry[SkillEffectType.SUMMON] || [];
        for (const inst of summons) {
            const handler = summonHandlers[inst.id];
            if (handler) handler(deltaTime, gameContext, inst);
        }
    }

    registerDraw(name, fn) { this._drawFns[name] = fn; }

    drawSkillVisuals(ctx, cameraX, cameraY, player) {
        const fns = Object.values(this._drawFns);
        for (let i = 0; i < fns.length; i++) { fns[i](ctx, cameraX, cameraY, player); }
    }

    reset() {
        this.handlers = {};
        this._drawFns = {};
        this._systemReady = false;
    }
}

if (typeof window !== 'undefined') {
    window.EffectDispatcher = EffectDispatcher;
    window._ensureBurnProcessor = function(sm) {
        sm.dispatcher.ensureSystemEffects();
    };
}
