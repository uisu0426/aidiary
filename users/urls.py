from django.urls import path
from .views import RegisterView, LoginView, AdminUserListView, UserListAPIView, UserUpdateAPIView, UserDeleteAPIView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path('list/', UserListAPIView.as_view(), name='user-list'),
]



urlpatterns += [
    path('admin/custom-users/', AdminUserListView.as_view(), name='admin-user-list'),
]

urlpatterns += [
    path('list/', UserListAPIView.as_view()),
    path('<int:pk>/', UserUpdateAPIView.as_view()),
    path('<int:pk>/', UserDeleteAPIView.as_view()),
]