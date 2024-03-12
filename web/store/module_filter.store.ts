import { action, computed, observable, makeObservable, runInAction, autorun } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
// types
import { RootStore } from "store/root.store";
import { TModuleDisplayFilters, TModuleFilters } from "@plane/types";

export interface IModuleFilterStore {
  // observables
  displayFilters: Record<string, TModuleDisplayFilters>;
  filters: Record<string, TModuleFilters>;
  searchQuery: string;
  // computed
  currentProjectDisplayFilters: TModuleDisplayFilters | undefined;
  currentProjectFilters: TModuleFilters | undefined;
  // computed functions
  getDisplayFiltersByProjectId: (projectId: string) => TModuleDisplayFilters | undefined;
  getFiltersByProjectId: (projectId: string) => TModuleFilters | undefined;
  // actions
  updateDisplayFilters: (projectId: string, displayFilters: TModuleDisplayFilters) => void;
  updateFilters: (projectId: string, filters: TModuleFilters) => void;
  updateSearchQuery: (query: string) => void;
  clearAllFilters: (projectId: string) => void;
}

export class ModuleFilterStore implements IModuleFilterStore {
  // observables
  displayFilters: Record<string, TModuleDisplayFilters> = {};
  filters: Record<string, TModuleFilters> = {};
  searchQuery: string = "";
  // root store
  rootStore: RootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      // computed
      currentProjectDisplayFilters: computed,
      currentProjectFilters: computed,
      // actions
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      clearAllFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // initialize display filters of the current project
    autorun(() => {
      const projectId = this.rootStore.app.router.projectId;
      if (!projectId) return;
      this.initProjectModuleFilters(projectId);
    });
  }

  /**
   * @description get display filters of the current project
   */
  get currentProjectDisplayFilters() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return;
    return this.displayFilters[projectId];
  }

  /**
   * @description get filters of the current project
   */
  get currentProjectFilters() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return;
    return this.filters[projectId];
  }

  /**
   * @description get display filters of a project by projectId
   * @param {string} projectId
   */
  getDisplayFiltersByProjectId = computedFn((projectId: string) => this.displayFilters[projectId]);

  /**
   * @description get filters of a project by projectId
   * @param {string} projectId
   */
  getFiltersByProjectId = computedFn((projectId: string) => this.filters[projectId]);

  /**
   * @description initialize display filters and filters of a project
   * @param {string} projectId
   */
  initProjectModuleFilters = (projectId: string) => {
    const displayFilters = this.getDisplayFiltersByProjectId(projectId);
    runInAction(() => {
      this.displayFilters[projectId] = {
        favorites: displayFilters?.favorites || false,
        layout: displayFilters?.layout || "list",
        order_by: displayFilters?.order_by || "name",
      };
      this.filters[projectId] = {};
    });
  };

  /**
   * @description update display filters of a project
   * @param {string} projectId
   * @param {TModuleDisplayFilters} displayFilters
   */
  updateDisplayFilters = (projectId: string, displayFilters: TModuleDisplayFilters) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [projectId, key], displayFilters[key as keyof TModuleDisplayFilters]);
      });
    });
  };

  /**
   * @description update filters of a project
   * @param {string} projectId
   * @param {TModuleFilters} filters
   */
  updateFilters = (projectId: string, filters: TModuleFilters) => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, [projectId, key], filters[key as keyof TModuleFilters]);
      });
    });
  };

  /**
   * @description update search query
   * @param {string} query
   */
  updateSearchQuery = (query: string) => (this.searchQuery = query);

  /**
   * @description clear all filters of a project
   * @param {string} projectId
   */
  clearAllFilters = (projectId: string) => {
    runInAction(() => {
      this.filters[projectId] = {};
    });
  };
}
