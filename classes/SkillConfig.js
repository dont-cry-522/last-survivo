/**
 * ============================================================
 *  SkillConfig.js - 技能系统全局配置
 * ============================================================
 *  定义稀有度、效果类型、流派分类、进化条件
 *  具体技能数据按流派拆分到 skills/ 目录
 * ============================================================
 */

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



if (typeof window !== 'undefined') {
    window.SkillConfig = SkillConfig;
}
