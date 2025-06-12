from .serializers import CustomTokenObtainPairSerializer, RegisterSerializer
from rest_framework import generics, permissions, status
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserAdminListSerializer, UserListSerializer



User = get_user_model()

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        serializer = UserAdminListSerializer(users, many=True)
        return Response(serializer.data)

class UserListAPIView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserListSerializer
    queryset = User.objects.all().order_by('id')


class UserUpdateAPIView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserListSerializer
    queryset = User.objects.all()


class UserDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all()