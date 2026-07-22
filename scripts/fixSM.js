const fs = require('fs');
let sm = fs.readFileSync('E:/game/last-survivor/classes/SkillManager.js', 'utf8');

const dvIdx = sm.indexOf('drawVisuals(ctx');
const winIdx = sm.indexOf('if (typeof window', dvIdx);

let classEnd = winIdx;
while (classEnd > dvIdx && sm[classEnd] !== '}') classEnd--;
while (classEnd > dvIdx && sm.substring(classEnd - 2, classEnd + 1) !== '\n}\n') {
    classEnd--;
    while (classEnd > dvIdx && sm[classEnd] !== '}') classEnd--;
}

const prefix = sm.substring(0, dvIdx - 4);
const suffix = sm.substring(classEnd - 1);

const middle = [
    '        this._drawFns = {};',
    '    }',
    '',
    '    registerDraw(name, fn) { this._drawFns[name] = fn; }',
    '',
    '    drawSkillVisuals(ctx, cameraX, cameraY, player) {',
    '        const fns = Object.values(this._drawFns);',
    '        for (let i = 0; i < fns.length; i++) { fns[i](ctx, cameraX, cameraY, player); }',
    '    }',
    ''
].join('\n');

const result = prefix + middle + suffix;
fs.writeFileSync('E:/game/last-survivor/classes/SkillManager.js', result, 'utf8');
console.log('Done');
