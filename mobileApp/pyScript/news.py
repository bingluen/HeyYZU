# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys
import json
import time
import HTMLParser

URL_LOGIN = 'https://portalx.yzu.edu.tw/PortalSocialVB/Login.aspx'
URL_PORTAL_HOMEPAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/DefaultPage.aspx?Menu=Default'
URL_PORTAL_POSTWALL = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx?Menu=Default&PageType=MA'
URL_PORTAL_POSTINNER = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx/divParentInnerHtml'
URL_PORTAL_GETPOSTWALL = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx/GetPostWall'
URL_PORTAL_POSTATTACH = 'https://portalx.yzu.edu.tw/PortalSocialVB/DownloadFile.aspx?'

r = requests.Session()

portalx_headers = {
    'Host':'portalx.yzu.edu.tw',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0',
    'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
}

html_parser = HTMLParser.HTMLParser()

def stdardOut(message):
    print ( message )

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
        self.message = {}
        ### do login
        login_result = r.post(URL_LOGIN, data=self.postdata, verify=False)

        if 'Login Failed' in login_result:
            self.message['status'] = {
                'state': 'loginFail',
                'statusCode': 1002,
                'message': 'Login Portal Failed'
            }
            standOut (json.dumps(self.message))
            sys.exit()
        else:
            self.message['status'] = {
                'state': 'loginSuccess',
                'statusCode': 1001,
                'message': 'Login Portal Success'
            }
            self.message['result'] = []

        ### connect portal homepage after login (because set cookie)
        if(self.message['status']['statusCode'] == 1001):
            r.headers.update(portalx_headers)
            self.HomePageContent = r.get(URL_PORTAL_POSTWALL).text

    def catch(self):
        ## page = 1
        content = BeautifulSoup(self.HomePageContent, 'lxml').find('div', id='divPostWall')
        posts = content.find_all(class_='PanelPost')
        pages = self.getPages(content.find(class_='divPageNum'))
        self.message['result'] = self.message['result'] + self.parser(posts)

        # page > 1
        for i in range(2, pages+1):
            self.message['result'] = self.message['result'] + self.parser(self.getNextPageWall(i))
            ##print self.getNextPageWall(i),'\n\n'

        stdardOut(json.dumps(self.message))

    def parser(self, posts):
        postList = []
        for post in posts:
            detail = post.find_all('td')
            if len(re.findall(u'【(教材|作業)】', detail[2].text, re.S)) > 0:
                continue
            postContent = {}
            try:
                postContent['portalId'] = re.findall('ShowPostGridUnique\(([0-9]+),1\)' ,detail[2].a['href'], re.S)[0]
                postContent['pageId'] = re.findall('PageID=([0-9]+)', detail[1].a['href'], re.S)[0]
                postContent['author'] = post.find('img', class_='imgPostAuthor')['title']
                postContent['title'] = re.sub(u'【.*】|\([0-9]{4}_[A-Z]{2}[0-9]{3}_[A-Z]\)', '', detail[2].text)
                postContent['date'] = detail[4].text
                postContent['content'] = self.getNewsContent(re.findall('ShowPostGridUnique\(([0-9]+),1\)' ,detail[2].a['href'], re.S)[0])
                postContent['attach'] = self.parseAttach()
                postList.append(postContent)
            except Exception,e:
                print 'error',e
                #print(post)
        return postList

    def getPages(self, content):
        navlist = content.find_all('a')
        return int(navlist[len(navlist) - 2].text)

    def getNewsContent(self, uid):
        headers = {'content-type': 'application/json'}
        data = {
            'ParentPostID': uid,
            'pageShow': 1
        }
        content = r.post(URL_PORTAL_POSTINNER, data=json.dumps(data), headers=headers).text
        self.newsContent = content
        return html_parser.unescape(BeautifulSoup(json.loads(content)['d'], 'lxml').find('textarea').text)

    def parseAttach(self):
        if BeautifulSoup(json.loads(self.newsContent)['d'], 'lxml').find('tr').find('a').img is not None:
            url = BeautifulSoup(json.loads(self.newsContent)['d'], 'lxml').find('tr').find('a')['href']
            return {
                'CourseType': re.findall('CourseType=([0-9])', url, re.S)[0],
                'AttachmentID': re.findall('AttachmentID=([0-9]+)', url, re.S)[0],
                'AttachmentFileName': re.findall('AttachmentFileName=(.+)', url, re.S)[0]
            }
        else:
            return None

    def getNextPageWall(self, page):
        headers = {'content-type': 'application/json'}
        data = {
            'PageIndex': page
        }
        content = r.post(URL_PORTAL_GETPOSTWALL, data=json.dumps(data), headers=headers).text
        return BeautifulSoup(json.loads(content)['d'], 'lxml').find_all(class_='PanelPost')


start_time = time.time()

argv = sys.argv

if len(argv) >= 3:
    try:
        crawler = catchNews(argv[1], argv[2])
        crawler.catch()
    except Exception,e:
        print 'error:', e

else:
    print('No action specified.')
    sys.exit()

#print("--- %s seconds ---" % (time.time() - start_time))
