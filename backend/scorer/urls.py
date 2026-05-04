from django.urls import path
from .views import ScoreView, StatsView, HistoryView, LatestScoreView, ActionItemView, ProfileView

urlpatterns = [
    path("profile/", ProfileView.as_view(), name="profile"),
    path("score/", ScoreView.as_view(), name="score"),
    path("score/latest/", LatestScoreView.as_view(), name="score_latest"),
    path("stats/", StatsView.as_view(), name="stats"),
    path("history/", HistoryView.as_view(), name="history"),
    path("action-items/", ActionItemView.as_view(), name="action_items"),
]
