from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("full_name", models.CharField(blank=True, default="", max_length=120)),
                ("age_range", models.CharField(blank=True, choices=[("18_24", "18-24"), ("25_30", "25-30"), ("31_40", "31-40"), ("40_plus", "40+")], default="", max_length=20)),
                ("state", models.CharField(blank=True, default="", max_length=2)),
                ("employment_type", models.CharField(blank=True, choices=[("full_time_salaried", "Full-time salaried"), ("part_time_hourly", "Part-time or hourly"), ("freelance_gig", "Freelance or gig"), ("student", "Student"), ("between_jobs", "Between jobs")], default="", max_length=40)),
                ("living_situation", models.CharField(blank=True, choices=[("single", "Single"), ("partnered", "Partnered"), ("family_kids", "Family with kids"), ("supporting_abroad", "Supporting family abroad")], default="", max_length=40)),
                ("family_situation", models.CharField(blank=True, choices=[("no_dependents", "No dependents"), ("have_children", "Have children"), ("caring_parents", "Caring for parents or family members"), ("both", "Both")], default="", max_length=40)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="userprofile", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "User profile",
            },
        ),
        migrations.CreateModel(
            name="Assessment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("persona", models.CharField(choices=[("starting_out", "Just starting out, first job, building habits"), ("tight", "Getting by but it's tight"), ("rough_patch", "Hit a rough patch"), ("doing_okay", "Doing okay, want to understand my risks better")], max_length=30)),
                ("q1_cash_flow", models.CharField(blank=True, default="", max_length=40)),
                ("q2_income_stability", models.CharField(blank=True, default="", max_length=40)),
                ("q3_credit_behavior", models.CharField(blank=True, default="", max_length=40)),
                ("q4_bnpl", models.CharField(blank=True, default="", max_length=40)),
                ("q5_debt", models.CharField(blank=True, default="", max_length=40)),
                ("q6_emergency_resilience", models.CharField(blank=True, default="", max_length=40)),
                ("q7_emergency_buffer", models.CharField(blank=True, default="", max_length=40)),
                ("q8_money_awareness", models.CharField(blank=True, default="", max_length=40)),
                ("q9_savings_behavior", models.CharField(blank=True, default="", max_length=40)),
                ("banking_score", models.IntegerField(default=0)),
                ("emergency_score", models.IntegerField(default=0)),
                ("spending_score", models.IntegerField(default=0)),
                ("literacy_score", models.IntegerField(default=0)),
                ("score", models.IntegerField()),
                ("risk_tier", models.CharField(max_length=10)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="assessments", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ActionItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(max_length=60)),
                ("done", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="action_items", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["key"],
                "unique_together": {("user", "key")},
            },
        ),
        migrations.CreateModel(
            name="BudgetSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("income", models.DecimalField(decimal_places=2, max_digits=12)),
                ("housing_pct", models.FloatField()),
                ("food_pct", models.FloatField()),
                ("transportation_pct", models.FloatField()),
                ("healthcare_pct", models.FloatField()),
                ("discretionary_pct", models.FloatField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="budgets", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
