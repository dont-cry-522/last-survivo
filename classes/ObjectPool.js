/**
 * ============================================================
 *  ObjectPool.js - 通用对象池基类
 * ============================================================
 *  统一管理所有可复用实体（子弹/敌人/粒子/经验球）
 *  避免频繁创建销毁，提升性能
 *  池满时覆盖最老的活跃对象（保证不丢失生成请求）
 * ============================================================
 */

class ObjectPool {
    /**
     * @param {Function} factory - 无参工厂函数，创建新实例
     * @param {number} maxSize - 池容量
     */
    constructor(factory, maxSize) {
        this.pool = [];
        for (let i = 0; i < maxSize; i++) {
            this.pool.push(factory());
        }
    }

    /**
     * 从池中获取一个空闲对象
     * @returns {Object} 空闲对象，池满时返回 pool[0]
     */
    acquire() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                return this.pool[i];
            }
        }
        return this.pool[0];
    }

    /**
     * 获取当前活跃对象数量
     */
    getActiveCount() {
        let count = 0;
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) count++;
        }
        return count;
    }

    /**
     * 清除所有对象（设为非活跃）
     */
    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
        }
    }
}

if (typeof window !== 'undefined') {
    window.ObjectPool = ObjectPool;
}
