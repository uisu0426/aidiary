import os
import re
from dotenv import load_dotenv
from openai import OpenAI
from .models import DiaryEntry, DailySummaryDiary
from datetime import datetime
from django.db import connection

# .env 파일에서 OpenAI API 키 로드
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

# 숫자를 문자열에서 추출하는 유틸 함수 (ex: "행복지수: 80%" → 80)
def extract_number(text: str) -> int:
    match = re.search(r"\d+", text)
    return int(match.group()) if match else 0

# GPT 응답을 파싱하여 일기 내용, 감정 정보, 해시태그 추출
def parse_gpt_output(content: str) -> dict:
    diary = ""
    emotion_summary, happiness_score, joy, anger, sadness, pleasure, hashtags = "분석 실패", 0, 0, 0, 0, 0, []

    diary_match = re.search(r"\[일기\](.*?)($|\[감정\]|\[해시태그\])", content, re.DOTALL)
    emotion_match = re.search(r"\[감정\](.*?)($|\[일기\]|\[해시태그\])", content, re.DOTALL)
    hashtag_match = re.search(r"\[해시태그\](.*?)($|\[일기\]|\[감정\])", content, re.DOTALL)

    if diary_match:
        diary = diary_match.group(1).strip()

    if emotion_match:
        lines = emotion_match.group(1).strip().splitlines()
        if len(lines) >= 5:
            emotion_summary = lines[0].split(":")[-1].strip()
            happiness_score = extract_number(lines[1])
            joy = extract_number(lines[2])
            anger = extract_number(lines[3])
            sadness = extract_number(lines[4])
            pleasure = extract_number(lines[5])

    if hashtag_match:
        hashtags = [tag.strip().lstrip("#") for tag in re.split(r"[#,\\s]+", hashtag_match.group(1)) if tag.strip()]

    return {
        "diary": diary,
        "emotion": emotion_summary,
        "happiness_score": happiness_score,
        "joy": joy,
        "anger": anger,
        "sadness": sadness,
        "pleasure": pleasure,
        "hashtags": hashtags,
    }

# 사용자의 일기를 기반으로 GPT를 호출하여 감성 일기 생성
def generate_diary_with_gpt(user_input: str) -> dict:
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "너는 감성 일기 작가야. 사용자의 하루를 바탕으로 감성적인 일기를 작성해.\n"
                        "응답 형식을 반드시 아래 [ ] 순서대로, 양식 그대로 출력해줘.\n"
                        "조건:\n"
                        "- 감정은 하나만\n"
                        "- 행복지수는 0~100 사이의 백분율\n"
                        "- 기쁨+분노+슬픔+즐거움 = 100(행복지수는 계산에 넣지 마)\n"
                        "- 해시태그는 3~5개\n\n"
                        "[일기]\n(감성적인 하루 종합 일기 내용)\n\n"
                        "[감정]\n감정: ...\n행복지수: ...\n기쁨: ...\n분노: ...\n슬픔: ...\n즐거움: ...\n\n"
                        "[해시태그]\n#..."
                    )
                },
                {"role": "user", "content": user_input},
            ],
            temperature=0.8,
            max_tokens=700,
        )

        content = response.choices[0].message.content.strip()
        print("🔍 GPT 응답 원문:\n", content)  # 디버깅용 출력

        return parse_gpt_output(content)

    except Exception as e:
        print("❌ GPT 호출 오류:", str(e))
        return {"error": f"OpenAI API 호출 중 오류: {str(e)}"}

# 하루 동안 여러 개의 일기를 기반으로 GPT 요약 및 감성 분석 수행
def generate_daily_summary(user, date: datetime.date) -> dict:
    connection.close()
    entries = DiaryEntry.objects.filter(user=user, created_at__date=date).order_by('created_at')
    if not entries.exists():
        return {"message": "해당 날짜에는 일기가 없습니다."}

    # 1. 단일 일기들의 raw_input과 generated_diary를 수집
    original_inputs = [
        {"raw_input": e.raw_input, "diary": e.generated_diary}
        for e in entries
    ]

    # 2. GPT에 전달할 입력 구성
    combined_input = "\n\n".join(
        f"[입력]\n{item['raw_input']}\n\n[일기]\n{item['diary']}"
        for item in original_inputs
    )

    system_prompt = (
        "너는 감성 일기 작가야. 다음은 사용자가 하루 동안 작성한 일기들과 키워드야.\n"
        "이 내용을 종합해서 하나의 감성적인 하루 종합 일기를 작성해줘.\n"
        "응답 형식을 반드시 아래 [ ] 순서대로, 양식 그대로 출력해줘.\n"
        "조건:\n"
        "- 감정은 하나만\n"
        "- 행복지수는 0~100 사이의 백분율\n"
        "- 기쁨+분노+슬픔+즐거움 = 100(행복지수는 계산에 넣지 마)\n"
        "- 해시태그는 3~5개\n\n"
        "[일기]\n(감성적인 하루 종합 일기 내용)\n\n"
        "[감정]\n감정: ...\n행복지수: ...\n기쁨: ...\n분노: ...\n슬픔: ...\n즐거움: ...\n\n"
        "[해시태그]\n#..."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": combined_input},
            ],
            temperature=0.8,
            max_tokens=700,
        )
        content = response.choices[0].message.content.strip()
        print("🔍 하루 종합 GPT 응답:\n", content)
        gpt = parse_gpt_output(content)

    except Exception as e:
        print("❌ 하루 종합 GPT 호출 오류:", str(e))
        return {"error": f"OpenAI API 호출 중 오류: {str(e)}"}

    # ✅ 기존 하루 종합 일기 삭제 후 새로 생성
    DailySummaryDiary.objects.filter(user=user, date=date).delete()

    summary = DailySummaryDiary.objects.create(
        user=user,
        date=date,
        raw_input=combined_input,
        generated_diary=gpt["diary"],
        emotion=gpt.get("emotion", ""),
        happiness_score=gpt.get("happiness_score", 0),
        joy=gpt.get("joy", 0),
        anger=gpt.get("anger", 0),
        sadness=gpt.get("sadness", 0),
        pleasure=gpt.get("pleasure", 0),
        hashtags=gpt.get("hashtags", []),
        original_inputs=original_inputs,
    )

    return {
        "id": summary.id,
        "date": str(summary.date),
        "generated_diary": summary.generated_diary,
        "emotion": summary.emotion,
        "happiness_score": summary.happiness_score,
        "joy": summary.joy,
        "anger": summary.anger,
        "sadness": summary.sadness,
        "pleasure": summary.pleasure,
        "hashtags": summary.hashtags,
        "original_inputs": summary.original_inputs,
    }

# GPT에게 한 달간 일기 목록을 요약하도록 요청
def generate_monthly_summary(diary_texts: list[str]) -> str:
    prompt = (
        "다음은 사용자의 한 달간 일기 목록입니다.\n"
        "전체적인 감정 흐름과 키워드, 분위기를 분석한 다음 하나의 감성적인 일기를 작성해주세요:\n\n"
        + "\n\n".join(diary_texts)
    )
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

# 한 달간 평균 감정 통계 및 인사이트 계산
def generate_monthly_retrospect(user, year: int, month: int) -> dict:
    entries = DiaryEntry.objects.filter(user=user, created_at__year=year, created_at__month=month)
    if not entries.exists():
        return {
            "summary": f"{month}월에는 작성된 일기가 없습니다.",
            "average_happiness": 0,
            "insight": "일기를 더 자주 써보는 것은 어떨까요?",
        }

    count = entries.count()
    total_happiness = sum(e.happiness_score or 0 for e in entries)
    average_happiness = round(total_happiness / count, 1)

    emotion_totals = {
        "joy": sum(e.joy or 0 for e in entries),
        "anger": sum(e.anger or 0 for e in entries),
        "sadness": sum(e.sadness or 0 for e in entries),
        "pleasure": sum(e.pleasure or 0 for e in entries),
    }
    emotion_avg = {k: round(v / count, 1) for k, v in emotion_totals.items()}

    insight = (
        f"{month}월은 전반적으로 행복지수 {average_happiness}%이며, "
        f"기쁨 {emotion_avg['joy']}%, 슬픔 {emotion_avg['sadness']}%, "
        f"분노 {emotion_avg['anger']}%, 즐거움 {emotion_avg['pleasure']}%의 감정 분포를 보였습니다."
    )

    return {
        "summary": f"{month}월 회고 요약",
        "average_happiness": average_happiness,
        "emotion_summary": emotion_avg,
        "insight": insight,
    }