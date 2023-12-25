import json

from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"main_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        peer_username = text_data_json['peer']
        action = text_data_json['action']
        message = text_data_json['message']

        print('Message received: ', message)

        print('peer_username: ', peer_username)
        print('action: ', action)
        print('self.channel_name: ', self.channel_name)

        if(action == 'new-offer') or (action =='new-answer'):

            # print(text_data_json['message'])
            receiver_channel_name = text_data_json['message']['receiver_channel_name']
            print('Sending to ', receiver_channel_name)

            # set new receiver as the current sender
            text_data_json['message']['receiver_channel_name'] = self.channel_name

            await self.channel_layer.send(
                receiver_channel_name,
                {
                    'type': 'send.sdp',
                    'receive_dict': text_data_json,
                }
            )

            return

        # set new receiver as the current sender
        # so that some messages can be sent
        # to this channel specifically
        text_data_json['message']['receiver_channel_name'] = self.channel_name

        # send to all peers
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send.sdp',
                'receive_dict': text_data_json,
            }
        )

        # # Send message to room group
        # await self.channel_layer.group_send(
        #     self.room_group_name, {"type": 'send.sdp', "sdp": text_data_json}
        # )

    # Receive message from room group
    async def send_sdp(self, event):
        receive_dict = event['receive_dict']

        this_peer = receive_dict['peer']
        action = receive_dict['action']
        message = receive_dict['message']

        await self.send(text_data=json.dumps({
            'peer': this_peer,
            'action': action,
            'message': message,
        }))

        # mes_type = event["type"]
        # mes_sdp = event["sdp"]

        # # Send message to WebSocket
        # await self.send(text_data=json.dumps({"type": mes_type, "spd": mes_sdp}))