# Django imports
from django.db import models
from django.conf import settings
from django.template.defaultfilters import slugify
from django.db.models.signals import post_save
from django.dispatch import receiver

# Modeule imports
from plane.db.mixins import AuditModel

# Module imports
from . import BaseModel

ROLE_CHOICES = (
    (20, "Admin"),
    (15, "Member"),
    (10, "Viewer"),
    (5, "Guest"),
)


def get_default_props():
    return {
        "issueView": "list",
        "groupByProperty": None,
        "orderBy": None,
        "filterIssue": None,
    }


class Project(BaseModel):
    NETWORK_CHOICES = ((0, "Secret"), (2, "Public"))
    name = models.CharField(max_length=255, verbose_name="Project Name")
    description = models.TextField(verbose_name="Project Description", blank=True)
    description_text = models.JSONField(
        verbose_name="Project Description RT", blank=True, null=True
    )
    description_html = models.JSONField(
        verbose_name="Project Description HTML", blank=True, null=True
    )
    network = models.PositiveSmallIntegerField(default=2, choices=NETWORK_CHOICES)
    workspace = models.ForeignKey(
        "db.WorkSpace", on_delete=models.CASCADE, related_name="workspace_project"
    )
    identifier = models.CharField(
        max_length=5,
        verbose_name="Project Identifier",
    )
    default_assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="default_assignee",
        null=True,
        blank=True,
    )
    project_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_lead",
        null=True,
        blank=True,
    )
    icon = models.CharField(max_length=255, null=True, blank=True)
    module_view = models.BooleanField(default=True)
    cycle_view = models.BooleanField(default=True)
    issue_views_view = models.BooleanField(default=True)
    page_view = models.BooleanField(default=True)
    cover_image = models.URLField(blank=True, null=True, max_length=800)

    def __str__(self):
        """Return name of the project"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = [["identifier", "workspace"], ["name", "workspace"]]
        verbose_name = "Project"
        verbose_name_plural = "Projects"
        db_table = "projects"
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        self.identifier = self.identifier.strip().upper()
        return super().save(*args, **kwargs)


class ProjectBaseModel(BaseModel):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="project_%(class)s"
    )
    workspace = models.ForeignKey(
        "db.Workspace", models.CASCADE, related_name="workspace_%(class)s"
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.workspace = self.project.workspace
        super(ProjectBaseModel, self).save(*args, **kwargs)


class ProjectMemberInvite(ProjectBaseModel):
    email = models.CharField(max_length=255)
    accepted = models.BooleanField(default=False)
    token = models.CharField(max_length=255)
    message = models.TextField(null=True)
    responded_at = models.DateTimeField(null=True)
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=10)

    class Meta:
        verbose_name = "Project Member Invite"
        verbose_name_plural = "Project Member Invites"
        db_table = "project_member_invites"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project.name} {self.email} {self.accepted}"


class ProjectMember(ProjectBaseModel):
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="member_project",
    )
    comment = models.TextField(blank=True, null=True)
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=10)
    view_props = models.JSONField(null=True)
    default_props = models.JSONField(default=get_default_props)

    class Meta:
        unique_together = ["project", "member"]
        verbose_name = "Project Member"
        verbose_name_plural = "Project Members"
        db_table = "project_members"
        ordering = ("-created_at",)

    def __str__(self):
        """Return members of the project"""
        return f"{self.member.email} <{self.project.name}>"


# TODO: Remove workspace relation later
class ProjectIdentifier(AuditModel):
    workspace = models.ForeignKey(
        "db.Workspace", models.CASCADE, related_name="project_identifiers", null=True
    )
    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, related_name="project_identifier"
    )
    name = models.CharField(max_length=10)

    class Meta:
        unique_together = ["name", "workspace"]
        verbose_name = "Project Identifier"
        verbose_name_plural = "Project Identifiers"
        db_table = "project_identifiers"
        ordering = ("-created_at",)


class ProjectFavorite(ProjectBaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_favorites",
    )

    class Meta:
        unique_together = ["project", "user"]
        verbose_name = "Project Favorite"
        verbose_name_plural = "Project Favorites"
        db_table = "project_favorites"
        ordering = ("-created_at",)

    def __str__(self):
        """Return user of the project"""
        return f"{self.user.email} <{self.project.name}>"
