# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys

URL_LOGIN = 'https://portalx.yzu.edu.tw/PortalSocialVB/Login.aspx'

class loginPortal:
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.messages = {}
        self.request = requests.Session()
        self.login()

    def login(self):
        try:
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
                self.messages['statusCode'] = 1001
                self.messages['status'] = 'Login failed.'
            else:
                self.messages['statusCode'] = 200
                self.messages['status'] = 'Login success.'

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
