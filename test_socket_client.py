import socket

HOST = 'localhost'
PORT = 8000
BUFFER = 1024

with socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM) as sock:
    sock.sendto(bytes('hello, world!', 'utf-8'), (HOST, PORT))
    data, addr = sock.recvfrom(BUFFER)

print('Received: ', data.decode("utf-8"))