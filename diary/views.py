from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import DiaryEntry, DailySummaryDiary
from .serializers import DiaryEntrySerializer, DailySummarySerializer
from .services import (
    generate_diary_with_gpt,
    generate_monthly_summary,
    generate_monthly_retrospect,
    generate_daily_summary
)
from datetime import datetime, timedelta
from collections import Counter


# ======================
# 공통 기능 헬퍼
# ======================

def regenerate_summary_if_needed(user, date):
    pass


# ======================
# 일기 관련 API
# ======================

class DiaryGenerateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_input = request.data.get('input')
        if not user_input:
            return Response({"error": "input 값이 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)

        gpt_result = generate_diary_with_gpt(user_input)
        if 'error' in gpt_result:
            return Response(gpt_result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        diary_entry = DiaryEntry.objects.create(
            user=request.user,
            raw_input=user_input,
            generated_diary=gpt_result.get('diary', ''),
            emotion=gpt_result.get('emotion', ''),
            happiness_score=gpt_result.get('happiness_score', 0),
            joy=gpt_result.get('joy', 0),
            anger=gpt_result.get('anger', 0),
            sadness=gpt_result.get('sadness', 0),
            pleasure=gpt_result.get('pleasure', 0),
            hashtags=gpt_result.get('hashtags', []),
            is_public=True
        )

        regenerate_summary_if_needed(request.user, diary_entry.created_at.date())

        serializer = DiaryEntrySerializer(diary_entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DiaryEntryListAPIView(APIView):
    """
    현재 로그인한 사용자의 전체 일기 및 하루 종합 일기 목록 통합 조회 API
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        diary_entries = DiaryEntry.objects.filter(user=request.user)
        summary_entries = DailySummaryDiary.objects.filter(user=request.user)
        diary_data = DiaryEntrySerializer(diary_entries, many=True).data
        summary_data = DailySummarySerializer(summary_entries, many=True).data
        combined = diary_data + [dict(item, is_summary=True) for item in summary_data]
        return Response(combined)


class DiaryEntryDetailAPIView(generics.RetrieveAPIView):
    queryset = DiaryEntry.objects.all()
    serializer_class = DiaryEntrySerializer
    permission_classes = [IsAuthenticated]


class DiaryEntryUpdateDeleteAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DiaryEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DiaryEntry.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        diary = self.get_object()
        raw_input = request.data.get('raw_input')
        generated_diary = request.data.get('generated_diary')
        hashtags = request.data.get('hashtags')

        print("📩 수정 요청:", request.data)

        if raw_input is not None:
            raw_input = raw_input.strip()
            if raw_input:
                gpt_result = generate_diary_with_gpt(raw_input)
                if 'error' in gpt_result:
                    return Response(gpt_result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                diary.raw_input = raw_input
                diary.generated_diary = gpt_result.get('diary', '')
                diary.emotion = gpt_result.get('emotion', '')
                diary.happiness_score = gpt_result.get('happiness_score', 0)
                diary.joy = gpt_result.get('joy', 0)
                diary.anger = gpt_result.get('anger', 0)
                diary.sadness = gpt_result.get('sadness', 0)
                diary.pleasure = gpt_result.get('pleasure', 0)

        elif generated_diary is not None:
            diary.generated_diary = generated_diary
            if hashtags is not None:
                diary.hashtags = hashtags

        else:
            return Response({"error": "수정할 내용이 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        diary.save()
        serializer = self.get_serializer(diary)
        return Response(serializer.data)


# ======================
# 하루 종합 일기 API
# ======================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def daily_summary_view(request):
    if request.method == 'GET':
        date_str = request.GET.get('date')
        if not date_str:
            return Response({"error": "날짜가 필요합니다."}, status=400)
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "날짜 형식이 잘못되었습니다."}, status=400)
        try:
            summary = DailySummaryDiary.objects.get(user=request.user, date=date)
        except DailySummaryDiary.DoesNotExist:
            return Response({"error": "해당 날짜의 하루 종합 일기가 없습니다."}, status=404)
        serializer = DailySummarySerializer(summary)
        return Response(serializer.data)

    elif request.method == 'POST':
        date_str = request.data.get('date')
        if not date_str:
            return Response({"error": "date 파라미터가 필요합니다."}, status=400)
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "날짜 형식이 잘못되었습니다."}, status=400)

        summary_data = generate_daily_summary(request.user, date)
        return Response(summary_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def missing_daily_summaries(request):
    user = request.user
    first_entry = DiaryEntry.objects.filter(user=user).order_by("created_at").first()
    if not first_entry:
        return Response({"missing_daily_summaries": []})

    start_date = first_entry.created_at.date()
    end_date = datetime.now().date()
    missing_dates = []

    for day in (start_date + timedelta(days=n) for n in range((end_date - start_date).days + 1)):
        if DiaryEntry.objects.filter(user=user, created_at__date=day).exists():
            if not DailySummaryDiary.objects.filter(user=user, date=day).exists():
                missing_dates.append(str(day))

    return Response({"missing_daily_summaries": missing_dates})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_daily_summary(request, pk):
    try:
        summary = DailySummaryDiary.objects.get(pk=pk, user=request.user)
    except DailySummaryDiary.DoesNotExist:
        return Response({"error": "일기를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

    summary.delete()
    return Response({"message": "하루 종합 일기가 삭제되었습니다."}, status=status.HTTP_204_NO_CONTENT)


# ======================
# 월간 회고록 API
# ======================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_retrospect(request):
    year = int(request.GET.get('year'))
    month = int(request.GET.get('month'))
    user = request.user

    entries = DiaryEntry.objects.filter(user=user, created_at__year=year, created_at__month=month)
    if not entries.exists():
        return Response({"message": "해당 월의 일기가 없습니다."}, status=404)

    total_happy = sum(e.happiness_score or 0 for e in entries)
    avg_happy = round(total_happy / entries.count(), 1)

    total_joy = sum(e.joy or 0 for e in entries)
    total_anger = sum(e.anger or 0 for e in entries)
    total_sadness = sum(e.sadness or 0 for e in entries)
    total_pleasure = sum(e.pleasure or 0 for e in entries)

    avg_emotions = {
        "joy": round(total_joy / entries.count()),
        "anger": round(total_anger / entries.count()),
        "sadness": round(total_sadness / entries.count()),
        "pleasure": round(total_pleasure / entries.count())
    }

    all_tags = [tag for e in entries for tag in e.hashtags or []]
    top_tags = [tag for tag, _ in Counter(all_tags).most_common(5)]

    highlight = max(entries, key=lambda e: e.happiness_score or 0)
    summary = generate_monthly_summary([e.generated_diary for e in entries])

    return Response({
        "year": year,
        "month": month,
        "average_happiness": avg_happy,
        "average_emotions": avg_emotions,
        "top_hashtags": top_tags,
        "summary": summary,
        "highlight_entry": {
            "id": highlight.id,
            "created_at": highlight.created_at,
            "generated_diary": highlight.generated_diary,
            "happiness_score": highlight.happiness_score,
            "emotion": highlight.emotion,
            "hashtags": highlight.hashtags
        }
    })


class MonthlyRetrospectView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get("year", datetime.now().year))
        month = int(request.query_params.get("month", datetime.now().month))
        result = generate_monthly_retrospect(request.user, year, month)
        return Response(result)