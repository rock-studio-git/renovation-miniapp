// 项目 Store：项目 + 阶段 的 CRUD 与本地存储
// 创建项目时自动生成 9 个默认阶段；删除项目级联删除关联数据

import type {
  Project,
  Stage,
  StageStatus,
  CreateProjectInput,
  UpdateProjectInput,
} from '../types/project';
import { generateId } from '../utils/id';
import { nowISO } from '../utils/date';
import { DEFAULT_STAGE_NAMES } from '../utils/constants';
import { loadArray, saveArray } from './storage';
import { budgetStore } from './budget-store';
import { todoStore } from './todo-store';
import { notifyDataChange } from './notify';
import type { IAppOption } from '../types/app-types';

/** 安全获取 App 实例：应用未就绪（如测试环境）时返回 undefined */
function getAppSafe(): IAppOption | undefined {
  try {
    return getApp<IAppOption>();
  } catch {
    return undefined;
  }
}

const CURRENT_PROJECT_KEY = 'currentProjectId';

class ProjectStore {
  private projects: Project[] = [];
  private stages: Stage[] = [];
  private currentProjectId: string | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.projects = loadArray<Project>('projects');
    this.stages = loadArray<Stage>('stages');
    try {
      const saved = wx.getStorageSync(CURRENT_PROJECT_KEY);
      this.currentProjectId = typeof saved === 'string' && saved ? saved : null;
    } catch {
      this.currentProjectId = null;
    }
    this.initialized = true;
  }

  private persist(): void {
    saveArray('projects', this.projects);
    saveArray('stages', this.stages);
  }

  /** 全部项目：进行中优先，其次按更新时间倒序 */
  getAll(): Project[] {
    return this.projects.slice().sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
  }

  getActive(): Project[] {
    return this.getAll().filter((p) => p.status === 'active');
  }

  getById(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }

  getCurrentProject(): Project | undefined {
    return this.currentProjectId ? this.getById(this.currentProjectId) : undefined;
  }

  setCurrentProject(id: string | null): void {
    this.currentProjectId = id;
    try {
      if (id) wx.setStorageSync(CURRENT_PROJECT_KEY, id);
      else wx.removeStorageSync(CURRENT_PROJECT_KEY);
    } catch {
      /* ignore */
    }
    const app = getAppSafe();
    if (app) app.globalData.currentProjectId = id;
    notifyDataChange('project');
  }

  create(input: CreateProjectInput): Project {
    const now = nowISO();
    const project: Project = {
      id: generateId('p'),
      name: input.name.trim(),
      houseType: input.houseType,
      decorationType: input.decorationType,
      area: input.area,
      address: input.address,
      startDate: input.startDate,
      plannedEndDate: input.plannedEndDate,
      totalBudget: input.totalBudget,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.projects.push(project);

    // 默认 9 个阶段，首个自动进行中
    const stages: Stage[] = DEFAULT_STAGE_NAMES.map((name, idx) => ({
      id: generateId('s'),
      projectId: project.id,
      name,
      sortOrder: idx,
      status: idx === 0 ? 'in_progress' : 'not_started',
    }));
    this.stages.push(...stages);
    project.currentStageId = stages[0].id;

    // 默认 13 个预算分类
    budgetStore.createDefaultCategories(project.id);

    // 首个项目自动设为当前
    if (!this.currentProjectId) {
      this.currentProjectId = project.id;
      try {
        wx.setStorageSync(CURRENT_PROJECT_KEY, project.id);
      } catch {
        /* ignore */
      }
      const app = getAppSafe();
      if (app) app.globalData.currentProjectId = project.id;
    }

    this.persist();
    notifyDataChange('project');
    return project;
  }

  update(id: string, input: UpdateProjectInput): Project {
    const project = this.getById(id);
    if (!project) throw new Error('项目不存在');
    if (input.name !== undefined) project.name = input.name.trim();
    if (input.houseType !== undefined) project.houseType = input.houseType;
    if (input.decorationType !== undefined) project.decorationType = input.decorationType;
    if (input.area !== undefined) project.area = input.area;
    if (input.address !== undefined) project.address = input.address;
    if (input.startDate !== undefined) project.startDate = input.startDate;
    if (input.plannedEndDate !== undefined) project.plannedEndDate = input.plannedEndDate;
    if (input.totalBudget !== undefined) project.totalBudget = input.totalBudget;
    if (input.currentStageId !== undefined) project.currentStageId = input.currentStageId;
    if (input.status !== undefined) project.status = input.status;
    project.updatedAt = nowISO();
    this.persist();
    notifyDataChange('project');
    return project;
  }

  /** 删除项目，级联删除阶段 / 分类 / 支出 / 待办 */
  remove(id: string): void {
    this.projects = this.projects.filter((p) => p.id !== id);
    this.stages = this.stages.filter((s) => s.projectId !== id);
    budgetStore.removeByProject(id);
    todoStore.removeByProject(id);
    if (this.currentProjectId === id) {
      const next = this.getActive()[0];
      this.currentProjectId = next ? next.id : null;
      try {
        if (this.currentProjectId) wx.setStorageSync(CURRENT_PROJECT_KEY, this.currentProjectId);
        else wx.removeStorageSync(CURRENT_PROJECT_KEY);
      } catch {
        /* ignore */
      }
      const app = getAppSafe();
      if (app) app.globalData.currentProjectId = this.currentProjectId;
    }
    this.persist();
    notifyDataChange('all');
  }

  // ---- 阶段管理 ----

  getStages(projectId: string): Stage[] {
    return this.stages
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getStageById(id: string): Stage | undefined {
    return this.stages.find((s) => s.id === id);
  }

  /** 设置阶段状态；同一项目只允许一个进行中阶段 */
  setStageStatus(stageId: string, status: StageStatus): void {
    const stage = this.stages.find((s) => s.id === stageId);
    if (!stage) return;
    if (status === 'in_progress') {
      this.stages.forEach((s) => {
        if (s.projectId === stage.projectId) s.status = 'not_started';
      });
      stage.status = 'in_progress';
      const project = this.getById(stage.projectId);
      if (project) project.currentStageId = stage.id;
    } else {
      stage.status = status;
    }
    this.persist();
    notifyDataChange('project');
  }

  /** 阶段进度：已完成数 / 总数 / 百分比 */
  getProgress(projectId: string): { completed: number; total: number; percent: number } {
    const stages = this.getStages(projectId);
    const completed = stages.filter((s) => s.status === 'completed').length;
    const total = stages.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }
}

export const projectStore = new ProjectStore();
