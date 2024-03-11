import { enableStaticRendering } from "mobx-react-lite";
// root stores
import { AppRootStore, IAppRootStore } from "./application";
import { CycleStore, ICycleStore } from "./cycle.store";
import { DashboardStore, IDashboardStore } from "./dashboard.store";
import { IEstimateStore, EstimateStore } from "./estimate.store";
import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";
import { GlobalViewStore, IGlobalViewStore } from "./global-view.store";
import { IInboxRootStore, InboxRootStore } from "./inbox/root.store";
import { IssueRootStore, IIssueRootStore } from "./issue/root.store";
import { ILabelStore, LabelStore } from "./label.store";
import { IMemberRootStore, MemberRootStore } from "./member";
import { IMentionStore, MentionStore } from "./mention.store";
import { IModuleStore, ModulesStore } from "./module.store";
import { IProjectRootStore, ProjectRootStore } from "./project";
import { IProjectViewStore, ProjectViewStore } from "./project-view.store";
import { IStateStore, StateStore } from "./state.store";
import { IUserRootStore, UserRootStore } from "./user";
import { IWorkspaceRootStore, WorkspaceRootStore } from "./workspace";
import { IProjectPageStore, ProjectPageStore } from "./project-page.store";
import { CycleFilterStore, ICycleFilterStore } from "./cycle_filter.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  app: IAppRootStore;
  eventTracker: IEventTrackerStore;
  user: IUserRootStore;
  workspaceRoot: IWorkspaceRootStore;
  projectRoot: IProjectRootStore;
  memberRoot: IMemberRootStore;
  cycle: ICycleStore;
  cycleFilter: ICycleFilterStore;
  module: IModuleStore;
  projectView: IProjectViewStore;
  globalView: IGlobalViewStore;
  issue: IIssueRootStore;
  inbox: IInboxRootStore;
  state: IStateStore;
  label: ILabelStore;
  estimate: IEstimateStore;
  mention: IMentionStore;
  dashboard: IDashboardStore;
  projectPages: IProjectPageStore;

  constructor() {
    this.app = new AppRootStore(this);
    this.eventTracker = new EventTrackerStore(this);
    this.user = new UserRootStore(this);
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.memberRoot = new MemberRootStore(this);
    // independent stores
    this.cycle = new CycleStore(this);
    this.cycleFilter = new CycleFilterStore(this);
    this.module = new ModulesStore(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    this.issue = new IssueRootStore(this);
    this.inbox = new InboxRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.mention = new MentionStore(this);
    this.projectPages = new ProjectPageStore(this);
    this.dashboard = new DashboardStore(this);
  }

  resetOnSignout() {
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.projectRoot = new ProjectRootStore(this);
    this.memberRoot = new MemberRootStore(this);
    // independent stores
    this.cycle = new CycleStore(this);
    this.cycleFilter = new CycleFilterStore(this);
    this.module = new ModulesStore(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
    this.issue = new IssueRootStore(this);
    this.inbox = new InboxRootStore(this);
    this.state = new StateStore(this);
    this.label = new LabelStore(this);
    this.estimate = new EstimateStore(this);
    this.mention = new MentionStore(this);
    this.projectPages = new ProjectPageStore(this);
    this.dashboard = new DashboardStore(this);
  }
}
