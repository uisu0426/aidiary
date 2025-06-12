from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class DiaryEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    raw_input = models.TextField(blank=True)
    generated_diary = models.TextField()
    emotion = models.CharField(max_length=50, blank=True, null=True)
    happiness_score = models.PositiveIntegerField(default=0)
    joy = models.PositiveIntegerField(default=0)
    anger = models.PositiveIntegerField(default=0)
    sadness = models.PositiveIntegerField(default=0)
    pleasure = models.PositiveIntegerField(default=0)
    hashtags = models.JSONField(default=list, blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.user}] {self.created_at.date()} - {self.generated_diary[:20]}"


class DailySummaryDiary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    original_inputs = models.JSONField(default=list, blank=True)  # 단일 일기 원본 목록 저장
    summary = models.TextField(blank=True)  # 하루 종합 일기
    emotion = models.CharField(max_length=50, blank=True, null=True)
    happiness_score = models.PositiveIntegerField(default=0)
    joy = models.PositiveIntegerField(default=0)
    anger = models.PositiveIntegerField(default=0)
    sadness = models.PositiveIntegerField(default=0)
    pleasure = models.PositiveIntegerField(default=0)
    hashtags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    raw_input = models.TextField(blank=True)
    generated_diary = models.TextField(blank=True)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"[{self.user}] {self.date} 하루 종합"