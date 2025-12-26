import json
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from .models import Invitation, Answer


def take_test(request, unique_link):
    invitation = get_object_or_404(Invitation, unique_link=unique_link)
    questions = invitation.test_template.questions.all()

    if Answer.objects.filter(invitation=invitation).exists():
        return HttpResponse("Тест уже пройден.")

    if request.method == 'POST':
        for question in questions:
            key = f'question_{question.id}'
            if question.question_type == 'multiple_choice':
                value = json.dumps([int(v) for v in request.POST.getlist(key)])
            else:
                value = request.POST.get(key, '').strip()

            Answer.objects.create(
                invitation=invitation,
                question=question,
                response=value,
            )

        invitation.completed = True
        invitation.save()
        return render(request, 'candidate_interface/test_completed.html', {'candidate': invitation.candidate})

    context = {
        'invitation': invitation,
        'questions': questions,
    }
    return render(request, 'candidate_interface/test_page.html', context)
