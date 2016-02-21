# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys
from login import loginPortal

portalx_headers = {
    'Host':'portalx.yzu.edu.tw',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0',
    'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
}

URL_PROFILE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/ClickMenuLog.aspx?type=App_&SysCode=P1'
URL_IFRAMESUB = 'https://portalx.yzu.edu.tw/PortalSocialVB/IFrameSub.aspx'
URL_BASICDATA = 'https://portal.yzu.edu.tw/personal/StudentBasic/BasicData.aspx'
URL_HISTORY = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/ClickMenuLog.aspx?type=App_&SysCode=S1'


class UserData(loginPortal):
    def pipeline(self, identity = 'student'):
        if self.messages['statusCode'] != 200:
            return
        if identity == 'student':
            self.getStudentData()
        if identity == 'courseHistory':
            self.getCourseHistory()

    def getStudentData(self):
        try:
            self.request.get(URL_PROFILE).text

            content = BeautifulSoup(self.request.get(URL_IFRAMESUB).text, 'lxml')
            postdata = {
                'Account': self.username,
                'SessionID': content.find('input', id='SessionID')['value']
            }

            content = BeautifulSoup(self.request.get(URL_BASICDATA, data=postdata).text, 'lxml')
            birth = re.split( u'年|月|日', content.find(id='ctl00_ContentPlaceHolder_MainEdit_Cell_Birth').text)
            birth[0] = str(int(birth[0])+1911)
            self.messages['userdata'] = {
                'chiName': content.find(id='ctl00_ContentPlaceHolder_MainEdit_Cell_ChiName').text,
                'engName':content.find(id='ctl00_ContentPlaceHolder_MainEdit_Txt_EngName')['value'],
                'studentId': content.find(id='ctl00_ContentPlaceHolder_MainEdit_Cell_StdNo').text.replace(' ', ''),
                'studentType': content.find(id='ctl00_ContentPlaceHolder_MainEdit_Cell_StdType').text.replace(' ', ''),
                'booldType': content.find(id='ctl00_ContentPlaceHolder_MainEdit_Cell_BloodType').text.replace(' ', ''),
                'gender': 1 if content.find(id='ctl00_ContentPlaceHolder_MainEdit_Cell_Sex').text == u'男' else 0,
                'birth': '-'.join(birth[:3]),
                'phone': content.find(id='ctl00_ContentPlaceHolder_MainEdit_Txt_CellPhone')['value'],
                'email': content.find(id='ctl00_ContentPlaceHolder_MainEdit_Txt_OtherMail')['value'],
                'address': content.find(id='ctl00_ContentPlaceHolder_MainEdit_Cell_NomAddr').text

            }
            self.messages['status'] = 'get user data successful.'

        except requests.exceptions.ConnectionError:
            self.messages['statusCode'] = 401
            self.messages['status'] = 'Cna\'t connect portal server'
            return

        except requests.exceptions.HTTPError:
            self.messages['statusCode'] = 402
            self.messages['status'] = 'HTTP error occure when connect portal server'
            return

        except requests.exceptions.Timeout:
            self.messages['statusCode'] = 403
            self.messages['status'] = 'connect timeout'
            return

    def getCourseHistory(self):
        try:
            trs = BeautifulSoup(self.request.get(URL_HISTORY).text, 'lxml').find('div', id='divDutyCoursePage').find_all('tr')
            skip = True
            courseList = []
            for tds in trs:
                if skip:
                    skip = False
                    continue
                td = tds.find_all('td')
                courseList.append({
                    'year': re.findall('[0-9]{3}', td[0].text, re.S)[0],
                    'semester': re.findall('[0-9]{1}', td[1].text, re.S)[0],
                    'code': re.findall('[A-Za-z]{2}[0-9]{3}', td[2].text, re.S)[0],
                    'class': re.findall('[A-Za-z]{1}[0-9]?', td[3].text, re.S)[0]
                })

            self.messages['status'] = 'Get course history successful'
            self.messages['data'] = courseList
        except requests.exceptions.ConnectionError:
            self.messages['statusCode'] = 401
            self.messages['status'] = 'Cna\'t connect portal server'
            return

        except requests.exceptions.HTTPError:
            self.messages['statusCode'] = 402
            self.messages['status'] = 'HTTP error occure when connect portal server'
            return

        except requests.exceptions.Timeout:
            self.messages['statusCode'] = 403
            self.messages['status'] = 'connect timeout'
            return
