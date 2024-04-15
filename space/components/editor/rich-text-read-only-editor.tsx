import React from "react";
// editor
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef } from "@plane/rich-text-editor";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMention } from "@/hooks/use-mention";

interface RichTextReadOnlyEditorWrapperProps extends Omit<IRichTextReadOnlyEditor, "mentionHandler"> {}

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ ...props }, ref) => {
    const { mentionHighlights } = useMention();

    return (
      <RichTextReadOnlyEditorWithRef
        ref={ref}
        mentionHandler={{ highlights: mentionHighlights }}
        {...props}
        // overriding the customClassName to add relative class passed
        containerClassName={cn(props.containerClassName, "relative border border-custom-border-200 p-3")}
      />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
