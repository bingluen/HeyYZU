# coding=UTF-8
import json, sys, threading, time, os
from login import loginPortal
from

# config
THREAD_PRE_USER = {
    'AUTH': 50,
    'NEWS': 25,
    'HOMEWORK': 25,
    'MATERIAL': 25
}

def authUser(packet):
    global lock, packets
    results = []

    # do Auth
    for user in packet:
        instance = loginPortal(user['username'], user['password'])
        try:
            results.append({'user_uid': user['user_uid'], 'auth': instance.login()})
        except PortalException:
            results.append({'user_uid': user['user_uid'], 'auth': False})
        except Exception as e:
            results.append({'user_uid': user['user_uid'], 'auth': False})
            # exception should be write to log

    # return auth result
    lock.acquire()
    try:
        for user in packets:
            for result in results:
                if (user['user_uid'] == result['user_uid']):
                    user['auth'] = result['auth']
    except Exception as e:
        # exception should be write to log
        lock.release()

    lock.release()


def reduceUser(packets):
    # Min Set Cover Problem

    # Create Lesson Set
    lessonSet = []

    for user in packets:
        for lesson in user['lessons']:
            if lesson['lesson_id'] not in lessonSet:
                lessonSet.append(lesson['lesson_id'])

    # Select User
    newPacket = list(packets)
    taskPacket = []
    while lessonSet: # lesson set not empty

        # sort by number of lesson of user
        newPacket.sort(key=lambda user: len(user['lessons']))

        # Pick the user which max number of lesson
        picker = newPacket.pop(0)

        # append to taskPacket
        taskPacket.append(picker)

        # Remove lesson which picker include from lessonSet
        for lesson in picker['lessons']:
            lessonSet = filter(lambda candidate: candidate !=  lesson['lesson_id'], lessonSet)

        # Remove lesson which picker include from all user
        for user in newPacket:
            user['lessons'] = filter(lambda lesson: lesson['lesson_id'] in lessonSet, user['lessons'])
            # if user' lesson is empty, remove it.
            if len(user['lessons']) == 0:
                newPacket.pop(newPacket.index(user))

    return taskPacket

def fetchHomework(packets):
    global lock, output
    homeworks = []

def fetchMaterial(packets):
    global lock, output
    materials = []

def fetchNew(packets):
    global lock, output
    news = []


if __name__ == '__main__':
    # saving output
    output = {}

    # read swap filename from input
    swap_filename = sys.argv[1]

    # loading data
    with open(swap_filename) as swap_packet:
        packets = json.load(swap_packet)
    #os.remove(swap_filename)

    # Mutiple Thread
    lock = threading.Lock()

    # Auth user
    threads = len(packets) / THREAD_PRE_USER['AUTH'] if len(packets) % THREAD_PRE_USER['AUTH'] == 0 else len(packets) / THREAD_PRE_USER['AUTH'] + 1
    taskThreads = []
    for i in xrange(threads):
        task = threading.Thread(target = authUser, kwargs = {'packet': packets[i * THREAD_PRE_USER['AUTH']: (i + 1) * THREAD_PRE_USER['AUTH']]}, name =  'thread-'  + str(i))
        task.start()
        time.sleep(1) # Waiting Thread
        taskThreads.append(task)

    for thread in taskThreads:
        thread.join()

    # Remove auth failed
    output['invalid'] = map(lambda user: user['user_uid'], filter(lambda user: user['auth'] == False, packets))
    packets = filter(lambda user: user['auth'] == True, packets)

    # perpare taskPacket for news & material
    taskPacket = reduceUser(packets)

    # Clear taskThreads
    taskThreads = []

    # Assign Homework Task
    threads = len(packets) / THREAD_PRE_USER['HOMEWORK'] if len(packets) % THREAD_PRE_USER['HOMEWORK'] == 0 else len(packets) / THREAD_PRE_USER['HOMEWORK'] + 1
    for i in xrange(threads):
        task = threading.Thread(target = fetchHomework, kwargs = {'packet': packets[i * THREAD_PRE_USER['HOMEWORK']: (i + 1) * THREAD_PRE_USER['HOMEWORK']]}, name =  'thread-homework-'  + str(i))
        task.star()
        time.sleep(1)
        taskThreads.append(task)

    # Assign Material Task
    threads = len(taskPacket) / THREAD_PRE_USER['MATERIAL'] if len(taskPacket) % THREAD_PRE_USER['MATERIAL'] == 0 else len(taskPacket) / THREAD_PRE_USER['MATERIAL'] + 1
    for i in xrange(threads):
        task = threading.Thread(target = fetchMaterial, kwargs = {'packet': packets[i * THREAD_PRE_USER['MATERIAL']: (i + 1) * THREAD_PRE_USER['MATERIAL']]}, name =  'thread-material-'  + str(i))
        task.star()
        time.sleep(1)
        taskThreads.append(task)

    # Assign News Task
    threads = len(taskPacket) / THREAD_PRE_USER['NEWS'] if len(taskPacket) % THREAD_PRE_USER['NEWS'] == 0 else len(taskPacket) / THREAD_PRE_USER['NEWS'] + 1
    for i in xrange(threads):
        task = threading.Thread(target = fetchNew, kwargs = {'packet': packets[i * THREAD_PRE_USER['NEWS']: (i + 1) * THREAD_PRE_USER['NEWS']]}, name =  'thread-news-'  + str(i))
        task.star()
        time.sleep(1)
        taskThreads.append(task)

    # Waiting
    for thread in taskThreads:
        thread.join()

    # Write output to file
    with open(swap_filename, 'w') as swap_packet:
        json.dump(output, swap_packet)
