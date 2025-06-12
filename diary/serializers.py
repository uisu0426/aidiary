from rest_framework import serializers
from .models import DiaryEntry, DailySummaryDiary


class DiaryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DiaryEntry
        fields = [
            'id',
            'user',
            'raw_input',
            'generated_diary',
            'emotion',
            'happiness_score',
            'joy',
            'anger',
            'sadness',
            'pleasure',
            'hashtags',
            'is_public',
            'created_at',
        ]
        read_only_fields = ['user', 'created_at']


class DailySummarySerializer(serializers.ModelSerializer):
    date = serializers.DateField(format="%Y-%m-%d", read_only=True)
   
    class Meta:
        model = DailySummaryDiary
        fields = [
            'id',
            'user',
            'date',
            'summary',
            'emotion',
            'happiness_score',
            'joy',
            'anger',
            'sadness',
            'pleasure',
            'hashtags',
            'created_at',
            'raw_input',
            'generated_diary',
            'original_inputs'
        ]
        read_only_fields = ['user', 'created_at']