from .project import (
    ProjectViewSet,
    ProjectMemberViewSet,
    UserProjectInvitationsViewset,
    ProjectInvitationsViewset,
    AddTeamToProjectEndpoint,
    ProjectIdentifierEndpoint,
    ProjectJoinEndpoint,
    ProjectUserViewsEndpoint,
    ProjectMemberUserEndpoint,
    ProjectFavoritesViewSet,
    ProjectPublicCoverImagesEndpoint,
    ProjectDeployBoardViewSet,
    UserProjectRolesEndpoint,
)
from .user import (
    UserEndpoint,
    UpdateUserOnBoardedEndpoint,
    UpdateUserTourCompletedEndpoint,
    UserActivityEndpoint,
)

from .oauth import OauthEndpoint

from .base import BaseAPIView, BaseViewSet, WebhookMixin

from .workspace import (
    WorkSpaceViewSet,
    UserWorkSpacesEndpoint,
    WorkSpaceAvailabilityCheckEndpoint,
    WorkspaceJoinEndpoint,
    WorkSpaceMemberViewSet,
    TeamMemberViewSet,
    WorkspaceInvitationsViewset,
    UserWorkspaceInvitationsViewSet,
    UserLastProjectWithWorkspaceEndpoint,
    WorkspaceMemberUserEndpoint,
    WorkspaceMemberUserViewsEndpoint,
    UserActivityGraphEndpoint,
    UserIssueCompletedGraphEndpoint,
    UserWorkspaceDashboardEndpoint,
    WorkspaceThemeViewSet,
    WorkspaceUserProfileStatsEndpoint,
    WorkspaceUserActivityEndpoint,
    WorkspaceUserProfileEndpoint,
    WorkspaceUserProfileIssuesEndpoint,
    WorkspaceLabelsEndpoint,
    WorkspaceProjectMemberEndpoint,
    WorkspaceUserPropertiesEndpoint,
    WorkspaceStatesEndpoint,
    WorkspaceEstimatesEndpoint,
    ExportWorkspaceUserActivityEndpoint,
    WorkspaceModulesEndpoint,
    WorkspaceCyclesEndpoint,
)
from .state import StateViewSet
from .view import (
    GlobalViewViewSet,
    GlobalViewIssuesViewSet,
    IssueViewViewSet,
    IssueViewFavoriteViewSet,
)
from .cycle import (
    CycleViewSet,
    CycleIssueViewSet,
    CycleDateCheckEndpoint,
    CycleFavoriteViewSet,
    TransferCycleIssueEndpoint,
    CycleUserPropertiesEndpoint,
)
from .asset import FileAssetEndpoint, UserAssetsEndpoint, FileAssetViewSet
from .issue import (
    IssueListEndpoint,
    IssueViewSet,
    WorkSpaceIssuesEndpoint,
    IssueActivityEndpoint,
    IssueCommentViewSet,
    IssueUserDisplayPropertyEndpoint,
    LabelViewSet,
    BulkDeleteIssuesEndpoint,
    UserWorkSpaceIssues,
    SubIssuesEndpoint,
    IssueLinkViewSet,
    BulkCreateIssueLabelsEndpoint,
    IssueAttachmentEndpoint,
    IssueArchiveViewSet,
    IssueSubscriberViewSet,
    CommentReactionViewSet,
    IssueReactionViewSet,
    IssueRelationViewSet,
    IssueDraftViewSet,
)

from .auth_extended import (
    ForgotPasswordEndpoint,
    ResetPasswordEndpoint,
    ChangePasswordEndpoint,
    SetUserPasswordEndpoint,
    EmailCheckEndpoint,
    MagicGenerateEndpoint,
)


from .authentication import (
    SignInEndpoint,
    SignOutEndpoint,
    MagicSignInEndpoint,
)

from .module import (
    ModuleViewSet,
    ModuleIssueViewSet,
    ModuleLinkViewSet,
    ModuleFavoriteViewSet,
    ModuleUserPropertiesEndpoint,
)

from .api import ApiTokenEndpoint

from .page import (
    PageViewSet,
    PageFavoriteViewSet,
    PageLogEndpoint,
    SubPagesEndpoint,
)

from .search import GlobalSearchEndpoint, IssueSearchEndpoint


from .external import (
    GPTIntegrationEndpoint,
    UnsplashEndpoint,
)

from .estimate import (
    ProjectEstimatePointEndpoint,
    BulkEstimatePointEndpoint,
)

from .inbox import InboxViewSet, InboxIssueViewSet

from .analytic import (
    AnalyticsEndpoint,
    AnalyticViewViewset,
    SavedAnalyticEndpoint,
    ExportAnalyticsEndpoint,
    DefaultAnalyticsEndpoint,
)

from .notification import (
    NotificationViewSet,
    UnreadNotificationEndpoint,
    MarkAllReadNotificationViewSet,
    UserNotificationPreferenceEndpoint,
)

from .exporter import ExportIssuesEndpoint

from .config import ConfigurationEndpoint, MobileConfigurationEndpoint

from .webhook import (
    WebhookEndpoint,
    WebhookLogsEndpoint,
    WebhookSecretRegenerateEndpoint,
)

from .dashboard import DashboardEndpoint, WidgetsEndpoint

from .error_404 import custom_404_view
