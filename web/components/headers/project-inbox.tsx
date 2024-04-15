import { FC, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Plus, RefreshCcw } from "lucide-react";
// ui
import { Breadcrumbs, Button, LayersIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { InboxIssueCreateEditModalRoot } from "@/components/inbox";
import { ProjectLogo } from "@/components/project";
// hooks
import { useProject, useProjectInbox } from "@/hooks/store";

export const ProjectInboxHeader: FC = observer(() => {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { currentProjectDetails } = useProject();
  const { loader } = useProjectInbox();

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div className="flex items-center gap-4">
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects`}
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
              link={
                <BreadcrumbLink label="Inbox Issues" icon={<LayersIcon className="h-4 w-4 text-custom-text-300" />} />
              }
            />
          </Breadcrumbs>

          {loader === "pagination-loading" && (
            <div className="flex items-center gap-1.5 text-custom-text-300">
              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              <p className="text-sm">Syncing...</p>
            </div>
          )}
        </div>
      </div>

      {currentProjectDetails?.inbox_view && workspaceSlug && projectId && (
        <div className="flex items-center gap-2">
          <InboxIssueCreateEditModalRoot
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
            modalState={createIssueModal}
            handleModalClose={() => setCreateIssueModal(false)}
            issue={undefined}
          />

          <Button variant="primary" prependIcon={<Plus />} size="sm" onClick={() => setCreateIssueModal(true)}>
            Add Issue
          </Button>
        </div>
      )}
    </div>
  );
});
