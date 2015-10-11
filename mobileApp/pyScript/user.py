import sys
import json
import requests
from bs4 import BeautifulSoup
import re

r = requests.Session()
argv = sys.argv

URL_LOGIN = 'https://portalx.yzu.edu.tw/PortalSocialVB/Login.aspx'

class User:
    def __init__(self, username, password):
        self.message = {}
        content = r.post(URL_LOGIN).text
        ecoVIEWSTATEGENERATOR = re.findall('id="__VIEWSTATEGENERATOR" value="([^"]*)"', content, re.S)
        ecoVIEWSTATE = re.findall('__VIEWSTATE" id="__VIEWSTATE" value="([^"]*)"', content, re.S)[0]
        ecoEVENTVALIDATION = re.findall('__EVENTVALIDATION" id="__EVENTVALIDATION" value="([^"]*)"', content, re.S)[0]
        self.postdata={
                '__VIEWSTATE':ecoVIEWSTATE,
                '__VIEWSTATEGENERATOR':ecoEVENTVALIDATION,
                '__EVENTVALIDATION':ecoEVENTVALIDATION,
                'Txt_UserID':username,
                'Txt_Password':password,
                'ibnSubmit':'\xE7\x99\xBB\xE5\x85\xA5'
                }
        ##print self.postdata
        ### do login
        login_result = r.post(URL_LOGIN, data=self.postdata, verify=False)


        if len(re.findall('Login Failed',login_result.text)) > 0:
            self.message['status'] = {
                'state': 'error'
                'code': 1001,
                'message': 'Login Portal Failed'
            }
            print(json.dumps(self.message))
            sys.exit(0)


if len(argv) == 3:
    user = User(argv[1], argv[2])
