from login import loginPortal
from userData import UserData
import sys
import json

def terminal(messages):
    print json.dumps(messages)
    sys.exit()

argv = sys.argv
if len(argv) == 4:
    if argv[1] == 'login':
        carrier = loginPortal(argv[2], argv[3])
    if argv[1] == 'userdata':
        carrier = UserData(argv[2], argv[3])
        carrier.pipeline()
    if argv[1] == 'courseHistory':
        carrier = UserData(argv[2], argv[3])
        carrier.pipeline('courseHistory')

    terminal(carrier.messages)
else:
    messages = {
        'statusCode': 502,
        'status': 'Params illegal'
    }
    login.terminal(messages)
