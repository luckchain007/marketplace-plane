import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
// plugins
import { AIHandlePlugin } from "@/plugins/ai-handle";
import { DragHandlePlugin } from "@/plugins/drag-handle";

type Props = {
  aiEnabled: boolean;
  dragDropEnabled: boolean;
};

export type SideMenuPluginProps = {
  dragHandleWidth: number;
  handlesConfig: {
    ai: boolean;
    dragDrop: boolean;
  };
  scrollThreshold: {
    up: number;
    down: number;
  };
};

export type SideMenuHandleOptions = {
  view: (view: EditorView, sideMenu: HTMLDivElement | null) => void;
  domEvents?: {
    [key: string]: (...args: any) => void;
  };
};

export const SideMenuExtension = (props: Props) => {
  const { aiEnabled, dragDropEnabled } = props;

  return Extension.create({
    name: "editorSideMenu",
    addProseMirrorPlugins() {
      return [
        SideMenu({
          dragHandleWidth: 24,
          handlesConfig: {
            ai: aiEnabled,
            dragDrop: dragDropEnabled,
          },
          scrollThreshold: { up: 300, down: 100 },
        }),
      ];
    },
  });
};

const absoluteRect = (node: Element) => {
  const data = node.getBoundingClientRect();

  return {
    top: data.top,
    left: data.left,
    width: data.width,
  };
};

const nodeDOMAtCoords = (coords: { x: number; y: number }) => {
  const elements = document.elementsFromPoint(coords.x, coords.y);
  const generalSelectors = [
    "li",
    "p:not(:first-child)",
    ".code-block",
    "blockquote",
    "img",
    "h1, h2, h3, h4, h5, h6",
    "[data-type=horizontalRule]",
    ".table-wrapper",
    ".issue-embed",
  ].join(", ");

  for (const elem of elements) {
    if (elem.matches("p:first-child") && elem.parentElement?.matches(".ProseMirror")) {
      return elem;
    }

    // if the element is a <p> tag that is the first child of a td or th
    if (
      (elem.matches("td > p:first-child") || elem.matches("th > p:first-child")) &&
      elem?.textContent?.trim() !== ""
    ) {
      return elem; // Return only if p tag is not empty in td or th
    }

    // apply general selector
    if (elem.matches(generalSelectors)) {
      return elem;
    }
  }
  return null;
};

const SideMenu = (options: SideMenuPluginProps) => {
  const { handlesConfig } = options;
  const editorSideMenu: HTMLDivElement | null = document.createElement("div");
  editorSideMenu.id = "editor-side-menu";
  // side menu view actions
  const hideSideMenu = () => {
    if (!editorSideMenu?.classList.contains("side-menu-hidden")) editorSideMenu?.classList.add("side-menu-hidden");
  };
  const showSideMenu = () => editorSideMenu?.classList.remove("side-menu-hidden");
  // side menu elements
  const { view: dragHandleView, domEvents: dragHandleDOMEvents } = DragHandlePlugin(options);
  const { view: aiHandleView, domEvents: aiHandleDOMEvents } = AIHandlePlugin(options);

  return new Plugin({
    key: new PluginKey("sideMenu"),
    view: (view) => {
      hideSideMenu();
      view?.dom.parentElement?.appendChild(editorSideMenu);
      // side menu elements' initialization
      if (handlesConfig.ai) {
        aiHandleView(view, editorSideMenu);
      }
      if (handlesConfig.dragDrop) {
        dragHandleView(view, editorSideMenu);
      }

      return {
        destroy: () => hideSideMenu(),
      };
    },
    props: {
      handleDOMEvents: {
        mousemove: (view, event) => {
          if (!view.editable) return;

          const node = nodeDOMAtCoords({
            x: event.clientX + 50 + options.dragHandleWidth,
            y: event.clientY,
          });

          if (!(node instanceof Element) || node.matches("ul, ol")) {
            hideSideMenu();
            return;
          }

          const compStyle = window.getComputedStyle(node);
          const lineHeight = parseInt(compStyle.lineHeight, 10);
          const paddingTop = parseInt(compStyle.paddingTop, 10);

          const rect = absoluteRect(node);

          rect.top += (lineHeight - 20) / 2;
          rect.top += paddingTop;

          if (node.parentElement?.parentElement?.matches("td") || node.parentElement?.parentElement?.matches("th")) {
            if (node.matches("ul:not([data-type=taskList]) li, ol li")) {
              rect.left -= 5;
            }
          } else {
            // Li markers
            if (node.matches("ul:not([data-type=taskList]) li, ol li")) {
              rect.left -= 18;
            }
          }

          if (node.matches(".table-wrapper")) {
            rect.top += 8;
            rect.left -= 8;
          }

          if (node.parentElement?.matches("td") || node.parentElement?.matches("th")) {
            rect.left += 8;
          }

          rect.width = options.dragHandleWidth;

          if (!editorSideMenu) return;

          editorSideMenu.style.left = `${rect.left - rect.width}px`;
          editorSideMenu.style.top = `${rect.top}px`;
          showSideMenu();
          if (handlesConfig.dragDrop) {
            dragHandleDOMEvents?.mousemove();
          }
          if (handlesConfig.ai) {
            aiHandleDOMEvents?.mousemove?.();
          }
        },
        keydown: () => hideSideMenu(),
        mousewheel: () => hideSideMenu(),
        dragenter: (view) => {
          if (handlesConfig.dragDrop) {
            dragHandleDOMEvents?.dragenter?.(view);
          }
        },
        drop: (view, event) => {
          if (handlesConfig.dragDrop) {
            dragHandleDOMEvents?.drop?.(view, event);
          }
        },
        dragend: (view) => {
          if (handlesConfig.dragDrop) {
            dragHandleDOMEvents?.dragend?.(view);
          }
        },
      },
    },
  });
};
