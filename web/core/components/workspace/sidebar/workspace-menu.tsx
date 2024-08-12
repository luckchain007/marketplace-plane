"use client";

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArchiveIcon, ChevronRight, MoreHorizontal, Settings } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { CustomMenu, Tooltip } from "@plane/ui";
// components
import { SidebarNavItem } from "@/components/sidebar";
// constants
import { SIDEBAR_WORKSPACE_MENU_ITEMS } from "@/constants/dashboard";
import { SIDEBAR_CLICKED } from "@/constants/event-tracker";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme, useEventTracker, useUser } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { UpgradeBadge } from "@/plane-web/components/workspace";

export const SidebarWorkspaceMenu = observer(() => {
  // state
  const [isMenuActive, setIsMenuActive] = useState(false);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // router params
  const { workspaceSlug } = useParams();
  // pathname
  const pathname = usePathname();
  // local storage
  const { setValue: toggleWorkspaceMenu, storedValue } = useLocalStorage<boolean>("is_workspace_menu_open", true);
  // derived values
  const isWorkspaceMenuOpen = !!storedValue;
  // auth
  const workspaceMemberInfo = currentWorkspaceRole || EUserWorkspaceRoles.GUEST;

  const handleLinkClick = (itemKey: string) => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    captureEvent(SIDEBAR_CLICKED, {
      destination: itemKey,
    });
  };

  useEffect(() => {
    if (sidebarCollapsed) toggleWorkspaceMenu(true);
  }, [sidebarCollapsed, toggleWorkspaceMenu]);
  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  const indicatorElement = (
    <div className="flex-shrink-0">
      <UpgradeBadge />
    </div>
  );

  return (
    <Disclosure as="div" defaultOpen>
      {!sidebarCollapsed && (
        <div className="flex px-2 bg-custom-sidebar-background-100 group/workspace-button hover:bg-custom-sidebar-background-90 rounded">
          {" "}
          <Disclosure.Button
            as="button"
            className="flex-1 sticky top-0  z-10  w-full  py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400  text-xs font-semibold"
            onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
          >
            <span>WORKSPACE</span>
          </Disclosure.Button>
          <CustomMenu
            customButton={
              <span
                ref={actionSectionRef}
                className="grid place-items-center p-0.5 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 rounded my-auto"
                onClick={() => {
                  console.log("ndkn");
                  setIsMenuActive(!isMenuActive);
                }}
              >
                <MoreHorizontal className="size-4" />
              </span>
            }
            className={cn(
              "h-full flex items-center opacity-0 z-20 pointer-events-none flex-shrink-0 group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto my-auto",
              {
                "opacity-100 pointer-events-auto": isMenuActive,
              }
            )}
            customButtonClassName="grid place-items-center"
            placement="bottom-start"
          >
            <CustomMenu.MenuItem>
              <Link href={`/${workspaceSlug}/projects/archives`}>
                <div className="flex items-center justify-start gap-2">
                  <ArchiveIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Archives</span>
                </div>
              </Link>
            </CustomMenu.MenuItem>

            <CustomMenu.MenuItem>
              <Link href={`/${workspaceSlug}/settings`}>
                <div className="flex items-center justify-start gap-2">
                  <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Settings</span>
                </div>
              </Link>
            </CustomMenu.MenuItem>
          </CustomMenu>
          <Disclosure.Button
            as="button"
            className="sticky top-0 z-10 group/workspace-button px-0.5 py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90 rounded text-xs font-semibold"
            onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
          >
            {" "}
            <span className="flex-shrink-0 opacity-0 pointer-events-none group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto rounded hover:bg-custom-sidebar-background-80">
              <ChevronRight
                className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
                  "rotate-90": isWorkspaceMenuOpen,
                })}
              />
            </span>
          </Disclosure.Button>
        </div>
      )}
      <Transition
        show={isWorkspaceMenuOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isWorkspaceMenuOpen && (
          <Disclosure.Panel
            as="div"
            className={cn("flex flex-col mt-0.5 gap-0.5", {
              "space-y-0 mt-0 ml-0": sidebarCollapsed,
            })}
            static
          >
            {SIDEBAR_WORKSPACE_MENU_ITEMS.map(
              (link) =>
                workspaceMemberInfo >= link.access && (
                  <Tooltip
                    key={link.key}
                    tooltipContent={link.label}
                    position="right"
                    className="ml-2"
                    disabled={!sidebarCollapsed}
                    isMobile={isMobile}
                  >
                    <Link href={`/${workspaceSlug}${link.href}`} onClick={() => handleLinkClick(link.key)}>
                      <SidebarNavItem
                        key={link.key}
                        className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
                        isActive={link.highlight(pathname, `/${workspaceSlug}`)}
                      >
                        <div className="flex items-center gap-1.5 py-[1px]">
                          <link.Icon
                            className={cn("size-4", {
                              "rotate-180": link.key === "active-cycles",
                            })}
                          />
                          {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{link.label}</p>}
                        </div>
                        {!sidebarCollapsed && link.key === "active-cycles" && indicatorElement}
                      </SidebarNavItem>
                    </Link>
                  </Tooltip>
                )
            )}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
