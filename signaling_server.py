from aiohttp import web
import socketio

ROOM = 'room'

sio = socketio.AsyncServer(cors_allowed_origins='*', ping_timeout=35)
app = web.Application()
sio.attach(app)

#py -m http.server -b 192.168.1.109 8000


@sio.event
async def connect(sid, environ):
    print('Connected', sid)
    await sio.enter_room(sid, ROOM)
    await sio.emit('ready', room=ROOM, skip_sid=sid)


@sio.event
async def disconnect(sid):
    await sio.leave_room(sid, ROOM)
    print('Disconnected', sid)


@sio.event
async def data(sid, data):
    print('Message from {}: {}'.format(sid, data))
    await sio.emit('data', data, room=ROOM, skip_sid=sid)


if __name__ == '__main__':
    web.run_app(app, port=8080)