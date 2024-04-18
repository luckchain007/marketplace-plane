import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
// types
import { TIssue } from "@plane/types";
// ui
import { StateGroupIcon } from "@plane/ui";
// components
import { IssueAttachmentRoot, IssueUpdateStatus } from "@/components/issues";
// hooks
import { useIssueDetail, useProjectState, useUser } from "@/hooks/store";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// components
import { IssueDescriptionInput } from "../description-input";
import { SubIssuesRoot } from "../sub-issues";
import { IssueTitleInput } from "../title-input";
import { IssueActivity } from "./issue-activity";
import { IssueParentDetail } from "./parent";
import { IssueReaction } from "./reactions";
import { TIssueOperations } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  isArchived: boolean;
  swrIssueDetails: TIssue | null | undefined;
};

export const IssueMainContent: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable, isArchived, swrIssueDetails } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const { currentUser } = useUser();
  const { projectStates } = useProjectState();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => setIsSubmitting("saved"), 2000);
    } else if (isSubmitting === "submitting") setShowAlert(true);
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  const issue = issueId ? getIssueById(issueId) : undefined;
  if (!issue) return <></>;

  const currentIssueState = projectStates?.find((s) => s.id === issue.state_id);

  return (
    <>
      <div className="rounded-lg space-y-4">
        {issue.parent_id && (
          <IssueParentDetail
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            issue={issue}
            issueOperations={issueOperations}
          />
        )}

        <div className="mb-2.5 flex items-center">
          {currentIssueState && (
            <StateGroupIcon
              className="mr-3 h-4 w-4"
              stateGroup={currentIssueState.group}
              color={currentIssueState.color}
            />
          )}
          <IssueUpdateStatus isSubmitting={isSubmitting} issueDetail={issue} />
        </div>

        <IssueTitleInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          isSubmitting={isSubmitting}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          issueOperations={issueOperations}
          disabled={!isEditable}
          value={issue.name}
        />

        {/* {issue?.description_html === issueDescription && ( */}
        <IssueDescriptionInput
          swrIssueDescription={swrIssueDetails?.description_html}
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          initialValue={issue.description_html}
          disabled={!isEditable}
          issueOperations={issueOperations}
          setIsSubmitting={(value) => setIsSubmitting(value)}
        />
        {/* )} */}

        {currentUser && (
          <IssueReaction
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            currentUser={currentUser}
            disabled={isArchived}
          />
        )}

        {currentUser && (
          <SubIssuesRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            parentIssueId={issueId}
            currentUser={currentUser}
            disabled={!isEditable}
          />
        )}
      </div>

      <IssueAttachmentRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={!isEditable}
      />

      <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={isArchived} />
    </>
  );
});
