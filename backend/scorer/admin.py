from django.contrib import admin
from .models import Assessment, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "employment_type", "age_range", "state", "updated_at")


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("id", "persona", "risk_tier", "score", "banking_score", "emergency_score", "spending_score", "literacy_score", "created_at")
    list_filter = ("risk_tier", "persona")
    readonly_fields = ("score", "risk_tier", "created_at")
    ordering = ("-created_at",)
