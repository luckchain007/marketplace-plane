import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { FileText, Plus } from "lucide-react";
// hooks
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// helpers
import { BreadcrumbLink } from "@/components/common";
import { ProjectLogo } from "@/components/project";
import { EUserProjectRoles } from "@/constants/project";
// constants
// components
import { useApplication, useEventTracker, useProject, useUser } from "@/hooks/store";

export const PagesHeader = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    commandPalette: { toggleCreatePageModal },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  const { setTrackElement } = useEventTracker();

  const canUserCreatePage =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                        <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                      </span>
                    )
                  }
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Pages" icon={<FileText className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </div>
      {canUserCreatePage && (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            prependIcon={<Plus />}
            size="sm"
            onClick={() => {
              setTrackElement("Project pages page");
              toggleCreatePageModal(true);
            }}
          >
            Create Page
          </Button>
        </div>
      )}
    </div>
  );
});
