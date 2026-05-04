from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    AGE_RANGE_CHOICES = [
        ("18_24", "18-24"),
        ("25_30", "25-30"),
        ("31_40", "31-40"),
        ("40_plus", "40+"),
    ]

    EMPLOYMENT_CHOICES = [
        ("full_time_salaried", "Full-time salaried"),
        ("part_time_hourly", "Part-time or hourly"),
        ("freelance_gig", "Freelance or gig"),
        ("student", "Student"),
        ("between_jobs", "Between jobs"),
    ]

    LIVING_SITUATION_CHOICES = [
        ("single", "Single"),
        ("partnered", "Partnered"),
        ("family_kids", "Family with kids"),
        ("supporting_abroad", "Supporting family abroad"),
    ]

    FAMILY_SITUATION_CHOICES = [
        ("no_dependents", "No dependents"),
        ("have_children", "Have children"),
        ("caring_parents", "Caring for parents or family members"),
        ("both", "Both"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="userprofile"
    )
    full_name = models.CharField(max_length=120, blank=True, default="")
    age_range = models.CharField(
        max_length=20, choices=AGE_RANGE_CHOICES, blank=True, default=""
    )
    state = models.CharField(max_length=2, blank=True, default="")
    employment_type = models.CharField(
        max_length=40, choices=EMPLOYMENT_CHOICES, blank=True, default=""
    )
    living_situation = models.CharField(
        max_length=40, choices=LIVING_SITUATION_CHOICES, blank=True, default=""
    )
    family_situation = models.CharField(
        max_length=40, choices=FAMILY_SITUATION_CHOICES, blank=True, default=""
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User profile"

    def __str__(self):
        return f"Profile: {self.user.username}"

    def is_complete(self):
        required = (
            self.full_name.strip(),
            self.age_range,
            self.state,
            self.employment_type,
            self.living_situation,
            self.family_situation,
        )
        return all(bool(x) for x in required)


class Assessment(models.Model):
    PERSONA_CHOICES = [
        ("starting_out", "Just starting out, first job, building habits"),
        ("tight", "Getting by but it's tight"),
        ("rough_patch", "Hit a rough patch"),
        ("doing_okay", "Doing okay, want to understand my risks better"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="assessments"
    )

    persona = models.CharField(max_length=30, choices=PERSONA_CHOICES)

    q1_cash_flow = models.CharField(max_length=40, blank=True, default="")
    q2_income_stability = models.CharField(max_length=40, blank=True, default="")
    q3_credit_behavior = models.CharField(max_length=40, blank=True, default="")
    q4_bnpl = models.CharField(max_length=40, blank=True, default="")
    q5_debt = models.CharField(max_length=40, blank=True, default="")
    q6_emergency_resilience = models.CharField(max_length=40, blank=True, default="")
    q7_emergency_buffer = models.CharField(max_length=40, blank=True, default="")
    q8_money_awareness = models.CharField(max_length=40, blank=True, default="")
    q9_savings_behavior = models.CharField(max_length=40, blank=True, default="")

    banking_score = models.IntegerField(default=0)
    emergency_score = models.IntegerField(default=0)
    spending_score = models.IntegerField(default=0)
    literacy_score = models.IntegerField(default=0)
    score = models.IntegerField()
    risk_tier = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Assessment #{self.pk}: {self.risk_tier} ({self.score})"


class ActionItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="action_items")
    key = models.CharField(max_length=60)
    done = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["user", "key"]]
        ordering = ["key"]
