# coding=UTF-8
import json, sys, time, os, threading
import threadpool
from login import loginPortal, PortalException
from course import Homework, News, Material

# config
THREAD_PRE_USER = {
    'AUTH': 50,
    'NM': 25, # for news & material
    'HOMEWORK': 25,
}

MAX_THREAD_NUM = 30

def authUser(packet):
    global lock, packets
    results = []
    console_log('authUser thread - ' + threading.current_thread().name)
    # do Auth
    for user in packet:
        instance = loginPortal(user['username'], user['password'])
        try:
            ar = {'user_uid': user['user_uid'], 'auth': instance.login()}
            results.append(ar)
        except PortalException as pe:
            console_log('login faild user: ' + str(user['user_uid']) + ', ' + user['username'])
            console_log(pe)
            results.append({'user_uid': user['user_uid'], 'auth': False})
        except Exception as e:
            console_log(threading.current_thread().name + ' somthing wrong during authUser: ')
            console_log('user: ' + str(user['user_uid']) + ', ' + user['username'])
            console_log(e)
            results.append({'user_uid': user['user_uid'], 'auth': False})
            # exception should be write to log
            pass

    # return auth result
    lock.acquire()
    for user in packets:
        for result in results:
            try:
                if user['user_uid'] == result['user_uid']:
                    user['auth'] = result['auth']
            except Exception as e:
                console_log(threading.current_thread().name + 'somthing wrong during merge auth result: ')
                console_log(e)
                # exception should be write to log
                pass
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
    userHW = []
    currentUser = ''
    currentLesson = ''
    for user in packets:
        loginInstance = loginPortal(user['username'], user['password'])
        try:
            currentUser = user['username']
            loginInstance.login()
            HWInstance = Homework(loginInstance.request)
            for lesson in user['lessons']:
                currentLesson = lesson['lesson_id']
                hwList = HWInstance.getHomeworkList(lesson)
                userHW = userHW + map(lambda el: {
                    'user_uid': user['user_uid'],
                    'lesson_id': lesson['lesson_id'],
                    'wk_id': el['wk_id'],
                    'grade': el['grade'],
                    'comment': el['comment'],
                    'uploadFile': el['uploadFile']
                }, hwList['homework'])
                homeworks.append({
                    'lesson_id': lesson['lesson_id'],
                    'hw': hwList['homework']
                })
        except Exception as e:
            console_log('fetchHomework - ' + threading.current_thread().name + ' somthing wrong: ')
            console_log(e)
            console_log('user - ' + currentUser + ', lesson - ' + str(currentLesson))
            pass

    lock.acquire()
    output['homework'] = output['homework'] + homeworks if 'homework' in output else list(homeworks)
    output['userHW'] = output['userHW'] + userHW if 'userHW' in output else list(userHW)
    lock.release()


def fetchMaterial(packets):
    global lock, output
    materials = []
    currentUser = ''
    currentLesson = ''
    for user in packets:
        loginInstance = loginPortal(user['username'], user['password'])
        try:
            currentUser = user['username']
            loginInstance.login()
            materialInstance = Material(loginInstance.request)
            for lesson in user['lessons']:
                currentLesson = lesson['lesson_id']
                mtr = materialInstance.getMaterialList(lesson)
                materials = materials + map(
                    lambda el: {
                        'lesson_id': lesson['lesson_id'],
                        'schedule': el['schedule'],
                        'lecture': el['lecture'],
                        'link': el['link'],
                        'outline': el['outline'],
                        'video': el['video'],
                        'date': el['date']
                    }, mtr['materials'])
        except Exception as e:
            console_log('fetchMaterials - ' + threading.current_thread().name + ' somthing wrong: ')
            console_log(e)
            console_log('user - ' + currentUser + ', lesson - ' + str(currentLesson))
            pass

    lock.acquire()
    output['material'] = output['material'] + materials if 'material' in output else list(materials)
    lock.release()

def fetchNews(packets):
    global lock, output
    news = []
    currentUser = ''
    currentLesson = ''
    for user in packets:
        loginInstance = loginPortal(user['username'], user['password'])
        try:
            currentUser = user['username']
            loginInstance.login()
            newsInstance = News(loginInstance.request)
            for lesson in user['lessons']:
                currentLesson = lesson['lesson_id']
                n = newsInstance.getNoticeList(lesson)
                news = news + map(
                    lambda el: {
                        'lesson_id': lesson['lesson_id'],
                        'portalId': el['portalId'],
                        'author': el['author'],
                        'subject': el['title'],
                        'content': el['content'],
                        'date': el['date'],
                        'attach': el['attach']
                    }, n['noticelist']
                )
        except PortalException as pe:
            if pe.code == 403:
                pass
        except Exception as e:
            console_log('fetchNews - ' + threading.current_thread().name + ' somthing wrong: ')
            console_log(e)
            console_log('user - ' + currentUser + ', lesson - ' + str(currentLesson))
            pass

    lock.acquire()
    output['news'] = output['news'] + news if 'news' in output else list(news)
    lock.release()

def console_log(msg):
    time.sleep(1)
    sys.stdout.write(str(msg))
    sys.stdout.flush()

if __name__ == '__main__':
    # Create Thread pool
    threadPool = threadpool.ThreadPool(MAX_THREAD_NUM)

    # saving output
    output = {}

    # read swap filename from input
    swap_filename = sys.argv[1]

    # loading data
    with open(swap_filename) as swap_packet:
        packets = json.load(swap_packet)
    os.remove(swap_filename)

    # Mutiple Thread
    lock = threading.Lock()

    console_log('Main thread is ' + threading.current_thread().name)

    ### Auth user
    threads = len(packets) / THREAD_PRE_USER['AUTH'] if len(packets) % THREAD_PRE_USER['AUTH'] == 0 else len(packets) / THREAD_PRE_USER['AUTH'] + 1

    # dispatch packet for each threads
    taskPacket = []
    for i in xrange(threads):
        taskPacket.append(packets[i * THREAD_PRE_USER['AUTH']: (i + 1) * THREAD_PRE_USER['AUTH']])

    # Request thread
    reqThreads = threadpool.makeRequests(authUser, taskPacket)
    [threadPool.putRequest(req) for req in reqThreads]
    console_log('Waiting for authUser.')
    threadPool.wait()
    console_log('authUser done.')

    # Remove auth failed
    try:
        output['invalid'] = map(lambda user: user['user_uid'], filter(lambda user: user['auth'] == False, packets))
        console_log('ouput invald done.')
        packets = filter(lambda user: user['auth'] == True, packets)
        console_log('packets filter done.')
    except Exception as e:
        console_log(threading.current_thread().name + ' something wrong duing remove auth failed user: ')
        console_log(e)

    # perpare taskPacket for news & material
    taskPacket = reduceUser(packets)

    # clear reqThreads
    reqThreads = []

    # dispatch Homework Task packet
    threads = len(packets) / THREAD_PRE_USER['HOMEWORK'] if len(packets) % THREAD_PRE_USER['HOMEWORK'] == 0 else len(packets) / THREAD_PRE_USER['HOMEWORK'] + 1
    HWTaskPackets = [packets[i * THREAD_PRE_USER['HOMEWORK']: (i + 1) * THREAD_PRE_USER['HOMEWORK']] for i in xrange(threads)]

    reqThreads = reqThreads + threadpool.makeRequests(fetchHomework, HWTaskPackets)


    # dispatch Material & News Task
    threads = len(taskPacket) / THREAD_PRE_USER['NM'] if len(taskPacket) % THREAD_PRE_USER['NM'] == 0 else len(taskPacket) / THREAD_PRE_USER['NM'] + 1
    taskPackets = [taskPacket[i * THREAD_PRE_USER['NM']: (i + 1) * THREAD_PRE_USER['NM']] for i in xrange(threads)]
    reqThreads = reqThreads + threadpool.makeRequests(fetchMaterial, taskPackets)
    reqThreads = reqThreads + threadpool.makeRequests(fetchNews, taskPackets)


    # Execute task
    [threadPool.putRequest(req) for req in reqThreads]
    console_log('Waiting for crawler.')
    threadPool.wait()
    threadPool.dismissWorkers(MAX_THREAD_NUM, do_join=True)
    console_log('crawler done.')

    # merge data & remove dupicate (for homework)
    output['homework'] = [el for el in output['homework'] if el not in output['homework'][output['homework'].index(el) + 1:]]
    output['homework'] = filter(lambda el: len(el['hw']) > 0, output['homework'])

    # reduce homework
    sub = []
    for el in output['homework']:
        for hw in el['hw']:
            sub.append({
                'lesson_id': el['lesson_id'],
                'wk_id': hw['wk_id'],
                'subject': hw['title'],
                'description': hw['description'],
                'schedule': hw['schedule'],
                'freeSubmit': hw['freeSubmit'],
                'attach': hw['attach'],
                'deadline': hw['deadline'],
                'isGroup': hw['isGroup']
            })

    output['homework'] = sub

    # Write output to file
    # print (json.dumps(output, indent = 4))
    with open(swap_filename, 'w') as swap_packet:
        json.dump(output, swap_packet)
