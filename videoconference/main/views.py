from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader


def index(request):
    return render(request, "main/entry.html")

# def room(request, room_name):
#     print(f'Enter room {room_name}')
#     # template = loader.get_template("main/index.html")
#     context = {}
#     return render(request, "main/index.html", context)

def room(request, room_name):
    print(f'Enter room {room_name}')
    context = {"room_name": room_name}
    return render(request, "main/room.html", context)

