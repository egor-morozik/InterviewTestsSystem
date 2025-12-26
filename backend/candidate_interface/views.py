from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from .models import Invitation, Answer
from interviewer_interface.models import Question


def take_test(request, unique_link):
    invitation = get_object_or_404(Invitation, unique_link=unique_link)

    if Answer.objects.filter(invitation=invitation).exists():
        return HttpResponse("Вы уже прошли этот тест. Спасибо!")

    questions = invitation.test_template.questions.all().order_by('id') 

    if request.method == 'POST':
        for question in questions:
            response_key = f'question_{question.id}'
            response_text = request.POST.get(response_key, '').strip()
            
            Answer.objects.create(
                invitation=invitation,
                question=question,
                response=response_text,
            )
        return render(request, 'candidate_interface/test_completed.html', {
            'candidate': invitation.candidate,
        })

    return render(request, 'candidate_interface/test_page.html', {
        'invitation': invitation,
        'questions': questions,
    })
