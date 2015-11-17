# -*- coding: utf8 -*-
import sys
import json
import requests
import re
from pyquery import PyQuery as pq
from datetime import datetime as dt

URL_LOGIN = 'https://portalx.yzu.edu.tw/PortalSocialVB/Login.aspx'
URL_DEFAULT = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/DefaultPage.aspx?Menu=Default&LogExcute=Y'
URL_PROFILE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/ClickMenuLog.aspx?type=App_&SysCode=P1'
URL_LEARNING = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/ClickMenuLog.aspx?type=App_&SysCode=S1'
URL_BASICDATA = 'https://portal.yzu.edu.tw/personal/StudentBasic/BasicData.aspx'
URL_IFRAMESUB = 'https://portalx.yzu.edu.tw/PortalSocialVB/IFrameSub.aspx'
URL_PORTAL = 'https://portal.yzu.edu.tw/VC2/Student/StudentVc.aspx'
URL_NICKNAME = 'https://portal.yzu.edu.tw/VC2/FFB_Login.aspx?sys=Nickname'
URL_LEARNING_CONTENT = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PageByDuty.aspx?DutyType=std'
URL_BOOK50 = 'https://portal.yzu.edu.tw/VC2/Student/Book50/StdGetPoint.aspx'
URL_SERVICE_MAIN = 'https://portal.yzu.edu.tw/Ser_learn/stdserv_std/ser_std_main_Login.asp'
URL_SERVICE = 'https://portal.yzu.edu.tw/Ser_learn/stdserv_std/ser_std_recdata.asp'


#Status Code:
#1001   Login success
#1002   Login fail

portalx_headers = {
    'Host':'portalx.yzu.edu.tw',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0',
    'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
}

portal_headers = {
    'Host':'portal.yzu.edu.tw',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0',
    'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
}

def stdardOut(message):
    print ( message )

class User:
    def __init__(self, username, password):
        self.message = {}
        self.username = username
        self.password = password
        self.session  = requests.Session()
        self.login()

    def login(self):
        #1st request(get cookies)
        d = pq( self.session.get(URL_LOGIN).text )
        VIEWSTATE = d("#__VIEWSTATE").attr('value')
        EVENTVALIDATION = d("#__EVENTVALIDATION").attr('value')

        #2nd request(login)
        postdata = {
            'Txt_UserID': self.username,
            'Txt_Password': self.password,
            '__VIEWSTATE': VIEWSTATE,
            '__EVENTVALIDATION': EVENTVALIDATION,
            'ibnSubmit': u'登入'
        }
        login_result = self.session.post(URL_LOGIN, data=postdata, verify=False).text

        if 'Login Failed' in login_result:
            self.message['status'] = {
                'state': 'loginFail',
                'statusCode': 1002,
                'message': 'Login Portal Failed'
            }
        else:
            self.message['status'] = {
                'state': 'loginSuccess',
                'statusCode': 1001,
                'message': 'Login Portal Success'
            }
    def verifyAccount(self):
        stdardOut( json.dumps(self.message) )

    def loginOld(self):
        #Get old portal sessionID
        self.session.headers.update(portal_headers)
        self.session.post(URL_NICKNAME, data=self.sessionData)

    def getMyProfile(self):
        if(self.message['status']['statusCode'] == 1001):
            #1st request(to Profile Page)
            self.session.headers.update(portalx_headers)
            self.session.get(URL_PROFILE)
            #2nd request(get SessionID)
            d = pq( self.session.get(URL_IFRAMESUB).text )
            self.sessionID = d("#SessionID").attr('value')

            #3rd request(get Basic Data)
            self.sessionData = {
                'Account': self.username,
                'SessionID': self.sessionID
            }
            self.session.headers.update(portal_headers)
            profile_result = self.session.post(URL_BASICDATA, data=self.sessionData).text

            #Fetch Data
            d = pq( profile_result )
            self.chiName = d("#ctl00_ContentPlaceHolder_MainEdit_Cell_ChiName").text()
            self.engName = d("#ctl00_ContentPlaceHolder_MainEdit_Txt_EngName").attr('value')
            self.sex = d("#ctl00_ContentPlaceHolder_MainEdit_Cell_Sex").text()
            birth = re.split( u'年|月|日',d("#ctl00_ContentPlaceHolder_MainEdit_Cell_Birth").text() )
            birth[0] = str(int(birth[0])+1911)

            self.birth = '-'.join(birth[:3])
            self.cellphone = d("#ctl00_ContentPlaceHolder_MainEdit_Txt_CellPhone").attr('value')
            self.mail = d("#ctl00_ContentPlaceHolder_MainEdit_Txt_OtherMail").attr('value')

            self.message['profile'] = {
                'portalUsername': self.username,
                'portalPassword': self.password,
                'chiName': self.chiName,
                'engName': self.engName,
                'gender': self.sex,
                'birth': self.birth,
                'cellphone': self.cellphone,
                'email': self.mail
            }

        #Output
        stdardOut( json.dumps(self.message) )

    def getMyCourse(self):
        if(self.message['status']['statusCode'] == 1001):
            #1st request(to Course Page)
            self.session.headers.update(portalx_headers)
            self.session.get(URL_LEARNING)
            #2nd request(get Courses)
            d = pq( self.session.get(URL_LEARNING_CONTENT).text )
            allTableRow = d(".table_1").find("tr").not_(".title_line").items()
            self.message['course'] = {}

            for index, tr in enumerate(allTableRow):
                #print tr.text()
                content = [i.text() for i in tr.items("td")]
                time = re.findall('([0-9]+)\(', content[5])
                location = re.findall('\(([0-9A-Z]+)\)', content[5])

                self.message['course'][index] = {
                    'year': content[0],
                    'semester': content[1],
                    'courseID': content[2],
                    'class': content[3],
                    'name': content[4],
                    'time': ','.join(time),
                    'location': ','.join(location),
                }
        #Output
        stdardOut( json.dumps(self.message['course']) )

    def getMyBook50(self):
        self.loginOld()
        d = pq(self.session.get(URL_BOOK50).text)

        allTableRow = d(".table_1").find("tr").not_(".title_line").items()
        self.message['book50'] = {}

        totalPoints = 0
        for index, tr in enumerate(allTableRow):
            #print tr.text()
            content = [i.text() for i in tr.items("td")]

            self.message['book50'][index] = {
                'semester': content[0],
                'time': content[1],
                'teacher': content[2],
                'book': content[3],
                'type': content[4],
                'points': content[5],
                'notes': content[6]
            }
            totalPoints += int(content[5])

        self.message['book50']['totalPoints'] = totalPoints
        #Output
        stdardOut( json.dumps(self.message['book50']) )

    def getMyService(self):
        self.loginOld()
        self.session.get(URL_SERVICE_MAIN + '?uid=' + self.username + '&sidNET=' + self.sessionID)
        #convert big5 to utf8
        d = pq( self.session.get(URL_SERVICE).text.encode('latin1', 'ignore').decode('big5') )

        teach, activity = map(int, re.findall('[0-9]+', d("font").eq(10).text()) )
        self.message['service'] = {
            'teach' : teach,
            'activity' : activity
        }
        #Output
        stdardOut( json.dumps(self.message['service']) )

    def getMyToDo(self):
        if(self.message['status']['statusCode'] == 1001):
            #1st request(to Default Page)
            self.session.headers.update(portalx_headers)
            d = pq( self.session.get(URL_DEFAULT).text )
            #Fetch Data
            allToDo = d("#divTasks").find("a").items()

            ToDoList = []
            for index, todo in enumerate(allToDo):
                lastDays = re.findall('[0-9]+', todo.next().text())[0]
                type = re.findall(u'【(.*)】', todo.text())[0]
                course = re.findall('\[(.*)\]', todo.text())[0]
                task = re.findall('\](.+)', todo.text())[0]
                ToDoList.append((lastDays, type, course, task))

            #Order by lastDays
            ToDoList = sorted(ToDoList, key=lambda x:int(x[0]))

            self.message['todo'] = {}
            for index, todo in enumerate(ToDoList):
                self.message['todo'][index]={
                    'lastDays':todo[0],
                    'type':todo[1],
                    'course':todo[2],
                    'task':todo[3]
                }
        #Output
        stdardOut( json.dumps(self.message['todo']) )


argv = sys.argv

if len(argv) == 4:
    try:
        method = argv[1]
        user = User(argv[2], argv[3])
        if(method == 'login'): user.verifyAccount()
        elif(method == 'getProfile'):   user.getMyProfile()
        elif(method == 'getCourse'):  user.getMyCourse()
        elif(method == 'getBook50'):  user.getMyBook50()
        elif(method == 'getService'): user.getMyService()
        elif(method == 'getToDo'):    user.getMyToDo()
        else:
            raise Exception('No such method : ' + method)
    except Exception,e:
        print 'error:', e

else:
    print('No action specified.')
    sys.exit()
