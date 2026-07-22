/**
 * ============================================================
 *  Utils.js - 工具函数集合
 * ============================================================
 *  数学计算、碰撞检测、随机数、空间工具等
 *  TODO: 可以加入四叉树空间划分优化大量敌人
 *  TODO: 可以加入对象池基类
 * ============================================================
 */

class Utils {
    /**
     * 计算两点之间的距离
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算两点距离的平方（避免开方，用于比较）
     */
    static distanceSq(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    /**
     * 获取两点之间的角度（弧度）
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    /**
     * 圆形碰撞检测
     */
    static circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distanceSq(x1, y1, x2, y2) < (r1 + r2) * (r1 + r2);
    }

    /**
     * 范围随机数 [min, max)
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * 范围随机整数 [min, max]
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 从数组中随机选取一个元素
     */
    static randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * 从数组中随机选取n个不重复元素
     */
    static randomChoices(arr, n) {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(n, arr.length));
    }

    /**
     * 数值限制在范围内
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * 线性插值
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * 格式化时间（秒 -> MM:SS）
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 格式化数字（大数字简化显示，如 1.2k）
     */
    static formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }

    /**
     * 在玩家周围随机生成点（用于敌人生成）
     * 在屏幕外的一圈随机位置生成
     */
    static spawnPositionAround(playerX, playerY, canvasW, canvasH) {
        const margin = 100; // 屏幕外多远
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(canvasW, canvasH) / 2 + margin;
        return {
            x: playerX + Math.cos(angle) * radius,
            y: playerY + Math.sin(angle) * radius,
        };
    }

    /**
     * 缓动函数 - easeOutQuad
     */
    static easeOutQuad(t) {
        return t * (2 - t);
    }

    /**
     * 缓动函数 - easeInOutQuad
     */
    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * 震动衰减计算
     */
    static shake(intensity, decay, deltaTime) {
        return intensity * Math.pow(decay, deltaTime * 60);
    }

    /**
     * HSL转RGB辅助（生成渐变色粒子用）
     */
    static hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }

    // TODO: 四叉树空间划分 - 优化大量敌人的最近查找
    // TODO: 对象池基类 - 统一管理可复用对象
}

if (typeof window !== 'undefined') {
    window.Utils = Utils;
}
