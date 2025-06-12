from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from diary.models import DiaryEntry


class DiaryInline(admin.TabularInline):
    model = DiaryEntry
    extra = 0
    fields = ['raw_input', 'generated_diary', 'emotion', 'created_at']
    readonly_fields = ['raw_input', 'generated_diary', 'emotion', 'created_at']
    can_delete = False
    show_change_link = False


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('user_id', 'username', 'email', 'is_staff', 'is_active')
    search_fields = ('user_id', 'username', 'email')
    ordering = ('user_id',)
    readonly_fields = ('last_login', 'date_joined')

    fieldsets = (
        (None, {'fields': ('user_id', 'email', 'password')}),
        ('개인정보', {'fields': ('username',)}),
        ('권한', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('기타 정보', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user_id', 'email', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    inlines = [DiaryInline]  # 사용자 상세 페이지에서 일기 보기


admin.site.register(CustomUser, CustomUserAdmin)