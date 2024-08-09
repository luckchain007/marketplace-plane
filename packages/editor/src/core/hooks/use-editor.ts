import { useImperativeHandle, useRef, MutableRefObject, useState, useEffect } from "react";
import { Selection } from "@tiptap/pm/state";
import { EditorProps } from "@tiptap/pm/view";
import { useEditor as useTiptapEditor, Editor } from "@tiptap/react";
// components
import { getEditorMenuItems } from "@/components/menus";
// extensions
import { CoreEditorExtensions } from "@/extensions";
// helpers
import { insertContentAtSavedSelection } from "@/helpers/insert-content-at-cursor-position";
import { IMarking, scrollSummary } from "@/helpers/scroll-to-node";
// plane editor providers
import { CollaborationProvider } from "@/plane-editor/providers";
// props
import { CoreEditorProps } from "@/props";
// types
import { EditorRefApi, IMentionHighlight, IMentionSuggestion, TEditorCommands, TFileHandler } from "@/types";

export interface CustomEditorProps {
  editorClassName: string;
  editorProps?: EditorProps;
  enableHistory: boolean;
  extensions?: any;
  fileHandler: TFileHandler;
  forwardedRef?: MutableRefObject<EditorRefApi | null>;
  handleEditorReady?: (value: boolean) => void;
  id?: string;
  initialValue?: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions?: () => Promise<IMentionSuggestion[]>;
  };
  onChange?: (json: object, html: string) => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  provider?: CollaborationProvider;
  tabIndex?: number;
  // undefined when prop is not passed, null if intentionally passed to stop
  // swr syncing
  value?: string | null | undefined;
}

export const useEditor = (props: CustomEditorProps) => {
  const {
    editorClassName,
    editorProps = {},
    enableHistory,
    extensions = [],
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id = "",
    initialValue,
    mentionHandler,
    onChange,
    placeholder,
    provider,
    tabIndex,
    value,
  } = props;

  const editor = useTiptapEditor({
    editorProps: {
      ...CoreEditorProps({
        editorClassName,
      }),
      ...editorProps,
    },
    extensions: [
      ...CoreEditorExtensions({
        enableHistory,
        fileConfig: {
          uploadFile: fileHandler.upload,
          deleteFile: fileHandler.delete,
          restoreFile: fileHandler.restore,
          cancelUploadImage: fileHandler.cancel,
        },
        mentionConfig: {
          mentionSuggestions: mentionHandler.suggestions ?? (() => Promise.resolve<IMentionSuggestion[]>([])),
          mentionHighlights: mentionHandler.highlights ?? [],
        },
        placeholder,
        tabIndex,
      }),
      ...extensions,
    ],
    content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<p></p>",
    onCreate: () => handleEditorReady?.(true),
    onTransaction: ({ editor }) => setSavedSelection(editor.state.selection),
    onUpdate: ({ editor }) => onChange?.(editor.getJSON(), editor.getHTML()),
    onDestroy: () => handleEditorReady?.(false),
  });

  const editorRef: MutableRefObject<Editor | null> = useRef(null);

  const [savedSelection, setSavedSelection] = useState<Selection | null>(null);

  // Inside your component or hook
  const savedSelectionRef = useRef(savedSelection);

  // Update the ref whenever savedSelection changes
  useEffect(() => {
    savedSelectionRef.current = savedSelection;
  }, [savedSelection]);

  // Effect for syncing SWR data
  useEffect(() => {
    // value is null when intentionally passed where syncing is not yet
    // supported and value is undefined when the data from swr is not populated
    if (value === null || value === undefined) return;
    if (editor && !editor.isDestroyed && !editor.storage.image.uploadInProgress) {
      try {
        editor.commands.setContent(value, false, { preserveWhitespace: "full" });
        const currentSavedSelection = savedSelectionRef.current;
        if (currentSavedSelection) {
          const docLength = editor.state.doc.content.size;
          const relativePosition = Math.min(currentSavedSelection.from, docLength - 1);
          editor.commands.setTextSelection(relativePosition);
        }
      } catch (error) {
        console.error("Error syncing editor content with external value:", error);
      }
    }
  }, [editor, value, id]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      clearEditor: () => {
        editorRef.current?.commands.clearContent();
      },
      setEditorValue: (content: string) => {
        editorRef.current?.commands.setContent(content);
      },
      setEditorValueAtCursorPosition: (content: string) => {
        if (savedSelection) {
          insertContentAtSavedSelection(editorRef, content, savedSelection);
        }
      },
      executeMenuItemCommand: (itemKey: TEditorCommands) => {
        const editorItems = getEditorMenuItems(editorRef.current, fileHandler.upload);

        const getEditorMenuItem = (itemKey: TEditorCommands) => editorItems.find((item) => item.key === itemKey);

        const item = getEditorMenuItem(itemKey);
        if (item) {
          if (item.key === "image") {
            item.command(savedSelectionRef.current);
          } else {
            item.command();
          }
        } else {
          console.warn(`No command found for item: ${itemKey}`);
        }
      },
      isMenuItemActive: (itemName: TEditorCommands): boolean => {
        const editorItems = getEditorMenuItems(editorRef.current, fileHandler.upload);

        const getEditorMenuItem = (itemName: TEditorCommands) => editorItems.find((item) => item.key === itemName);
        const item = getEditorMenuItem(itemName);
        return item ? item.isActive() : false;
      },
      onStateChange: (callback: () => void) => {
        // Subscribe to editor state changes
        editorRef.current?.on("transaction", () => {
          callback();
        });
        // Return a function to unsubscribe to the continuous transactions of
        // the editor on unmounting the component that has subscribed to this
        // method
        return () => {
          editorRef.current?.off("transaction");
        };
      },
      getMarkDown: (): string => {
        const markdownOutput = editorRef.current?.storage.markdown.getMarkdown();
        return markdownOutput;
      },
      getHTML: (): string => {
        const htmlOutput = editorRef.current?.getHTML() ?? "<p></p>";
        return htmlOutput;
      },
      scrollSummary: (marking: IMarking): void => {
        if (!editorRef.current) return;
        scrollSummary(editorRef.current, marking);
      },
      setSynced: () => {
        if (provider) {
          provider.setSynced();
        }
      },
      hasUnsyncedChanges: () => {
        if (provider) {
          return provider.hasUnsyncedChanges();
        } else {
          return false;
        }
      },
      isEditorReadyToDiscard: () => editorRef.current?.storage.image.uploadInProgress === false,
      setFocusAtPosition: (position: number) => {
        if (!editorRef.current || editorRef.current.isDestroyed) {
          console.error("Editor reference is not available or has been destroyed.");
          return;
        }
        try {
          const docSize = editorRef.current.state.doc.content.size;
          const safePosition = Math.max(0, Math.min(position, docSize));
          editorRef.current
            .chain()
            .insertContentAt(safePosition, [{ type: "paragraph" }])
            .focus()
            .run();
        } catch (error) {
          console.error("An error occurred while setting focus at position:", error);
        }
      },
    }),
    [editorRef, savedSelection, fileHandler.upload]
  );

  if (!editor) {
    return null;
  }

  // the editorRef is used to access the editor instance from outside the hook
  // and should only be used after editor is initialized
  editorRef.current = editor;

  return editor;
};
