import React, { useCallback } from "react";
import xor from "lodash/xor";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { TIssue } from "@plane/types";
// components
import { ModuleDropdown } from "@/components/dropdowns";
// constants
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useEventTracker, useIssues } from "@/hooks/store";

type Props = {
  issue: TIssue;
  onClose: () => void;
  disabled: boolean;
};

export const SpreadsheetModuleColumn: React.FC<Props> = observer((props) => {
  const { issue, disabled, onClose } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // hooks
  const { captureIssueEvent } = useEventTracker();
  const {
    issues: { changeModulesInIssue },
  } = useIssues(EIssuesStoreType.MODULE);

  const handleModule = useCallback(
    async (moduleIds: string[] | null) => {
      if (!workspaceSlug || !issue || !issue.module_ids || !moduleIds) return;

      const updatedModuleIds = xor(issue.module_ids, moduleIds);
      const modulesToAdd: string[] = [];
      const modulesToRemove: string[] = [];
      for (const moduleId of updatedModuleIds) {
        if (issue.module_ids.includes(moduleId)) modulesToRemove.push(moduleId);
        else modulesToAdd.push(moduleId);
      }
      changeModulesInIssue(workspaceSlug.toString(), issue.project_id, issue.id, modulesToAdd, modulesToRemove);

      captureIssueEvent({
        eventName: "Issue updated",
        payload: {
          ...issue,
          module_ids: moduleIds,
          element: "Spreadsheet layout",
        },
        updates: { changed_property: "module_ids", change_details: { module_ids: moduleIds } },
        path: router.asPath,
      });
    },
    [workspaceSlug, issue, changeModulesInIssue, captureIssueEvent, router.asPath]
  );

  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      <ModuleDropdown
        projectId={issue?.project_id}
        value={issue?.module_ids ?? []}
        onChange={handleModule}
        disabled={disabled}
        placeholder="Select modules"
        buttonVariant="transparent-with-text"
        buttonContainerClassName="w-full relative flex items-center p-2 group-[.selected-issue-row]:bg-custom-primary-100/5 group-[.selected-issue-row]:hover:bg-custom-primary-100/10"
        buttonClassName="relative leading-4 h-4.5 bg-transparent hover:bg-transparent"
        onClose={onClose}
        multiple
        showCount
        showTooltip
      />
    </div>
  );
});
