import React, { useState, useRef } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IIssueLabel } from "@plane/types";
// hooks
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "@/components/empty-state";
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  ProjectSettingLabelGroup,
  ProjectSettingLabelItem,
} from "@/components/labels";
import { EmptyStateType } from "@/constants/empty-state";
import { useLabel } from "@/hooks/store";
// components
// ui
// types
// constants

export const ProjectSettingsLabelList: React.FC = observer(() => {
  // states
  const [showLabelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabel | null>(null);
  // refs
  const scrollToRef = useRef<HTMLFormElement>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { projectLabels, updateLabelPosition, projectLabelsTree } = useLabel();

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const onDrop = (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    if (workspaceSlug && projectId) {
      updateLabelPosition(
        workspaceSlug?.toString(),
        projectId?.toString(),
        draggingLabelId,
        droppedParentId,
        droppedLabelId,
        dropAtEndOfList
      );
      return;
    }
  };

  return (
    <>
      <DeleteLabelModal
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel ?? null}
        onClose={() => setSelectDeleteLabel(null)}
      />
      <div className="flex items-center justify-between border-b border-custom-border-100 py-3.5">
        <h3 className="text-xl font-medium">Labels</h3>
        <Button variant="primary" onClick={newLabel} size="sm">
          Add label
        </Button>
      </div>
      <div className="w-full py-8">
        {showLabelForm && (
          <div className="my-2 w-full rounded border border-custom-border-200 px-3.5 py-2">
            <CreateUpdateLabelInline
              labelForm={showLabelForm}
              setLabelForm={setLabelForm}
              isUpdating={isUpdating}
              ref={scrollToRef}
              onClose={() => {
                setLabelForm(false);
                setIsUpdating(false);
              }}
            />
          </div>
        )}
        {projectLabels ? (
          projectLabels.length === 0 && !showLabelForm ? (
            <div className="flex items-center justify-center h-full w-full">
              <EmptyState type={EmptyStateType.PROJECT_SETTINGS_LABELS} />
            </div>
          ) : (
            projectLabelsTree && (
              <div className="mt-3">
                {projectLabelsTree.map((label, index) => {
                  if (label.children && label.children.length) {
                    return (
                      <ProjectSettingLabelGroup
                        key={label.id}
                        label={label}
                        labelChildren={label.children || []}
                        handleLabelDelete={(label: IIssueLabel) => setSelectDeleteLabel(label)}
                        isUpdating={isUpdating}
                        setIsUpdating={setIsUpdating}
                        isLastChild={index === projectLabelsTree.length - 1}
                        onDrop={onDrop}
                      />
                    );
                  }
                  return (
                    <ProjectSettingLabelItem
                      label={label}
                      key={label.id}
                      setIsUpdating={setIsUpdating}
                      handleLabelDelete={(label) => setSelectDeleteLabel(label)}
                      isChild={false}
                      isLastChild={index === projectLabelsTree.length - 1}
                      onDrop={onDrop}
                    />
                  );
                })}
              </div>
            )
          )
        ) : (
          !showLabelForm && (
            <Loader className="space-y-5">
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
            </Loader>
          )
        )}
      </div>
    </>
  );
});
