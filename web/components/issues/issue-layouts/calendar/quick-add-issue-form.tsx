import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
// components
import { PlusIcon } from "lucide-react";
import { ISearchIssueResponse, TIssue } from "@plane/types";
import { TOAST_TYPE, setPromiseToast, setToast, CustomMenu } from "@plane/ui";
import { ExistingIssuesListModal } from "@/components/core";
// hooks
import { ISSUE_CREATED } from "@/constants/event-tracker";
import { cn } from "@/helpers/common.helper";
import { createIssuePayload } from "@/helpers/issue.helper";
import { useEventTracker, useIssueDetail, useProject } from "@/hooks/store";
import useKeypress from "@/hooks/use-keypress";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
// helpers
// icons
// ui
// types
// constants
// helper

type Props = {
  formKey: keyof TIssue;
  groupId?: string;
  subGroupId?: string | null;
  prePopulatedData?: Partial<TIssue>;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  viewId?: string;
  onOpen?: () => void;
};

const defaultValues: Partial<TIssue> = {
  name: "",
};

const Inputs = (props: any) => {
  const { register, setFocus, projectDetails } = props;

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  return (
    <>
      <h4 className="text-sm md:text-xs leading-5 text-custom-text-400">{projectDetails?.identifier ?? "..."}</h4>
      <input
        type="text"
        autoComplete="off"
        placeholder="Issue Title"
        {...register("name", {
          required: "Issue title is required.",
        })}
        className="w-full rounded-md bg-transparent py-1.5 pr-2 text-sm md:text-xs font-medium leading-5 text-custom-text-200 outline-none"
      />
    </>
  );
};

export const CalendarQuickAddIssueForm: React.FC<Props> = observer((props) => {
  const { formKey, prePopulatedData, quickAddCallback, addIssuesToView, viewId, onOpen } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;
  // store hooks
  const { getProjectById } = useProject();
  const { captureIssueEvent } = useEventTracker();
  const { updateIssue } = useIssueDetail();
  // refs
  const ref = useRef<HTMLDivElement>(null);
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExistingIssueModalOpen, setIsExistingIssueModalOpen] = useState(false);
  // derived values
  const projectDetail = projectId ? getProjectById(projectId.toString()) : null;
  const ExistingIssuesListModalPayload = addIssuesToView
    ? moduleId
      ? { module: moduleId.toString(), target_date: "none" }
      : { cycle: true, target_date: "none" }
    : { target_date: "none" };

  const {
    reset,
    handleSubmit,
    register,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<TIssue>({ defaultValues });

  const handleClose = () => {
    setIsOpen(false);
  };

  useKeypress("Escape", handleClose);
  useOutsideClickDetector(ref, handleClose);

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  useEffect(() => {
    if (!errors) return;

    Object.keys(errors).forEach((key) => {
      const error = errors[key as keyof TIssue];

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.message?.toString() || "Some error occurred. Please try again.",
      });
    });
  }, [errors]);

  const onSubmitHandler = async (formData: TIssue) => {
    if (isSubmitting || !workspaceSlug || !projectId) return;

    reset({ ...defaultValues });

    const payload = createIssuePayload(projectId.toString(), {
      ...(prePopulatedData ?? {}),
      ...formData,
    });

    if (quickAddCallback) {
      const quickAddPromise = quickAddCallback(
        workspaceSlug.toString(),
        projectId.toString(),
        {
          ...payload,
        },
        viewId
      );
      setPromiseToast<any>(quickAddPromise, {
        loading: "Adding issue...",
        success: {
          title: "Success!",
          message: () => "Issue created successfully.",
        },
        error: {
          title: "Error!",
          message: (err) => err?.message || "Some error occurred. Please try again.",
        },
      });

      await quickAddPromise
        .then((res) => {
          captureIssueEvent({
            eventName: ISSUE_CREATED,
            payload: { ...res, state: "SUCCESS", element: "Calendar quick add" },
            path: router.asPath,
          });
        })
        .catch(() => {
          captureIssueEvent({
            eventName: ISSUE_CREATED,
            payload: { ...payload, state: "FAILED", element: "Calendar quick add" },
            path: router.asPath,
          });
        });
    }
  };

  const handleAddIssuesToView = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const issueIds = data.map((i) => i.id);

    try {
      // To handle all updates in parallel
      await Promise.all(
        data.map((issue) =>
          updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, prePopulatedData ?? {})
        )
      );
      if (addIssuesToView) {
        await addIssuesToView(issueIds);
      }
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  const handleNewIssue = () => {
    setIsOpen(true);
    if (onOpen) onOpen();
  };
  const handleExistingIssue = () => {
    setIsExistingIssueModalOpen(true);
  };

  return (
    <>
      {workspaceSlug && projectId && (
        <ExistingIssuesListModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          isOpen={isExistingIssueModalOpen}
          handleClose={() => setIsExistingIssueModalOpen(false)}
          searchParams={ExistingIssuesListModalPayload}
          handleOnSubmit={handleAddIssuesToView}
        />
      )}
      {isOpen && (
        <div
          ref={ref}
          className={`z-20 w-full transition-all ${
            isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
          }`}
        >
          <form
            onSubmit={handleSubmit(onSubmitHandler)}
            className="z-50 flex w-full items-center gap-x-2 rounded md:border-[0.5px] border-custom-border-200 bg-custom-background-100 px-2 md:shadow-custom-shadow-2xs transition-opacity"
          >
            <Inputs formKey={formKey} register={register} setFocus={setFocus} projectDetails={projectDetail} />
          </form>
        </div>
      )}

      {!isOpen && (
        <div
          className={cn("md:opacity-0 rounded md:border-[0.5px] border-custom-border-200 md:group-hover:opacity-100", {
            block: isMenuOpen,
          })}
        >
          <CustomMenu
            placement="bottom-start"
            menuButtonOnClick={() => setIsMenuOpen(true)}
            onMenuClose={() => setIsMenuOpen(false)}
            className="w-full"
            customButtonClassName="w-full"
            customButton={
              <div className="flex w-full items-center gap-x-[6px] rounded-md px-2 py-1.5 text-custom-primary-100">
                <PlusIcon className="h-3.5 w-3.5 stroke-2 flex-shrink-0" />
                <span className="text-sm font-medium flex-shrink-0 text-custom-primary-100">New Issue</span>
              </div>
            }
          >
            <CustomMenu.MenuItem onClick={handleNewIssue}>New Issue</CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={handleExistingIssue}>Add existing issue</CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      )}
    </>
  );
});
