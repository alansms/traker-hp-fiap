# callback_server.py
from flask import Flask, request
app = Flask(__name__)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    return f"Received code: {code}", 200

if __name__ == '__main__':
    app.run(port=3000)
