import uuid
import argparse
import sys 
import requests
import setuptools
import mysql.connector

class Terminal():
    def __init__(self, room_contrl, user_admin, brows):
      self.room_controller = room_contrl
      self.user_administator = user_admin
      self.browser = brows
      print("In TERMINAL init: ")
      print(f'\t{self.room_controller}')
      print(f'\t{self.user_administator}')
      
    @property
    def room_controller(self):
          return self._room_controller
          
    @room_controller.setter
    def room_controller(self, room_contrl):
        self._room_controller = room_contrl
        
    @property
    def user_administrator(self):
        return self._user_administrator
    
    @user_administrator.setter
    def user_administrator(self, user_admin):
        self._user_administrator = user_admin
        
    @property
    def browser(self):
        return self._browser
        
    @browser.setter
    def browser(self, brows):
        self._browser = brows
        
    def command_parser(self):
        desc = 'create_room [name] [-s] [-o] - create new room for videoconference, [name] - room name, [-s] - save room, [-o] - connect to room (open in bowser)\nconnect [name] - connect to existing room, [name] - room name\ndelete_room [name] - delete existing room, [name] - room name\nrename_room [old_name] [new_name] - rename existing room\nsave_room [name] - save existing room to saved list, [name] - room name\nget_saved - get all rooms from saved list\nchange_username [new_name] - change username\nerase_saved [name] - delete saved room from saved list'
        connect = True
        save = True
        parser = argparse.ArgumentParser(prog='videoconference',
                                        description=desc,
                                        epilog='text in the footer to help')
        parser.add_argument('command',
                            metavar='Command',
                            nargs='+',
                            help='enter some command from commands list in description.',
                            default=None)
        parser.add_argument('-s',
                            action='store_const',
                            const=save,
                            default=False,
                            help='enter if you wanna save this room')
        parser.add_argument('-o',
                            action='store_const',
                            const=connect,
                            default=False,
                            help='enter if you wanna connect to this room')
        args = parser.parse_args()
        return args

    def command_processor(self):
        args = self.command_parser()
        commands = args.command
        save_room = args.s
        connect_to_room = args.o
        args_counter = len(commands)
        first_word = commands[0]
        second_word = commands[1]
        match args_counter:
            case 2:
                match first_word:
                    case 'get':
                        if second_word == 'saved':
                            print('Get all saved room.')
                            self.room_controller.get_all_saved_rooms()
                        else:
                            raise ValueError('!!! Wrong command !!!')
                    case 'connect':
                        room_name = second_word
                        print(f'Connect to {second_word}.')
                        room_link = self.room_controller.get_room(room_name)
                        self.browser.open_url(room_link)
                    case _:
                        raise ValueError('!!! Wrong command !!!')
            case 3:
                match first_word:
                    case 'create':
                        if second_word == 'room':
                            room_name = commands[2]
                            print(f'Create room {room_name}.', end=' ')
                            room_link = self.room_controller.create_room(room_name)
                            if save_room:
                                print('Save room.')
                                self.room_controller.save_room(room_name)
                            if connect_to_room:
                                print('Connecting to room...')
                                self.browser.open_url(room_link)
                        else:
                            raise ValueError('!!! Wrong command !!!')
                    case 'delete':
                        if second_word == 'room':
                            room_name = commands[2]
                            print(f'Delete room {room_name}.')
                            self.room_controller.delete_room(room_name)
                        else:
                            raise ValueError('!!! Wrong command !!!')
                    case 'save':
                        if second_word == 'room':
                            room_name = commands[2]
                            print(f'Save room {room_name}.')
                            self.room_controller.save_room(room_name)
                        else:
                            raise ValueError('!!! Wrong command !!!')
                    case 'change':
                        if second_word == 'username':
                            new_username = commands[2]
                            print(f'Change username on {new_username}.')
                            self.user_administator.set_user_name(new_username)
                        else:
                            raise ValueError('!!! Wrong command !!!')
                    case 'erase':
                        if second_word == 'saved':
                            room_name = commands[2]
                            print(f'Delete room {room_name} from saved list.')
                            self.room_controller.delete_saved_room(room_name)
                        else:
                            raise ValueError('!!! Wrong command !!!')
                    case _:
                        raise ValueError('!!! Wrong command !!!')
            case 4:
                if first_word == 'rename' and second_word == 'room':
                    print(f'Rename room from {commands[2]} to {commands[3]}.')
                else:
                    raise ValueError('!!! Wrong command !!!')
            case _:
                raise ValueError('!!! Wrong command !!!')

    def e_no_room(self):
        if 1 < 2:
            raise NoSuchRoomException('There are no room with this name.')
    
    # def create_room(self, room_name):
    #     #action
    #     room_link = self.room_controller.create_room(room_name)
    #     print("Terminal: 1. Create room.")
    #     answer = input('Wanna connect now? y/n: ')
    #     if answer:
    #         if answer == 'y':
    #             self.connect_to_room(room_link)
    #         elif answer == 'n':
    #             print(f'Link for {room_name}: {room_link}')
    #         else:
    #             raise ValueError('Wrong answer')
    #     else:
    #         raise ValueError('Empty answer')
    
    # def connect_to_room(self, room_link):
    #     #action
    #     print("Terminal: 2. Connect to room")
    #     self.browser.open_url(room_link)
    
    # def get_room_id(self):
    #     #output
    #     print("Terminal: 3. Get room ID")
    
    # def remove_room(self):
    #     #action
    #     self.get_room_id()
    #     print("Terminal: 4. Remove room")
    
    # def rename_room(self, new_room_name):
    #     #input
    #     self.get_room_id()
    #     print("Terminal: 5. Rename room: ", new_room_name)
    
    # def new_saved_room(self):
    #     #actions
    #     self.get_room_id()
    #     print("Terminal: 6. New saved room")
    
    # def get_all_saved_room(self):
    #     #output
    #     print("Terminal: 7. Get all saved room")
    #     self.room_controller.get_all_saved_rooms()
    
    # def set_name(self, new_user_name):
    #     #input
    #     print("Terminal: 8. Set new user name: ", new_user_name)
    
class Browser():
    def __init__(self, pt, method):
        self.platform = pt
        self.connect_method = method
        print("In BROWSER init:")
        print("\tPlatform: ", self.platform)
        print("\tConnect method: ", self.connect_method)
        
    @property
    def platform(self):
        return self._platform
        
    @platform.setter
    def platform(self, pt):
        self._platform = pt
        
    @property
    def connect_method(self):
        return self._connect_method
        
    @connect_method.setter
    def connect_method(self, method):
        self._connect_method = method
        
    def open_url(self, url):
        #action
        print(f'Browser: 1. Open URL: {url}')
    
class Room_Controller():
    def __init__(self, db_module):
      self.db_module_instance = db_module
      print("In ROOM CONTROLLER init: ", db_module.db_name)
      
    @property
    def db_module_instance(self):
          return self._db_module_instance
          
    @db_module_instance.setter
    def db_module_instance(self, db_module):
        self._db_module_instance = db_module
        
    def create_link(self, room_name):
        #output
        print("Room Contrl: 1. Create link for room.")
        link = f'https://www.videoconference.ua/{room_name}/{str(uuid.uuid4())}'
        return link
    
    def create_room(self, room_name):
        #action -> output
        room_link = self.create_link(room_name)
        self.db_module_instance.new_room(room_name, room_link)
        print(f'Room Contrl: 2. Create new room: {room_name} ({room_link}).')
        return room_link
    
    def delete_room(self, room_name):
        print(f'Room Contrl: 3. Delete room {room_name}.')
    
    def rename_room(self, new_name):
        print(f'Room Contrl: 4. Rename room: {new_name}.')
    
    def get_room(self, room_name):
        #output
        print("Room Contrl: 5. Get room.")
        room_link = ''
        return room_link
        
    def save_room(self, room_name):
        print(f'Room Contrl: 6. Save existing room {room_name}.')
    
    def delete_saved_room(self, room_name):
        print('Room Contrl: 7. Delete room from list of saved rooms.')
    
    def get_all_saved_rooms(self):
        print('Room Contrl: 8. Get all saved rooms.')
        sql = ''
        
    def __str__(self):
        return f'Room Controller for DB: {self.db_module_instance.db_name}'
    
class User_Admin():
    def __init__(self, db_module):
        self.db_module_instance = db_module
        print("In USER ADMIN init: ", self.db_module_instance.db_name)
      
    @property
    def db_module_instance(self):
          return self._db_module_instance
          
    @db_module_instance.setter
    def db_module_instance(self, db_module):
        self._db_module_instance = db_module
    
    def new_user(self, name='NULL'):
        print('User Admin: 1. Create new user.')
    
    def set_user_name(self, new_name):
        print('User Admin: 2. Set user name/Rename user.')
    
    def __str__(self):
        return f'User Administrator for DB: {self.db_module_instance.db_name}'
    
class DB_Module():
    def __init__(self, db_name):
        self.db_name = db_name
        mydb = mysql.connector.connect(
            host='localhost',
            user='root',
            password='password123',
            database=self.db_name
        )
        self._cursor = mydb.cursor()


    @property
    def db_name(self):
        return self._db_name
        
    @db_name.setter
    def db_name(self, db_name):
        self._db_name = db_name
        
    def new_room(self, name, link):
        print('DB Module: 1. Create new room')
        sql = 'INSERT INTO ROOM (name, link) VALUES (%s, %s)'
        val = (name, link)
        self._cursor.execute(sql, val)
    
    def delete_room(self):
        ID = self.get_room_id()
        print('DB Module: 2. Erase room from DB.')
    
    def rename_room(self):
        ID = self.get_room_id()
        print('DB Module: 3. Rename room.')
    
    def create_saved_room(self):
        #action
        user_id = self.get_user_id()
        room_id = self.get_room_id()
        sql = 'INSERT INTO SAVED_ROOM (user_id, room_id) VALUES (%s, %s)'
        val = (user_id, room_id)
        self._cursor.execute(sql, val)
        print("DB Module: 4. Create new record with saved room")
        print(user_id, room_id)
    
    def get_room_id(self):
        #output
        print("DB Module: 5. Get room ID")
    
    def rename_saved_room(self, new_room_name):
        #input -> action
        ID = self.get_room_id()
        print("DB Module: 6. Rename saved room: ", new_room_name)
    
    def remove_saved_room(self):
        #action
        ID = self.get_room_id()
        print("DB Module: 7. Erase saved room from DB.")
        
    def new_user(self, name='NULL'):
        print('DB Module: 8. Create new user')
        sql = 'INSERT INTO USER (name) VALUES (%s)'
        val = (name)
        self._cursor.execute(sql, val)
    
    def get_user_id(self):
        #output
        print("DB Module: 9. Get user ID")

    def use_cursor(self, sql, val):
        self._cursor.execute(sql, val)
    
class NoSuchRoomException(Exception):
    pass


def main():
    new_db_module = DB_Module("videoconference")
    new_room_controller = Room_Controller(new_db_module)
    new_user_admin = User_Admin(new_db_module)
    new_browser = Browser("windows", "UDP")
    new_terminal = Terminal(new_room_controller, new_user_admin, new_browser)
    print("\n----DataBase Module----\n")
    # new_db_module.new_room('RoomN', 'link')
    # new_db_module.delete_room()
    # new_db_module.rename_room()
    # new_db_module.create_saved_room()
    # new_db_module.get_room_id()
    # new_db_module.rename_saved_room("RoomN")
    # new_db_module.remove_saved_room()
    # new_db_module.new_user('NULL')
    # new_db_module.get_user_id()
    print("\n----Terminal----\n")
    # new_terminal.create_room('RoomN')
    # new_terminal.connect_to_room('URL')
    # new_terminal.get_room_id()
    # new_terminal.remove_room()
    # new_terminal.rename_room("room1")
    # new_terminal.new_saved_room()
    new_terminal.get_all_saved_room()
    # new_terminal.set_name("new_user_name")
    print("\n----Room Controller----\n")
    # new_room_controller.create_room('room1')
    # new_room_controller.get_room()
    # new_room_controller.delete_room()
    # new_room_controller.rename_room('room2')
    # new_room_controller.get_room()
    # new_room_controller.save_room()
    # new_room_controller.delete_saved_room()
    # new_room_controller.get_all_saved_rooms()
    print("\n----User Administrator----\n")
    # new_user_admin.new_user('new_user')
    # new_user_admin.set_user_name('new_user_name')
    # print("\n----Browser----\n")
    # print('\n----Exceptions----\n')
    # new_terminal.e_no_room()


if __name__ == "__main__":
    main()