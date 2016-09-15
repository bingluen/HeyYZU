from login import loginPortal
from userData import UserData
from course import Course
from library import Library
import sys
import json
import requests

def terminal(messages):
    print json.dumps(messages)
    sys.exit()

argv = sys.argv
if len(argv) >= 4:
    try:
        if argv[1] == 'login':
            carrier = loginPortal(argv[2], argv[3])
        elif argv[1] == 'userdata':
            carrier = UserData(argv[2], argv[3])
            carrier.pipeline()
        elif argv[1] == 'courseHistory':
            carrier = UserData(argv[2], argv[3])
            carrier.pipeline('courseHistory')
        elif argv[1] == 'course':
            carrier = Course(argv[2], argv[3])
            carrier.pipeline(argv[4], argv[5])
        elif argv[1] == 'library':
            carrier = Library(argv[2], argv[3])
            carrier.pipeline(argv[4], argv[5] if len(argv) > 5 else None)

    except requests.exceptions.ConnectionError:
        carrier.messages['statusCode'] = 3001
        carrier.messages['status'] = 'Cna\'t connect portal server'

    except requests.exceptions.HTTPError:
        carrier.messages['statusCode'] = 3002
        carrier.messages['status'] = 'HTTP error occure when connect portal server'

    except requests.exceptions.Timeout:
        carrier.messages['statusCode'] = 3003
        carrier.messages['status'] = 'Connect timeout'

    except Exception:
        carrier.messages['statusCode'] = 3004
        carrier.messages['status'] = 'Unexpected error'

    terminal(carrier.messages)
else:
    messages = {
        'statusCode': 3000,
        'status': 'Params illegal'
    }
    terminal(messages)
