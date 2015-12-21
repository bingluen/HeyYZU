# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys
import json
import time

URL_LOGIN = 'https://portalx.yzu.edu.tw/PortalSocialVB/Login.aspx'
URL_PORTAL_HOMEPAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/DefaultPage.aspx?Menu=Default'
URL_PORTAL_POSTWALL = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx?Menu=Default&PageType=MA'
URL_PORTAL_POSTINNER = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx'

r = requests.Session()


def writeFile(filename, content):
    f = open(filename, 'w')
    f.write(content)
    f.close()

class catchNews:

    def __init__ (self, username, password):
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


        ### connect portal homepage after login (because set cookie)
        self.HomePageContent = r.get(URL_PORTAL_POSTWALL).text

        self.result = []

    def parser(self):
        content = BeautifulSoup(self.HomePageContent, 'lxml').find('div', id='divPostWall')
        pages = self.getPages(content.find(class_='divPageNum'))
        posts = content.find_all('table', cellspacing='0')

        for post in posts[1:len(posts)]:
            postContent = {}
            try:
                detail = post.find_all('td', class_='TDtitle')
                if len(re.findall(u'【(教材|作業)】', detail[2].text, re.S)) > 0:
                    continue
                postContent['pageId'] = re.findall('PageID=([0-9]+)', detail[1].a['href'], re.S)[0]
                postContent['title'] = re.sub(u'【.*】', '', detail[2].text)
                postContent['content'] = self.getNewsContent(re.findall('ShowPostGridUnique\(([0-9]+),1\)' ,detail[2].a['href'], re.S)[0])
                postContent['date'] = detail[4].text

            except:
                detail = post.find_all('td', class_='TDtitleB')
                if len(re.findall(u'【(教材|作業)】', detail[1].text, re.S)) > 0:
                    continue
                postContent['pageId'] = re.findall('PageID=([0-9]+)', detail[0].a['href'], re.S)[0]
                postContent['title'] = re.sub(u'【.*】', '', detail[1].text)
                postContent['content'] = self.getNewsContent(re.findall('ShowPostGridUnique\(([0-9]+),1\)' ,detail[1].a['href'], re.S)[0])
                postContent['date'] = post.find_all('td', class_='TDtitle')[2].text
            print(postContent)


    def getPages(self, content):
        navlist = content.find_all('a')
        print navlist[len(navlist) - 2].text

    def getNewsContent(self, uid):
        data = {
            'ParentPostID': uid,
            'pageShow': 1
        }
        content = r.post(URL_PORTAL_POSTINNER, data=data,  verify=False).text
        print content



start_time = time.time()

argv = sys.argv

if len(argv) >= 3:
    try:
        crawler = catchNews(argv[1], argv[2])
        crawler.parser()
    except Exception,e:
        print 'error:', e

else:
    print('No action specified.')
    sys.exit()

print("--- %s seconds ---" % (time.time() - start_time))
