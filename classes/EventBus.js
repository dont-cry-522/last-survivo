/**
 * ============================================================
 *  EventBus.js - 游戏事件总线
 * ============================================================
 *
 *  解耦实体与系统之间的直接调用。
 *  实体通过 Manager 发出事件（emit），系统监听事件（on）响应。
 *
 *  设计原则:
 *    1. 实例化模式 — 由 Game 创建并注入各系统，非全局单例
 *    2. 实体无感知 — 实体不持有 EventBus，Manager 代理 emit
 *    3. 命名空间 — domain:action 格式（enemy:dead / player:hit）
 *    4. 无临时分配 — emit 只传递已有引用，不在热路径创建对象
 *    5. 可重置 — clear() 用于游戏重开
 *
 *  事件契约（计划目录，随迁移逐步实施）:
 *
 *  ┌──────────────────┬──────────────────────────────────────────┐
 *  │ 事件名            │ 载荷 (data)                              │
 *  ├──────────────────┼──────────────────────────────────────────┤
 *  │ enemy:dead       │ { x, y, color, isExploder, exp, gold }   │
 *  │ enemy:explode    │ { x, y }                                 │
 *  │ enemy:hit        │ { x, y, damage, isCrit }                 │
 *  │ boss:dead        │ { x, y, exp, gold }                      │
 *  │ boss:hit         │ { x, y, damage, isCrit }                 │
 *  │ boss:charge      │ { direction: {x,y} }                     │
 *  │ boss:aoe         │ { x, y, radius }                         │
 *  │ boss:appear      │ {}                                       │
 *  │ player:damaged   │ { amount }                               │
 *  │ player:dash      │ {}                                       │
 *  │ player:shoot     │ {}                                       │
 *  │ player:levelup   │ {}                                       │
 *  │ bullet:hit       │ { x, y, isCrit }                         │
 *  │ experience:pickup│ { x, y }                                 │
 *  │ screen:shake     │ { intensity }                            │
 *  │ enemy:explode    │ { x, y }                                 │
 *  │ game:over        │ {}                                       │
 *  │ game:start       │ {}                                       │
 *  └──────────────────┴──────────────────────────────────────────┘
 * ============================================================
 */

class EventBus {
    constructor() {
        this._listeners = {};
    }

    /**
     * 注册事件监听
     * @param {string} event - 事件名 (domain:action)
     * @param {Function} callback - 回调函数，接收 data 参数
     * @param {Object} [context] - 可选，回调的 this 绑定
     */
    on(event, callback, context) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push({ callback, context: context || null });
    }

    /**
     * 移除事件监听
     * @param {string} event - 事件名
     * @param {Function} callback - 要移除的回调引用
     */
    off(event, callback) {
        const listeners = this._listeners[event];
        if (!listeners) return;
        for (let i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i].callback === callback) {
                listeners.splice(i, 1);
            }
        }
    }

    /**
     * 发送事件
     * @param {string} event - 事件名
     * @param {Object} [data] - 事件载荷，直接传递引用，不做拷贝
     */
    emit(event, data) {
        const listeners = this._listeners[event];
        if (!listeners) return;
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            if (listener.context) {
                listener.callback.call(listener.context, data);
            } else {
                listener.callback(data);
            }
        }
    }

    /**
     * 移除某事件的所有监听器
     * @param {string} event - 事件名，省略则清空全部
     */
    clear(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    }
}

if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
}
