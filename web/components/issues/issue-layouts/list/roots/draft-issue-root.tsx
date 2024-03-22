import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { DraftIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
// components
// types
// constants
import { BaseListRoot } from "../base-list-root";

export const DraftIssueListLayout: FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  if (!workspaceSlug || !projectId) return null;

  return <BaseListRoot QuickActions={DraftIssueQuickActions} storeType={EIssuesStoreType.DRAFT} />;
});
