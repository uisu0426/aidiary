from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate, get_user_model
from .models import CustomUser

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)  # 비밀번호 확인

    class Meta:
        model = User
        fields = ('user_id', 'username', 'email', 'password', 'password2')

    def validate_user_id(self, value):
        if User.objects.filter(user_id=value).exists():
            raise serializers.ValidationError("이미 사용 중인 ID입니다.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 등록된 이메일입니다.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "비밀번호가 일치하지 않습니다."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create(
            user_id=validated_data['user_id'],
            username=validated_data['username'],
            email=validated_data['email'],
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        user_id = attrs.get('user_id')
        password = attrs.get('password')

        user = None
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("존재하지 않는 사용자입니다.")

        if not user.check_password(password):
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")

        refresh = self.get_token(user)

        # ✅ 사용자 정의 필드도 토큰과 응답에 포함
        refresh['user_id'] = user.user_id
        refresh['username'] = user.username
        refresh['is_staff'] = user.is_staff  # 토큰에 포함

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.user_id,
            'username': user.username,
            'is_staff': user.is_staff,  # 응답에 포함
        }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_id'] = user.user_id
        token['username'] = user.username
        token['is_staff'] = user.is_staff  # 토큰에 포함
        return token
    
class UserAdminListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'user_id', 'username', 'email', 'date_joined']

class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'user_id', 'username', 'email', 'is_active']
