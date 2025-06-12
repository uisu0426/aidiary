from django.urls import path
from . import views

urlpatterns = [
    # 일기 CRUD
    path('generate/', views.DiaryGenerateAPIView.as_view(), name='generate-diary'),
    path('entries/', views.DiaryEntryListAPIView.as_view(), name='diary-list'),
    path('entries/<int:pk>/', views.DiaryEntryDetailAPIView.as_view(), name='diary-detail'),
    path('edit/<int:pk>/', views.DiaryEntryUpdateDeleteAPIView.as_view(), name='diary-edit'),

    # 하루 종합 일기 (GET + POST 통합)
    path('daily-summary/', views.daily_summary_view, name='daily-summary'),
    path('daily-summary/delete/<int:pk>/', views.delete_daily_summary, name='delete-daily-summary'),

    # 회고록 관련
    path('missing-summaries/', views.missing_daily_summaries, name='missing-daily-summaries'),
    path('monthly-retrospect/', views.monthly_retrospect, name='monthly-retrospect'),
    path('monthly-retrospect-llm/', views.MonthlyRetrospectView.as_view(), name='monthly-retrospect-llm'),
]