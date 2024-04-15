import { FC, FormEvent, useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { EditorRefApi } from "@plane/rich-text-editor";
import { TIssue } from "@plane/types";
import { Button, ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  InboxIssueTitle,
  InboxIssueDescription,
  InboxIssueProperties,
} from "@/components/inbox/modals/create-edit-modal";
// constants
import { ISSUE_CREATED } from "@/constants/event-tracker";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useEventTracker, useProjectInbox, useWorkspace } from "@/hooks/store";

type TInboxIssueCreateRoot = {
  workspaceSlug: string;
  projectId: string;
  handleModalClose: () => void;
};

export const defaultIssueData: Partial<TIssue> = {
  id: undefined,
  name: "",
  description_html: "",
  priority: "none",
  state_id: "",
  label_ids: [],
  assignee_ids: [],
  start_date: renderFormattedPayloadDate(new Date()),
  target_date: "",
};

export const InboxIssueCreateRoot: FC<TInboxIssueCreateRoot> = observer((props) => {
  const { workspaceSlug, projectId, handleModalClose } = props;
  const router = useRouter();
  // refs
  const descriptionEditorRef = useRef<EditorRefApi>(null);
  // hooks
  const { captureIssueEvent } = useEventTracker();
  const { createInboxIssue } = useProjectInbox();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  // states
  const [createMore, setCreateMore] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TIssue>>(defaultIssueData);
  const handleFormData = useCallback(
    <T extends keyof Partial<TIssue>>(issueKey: T, issueValue: Partial<TIssue>[T]) => {
      setFormData({
        ...formData,
        [issueKey]: issueValue,
      });
    },
    [formData]
  );

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: Partial<TIssue> = {
      name: formData.name || "",
      description_html: formData.description_html || "<p></p>",
      priority: formData.priority || "none",
      state_id: formData.state_id || "",
      label_ids: formData.label_ids || [],
      assignee_ids: formData.assignee_ids || [],
      target_date: formData.target_date || null,
    };
    setFormSubmitting(true);

    await createInboxIssue(workspaceSlug, projectId, payload)
      .then((res) => {
        if (!createMore) {
          router.push(`/${workspaceSlug}/projects/${projectId}/inbox/?currentTab=open&inboxIssueId=${res?.issue?.id}`);
          handleModalClose();
        } else {
          descriptionEditorRef?.current?.clearEditor();
          setFormData(defaultIssueData);
        }
        captureIssueEvent({
          eventName: ISSUE_CREATED,
          payload: {
            ...formData,
            state: "SUCCESS",
            element: "Inbox page",
          },
          path: router.pathname,
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: `${TOAST_TYPE.SUCCESS}!`,
          message: "Issue created successfully.",
        });
      })
      .catch((error) => {
        console.error(error);
        captureIssueEvent({
          eventName: ISSUE_CREATED,
          payload: {
            ...formData,
            state: "FAILED",
            element: "Inbox page",
          },
          path: router.pathname,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `${TOAST_TYPE.ERROR}!`,
          message: "Some error occurred. Please try again.",
        });
      });
    setFormSubmitting(false);
  };

  if (!workspaceSlug || !projectId || !workspaceId) return <></>;
  return (
    <form className="relative space-y-4" onSubmit={handleFormSubmit}>
      <InboxIssueTitle data={formData} handleData={handleFormData} />
      <InboxIssueDescription
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        workspaceId={workspaceId}
        data={formData}
        handleData={handleFormData}
        editorRef={descriptionEditorRef}
      />
      <InboxIssueProperties projectId={projectId} data={formData} handleData={handleFormData} />
      <div className="relative flex justify-between items-center gap-3">
        <div className="flex cursor-pointer items-center gap-1" onClick={() => setCreateMore((prevData) => !prevData)}>
          <span className="text-xs">Create more</span>
          <ToggleSwitch value={createMore} onChange={() => {}} size="md" />
        </div>
        <div className="relative flex items-center gap-3">
          <Button variant="neutral-primary" size="sm" type="button" onClick={handleModalClose}>
            Discard
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={formSubmitting}>
            {formSubmitting ? "Adding Issue..." : "Add Issue"}
          </Button>
        </div>
      </div>
    </form>
  );
});
