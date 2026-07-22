/**
 * ============================================================
 *  Enemy.js - 敌人系统
 * ============================================================
 *  四种敌人类型：普通、快速、坦克、自爆
 *  统一AI：追踪玩家，接触造成伤害
 *  自爆敌人接近后爆炸造成范围伤害
 *  TODO: 可以加入更多敌人类型（远程、治疗、护盾等）
 *  TODO: 可以加入敌人状态系统（减速、灼烧、中毒等）
 *  TODO: 可以加入敌人动画（行走、受击、死亡）
 * ============================================================
 */

class Enemy {
    constructor() {
        this.active = false;
        this.type = 'normal';
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.maxHp = 30;
        this.hp = 30;
        this.speed = 1.5;
        this.damage = 10;
        this.size = 15;
        this.exp = 5;
        this.gold = 1;
        this.color = '#ff6b6b';
        this.glowColor = 'rgba(255, 107, 107, 0.5)';

        // 自爆敌人特有
        this.explodeRadius = 0;
        this.isExploder = false;
        this.explodeTriggerDistance = 50;

        // 受击闪烁
        this.hitFlash = 0;

        // 击退
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.knockbackDecay = 0.9;

        // 难度缩放
        this.hpMultiplier = 1;
        this.speedMultiplier = 1;
    }

    /**
     * 初始化敌人
     */
    init(type, x, y, hpMultiplier = 1, speedMultiplier = 1) {
        const cfg = Config.ENEMY_TYPES[type];
        if (!cfg) return;

        this.active = true;
        this.type = type;
        this.x = x;
        this.y = y;
        this.maxHp = cfg.hp * hpMultiplier;
        this.hp = this.maxHp;
        this.speed = cfg.speed * speedMultiplier;
        this.damage = cfg.damage;
        this.size = cfg.size;
        this.exp = cfg.exp;
        this.gold = cfg.gold;
        this.color = cfg.color;
        this.glowColor = cfg.glowColor;
        this.hitFlash = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;

        this.hpMultiplier = hpMultiplier;
        this.speedMultiplier = speedMultiplier;

        // 自爆敌人
        if (type === 'exploder') {
            this.isExploder = true;
            this.explodeRadius = cfg.explodeRadius;
        } else {
            this.isExploder = false;
        }
    }

    /**
     * 受到伤害
     * @returns {boolean} 是否死亡
     */
    takeDamage(amount, bulletAngle = 0) {
        this.hp -= amount;
        this.hitFlash = 0.1;

        // 击退效果
        const knockbackForce = amount * 0.3;
        this.knockbackX += Math.cos(bulletAngle) * knockbackForce;
        this.knockbackY += Math.sin(bulletAngle) * knockbackForce;

        if (this.hp <= 0) {
            this.hp = 0;
            return true;
        }
        return false;
    }

    /**
     * 死亡处理
     */
    die(particleManager, experienceManager, player) {
        this.active = false;

        // 爆炸粒子
        particleManager.spawnExplosion(this.x, this.y, this.color, 12);

        // 掉落经验
        experienceManager.spawnOrb(this.x, this.y, this.exp, this.gold);

        // 自爆敌人死亡也爆炸
        if (this.isExploder) {
            this.explode(particleManager, player);
        }
    }

    /**
     * 自爆
     */
    explode(particleManager, player) {
        // 大范围爆炸特效
        particleManager.spawnExplosion(this.x, this.y, '#ff9ff3', 30);

        // 对玩家造成范围伤害
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        if (dist < this.explodeRadius + player.size) {
            player.takeDamage(this.damage);
        }
    }

    /**
     * 更新敌人AI
     */
    update(deltaTime, player, particleManager) {
        if (!this.active) return;

        // 受击闪烁
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }

        // 击退衰减
        this.knockbackX *= this.knockbackDecay;
        this.knockbackY *= this.knockbackDecay;

        // 追踪玩家
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        const moveX = Math.cos(angle) * this.speed * deltaTime * 60;
        const moveY = Math.sin(angle) * this.speed * deltaTime * 60;

        this.x += moveX + this.knockbackX;
        this.y += moveY + this.knockbackY;

        // 自爆敌人：接近玩家时触发爆炸
        if (this.isExploder) {
            const dist = Utils.distance(this.x, this.y, player.x, player.y);
            if (dist < this.explodeTriggerDistance) {
                this.explode(particleManager, player);
                this.active = false;
                particleManager.spawnExplosion(this.x, this.y, '#ff9ff3', 25);
            }
        }

        // 接触伤害（非自爆敌人）
        if (!this.isExploder) {
            if (Utils.circleCollision(this.x, this.y, this.size, player.x, player.y, player.size)) {
                player.takeDamage(this.damage * deltaTime * 2); // 持续伤害
            }
        }
    }

    /**
     * 绘制敌人
     */
    draw(ctx, cameraX, cameraY) {
        if (!this.active) return;

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        ctx.save();

        // 发光
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.glowColor;

        // 受击闪白
        let fillColor = this.color;
        if (this.hitFlash > 0) {
            fillColor = '#ffffff';
        }

        ctx.fillStyle = fillColor;

        // 根据类型画不同形状
        switch (this.type) {
            case 'normal':
                // 圆形
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'fast':
                // 菱形
                ctx.beginPath();
                ctx.moveTo(screenX, screenY - this.size);
                ctx.lineTo(screenX + this.size * 0.7, screenY);
                ctx.lineTo(screenX, screenY + this.size);
                ctx.lineTo(screenX - this.size * 0.7, screenY);
                ctx.closePath();
                ctx.fill();
                break;

            case 'tank':
                // 六边形
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * Math.PI * 2;
                    const px = screenX + Math.cos(a) * this.size;
                    const py = screenY + Math.sin(a) * this.size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;

            case 'exploder':
                // 脉动圆形（危险感）
                const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.15;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * pulse, 0, Math.PI * 2);
                ctx.fill();
                // 内部警告符号
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'elite':
                // 精英怪 - 八角星
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    const r = i % 2 === 0 ? this.size : this.size * 0.6;
                    const px = screenX + Math.cos(a) * r;
                    const py = screenY + Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                break;
        }

        // 血条（只在受伤后显示）
        if (this.hp < this.maxHp) {
            ctx.shadowBlur = 0;
            const barWidth = this.size * 2;
            const barHeight = 4;
            const barX = screenX - barWidth / 2;
            const barY = screenY - this.size - 8;

            // 背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // 血量
            const hpPercent = this.hp / this.maxHp;
            ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
            ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        }

        ctx.restore();
    }
}

/**
 * 敌人管理器
 */
class EnemyManager {
    constructor(maxEnemies = 500) {
        this.pool = [];
        this.maxEnemies = maxEnemies;
        this.activeEnemies = []; // 缓存活跃敌人引用，优化遍历

        // 预分配
        for (let i = 0; i < maxEnemies; i++) {
            this.pool.push(new Enemy());
        }
    }

    /**
     * 生成敌人
     */
    spawn(type, x, y, hpMultiplier = 1, speedMultiplier = 1) {
        const enemy = this.getEnemy();
        if (enemy) {
            enemy.init(type, x, y, hpMultiplier, speedMultiplier);
        }
        return enemy;
    }

    /**
     * 获取空闲敌人
     */
    getEnemy() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                return this.pool[i];
            }
        }
        return null; // 池满不生成
    }

    /**
     * 获取所有活跃敌人数组
     */
    getActiveEnemies() {
        const result = [];
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                result.push(this.pool[i]);
            }
        }
        return result;
    }

    update(deltaTime, player, particleManager, experienceManager, audio) {
        for (let i = 0; i < this.pool.length; i++) {
            const e = this.pool[i];
            if (!e.active) continue;

            e.update(deltaTime, player, particleManager);

            if (e.hp <= 0 && e.active) {
                e.die(particleManager, experienceManager, player);
                player.addKill(e.type === 'elite');

                if (audio) {
                    if (e.isExploder) {
                        audio.exploderExplode();
                    } else if (e.type === 'tank' || e.type === 'elite') {
                        audio.enemyDeadBig();
                    } else {
                        audio.enemyDead();
                    }
                }
            }
        }
    }

    draw(ctx, cameraX, cameraY) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].draw(ctx, cameraX, cameraY);
        }
    }

    /**
     * 获取活跃敌人数
     */
    getActiveCount() {
        let count = 0;
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) count++;
        }
        return count;
    }

    /**
     * 清除所有敌人
     */
    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
        }
    }
}

if (typeof window !== 'undefined') {
    window.Enemy = Enemy;
    window.EnemyManager = EnemyManager;
}
