from login import loginPortal
from userData import UserData
from course import Course
import sys
import json

def terminal(messages):
    print json.dumps(messages)
    sys.exit()

argv = sys.argv
if len(argv) >= 4:
    if argv[1] == 'login':
        carrier = loginPortal(argv[2], argv[3])
    if argv[1] == 'userdata':
        carrier = UserData(argv[2], argv[3])
        carrier.pipeline()
    if argv[1] == 'courseHistory':
        carrier = UserData(argv[2], argv[3])
        carrier.pipeline('courseHistory')
    if argv[1] == 'course':
        carrier = Course(argv[2], argv[3])
        if argv[5] == 'inline':
            carrier.pipeline(argv[4], 'inline', {'year': argv[6], 'semester': argv[7], 'courseCode': argv[8], 'class': argv[9]})
        elif argv[5] == 'infile':
            carrier.pipeline(argv[4], 'infile', argv[6])

    terminal(carrier.messages)
else:
    messages = {
        'statusCode': 502,
        'status': 'Params illegal'
    }
    terminal(messages)
