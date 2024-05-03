import cloneDeep from "lodash/cloneDeep";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import set from "lodash/set";
import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { computedFn } from "mobx-utils";
import { IIssueFilterOptions, IWorkspaceView } from "@plane/types";
// constants
import { EIssueFilterType } from "@/constants/issue";
// services
import { WorkspaceService } from "@/services/workspace.service";
// types
import { RootStore } from "@/store/root.store";

export interface IGlobalViewStore {
  // observables
  globalViewMap: Record<string, IWorkspaceView>;
  // computed
  currentWorkspaceViews: string[] | null;
  // computed actions
  getSearchedViews: (searchQuery: string) => string[] | null;
  getViewDetailsById: (viewId: string) => IWorkspaceView | null;
  // fetch actions
  fetchAllGlobalViews: (workspaceSlug: string) => Promise<IWorkspaceView[]>;
  fetchGlobalViewDetails: (workspaceSlug: string, viewId: string) => Promise<IWorkspaceView>;
  // crud actions
  createGlobalView: (workspaceSlug: string, data: Partial<IWorkspaceView>) => Promise<IWorkspaceView>;
  updateGlobalView: (
    workspaceSlug: string,
    viewId: string,
    data: Partial<IWorkspaceView>
  ) => Promise<IWorkspaceView | undefined>;
  deleteGlobalView: (workspaceSlug: string, viewId: string) => Promise<any>;
}

export class GlobalViewStore implements IGlobalViewStore {
  // observables
  globalViewMap: Record<string, IWorkspaceView> = {};
  // root store
  rootStore;
  // services
  workspaceService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      globalViewMap: observable,
      // computed
      currentWorkspaceViews: computed,
      // actions
      fetchAllGlobalViews: action,
      fetchGlobalViewDetails: action,
      createGlobalView: action,
      updateGlobalView: action,
      deleteGlobalView: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.workspaceService = new WorkspaceService();
  }

  /**
   * @description returns list of views for current workspace
   */
  get currentWorkspaceViews() {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails) return null;

    return (
      Object.keys(this.globalViewMap ?? {})?.filter(
        (viewId) => this.globalViewMap[viewId]?.workspace === currentWorkspaceDetails.id
      ) ?? null
    );
  }

  /**
   * @description returns list of views for current workspace based on search query
   * @param searchQuery
   * @returns
   */
  getSearchedViews = computedFn((searchQuery: string) => {
    const currentWorkspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspaceDetails) return null;

    return (
      Object.keys(this.globalViewMap ?? {})?.filter(
        (viewId) =>
          this.globalViewMap[viewId]?.workspace === currentWorkspaceDetails.id &&
          this.globalViewMap[viewId]?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ) ?? null
    );
  });

  /**
   * @description returns view details for given viewId
   * @param viewId
   */
  getViewDetailsById = computedFn((viewId: string): IWorkspaceView | null => this.globalViewMap[viewId] ?? null);

  /**
   * @description fetch all global views for given workspace
   * @param workspaceSlug
   */
  fetchAllGlobalViews = async (workspaceSlug: string): Promise<IWorkspaceView[]> =>
    await this.workspaceService.getAllViews(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((view) => {
          set(this.globalViewMap, view.id, view);
        });
      });
      return response;
    });

  /**
   * @description fetch view details for given viewId
   * @param viewId
   */
  fetchGlobalViewDetails = async (workspaceSlug: string, viewId: string): Promise<IWorkspaceView> =>
    await this.workspaceService.getViewDetails(workspaceSlug, viewId).then((response) => {
      runInAction(() => {
        set(this.globalViewMap, viewId, response);
      });
      return response;
    });

  /**
   * @description create new global view
   * @param workspaceSlug
   * @param data
   */
  createGlobalView = async (workspaceSlug: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> =>
    await this.workspaceService.createView(workspaceSlug, data).then((response) => {
      runInAction(() => {
        set(this.globalViewMap, response.id, response);
      });
      return response;
    });

  /**
   * @description update global view
   * @param workspaceSlug
   * @param viewId
   * @param data
   */
  updateGlobalView = async (
    workspaceSlug: string,
    viewId: string,
    data: Partial<IWorkspaceView>
  ): Promise<IWorkspaceView | undefined> => {
    const currentViewData = this.getViewDetailsById(viewId) ? cloneDeep(this.getViewDetailsById(viewId)) : undefined;
    try {
      Object.keys(data).forEach((key) => {
        const currentKey = key as keyof IWorkspaceView;
        set(this.globalViewMap, [viewId, currentKey], data[currentKey]);
      });
      const currentView = await this.workspaceService.updateView(workspaceSlug, viewId, data);
      // applying the filters in the global view
      if (!isEqual(currentViewData?.filters || {}, currentView?.filters || {})) {
        if (isEmpty(currentView?.filters)) {
          const currentGlobalViewFilters: IIssueFilterOptions = this.rootStore.issue.workspaceIssuesFilter.filters[
            viewId
          ].filters as IIssueFilterOptions;
          const newFilters: IIssueFilterOptions = {};
          Object.keys(currentGlobalViewFilters ?? {}).forEach((key) => {
            newFilters[key as keyof IIssueFilterOptions] = [];
          });
          await this.rootStore.issue.workspaceIssuesFilter.updateFilters(
            workspaceSlug,
            undefined,
            EIssueFilterType.FILTERS,
            newFilters,
            viewId
          );
        } else {
          await this.rootStore.issue.workspaceIssuesFilter.updateFilters(
            workspaceSlug,
            undefined,
            EIssueFilterType.FILTERS,
            currentView.filters,
            viewId
          );
        }
        this.rootStore.issue.workspaceIssues.fetchIssues(workspaceSlug, viewId, "mutation");
      }
      return currentView;
    } catch {
      Object.keys(data).forEach((key) => {
        const currentKey = key as keyof IWorkspaceView;
        if (currentViewData) set(this.globalViewMap, [viewId, currentKey], currentViewData[currentKey]);
      });
    }
  };

  /**
   * @description delete global view
   * @param workspaceSlug
   * @param viewId
   */
  deleteGlobalView = async (workspaceSlug: string, viewId: string): Promise<any> =>
    await this.workspaceService.deleteView(workspaceSlug, viewId).then(() => {
      runInAction(() => {
        delete this.globalViewMap[viewId];
      });
    });
}
