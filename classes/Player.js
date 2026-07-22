/**
 * ============================================================
 *  Player.js - 玩家飞船类
 * ============================================================
 *  蓝色科技飞船，八方向移动，Shift冲刺，自动攻击
 *  支持：尾焰粒子、移动残影、冲刺残影
 *  TODO: 可以加入技能系统（主动技能）
 *  TODO: 可以加入武器切换系统
 *  TODO: 可以加入角色皮肤/外观系统
 * ============================================================
 */

class Player {
    constructor(x, y) {
        // 位置
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2; // 朝向

        // 属性 - 从配置初始化
        const cfg = Config.PLAYER;
        this.maxHp = cfg.maxHp;
        this.hp = cfg.maxHp;
        this.speed = cfg.speed;
        this.baseSpeed = cfg.speed;
        this.attackSpeed = cfg.attackSpeed;
        this.attackRange = cfg.attackRange;
        this.bulletDamage = cfg.bulletDamage;
        this.bulletSpeed = cfg.bulletSpeed;
        this.bulletCount = cfg.bulletCount;
        this.pierce = cfg.pierce;
        this.critRate = cfg.critRate;
        this.critDamage = cfg.critDamage;
        this.magnetRange = cfg.magnetRange;
        this.expMultiplier = cfg.expMultiplier;
        this.size = cfg.size;
        this.shield = 0;

        // 冲刺相关
        this.dashCooldown = cfg.dashCooldown;
        this.dashCooldownMax = cfg.dashCooldown;
        this.dashDuration = cfg.dashDuration;
        this.dashSpeedMultiplier = cfg.dashSpeedMultiplier;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDirection = { x: 0, y: 0 };

        // 攻击相关
        this.attackTimer = 0;
        this.attackInterval = 1 / this.attackSpeed;

        // 等级与经验
        this.level = 1;
        this.exp = 0;
        this.expToNext = Config.getExpForLevel(1);

        // 金币
        this.gold = 0;

        // 无敌时间（受伤后短暂无敌）
        this.invincibleTimer = 0;
        this.invincibleDuration = 0.5;

        // 残影计时器
        this.afterimageTimer = 0;
        this.trailTimer = 0;

        // 输入状态
        this.keys = {
            w: false, a: false, s: false, d: false,
            shift: false,
        };

        // 统计
        this.kills = 0;
        this.bossKills = 0;
        this.upgradeCount = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;

        // 颜色
        this.color = Config.COLORS.player;
        this.glowColor = Config.COLORS.playerGlow;

        // 音频引用（由Game注入）
        this.audio = null;
    }

    /**
     * 处理按键按下
     */
    onKeyDown(key) {
        const k = key.toLowerCase();
        if (k in this.keys) {
            this.keys[k] = true;
        }
        if (k === 'shift') {
            this.keys.shift = true;
            this.tryDash();
        }
    }

    /**
     * 处理按键抬起
     */
    onKeyUp(key) {
        const k = key.toLowerCase();
        if (k in this.keys) {
            this.keys[k] = false;
        }
        if (k === 'shift') {
            this.keys.shift = false;
        }
    }

    /**
     * 尝试冲刺
     */
    tryDash() {
        if (this.dashCooldown > 0 || this.isDashing) return;

        // 计算冲刺方向
        let dx = 0, dy = 0;
        if (this.keys.w) dy -= 1;
        if (this.keys.s) dy += 1;
        if (this.keys.a) dx -= 1;
        if (this.keys.d) dx += 1;

        // 如果没有方向输入，朝当前朝向冲刺
        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.angle);
            dy = Math.sin(this.angle);
        } else {
            // 归一化
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        this.dashDirection.x = dx;
        this.dashDirection.y = dy;
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashCooldownMax;
        this.invincibleTimer = Math.max(this.invincibleTimer, this.dashDuration);

        if (this.audio) this.audio.dash();
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        if (this.invincibleTimer > 0) return false;

        // 先扣护盾
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;
        }

        this.hp -= amount;
        this.invincibleTimer = this.invincibleDuration;

        // 重置连击
        this.combo = 0;

        if (this.audio) this.audio.playerHit();

        if (this.hp <= 0) {
            this.hp = 0;
            return true; // 死亡
        }
        return false;
    }

    /**
     * 增加经验
     */
    addExp(amount) {
        this.exp += amount * this.expMultiplier;
        let leveledUp = false;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.expToNext = Config.getExpForLevel(this.level);
            this.maxHp += Config.PLAYER.levelHpBonus;
            this.hp += Config.PLAYER.levelHpBonus;
            leveledUp = true;
        }
        return leveledUp;
    }

    /**
     * 增加金币
     */
    addGold(amount) {
        this.gold += amount;
    }

    /**
     * 增加击杀
     */
    addKill(isBoss = false) {
        this.kills++;
        this.combo++;
        this.comboTimer = 3; // 3秒连击窗口
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        if (isBoss) this.bossKills++;
    }

    /**
     * 查找最近的敌人
     */
    findNearestEnemy(enemies) {
        let nearest = null;
        let nearestDist = this.attackRange * this.attackRange; // 平方比较

        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.active) continue;
            const dist = Utils.distanceSq(this.x, this.y, e.x, e.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = e;
            }
        }
        return nearest;
    }

    /**
     * 自动攻击
     */
    autoAttack(deltaTime, enemies, bulletManager, particleManager) {
        this.attackTimer -= deltaTime;
        if (this.attackTimer > 0) return;

        // 找最近的敌人
        const target = this.findNearestEnemy(enemies);
        if (!target) return;

        // 重置攻击间隔（实时读取攻速）
        this.attackInterval = 1 / this.attackSpeed;
        this.attackTimer = this.attackInterval;

        // 发射多颗子弹
        const bulletCount = this.bulletCount;
        const spreadAngle = bulletCount > 1 ? 0.3 : 0; // 散射角度

        for (let i = 0; i < bulletCount; i++) {
            // 计算每颗子弹的角度（均匀分布在扇形内）
            let angle = Utils.angle(this.x, this.y, target.x, target.y);
            if (bulletCount > 1) {
                const offset = (i - (bulletCount - 1) / 2) * spreadAngle;
                angle += offset;
            }

            // 暴击判定
            const isCrit = Math.random() < this.critRate;
            const damage = isCrit ? this.bulletDamage * this.critDamage : this.bulletDamage;

            const bullet = bulletManager.fire(
                this.x, this.y,
                angle,
                damage,
                this.bulletSpeed,
                this.pierce,
                target // 追踪目标
            );

            if (bullet) {
                bullet.isCrit = isCrit;
            }
        }

        // 发射特效 - 枪口闪光
        // 播放射击音效
        if (this.audio) this.audio.shoot();
    }

    /**
     * 更新玩家
     */
    update(deltaTime, enemies, bulletManager, particleManager) {
        // 冷却计时
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
            if (this.dashCooldown < 0) this.dashCooldown = 0;
        }

        // 无敌时间
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
        }

        // 连击计时
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }

        // 冲刺状态
        if (this.isDashing) {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }

            // 冲刺移动
            const dashSpeed = this.speed * this.dashSpeedMultiplier;
            this.x += this.dashDirection.x * dashSpeed * deltaTime * 60;
            this.y += this.dashDirection.y * dashSpeed * deltaTime * 60;

            // 冲刺残影
            this.afterimageTimer -= deltaTime;
            if (this.afterimageTimer <= 0) {
                this.afterimageTimer = 0.03;
                particleManager.spawnAfterimage(this.x, this.y, this.size, this.color);
            }

        } else {
            // 普通移动
            let dx = 0, dy = 0;
            if (this.keys.w) dy -= 1;
            if (this.keys.s) dy += 1;
            if (this.keys.a) dx -= 1;
            if (this.keys.d) dx += 1;

            // 归一化对角移动
            if (dx !== 0 && dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;
            }

            // 更新朝向（有移动时）
            if (dx !== 0 || dy !== 0) {
                this.angle = Math.atan2(dy, dx);
            }

            this.x += dx * this.speed * deltaTime * 60;
            this.y += dy * this.speed * deltaTime * 60;

            // 移动残影（只有移动时）
            if (dx !== 0 || dy !== 0) {
                this.afterimageTimer -= deltaTime;
                if (this.afterimageTimer <= 0) {
                    this.afterimageTimer = 0.08;
                    particleManager.spawnAfterimage(this.x, this.y, this.size * 0.8, this.glowColor);
                }
            }
        }

        // 尾焰粒子
        this.trailTimer -= deltaTime;
        if (this.trailTimer <= 0) {
            this.trailTimer = 0.03;
            particleManager.spawnTrail(
                this.x - Math.cos(this.angle) * this.size * 0.8,
                this.y - Math.sin(this.angle) * this.size * 0.8,
                this.angle,
                this.color
            );
        }

        // 自动攻击
        this.autoAttack(deltaTime, enemies, bulletManager, particleManager);
    }

    /**
     * 绘制玩家飞船
     */
    draw(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // 闪烁效果（无敌时）
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 20) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 外发光
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.glowColor;

        // 飞船主体 - 三角形科技风
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size * 0.7, -this.size * 0.7);
        ctx.lineTo(-this.size * 0.4, 0);
        ctx.lineTo(-this.size * 0.7, this.size * 0.7);
        ctx.closePath();
        ctx.fill();

        // 内部高亮
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(this.size * 0.6, 0);
        ctx.lineTo(-this.size * 0.2, -this.size * 0.3);
        ctx.lineTo(-this.size * 0.2, this.size * 0.3);
        ctx.closePath();
        ctx.fill();

        // 驾驶舱
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.size * 0.1, 0, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 护盾效果
        if (this.shield > 0) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // 攻击范围指示（调试用，正式版隐藏）
        // TODO: 做成可配置的调试模式
    }

    /**
     * 重置玩家（重新开始）
     */
    reset(x, y) {
        const cfg = Config.PLAYER;
        this.x = x;
        this.y = y;
        this.maxHp = cfg.maxHp;
        this.hp = cfg.maxHp;
        this.speed = cfg.speed;
        this.attackSpeed = cfg.attackSpeed;
        this.attackRange = cfg.attackRange;
        this.bulletDamage = cfg.bulletDamage;
        this.bulletSpeed = cfg.bulletSpeed;
        this.bulletCount = cfg.bulletCount;
        this.pierce = cfg.pierce;
        this.critRate = cfg.critRate;
        this.critDamage = cfg.critDamage;
        this.magnetRange = cfg.magnetRange;
        this.expMultiplier = cfg.expMultiplier;
        this.dashCooldown = 0;
        this.dashCooldownMax = cfg.dashCooldown;
        this.level = 1;
        this.exp = 0;
        this.expToNext = Config.getExpForLevel(1);
        this.gold = 0;
        this.kills = 0;
        this.bossKills = 0;
        this.upgradeCount = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.shield = 0;
        this.angle = -Math.PI / 2;
        this.isDashing = false;
        this.invincibleTimer = 0;
    }
}

if (typeof window !== 'undefined') {
    window.Player = Player;
}
