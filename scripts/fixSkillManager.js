const fs = require('fs');
let sm = fs.readFileSync('E:/game/last-survivor/classes/SkillManager.js', 'utf8');

const replacement = `        this._drawFns = {};
    }

    /** 注册绘制函数（技能 apply 时调用） */
    registerDraw(name, fn) { this._drawFns[name] = fn; }

    /** 绘制所有技能视觉（每帧由 Game.render 调用） */
    drawSkillVisuals(ctx, cameraX, cameraY, player) {
        const fns = Object.values(this._drawFns);
        for (let i = 0; i < fns.length; i++) { fns[i](ctx, cameraX, cameraY, player); }
    }
}`;

// Find and replace the drawVisuals method
const startMarker = '    /**\n     * 绘制技能视觉效果';
const endMarker = '    }\n}';

const startIdx = sm.indexOf(startMarker);
if (startIdx === -1) { console.log('START NOT FOUND'); process.exit(1); }

// Find the closing of the CLASS (not the method)
// The drawVisuals method is the last method before the class closing brace
// Find closing brace before "if (typeof window"
const windowIdx = sm.indexOf('if (typeof window', startIdx);
const beforeWindow = sm.substring(startIdx, windowIdx);

// Remove everything from the drawVisuals comment to just before "if (typeof window"
sm = sm.substring(0, startIdx) + replacement + '\n\n' + sm.substring(windowIdx);

fs.writeFileSync('E:/game/last-survivor/classes/SkillManager.js', sm, 'utf8');
console.log('SkillManager updated');
