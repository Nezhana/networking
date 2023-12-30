import argparse
import re

def command_parser():
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

def command_processor(args):
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
                    else:
                        raise ValueError('!!! Wrong command !!!')
                case 'connect':
                    print(f'Connect to {second_word}.')
                case _:
                    raise ValueError('!!! Wrong command !!!')
        case 3:
            match first_word:
                case 'create':
                    if second_word == 'room':
                        print(f'Create room {commands[2]}.', end=' ')
                    else:
                        raise ValueError('!!! Wrong command !!!')
                    if save_room:
                        print('Save room.')
                    if connect_to_room:
                        print('Connecting to room...')
                case 'delete':
                    if second_word == 'room':
                        print(f'Delete room {commands[2]}.')
                    else:
                        raise ValueError('!!! Wrong command !!!')
                case 'save':
                    if second_word == 'room':
                        print(f'Save room {commands[2]}.')
                    else:
                        raise ValueError('!!! Wrong command !!!')
                case 'change':
                    if second_word == 'username':
                        print(f'Change username on {commands[2]}.')
                    else:
                        raise ValueError('!!! Wrong command !!!')
                case 'erase':
                    if second_word == 'saved':
                        print(f'Delete room {commands[2]} from saved list.')
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


import mysql.connector

def main():
    link = 'http://192.168.1.109:8000/Room_1/'
    match = re.search(r'http://([\d.]+:\w+/)(\w+)/', link)
    print(match.group(1))

    mydb = mysql.connector.connect(
            host='localhost',
            user='root',
            password='ssql5030',
            database='videoconference'
        )
    cursor = mydb.cursor()
    roomID = 3
    sql = 'SELECT link FROM room WHERE Id = (%s)'
    cursor.execute(sql, (roomID,))
    myresult = cursor.fetchall()
    print(myresult[0][0])

if __name__ == "__main__":
    main()