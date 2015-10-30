# -*- coding: utf8 -*-
import sys
import json
import requests
import re
from pyquery import PyQuery as pq
from datetime import datetime as dt

URL_LOGIN = 'https://portalx.yzu.edu.tw/PortalSocialVB/Login.aspx'
URL_PROFILE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/ClickMenuLog.aspx?type=App_&SysCode=P1'
URL_BASICDATA = 'https://portal.yzu.edu.tw/personal/StudentBasic/BasicData.aspx'
URL_IFRAMESUB = 'https://portalx.yzu.edu.tw/PortalSocialVB/IFrameSub.aspx'

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
    #sys.stdout.write( message )
    print( message )

class User:
    def __init__(self, username, password):
        self.message = {}
        self.username = username
        self.password = password
        self.session  = requests.Session()
        self.session.headers.update(portalx_headers)
        self.login()

    def login(self):
        #1st request(get info)
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
            self.message['profile'] = {
                'portalUsername': self.username,
                'portalPassword': self.password
            }
        else:
            self.message['status'] = {
                'state': 'loginSuccess',
                'statusCode': 1001,
                'message': 'Login Portal Success'
            }


    def getProfile(self):
        if(self.message['status']['statusCode'] == 1001):
            #1st request(to Profile Page)
            self.session.get(URL_PROFILE)
            #2nd request(get SessionID)
            d = pq( self.session.get(URL_IFRAMESUB).text )
            self.sessionID = d("#SessionID").attr('value')

            #3rd request(get Basic Data)
            postdata = {
                'Account': self.username,
                'SessionID': self.sessionID
            }
            self.session.headers.update(portal_headers)
            profile_result = self.session.post(URL_BASICDATA, data=postdata).text

            #Fetch Data
            d = pq( profile_result )
            self.chiName = d("#ctl00_ContentPlaceHolder_MainEdit_Cell_ChiName").text()
            self.engName = d("#ctl00_ContentPlaceHolder_MainEdit_Txt_EngName").attr('value')
            self.sex = d("#ctl00_ContentPlaceHolder_MainEdit_Cell_Sex").text()
            self.birth = d("#ctl00_ContentPlaceHolder_MainEdit_Cell_Birth").text()
            #For python 3
            """
            self.birth = self.birth.replace(self.birth[0:2], str(int(self.birth[0:2])+ 1911))
            self.birth = dt.strptime(self.birth, u'%Y年%m月%d日').strftime('%Y-%m-%d')
            """
            #For python 2
            self.birth = re.sub(ur'\u65e5', '', re.sub(ur'\u5e74|\u6708', '-', self.birth.replace(self.birth[0:2], str(int(self.birth[0:2])+ 1911))))
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


argv = sys.argv

if len(argv) == 4:
    try:

        method = argv[1]
        user = User(argv[2], argv[3])

        if(method == 'getProfile'):
            user.getProfile()
        elif(method == 'login'):
            stdardOut( json.dumps(user.message) )
        else:
            raise Exception('No such method : ' + method)
    except Exception as e:
        print ('error:', e)

else:
    print('No action specified.')
    sys.exit()
