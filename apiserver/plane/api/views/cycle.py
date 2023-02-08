# Python imports
import json

# Django imports
from django.db.models import OuterRef, Func, F
from django.core import serializers

# Third party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet
from plane.api.serializers import CycleSerializer, CycleIssueSerializer
from plane.api.permissions import ProjectEntityPermission
from plane.db.models import Cycle, CycleIssue, Issue
from plane.bgtasks.issue_activites_task import issue_activity


class CycleViewSet(BaseViewSet):
    serializer_class = CycleSerializer
    model = Cycle
    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"), owned_by=self.request.user
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("owned_by")
            .distinct()
        )


class CycleIssueViewSet(BaseViewSet):
    serializer_class = CycleIssueSerializer
    model = CycleIssue

    permission_classes = [
        ProjectEntityPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            cycle_id=self.kwargs.get("cycle_id"),
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .annotate(
                sub_issues_count=Issue.objects.filter(parent=OuterRef("issue_id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .filter(cycle_id=self.kwargs.get("cycle_id"))
            .select_related("project")
            .select_related("workspace")
            .select_related("cycle")
            .select_related("issue", "issue__state", "issue__project")
            .prefetch_related("issue__assignees", "issue__labels")
            .distinct()
        )

    def create(self, request, slug, project_id, cycle_id):
        try:
            issues = request.data.get("issues", [])

            if not len(issues):
                return Response(
                    {"error": "Issues are required"}, status=status.HTTP_400_BAD_REQUEST
                )

            cycle = Cycle.objects.get(
                workspace__slug=slug, project_id=project_id, pk=cycle_id
            )

            # Get all CycleIssues already created
            cycle_issues = list(CycleIssue.objects.filter(issue_id__in=issues))
            records_to_update = []
            update_cycle_issue_activity = []
            record_to_create = []

            for issue in issues:
                cycle_issue = [
                    cycle_issue
                    for cycle_issue in cycle_issues
                    if str(cycle_issue.issue_id) in issues
                ]
                # Update only when cycle changes
                if len(cycle_issue):
                    if cycle_issue[0].cycle_id != cycle_id:
                        update_cycle_issue_activity.append(
                            {
                                "old_cycle_id": str(cycle_issue[0].cycle_id),
                                "new_cycle_id": str(cycle_id),
                                "issue_id": str(cycle_issue[0].issue_id),
                            }
                        )
                        cycle_issue[0].cycle_id = cycle_id
                        records_to_update.append(cycle_issue[0])
                else:
                    record_to_create.append(
                        CycleIssue(
                            project_id=project_id,
                            workspace=cycle.workspace,
                            created_by=request.user,
                            updated_by=request.user,
                            cycle=cycle,
                            issue_id=issue,
                        )
                    )

            CycleIssue.objects.bulk_create(
                record_to_create,
                batch_size=10,
                ignore_conflicts=True,
            )
            CycleIssue.objects.bulk_update(
                records_to_update,
                ["cycle"],
                batch_size=10,
            )

            # Capture Issue Activity
            issue_activity.delay(
                {
                    "type": "issue.activity",
                    "requested_data": json.dumps({"cycles_list": issues}),
                    "actor_id": str(self.request.user.id),
                    "issue_id": str(self.kwargs.get("pk", None)),
                    "project_id": str(self.kwargs.get("project_id", None)),
                    "current_instance": json.dumps(
                        {
                            "updated_cycle_issues": update_cycle_issue_activity,
                            "created_cycle_issues": serializers.serialize(
                                "json", record_to_create
                            ),
                        }
                    ),
                },
            )

            # Return all Cycle Issues
            return Response(
                CycleIssueSerializer(self.get_queryset(), many=True).data,
                status=status.HTTP_200_OK,
            )

        except Cycle.DoesNotExist:
            return Response(
                {"error": "Cycle not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
