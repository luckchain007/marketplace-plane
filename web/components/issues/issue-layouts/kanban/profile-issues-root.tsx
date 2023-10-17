import React from "react";
// react beautiful dnd
import { DragDropContext } from "@hello-pangea/dnd";
// mobx
import { observer } from "mobx-react-lite";
// components
import { KanBanSwimLanes } from "./swimlanes";
import { KanBan } from "./default";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IProfileIssuesKanBanLayout {}

export const ProfileIssuesKanBanLayout: React.FC = observer(() => {
  const {
    profileIssues: profileIssuesStore,
    profileIssueFilters: profileIssueFiltersStore,
    issueKanBanView: issueKanBanViewStore,
  }: RootStore = useMobxStore();

  const issues = profileIssuesStore?.getIssues;

  const sub_group_by: string | null = profileIssueFiltersStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = profileIssueFiltersStore?.userDisplayFilters?.group_by || null;

  const display_properties = profileIssueFiltersStore?.userDisplayProperties || null;

  const currentKanBanView: "swimlanes" | "default" = profileIssueFiltersStore?.userDisplayFilters?.sub_group_by
    ? "swimlanes"
    : "default";

  const onDragEnd = (result: any) => {
    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    currentKanBanView === "default"
      ? issueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : issueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  const updateIssue = (sub_group_by: string | null, group_by: string | null, issue: any) => {
    profileIssuesStore.updateIssueStructure(group_by, sub_group_by, issue);
  };

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    issueKanBanViewStore.handleKanBanToggle(toggle, value);
  };

  return (
    <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90 px-3`}>
      <DragDropContext onDragEnd={onDragEnd}>
        {currentKanBanView === "default" ? (
          <KanBan
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={updateIssue}
            display_properties={display_properties}
            kanBanToggle={issueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        ) : (
          <KanBanSwimLanes
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={updateIssue}
            display_properties={display_properties}
            kanBanToggle={issueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}
      </DragDropContext>
    </div>
  );
});
