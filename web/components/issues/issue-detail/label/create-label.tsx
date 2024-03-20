import { FC, useState, Fragment, useEffect } from "react";
import { TwitterPicker } from "react-color";
import { Controller, useForm } from "react-hook-form";
import { Plus, X, Loader } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import { IIssueLabel } from "@plane/types";
// hooks
import { Input, TOAST_TYPE, setToast } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// helpers
import { cn } from "helpers/common.helper";
// ui
// types
import { TLabelOperations } from "./root";

type ILabelCreate = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  labelOperations: TLabelOperations;
  disabled?: boolean;
};

const defaultValues: Partial<IIssueLabel> = {
  name: "",
  color: "#ff0000",
};

export const LabelCreate: FC<ILabelCreate> = (props) => {
  const { workspaceSlug, projectId, issueId, labelOperations, disabled = false } = props;
  // hooks
  const {
    issue: { getIssueById },
    peekIssue,
  } = useIssueDetail();
  // state
  const [isCreateToggle, setIsCreateToggle] = useState(false);
  const handleIsCreateToggle = () => setIsCreateToggle(!isCreateToggle);
  // react hook form
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setFocus,
  } = useForm<Partial<IIssueLabel>>({
    defaultValues,
  });

  useEffect(() => {
    if (!isCreateToggle) return;

    setFocus("name");
    reset();
  }, [isCreateToggle, reset, setFocus]);

  const handleLabel = async (formData: Partial<IIssueLabel>) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    try {
      const issue = getIssueById(issueId);
      const labelResponse = await labelOperations.createLabel(workspaceSlug, projectId, formData);
      const currentLabels = [...(issue?.label_ids || []), labelResponse.id];
      await labelOperations.updateIssue(workspaceSlug, projectId, issueId, { label_ids: currentLabels });
      reset(defaultValues);
    } catch (error) {
      setToast({
        title: "Label creation failed",
        type: TOAST_TYPE.ERROR,
        message: "Label creation failed. Please try again sometime later.",
      });
    }
  };

  return (
    <>
      <div
        className="relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-full border border-custom-border-100 p-0.5 px-2 text-xs text-custom-text-300 transition-all hover:bg-custom-background-90 hover:text-custom-text-200"
        onClick={handleIsCreateToggle}
      >
        <div className="flex-shrink-0">
          {isCreateToggle ? <X className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
        </div>
        <div className="flex-shrink-0">{isCreateToggle ? "Cancel" : "New"}</div>
      </div>

      {isCreateToggle && (
        <form className="relative flex items-center gap-x-2" onSubmit={handleSubmit(handleLabel)}>
          <div>
            <Controller
              name="color"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Popover>
                  <>
                    <Popover.Button className="grid place-items-center outline-none">
                      {value && value?.trim() !== "" && (
                        <span
                          className="h-6 w-6 rounded"
                          style={{
                            backgroundColor: value ?? "black",
                          }}
                        />
                      )}
                    </Popover.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel
                        className={cn("absolute z-10 mt-1.5 max-w-xs px-2 sm:px-0", !peekIssue ? "right-0" : "")}
                      >
                        <TwitterPicker
                          triangle={!peekIssue ? "hide" : "top-left"}
                          color={value}
                          onChange={(value) => onChange(value.hex)}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                </Popover>
              )}
            />
          </div>
          <Controller
            control={control}
            name="name"
            rules={{
              required: "This is required",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="name"
                name="name"
                type="text"
                value={value ?? ""}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.name)}
                placeholder="Title"
                className="w-full"
                disabled={isSubmitting}
              />
            )}
          />
          <button
            type="button"
            className="grid place-items-center rounded bg-red-500 p-1.5"
            onClick={() => setIsCreateToggle(false)}
            disabled={disabled}
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <button type="submit" className="grid place-items-center rounded bg-green-500 p-1.5" disabled={isSubmitting}>
            {isSubmitting ? <Loader className="spin h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
          </button>
        </form>
      )}
    </>
  );
};
