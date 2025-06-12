from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,      # 로그인용 (access + refresh 발급)
    TokenRefreshView          # refresh 토큰으로 access 재발급
)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", include("users.urls")),  # /api/users/register/
    path("api/diary/", include("diary.urls")),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]