import { FC } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { TGroupedIssues } from "@plane/types";
// components
import { TOAST_TYPE, setToast } from "@plane/ui";
import { CalendarChart } from "@/components/issues";
// hooks
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useIssues, useUser } from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// ui
// types
import { IQuickActionProps } from "../list/list-view-types";
import { handleDragDrop } from "./utils";

type CalendarStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW;

interface IBaseCalendarRoot {
  QuickActions: FC<IQuickActionProps>;
  storeType: CalendarStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  viewId?: string;
  isCompletedCycle?: boolean;
}

export const BaseCalendarRoot = observer((props: IBaseCalendarRoot) => {
  const { QuickActions, storeType, addIssuesToView, viewId, isCompletedCycle = false } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { issues, issuesFilter, issueMap } = useIssues(storeType);
  const { updateIssue, removeIssue, removeIssueFromView, archiveIssue, restoreIssue, updateFilters } =
    useIssuesActions(storeType);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const displayFilters = issuesFilter.issueFilters?.displayFilters;

  const groupedIssueIds = (issues.groupedIssueIds ?? {}) as TGroupedIssues;

  const onDragEnd = async (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    if (handleDragDrop) {
      await handleDragDrop(
        result.source,
        result.destination,
        workspaceSlug?.toString(),
        projectId?.toString(),
        issueMap,
        groupedIssueIds,
        updateIssue
      ).catch((err) => {
        setToast({
          title: "Error",
          type: TOAST_TYPE.ERROR,
          message: err?.detail ?? "Failed to perform this action",
        });
      });
    }
  };

  return (
    <>
      <div className="h-full w-full overflow-hidden bg-custom-background-100 pt-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <CalendarChart
            issuesFilterStore={issuesFilter}
            issues={issueMap}
            groupedIssueIds={groupedIssueIds}
            layout={displayFilters?.calendar?.layout}
            showWeekends={displayFilters?.calendar?.show_weekends ?? false}
            quickActions={(issue, customActionButton, placement) => (
              <QuickActions
                customActionButton={customActionButton}
                issue={issue}
                handleDelete={async () => removeIssue(issue.project_id, issue.id)}
                handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
                handleRemoveFromView={async () =>
                  removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)
                }
                handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
                handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
                readOnly={!isEditingAllowed || isCompletedCycle}
                placements={placement}
              />
            )}
            addIssuesToView={addIssuesToView}
            quickAddCallback={issues.quickAddIssue}
            viewId={viewId}
            readOnly={!isEditingAllowed || isCompletedCycle}
            updateFilters={updateFilters}
          />
        </DragDropContext>
      </div>
    </>
  );
});
