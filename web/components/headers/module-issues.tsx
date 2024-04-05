import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/router";
// hooks
import { ArrowRight, PanelRight, Plus } from "lucide-react";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, IIssueFilterOptions, TIssueLayouts } from "@plane/types";
import { Breadcrumbs, Button, CustomMenu, DiceIcon, Tooltip } from "@plane/ui";
import { ProjectAnalyticsModal } from "@/components/analytics";
import { BreadcrumbLink } from "@/components/common";
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection, LayoutSelection } from "@/components/issues";
import { ProjectLogo } from "@/components/project";
import { EIssuesStoreType, EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { cn } from "@/helpers/common.helper";
import { truncateText } from "@/helpers/string.helper";
import {
  useApplication,
  useEventTracker,
  useLabel,
  useMember,
  useModule,
  useProject,
  useProjectState,
  useUser,
  useIssues,
} from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import useLocalStorage from "@/hooks/use-local-storage";
// components
// ui
// icons
// helpers
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
// constants

const ModuleDropdownOption: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { getModuleById } = useModule();
  // derived values
  const moduleDetail = getModuleById(moduleId);

  if (!moduleDetail) return null;

  return (
    <CustomMenu.MenuItem key={moduleDetail.id}>
      <Link
        href={`/${workspaceSlug}/projects/${projectId}/modules/${moduleDetail.id}`}
        className="flex items-center gap-1.5"
      >
        <DiceIcon className="h-3 w-3" />
        {truncateText(moduleDetail.name, 40)}
      </Link>
    </CustomMenu.MenuItem>
  );
};

export const ModuleIssuesHeader: React.FC = observer(() => {
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    issuesFilter: { issueFilters },
  } = useIssues(EIssuesStoreType.MODULE);
  const { updateFilters } = useIssuesActions(EIssuesStoreType.MODULE);
  const { projectModuleIds, getModuleById } = useModule();
  const {
    commandPalette: { toggleCreateIssueModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  const { projectLabels } = useLabel();
  const { projectStates } = useProjectState();
  const {
    project: { projectMemberIds },
  } = useMember();

  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");

  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  const activeLayout = issueFilters?.displayFilters?.layout;

  const handleLayoutChange = useCallback(
    (layout: TIssueLayouts) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [projectId, moduleId, updateFilters]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!projectId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        // this validation is majorly for the filter start_date, target_date custom
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), EIssueFilterType.FILTERS, { [key]: newValues });
    },
    [projectId, moduleId, issueFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [projectId, moduleId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [projectId, moduleId, updateFilters]
  );

  // derived values
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : undefined;
  const canUserCreateIssue =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  const issueCount = moduleDetails
    ? issueFilters?.displayFilters?.sub_issue && moduleDetails.sub_issues
      ? moduleDetails.total_issues + moduleDetails.sub_issues
      : moduleDetails.total_issues
    : undefined;

  return (
    <>
      <ProjectAnalyticsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        moduleDetails={moduleDetails ?? undefined}
      />
      <div className="relative z-[15] items-center gap-x-2 gap-y-4">
        <div className="flex justify-between bg-custom-sidebar-background-100 p-4">
          <div className="flex items-center gap-2">
            <Breadcrumbs onBack={router.back}>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <span>
                    <span className="hidden md:block">
                      <BreadcrumbLink
                        label={currentProjectDetails?.name ?? "Project"}
                        href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                        icon={
                          currentProjectDetails && (
                            <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                              <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                            </span>
                          )
                        }
                      />
                    </span>
                    <Link
                      href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                      className="block md:hidden pl-2 text-custom-text-300"
                    >
                      ...
                    </Link>
                  </span>
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/projects/${projectId}/modules`}
                    label="Modules"
                    icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="component"
                component={
                  <CustomMenu
                    label={
                      <>
                        <DiceIcon className="h-3 w-3" />
                        <div className="flex items-center gap-2 w-auto max-w-[70px] sm:max-w-[200px] truncate">
                          <p className="truncate">{moduleDetails?.name && moduleDetails.name}</p>
                          {issueCount && issueCount > 0 ? (
                            <Tooltip
                              isMobile={isMobile}
                              tooltipContent={`There are ${issueCount} ${
                                issueCount > 1 ? "issues" : "issue"
                              } in this module`}
                              position="bottom"
                            >
                              <span className="cursor-default flex items-center text-center justify-center px-2 flex-shrink-0 bg-custom-primary-100/20 text-custom-primary-100 text-xs font-semibold rounded-xl">
                                {issueCount}
                              </span>
                            </Tooltip>
                          ) : null}
                        </div>
                      </>
                    }
                    className="ml-1.5 flex-shrink-0"
                    placement="bottom-start"
                  >
                    {projectModuleIds?.map((moduleId) => (
                      <ModuleDropdownOption key={moduleId} moduleId={moduleId} />
                    ))}
                  </CustomMenu>
                }
              />
            </Breadcrumbs>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-2">
              <LayoutSelection
                layouts={["list", "kanban", "calendar", "spreadsheet", "gantt_chart"]}
                onChange={(layout) => handleLayoutChange(layout)}
                selectedLayout={activeLayout}
              />
              <FiltersDropdown title="Filters" placement="bottom-end">
                <FilterSelection
                  filters={issueFilters?.filters ?? {}}
                  handleFiltersUpdate={handleFiltersUpdate}
                  layoutDisplayFiltersOptions={
                    activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
                  }
                  labels={projectLabels}
                  memberIds={projectMemberIds ?? undefined}
                  states={projectStates}
                  cycleViewDisabled={!currentProjectDetails?.cycle_view}
                  moduleViewDisabled={!currentProjectDetails?.module_view}
                />
              </FiltersDropdown>
              <FiltersDropdown title="Display" placement="bottom-end">
                <DisplayFiltersSelection
                  layoutDisplayFiltersOptions={
                    activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined
                  }
                  displayFilters={issueFilters?.displayFilters ?? {}}
                  handleDisplayFiltersUpdate={handleDisplayFilters}
                  displayProperties={issueFilters?.displayProperties ?? {}}
                  handleDisplayPropertiesUpdate={handleDisplayProperties}
                  ignoreGroupedFilters={["module"]}
                  cycleViewDisabled={!currentProjectDetails?.cycle_view}
                  moduleViewDisabled={!currentProjectDetails?.module_view}
                />
              </FiltersDropdown>
            </div>

            {canUserCreateIssue && (
              <>
                <Button
                  className="hidden md:block"
                  onClick={() => setAnalyticsModal(true)}
                  variant="neutral-primary"
                  size="sm"
                >
                  Analytics
                </Button>
                <Button
                  className="hidden sm:flex"
                  onClick={() => {
                    setTrackElement("Module issues page");
                    toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
                  }}
                  size="sm"
                  prependIcon={<Plus />}
                >
                  Add Issue
                </Button>
              </>
            )}
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80"
              onClick={toggleSidebar}
            >
              <ArrowRight
                className={`h-4 w-4 duration-300 hidden md:block ${isSidebarCollapsed ? "-rotate-180" : ""}`}
              />
              <PanelRight
                className={cn(
                  "w-4 h-4 block md:hidden",
                  !isSidebarCollapsed ? "text-[#3E63DD]" : "text-custom-text-200"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
