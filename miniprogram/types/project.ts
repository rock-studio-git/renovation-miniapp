// 项目与阶段相关类型定义（对齐 PRD 第 10 节数据模型）

/** 房屋类型：新房 / 旧房 */
export type HouseType = 'new' | 'old';

/** 装修方式：半包 / 全包 / 清包 / 暂不确定 */
export type DecorationType = 'half' | 'full' | 'clear' | 'unknown';

/** 阶段状态 */
export type StageStatus = 'not_started' | 'in_progress' | 'completed';

/** 项目状态 */
export type ProjectStatus = 'active' | 'archived';

/** 装修阶段 */
export interface Stage {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
  status: StageStatus;
  note?: string;
}

/** 装修项目 */
export interface Project {
  id: string;
  name: string;
  houseType: HouseType;
  decorationType: DecorationType;
  /** 建筑面积（平方米） */
  area: number;
  address?: string;
  /** 开工日期 ISO date (YYYY-MM-DD) */
  startDate: string;
  /** 计划完工日期 ISO date */
  plannedEndDate?: string;
  /** 总预算（元，保留两位小数） */
  totalBudget: number;
  /** 当前进行中的阶段 ID */
  currentStageId?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

/** 创建项目输入 */
export interface CreateProjectInput {
  name: string;
  houseType: HouseType;
  decorationType: DecorationType;
  area: number;
  address?: string;
  startDate: string;
  plannedEndDate?: string;
  totalBudget: number;
}

/** 更新项目输入（部分字段） */
export interface UpdateProjectInput {
  name?: string;
  houseType?: HouseType;
  decorationType?: DecorationType;
  area?: number;
  address?: string;
  startDate?: string;
  plannedEndDate?: string;
  totalBudget?: number;
  currentStageId?: string;
  status?: ProjectStatus;
}
