# Python imports
import boto3

# Django imports
from django.db import IntegrityError
from django.db.models import (
    Prefetch,
    Q,
    Exists,
    OuterRef,
    F,
    Func,
    Subquery,
)
from django.conf import settings
from django.utils import timezone

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from rest_framework.permissions import AllowAny

# Module imports
from plane.app.views.base import BaseViewSet, BaseAPIView, WebhookMixin
from plane.app.serializers import (
    ProjectSerializer,
    ProjectListSerializer,
    ProjectFavoriteSerializer,
    ProjectDeployBoardSerializer,
)

from plane.app.permissions import (
    ProjectBasePermission,
    ProjectMemberPermission,
)

from plane.db.models import (
    Project,
    ProjectMember,
    Workspace,
    State,
    ProjectFavorite,
    ProjectIdentifier,
    Module,
    Cycle,
    Inbox,
    ProjectDeployBoard,
    IssueProperty,
    Issue,
)
from plane.utils.cache import cache_response


class ProjectViewSet(WebhookMixin, BaseViewSet):
    serializer_class = ProjectListSerializer
    model = Project
    webhook_event = "project"

    permission_classes = [
        ProjectBasePermission,
    ]

    def get_queryset(self):
        sort_order = ProjectMember.objects.filter(
            member=self.request.user,
            project_id=OuterRef("pk"),
            workspace__slug=self.kwargs.get("slug"),
            is_active=True,
        ).values("sort_order")
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(
                Q(
                    project_projectmember__member=self.request.user,
                    project_projectmember__is_active=True,
                )
                | Q(network=2)
            )
            .select_related(
                "workspace",
                "workspace__owner",
                "default_assignee",
                "project_lead",
            )
            .annotate(
                is_favorite=Exists(
                    ProjectFavorite.objects.filter(
                        user=self.request.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        member=self.request.user,
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                        is_active=True,
                    )
                )
            )
            .annotate(
                total_members=ProjectMember.objects.filter(
                    project_id=OuterRef("id"),
                    member__is_bot=False,
                    is_active=True,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_cycles=Cycle.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_modules=Module.objects.filter(project_id=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                member_role=ProjectMember.objects.filter(
                    project_id=OuterRef("pk"),
                    member_id=self.request.user.id,
                    is_active=True,
                ).values("role")
            )
            .annotate(
                is_deployed=Exists(
                    ProjectDeployBoard.objects.filter(
                        project_id=OuterRef("pk"),
                        workspace__slug=self.kwargs.get("slug"),
                    )
                )
            )
            .annotate(sort_order=Subquery(sort_order))
            .prefetch_related(
                Prefetch(
                    "project_projectmember",
                    queryset=ProjectMember.objects.filter(
                        workspace__slug=self.kwargs.get("slug"),
                        is_active=True,
                    ).select_related("member"),
                    to_attr="members_list",
                )
            )
            .distinct()
        )

    def list(self, request, slug):
        fields = [
            field
            for field in request.GET.get("fields", "").split(",")
            if field
        ]
        projects = self.get_queryset().order_by("sort_order", "name")
        if request.GET.get("per_page", False) and request.GET.get(
            "cursor", False
        ):
            return self.paginate(
                request=request,
                queryset=(projects),
                on_results=lambda projects: ProjectListSerializer(
                    projects, many=True
                ).data,
            )
        projects = ProjectListSerializer(
            projects, many=True, fields=fields if fields else None
        ).data
        return Response(projects, status=status.HTTP_200_OK)

    def retrieve(self, request, slug, pk):
        project = (
            self.get_queryset()
            .filter(archived_at__isnull=True)
            .filter(pk=pk)
            .annotate(
                total_issues=Issue.issue_objects.filter(
                    project_id=self.kwargs.get("pk"),
                    parent__isnull=True,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues=Issue.issue_objects.filter(
                    project_id=self.kwargs.get("pk"),
                    parent__isnull=False,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                archived_issues=Issue.objects.filter(
                    project_id=self.kwargs.get("pk"),
                    archived_at__isnull=False,
                    parent__isnull=True,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                archived_sub_issues=Issue.objects.filter(
                    project_id=self.kwargs.get("pk"),
                    archived_at__isnull=False,
                    parent__isnull=False,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                draft_issues=Issue.objects.filter(
                    project_id=self.kwargs.get("pk"),
                    is_draft=True,
                    parent__isnull=True,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                draft_sub_issues=Issue.objects.filter(
                    project_id=self.kwargs.get("pk"),
                    is_draft=True,
                    parent__isnull=False,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        ).first()

        serializer = ProjectListSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)

            serializer = ProjectSerializer(
                data={**request.data}, context={"workspace_id": workspace.id}
            )
            if serializer.is_valid():
                serializer.save()

                # Add the user as Administrator to the project
                _ = ProjectMember.objects.create(
                    project_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                )
                # Also create the issue property for the user
                _ = IssueProperty.objects.create(
                    project_id=serializer.data["id"],
                    user=request.user,
                )

                if serializer.data["project_lead"] is not None and str(
                    serializer.data["project_lead"]
                ) != str(request.user.id):
                    ProjectMember.objects.create(
                        project_id=serializer.data["id"],
                        member_id=serializer.data["project_lead"],
                        role=20,
                    )
                    # Also create the issue property for the user
                    IssueProperty.objects.create(
                        project_id=serializer.data["id"],
                        user_id=serializer.data["project_lead"],
                    )

                # Default states
                states = [
                    {
                        "name": "Backlog",
                        "color": "#A3A3A3",
                        "sequence": 15000,
                        "group": "backlog",
                        "default": True,
                    },
                    {
                        "name": "Todo",
                        "color": "#3A3A3A",
                        "sequence": 25000,
                        "group": "unstarted",
                    },
                    {
                        "name": "In Progress",
                        "color": "#F59E0B",
                        "sequence": 35000,
                        "group": "started",
                    },
                    {
                        "name": "Done",
                        "color": "#16A34A",
                        "sequence": 45000,
                        "group": "completed",
                    },
                    {
                        "name": "Cancelled",
                        "color": "#EF4444",
                        "sequence": 55000,
                        "group": "cancelled",
                    },
                ]

                State.objects.bulk_create(
                    [
                        State(
                            name=state["name"],
                            color=state["color"],
                            project=serializer.instance,
                            sequence=state["sequence"],
                            workspace=serializer.instance.workspace,
                            group=state["group"],
                            default=state.get("default", False),
                            created_by=request.user,
                        )
                        for state in states
                    ]
                )

                project = (
                    self.get_queryset()
                    .filter(pk=serializer.data["id"])
                    .first()
                )
                serializer = ProjectListSerializer(project)
                return Response(
                    serializer.data, status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except serializers.ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )

    def partial_update(self, request, slug, pk=None):
        try:
            workspace = Workspace.objects.get(slug=slug)

            project = Project.objects.get(pk=pk)

            if project.archived_at:
                return Response(
                    {"error": "Archived projects cannot be updated"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = ProjectSerializer(
                project,
                data={**request.data},
                context={"workspace_id": workspace.id},
                partial=True,
            )

            if serializer.is_valid():
                serializer.save()
                if serializer.data["inbox_view"]:
                    Inbox.objects.get_or_create(
                        name=f"{project.name} Inbox",
                        project=project,
                        is_default=True,
                    )

                    # Create the triage state in Backlog group
                    State.objects.get_or_create(
                        name="Triage",
                        group="triage",
                        description="Default state for managing all Inbox Issues",
                        project_id=pk,
                        color="#ff7700",
                        is_triage=True,
                    )

                project = (
                    self.get_queryset()
                    .filter(pk=serializer.data["id"])
                    .first()
                )
                serializer = ProjectListSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        except IntegrityError as e:
            if "already exists" in str(e):
                return Response(
                    {"name": "The project name is already taken"},
                    status=status.HTTP_410_GONE,
                )
        except (Project.DoesNotExist, Workspace.DoesNotExist):
            return Response(
                {"error": "Project does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except serializers.ValidationError:
            return Response(
                {"identifier": "The project identifier is already taken"},
                status=status.HTTP_410_GONE,
            )


class ProjectArchiveUnarchiveEndpoint(BaseAPIView):

    permission_classes = [
        ProjectBasePermission,
    ]

    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.archived_at = timezone.now()
        project.save()
        return Response(
            {"archived_at": str(project.archived_at)},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        project.archived_at = None
        project.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectIdentifierEndpoint(BaseAPIView):
    permission_classes = [
        ProjectBasePermission,
    ]

    def get(self, request, slug):
        name = request.GET.get("name", "").strip().upper()

        if name == "":
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exists = ProjectIdentifier.objects.filter(
            name=name, workspace__slug=slug
        ).values("id", "name", "project")

        return Response(
            {"exists": len(exists), "identifiers": exists},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slug):
        name = request.data.get("name", "").strip().upper()

        if name == "":
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Project.objects.filter(
            identifier=name, workspace__slug=slug
        ).exists():
            return Response(
                {
                    "error": "Cannot delete an identifier of an existing project"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        ProjectIdentifier.objects.filter(
            name=name, workspace__slug=slug
        ).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )


class ProjectUserViewsEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)

        project_member = ProjectMember.objects.filter(
            member=request.user,
            project=project,
            is_active=True,
        ).first()

        if project_member is None:
            return Response(
                {"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN
            )

        view_props = project_member.view_props
        default_props = project_member.default_props
        preferences = project_member.preferences
        sort_order = project_member.sort_order

        project_member.view_props = request.data.get("view_props", view_props)
        project_member.default_props = request.data.get(
            "default_props", default_props
        )
        project_member.preferences = request.data.get(
            "preferences", preferences
        )
        project_member.sort_order = request.data.get("sort_order", sort_order)

        project_member.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectFavoritesViewSet(BaseViewSet):
    serializer_class = ProjectFavoriteSerializer
    model = ProjectFavorite

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(user=self.request.user)
            .select_related(
                "project", "project__project_lead", "project__default_assignee"
            )
            .select_related("workspace", "workspace__owner")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, slug):
        serializer = ProjectFavoriteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id):
        project_favorite = ProjectFavorite.objects.get(
            project=project_id, user=request.user, workspace__slug=slug
        )
        project_favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPublicCoverImagesEndpoint(BaseAPIView):
    permission_classes = [
        AllowAny,
    ]

    # Cache the below api for 24 hours
    @cache_response(60 * 60 * 24, user=False)
    def get(self, request):
        files = []
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        params = {
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Prefix": "static/project-cover/",
        }

        response = s3.list_objects_v2(**params)
        # Extracting file keys from the response
        if "Contents" in response:
            for content in response["Contents"]:
                if not content["Key"].endswith(
                    "/"
                ):  # This line ensures we're only getting files, not "sub-folders"
                    files.append(
                        f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{content['Key']}"
                    )

        return Response(files, status=status.HTTP_200_OK)


class ProjectDeployBoardViewSet(BaseViewSet):
    permission_classes = [
        ProjectMemberPermission,
    ]
    serializer_class = ProjectDeployBoardSerializer
    model = ProjectDeployBoard

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .select_related("project")
        )

    def create(self, request, slug, project_id):
        comments = request.data.get("comments", False)
        reactions = request.data.get("reactions", False)
        inbox = request.data.get("inbox", None)
        votes = request.data.get("votes", False)
        views = request.data.get(
            "views",
            {
                "list": True,
                "kanban": True,
                "calendar": True,
                "gantt": True,
                "spreadsheet": True,
            },
        )

        project_deploy_board, _ = ProjectDeployBoard.objects.get_or_create(
            anchor=f"{slug}/{project_id}",
            project_id=project_id,
        )
        project_deploy_board.comments = comments
        project_deploy_board.reactions = reactions
        project_deploy_board.inbox = inbox
        project_deploy_board.votes = votes
        project_deploy_board.views = views

        project_deploy_board.save()

        serializer = ProjectDeployBoardSerializer(project_deploy_board)
        return Response(serializer.data, status=status.HTTP_200_OK)
