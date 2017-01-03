# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys

URL_LOGIN = 'https://unipop.yzu.edu.tw/PortalSocialVB/Login.aspx'

portalx_headers = {
    'Host':'unipop.yzu.edu.tw',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0',
    'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
}

class PortalException(Exception):
    def __init__(self, code, status, err):
        self.code = code
        self.status = status
        self.err = err

    def __repr__(self):
        return 'PortalException(' + str(self.code) +'):' + str(self.status)

    def __str__(self):
        return 'PortalException(' + str(self.code) +'):' + str(self.status) + '\n' + str(self.err)

class loginPortal:
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.request = requests.Session()
        self.login()

    def login(self):
        content = BeautifulSoup(self.request.post(URL_LOGIN).text, 'lxml')

        postdata = {
            '__VIEWSTATE': content.find('input', id='__VIEWSTATE')['value'],
            '__VIEWSTATEGENERATOR': content.find('input', id='__VIEWSTATEGENERATOR')['value'],
            '__EVENTVALIDATION': content.find('input', id='__EVENTVALIDATION')['value'],
            'Txt_UserID': self.username,
            'Txt_Password': self.password,
            'ibnSubmit':'\xE7\x99\xBB\xE5\x85\xA5'
        }
        content = self.request.post(URL_LOGIN, data=postdata, verify=False)

        if re.findall(u'Login Failed！登入失敗！', content.text, re.S):
            raise PortalException(400, 'Login Failed', 'Username/Password incorrect.')
        else:
            return True
