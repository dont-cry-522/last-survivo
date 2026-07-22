/**
 * ============================================================
 *  Bullet.js - 瀛愬脊绯荤粺
 * ============================================================
 *  鑷姩杩借釜鏈€杩戞晫浜虹殑鑳介噺瀛愬脊
 *  鏀寔绌块€忋€佹毚鍑汇€佸鍙戝皠鍑?
 *  浣跨敤瀵硅薄姹犻伩鍏嶉绻佸垱寤洪攢姣?
 *  TODO: 鍙互鍔犲叆涓嶅悓瀛愬脊绫诲瀷锛堟縺鍏夈€佹暎寮广€佸寮圭瓑锛?
 *  TODO: 鍙互鍔犲叆瀛愬脊寮硅烦銆佸垎瑁傜瓑鐗规畩鏁堟灉
 * ============================================================
 */

class Bullet {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.speed = 8;
        this.damage = 10;
        this.size = 5;
        this.pierce = 0;          // 鍓╀綑绌块€忔鏁?
        this.hitEnemies = [];     // 宸茬粡鍛戒腑杩囩殑鏁屼汉锛堥槻姝㈢┛閫忔椂閲嶅浼ゅ锛?
        this.target = null;       // 杩借釜鐩爣
        this.trackingStrength = 0.1; // 杩借釜寮哄害
        this.trailTimer = 0;
        this.color = Config.COLORS.bullet;
        this.glowColor = Config.COLORS.bulletGlow;
        this.isCrit = false;      // 鏈鏄惁鏆村嚮
        this.life = 3;            // 鏈€澶у瓨娲绘椂闂达紙闃叉椋炲嚭鍦板浘涓嶆秷澶憋級
    }

    /**
     * 鍒濆鍖栧瓙寮癸紙瀵硅薄姹犲鐢級
     */
    init(x, y, angle, damage, speed, pierce, target = null) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.damage = damage;
        this.pierce = pierce;
        this.hitEnemies = [];
        this.target = target;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.trailTimer = 0;
        this.life = 3;
        this.isCrit = false;
    }

    /**
     * 鏇存柊瀛愬脊
     */
    update(deltaTime, enemies, particleManager) {
        if (!this.active) return;

        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // 杩借釜鐩爣閫昏緫
        if (this.target && this.target.active) {
            const angleToTarget = Utils.angle(this.x, this.y, this.target.x, this.target.y);
            const currentAngle = Math.atan2(this.vy, this.vx);

            // 骞虫粦杞悜
            let angleDiff = angleToTarget - currentAngle;
            // 褰掍竴鍖栬搴﹀樊鍒?[-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const turnRate = this.trackingStrength * deltaTime * 60;
            const newAngle = currentAngle + Utils.clamp(angleDiff, -turnRate, turnRate);

            this.vx = Math.cos(newAngle) * this.speed;
            this.vy = Math.sin(newAngle) * this.speed;
        } else if (!this.target || !this.target.active) {
            // 鐩爣涓㈠け锛屽皾璇曟壘鏂扮洰鏍囷紙寮辫拷韪級
            // TODO: 鍙互閰嶇疆鏄惁鑷姩鍒囨崲鐩爣
        }

        // 绉诲姩
        this.x += this.vx * deltaTime * 60;
        this.y += this.vy * deltaTime * 60;

        // 鎷栧熬绮掑瓙
        this.trailTimer -= deltaTime;
        if (this.trailTimer <= 0) {
            this.trailTimer = 0.02;
            const angle = Math.atan2(this.vy, this.vx);
            particleManager.spawnTrail(this.x, this.y, angle, this.color);
        }
    }

    /**
     * 鍛戒腑鏁屼汉澶勭悊
     * @returns {boolean} 鏄惁閫犳垚浜嗘湁鏁堝懡涓?
     */
    onHit(enemy, particleManager) {
        // 宸茬粡鍛戒腑杩囩殑涓嶅啀浼ゅ锛堢┛閫忕敤锛?
        if (this.hitEnemies.includes(enemy)) return false;
        this.hitEnemies.push(enemy);

        // 鍛戒腑鐗规晥
        particleManager.spawnHit(this.x, this.y, this.color, 4);

        // 绌块€忓鐞?
        if (this.pierce > 0) {
            this.pierce--;
        } else {
            this.active = false;
        }

        return true;
    }

/**
 * 瀛愬脊绠＄悊鍣?- 瀵硅薄姹?
 */
class BulletManager extends ObjectPool {
    constructor(maxBullets = 200) {
        super(() => new Bullet(), maxBullets);
    }

    /**
     * 鍙戝皠涓€棰楀瓙寮?
     */
    fire(x, y, angle, damage, speed, pierce, target = null) {
        const bullet = this.acquire();
        if (bullet) {
            bullet.init(x, y, angle, damage, speed, pierce, target);
        }
        return bullet;
    }

    update(deltaTime, enemies, particleManager) {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].update(deltaTime, enemies, particleManager);
        }
    }

    }
}

if (typeof window !== 'undefined') {
    window.Bullet = Bullet;
    window.BulletManager = BulletManager;
}
