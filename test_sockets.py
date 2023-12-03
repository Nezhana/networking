import socket

HOST = 'localhost'
PORT = 8000
BUFFER = 1024

with socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM) as sock:
    sock.bind((HOST, PORT))
    print("UDP server up and listening")
    while True:
        data, addr = sock.recvfrom(BUFFER)
        print(f'Connected: {addr}')
        if not data:
            break
        print(data, type(data))
        data = data.decode("utf-8").upper()
        sock.sendto(bytes(data, 'utf-8'), addr)

# def send(data, port=PORT, addr=HOST):
#         """send(data[, port[, addr]]) - multicasts a UDP datagram."""
#         # Create the socket
#         s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
#         # Make the socket multicast-aware, and set TTL.
#         s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 4) # Change TTL (=4) to suit
#         # Send the data
#         s.sendto(data, (addr, port))

# def recv(port=PORT, addr=HOST, buf_size=1024):
#         """recv([port[, addr[,buf_size]]]) - waits for a datagram and returns the data."""

#         # Create the socket
#         s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

#         # Set some options to make it multicast-friendly
#         s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
#         try:
#                 s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
#         except AttributeError:
#                 pass # Some systems don't support SO_REUSEPORT
#         s.setsockopt(socket.SOL_IP, socket.IP_MULTICAST_TTL, 20)
#         s.setsockopt(socket.SOL_IP, socket.IP_MULTICAST_LOOP, 1)

#         # Bind to the port
#         s.bind(('', port))

#         # Set some more multicast options
#         intf = socket.gethostbyname(socket.gethostname())
#         s.setsockopt(socket.SOL_IP, socket.IP_MULTICAST_IF, socket.inet_aton(intf))
#         s.setsockopt(socket.SOL_IP, socket.IP_ADD_MEMBERSHIP, socket.inet_aton(addr) + socket.inet_aton(intf))

#         # Receive the data, then unregister multicast receive membership, then close the port
#         data, sender_addr = s.recvfrom(buf_size)
#         s.setsockopt(socket.SOL_IP, socket.IP_DROP_MEMBERSHIP, socket.inet_aton(addr) + socket.inet_aton('0.0.0.0'))
#         s.close()
#         return data