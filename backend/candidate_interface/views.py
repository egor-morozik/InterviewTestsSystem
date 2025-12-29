import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.utils import timezone
from .models import Invitation, Answer
from interviewer_interface.models import Question

def take_test(request, unique_link, question_id=None):
    invitation = get_object_or_404(Invitation, unique_link=unique_link)
    if invitation.completed:
        return render(request, 'candidate_interface/test_completed.html', {
            'candidate': invitation.candidate,
            'message': "Вы уже завершили этот тест. Повторное прохождение невозможно."
        })

    template = invitation.test_template
    time_limit_seconds = template.time_limit * 60  

    session_key = f'test_start_{unique_link}'
    if time_limit_seconds > 0 and session_key not in request.session:
        request.session[session_key] = timezone.now().timestamp()
        request.session.modified = True

    if time_limit_seconds > 0:
        start_timestamp = request.session.get(session_key)
        elapsed = timezone.now().timestamp() - start_timestamp
        if elapsed >= time_limit_seconds:
            invitation.completed = True
            invitation.save()
            return render(request, 'candidate_interface/test_completed.html', {
                'candidate': invitation.candidate,
                'message': "Время на тест истекло. Результаты сохранены."
            })

        remaining_time = int(time_limit_seconds - elapsed)
    else:
        remaining_time = 0

    template_questions = template.testtemplatequestion_set.all().order_by('order')
    questions = [tq.question for tq in template_questions]

    if not questions:
        return HttpResponse("Нет вопросов в тесте.")

    if question_id is None:
        return redirect('candidate_interface:take_test', unique_link=unique_link, question_id=questions[0].id)

    try:
        current_index = next(i for i, q in enumerate(questions) if q.id == question_id)
        current_question = questions[current_index]
    except StopIteration:
        return HttpResponse("Вопрос не найден в этом тесте.", status=404)

    if request.method == 'POST':
        response_key = f'question_{current_question.id}'
        if current_question.question_type == 'multiple_choice':
            response_value = json.dumps([int(v) for v in request.POST.getlist(response_key)])
        else:
            response_value = request.POST.get(response_key, '').strip()

        Answer.objects.update_or_create(
            invitation=invitation,
            question=current_question,
            defaults={'response': response_value}
        )

        action = request.POST.get('action')
        if action == 'next':
            next_index = current_index + 1
            if next_index < len(questions):
                return redirect('candidate_interface:take_test', unique_link=unique_link, question_id=questions[next_index].id)
            else:
                return redirect('candidate_interface:finish_test', unique_link=unique_link)

        elif action == 'prev':
            prev_index = current_index - 1
            if prev_index >= 0:
                return redirect('candidate_interface:take_test', unique_link=unique_link, question_id=questions[prev_index].id)

        elif action == 'finish':
            return redirect('candidate_interface:finish_test', unique_link=unique_link)

    context = {
        'invitation': invitation,
        'current_question': current_question,
        'questions': questions,
        'total_questions': len(questions),
        'current_index': current_index + 1,
        'is_first': current_index == 0,
        'is_last': current_index == len(questions) - 1,
        'remaining_time': remaining_time,
        'time_limit_active': time_limit_seconds > 0,
    }

    return render(request, 'candidate_interface/test_page.html', context)


def finish_test(request, unique_link):
    invitation = get_object_or_404(Invitation, unique_link=unique_link)

    if invitation.completed:
        return render(request, 'candidate_interface/test_completed.html', {
            'candidate': invitation.candidate,
            'message': "Тест уже завершён."
        })

    invitation.completed = True
    invitation.save()

    for answer in invitation.answers.all():
        answer.auto_evaluate()
        answer.save()

    return render(request, 'candidate_interface/test_completed.html', {
        'candidate': invitation.candidate,
        'message': "Тест успешно завершён. Спасибо!"
    })
