import React from 'react';
import {Tier, User} from "@/app/user-info/types";
/**
 * 渲染排名值和等级的组件。
 */
interface ValueDisplayProps {
  modifiers: string;
  value: React.ReactNode;
}

interface RankDisplayProps {
  type: 'global' | 'local' | string;
  user: User;
}

const ValueDisplay: React.FC<ValueDisplayProps> = ({ modifiers, value }) => (
  <div className={`value-display value-display--${modifiers}`}>
    <div className="value-display__value">{value}</div>
  </div>
);

export const globalTier = (user: User): Tier | null => {
    const rank = user.statistics?.global_rank;
    const percent = user.statistics?.global_rank_percent
  if (rank == null || percent
      == null) {
    return null;
  }

  // 根据 rank 决定最高等级
  if (rank <= 100) {
    return 'lustrous';
  }

  // 根据 percent 决定其他等级
  return percent < 0.0005
    ? 'radiant'
    : percent < 0.0025
      ? 'rhodium'
      : percent < 0.005
        ? 'platinum'
        : percent < 0.025
          ? 'gold'
          : percent < 0.05
            ? 'silver'
            : percent < 0.25
              ? 'bronze'
              : percent < 0.5
                ? 'iron'
                : null;
};

const classNames = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface RankValueStyle extends React.CSSProperties {
    '--colour'?: string;
}

const RankDisplay: React.FC<RankDisplayProps> = ({ type, user }) => {
  // 1. 获取等级（Tier）
  const tier = type === 'global' ? globalTier(user) : null;
  // 基础等级为 'base'，否则使用实际等级 (使用类型断言确保它是 Tier 类型)
  const currentTier: Tier = (tier ?? 'base') as Tier;

  // --- 1. 动态 CSS 变量 ---
  // 如果有等级，使用 --level-tier-X 变量名，否则为空（将使用 .rank-value 中定义的默认值）
  const tierVar = tier == null ? '' : `var(--level-tier-${tier})`;

  // --- 2. 动态 Tailwind 类 (Font Weight) ---
  // 原始代码: .rank-value { --font-weight: bold; }
  //          &--base / &--iron { --font-weight: 400; }
  let fontWeightClass = 'font-bold'; // 默认 bold

  if (currentTier === 'base' || currentTier === 'iron') {
    fontWeightClass = 'font-normal'; // 对应 font-weight: 400
  }



  return (
    <ValueDisplay
      modifiers='rank'
      value={
        <div
          // 动态应用类名
          className={classNames('rank-value', fontWeightClass, currentTier === 'base' ? 'rank-value--base' : '')}
          style={{
            // 覆盖 --colour 变量，实现动态等级颜色
            // 例如: --colour: var(--level-tier-platinum);
            '--colour': tierVar,
          } as RankValueStyle} // 使用类型断言
        >
          {/* 这里放置实际的排名/百分比值 */}
          {/* 示例：检查 rank 是否存在并显示 */}
          {user.statistics?.global_rank !== null ? `#${user.statistics?.global_rank}` : 'N/A'}
        </div>
      }
    />
  );
};

export default RankDisplay;