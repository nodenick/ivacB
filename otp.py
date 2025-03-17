import json
import socket
from flask import Flask, request, jsonify
from threading import Thread, Lock

app = Flask(__name__)
latest_data = None  # Store the latest data
data_sent = False  # Track if the latest data has been sent
lock = Lock()  # Thread-safe handling


def socket_server():
    """Socket server that listens for connections and sends only new data."""
    global data_sent
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    host = '127.0.0.1'
    port = 9000
    server_socket.bind((host, port))
    server_socket.listen(5)
    print(f"Socket server listening on {host}:{port}")

    while True:
        client_socket, addr = server_socket.accept()
        print(f"Connected to client: {addr}")

        with lock:
            if latest_data and not data_sent:
                try:
                    # Add a newline character at the end for proper message termination
                    message = json.dumps(latest_data) + "\n"
                    client_socket.send(message.encode('utf-8'))
                    print(f"Sent data to client: {latest_data}")
                    data_sent = True  # Mark as sent

                    # Wait for acknowledgment from client
                    try:
                        client_socket.settimeout(5)
                        response = client_socket.recv(4096)
                        print(
                            f"Client response: {response.decode('utf-8').strip()}")
                    except socket.timeout:
                        print("No response from client (timeout)")

                except Exception as e:
                    print(f"Error sending data: {e}")

        client_socket.close()


@app.route('/api', methods=['POST'])
def api():
    """API to receive JSON data and store it."""
    global latest_data, data_sent

    data = request.get_json()

    # Verify the data has the required fields
    if 'mobile_no' not in data or 'otp' not in data:
        return jsonify({"error": "Missing required fields 'mobile_no' or 'otp'"}), 400

    with lock:
        latest_data = data
        data_sent = False  # Mark as unsent so the listener can receive it

    print(f"New OTP received: {data['mobile_no']}: {data['otp']}")
    return jsonify({"message": "New data received", "data": latest_data})


# import json
# import socket
# from flask import Flask, request, jsonify
# from threading import Thread, Lock

# app = Flask(__name__)

# latest_data = None  # Store the latest data
# data_sent = False  # Track if the latest data has been sent
# lock = Lock()  # Thread-safe handling


# def socket_server():
#     """Socket server that listens for connections and sends only new data."""
#     global data_sent

#     server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#     server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

#     host = '127.0.0.1'
#     port = 9000

#     server_socket.bind((host, port))
#     server_socket.listen(5)
#     print(f"Socket server listening on {host}:{port}")

#     while True:
#         client_socket, addr = server_socket.accept()
#         print(f"Connected to client: {addr}")

#         with lock:
#             if latest_data and not data_sent:
#                 try:
#                     client_socket.send(json.dumps(latest_data).encode())
#                     data_sent = True  # Mark as sent
#                 except Exception as e:
#                     print(f"Error sending data: {e}")

#         client_socket.close()


# @app.route('/api', methods=['POST'])
# def api():
#     """API to receive JSON data and store it."""
#     global latest_data, data_sent

#     with lock:
#         latest_data = request.get_json()
#         data_sent = False  # Mark as unsent so the listener can receive it

#     return jsonify({"message": "New data received", "data": latest_data})


if __name__ == '__main__':
    # Start socket server in a separate thread
    socket_thread = Thread(target=socket_server, daemon=True)
    socket_thread.start()

    # Start socket listener in a separate thread

    # Run Flask app
    app.run(debug=False, use_reloader=False)
