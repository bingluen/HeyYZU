# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys
from login import loginPortal
import json
from HTMLParser import HTMLParser

URL_FIRST_TO_PAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FPage/FirstToPage.aspx?'
URL_HOMEWORK_PAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/THom/HomeworkList.aspx?Menu=Hom'
URL_NOTICE_PAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx?Menu=New'
URL_NOTICE_LIST = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspxGetPostWall'
URL_NOTICE_INNER = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx/divParentInnerHtml'


class Course(loginPortal):
    def pipeline(self, task = None, argSource = None, args = None):
        if self.messages['statusCode'] != 200:
            return
        if task is None or argSource is None:
            self.messages['statusCode'] = 502
            self.messages['status'] = 'Params error: no task assign'
            return
        if task == 'homework':
            homework = Homework(self.request)
            self.messages['data'] = []
            if argSource == 'inline':
                result = homework.getHomeworkList(args)
                self.messages['data'].append(result['data'])
                self.messages['statusCode'] = result['statusCode']
                self.messages['status'] = result['status']
            elif argSource == 'infile':
                with open(args) as f:
                    courseList = json.loads(f.read())['args']
                for course in courseList:
                    result = homework.getHomeworkList(args)
                    self.messages['data'].append(result['data'])
                    self.messages['statusCode'] = result['statusCode']
                    self.messages['status'] = result['status']
            else:
                self.messages['statusCode'] = 502
                self.messages['status'] = 'Params error: no arg source assign'
            return
        if task == 'notice':
            notice = Notice(self.request)
            self.messages['data'] = []
            if argSource == 'inline':
                result = notice.getNoticeList(args)
                self.messages['data'].append(result['data'])
                self.messages['statusCode'] = result['statusCode']
                self.messages['status'] = result['status']
            elif argSource == 'infile':
                with open(args) as f:
                    courseList = json.loads(f.read())['args']
                for course in courseList:
                    result = notice.getNoticeList(args)
                    self.messages['data'].append(result['data'])
                    self.messages['statusCode'] = result['statusCode']
                    self.messages['status'] = result['status']
            else:
                self.messages['statusCode'] = 502
                self.messages['status'] = 'Params error: no arg source assign'
            return
        else:
            self.messages['statusCode'] = 502
            self.messages['status'] = 'Params error'
            return


class Homework:
    def __init__(self, requests):
        self.request = requests

    def getHomeworkList(self, args = None):
        if args is None:
            return {
                'statusCode': 502,
                'status': 'Params error: no lesson assign'
            }
        self.request.get(URL_FIRST_TO_PAGE + 'y=' + str(args['year']) + '&s=' + str(args['semester']) + '&id=' + args['courseCode'] + '&c=' + args['class'])
        DOM = BeautifulSoup(self.request.get(URL_HOMEWORK_PAGE).text, 'lxml')
        content = DOM.find('table', id='Table1').find_all('tr')
        isFirst = True
        isFinishGetRecord = True

        ### Homework item column is
        """
        first row
        node_index        value        type
        0                 index       number
        1                Schedule     string
        2                 title       string
        3         teacherUploadFile      MIX
        4                deadline     string
        5         studentUploadFileList  MIX
        6        empty
        7                isGroup      string(個人/？)
        8              freeToSubmit   character(Y/N)
        9                  grade      number
        10                 comment    string
        second row
        0             descriptionOfHomework
        """

        homeworkList = []
        homeworkItem = {}
        for row in content:

            tds = row.find_all('td', colspan='11')
            if len(tds) > 0:
                continue
            tds = row.find_all('td')

            ### skip first row (title row)
            if(isFirst):
                isFirst = False
                continue

            ### mark row number is first row of a record or not
            if(isFinishGetRecord):
                isFinishGetRecord = False
                ### first row of a record
                homeworkItem['schedule'] = tds[1].text
                homeworkItem['title'] = re.sub('^[\n\t ]+|[\n\t ]+$', '', tds[2].text)
                homeworkItem['attach'] = self.parseAttach(tds[3])
                homeworkItem['deadline'] = tds[4].text
                homeworkItem['uploadFile'] = self.parseUploadFile(tds[5])
                try:
                    homeworkItem['wk_id'] = tds[6].span['wk_id']
                except:
                    homeworkItem['wk_id'] = None
                homeworkItem['isGroup'] = False if tds[7].text == u'個人' else True
                homeworkItem['freeSubmit'] = False if tds[8].text == 'N' else True
                homeworkItem['grade'] = tds[9].text
                homeworkItem['comment'] = tds[10].text


            else:
                isFinishGetRecord = True
                homeworkItem['description'] = tds[0].text
                homeworkList.append(homeworkItem.copy())
                homeworkItem.clear()

        return {
            'data': {
                'year': args['year'],
                'semester': args['semester'],
                'courseCode': args['courseCode'],
                'class': args['class'],
                'homework': homeworkList
            },
            'statusCode': 200,
            'status': 'get homewok list successful.'
            }
    def parseAttach(self, attach):
        if len(attach.contents) > 0:
            attachDetail = {}
            parameter = re.findall('type=([0-9])&File_name=(.*)&id=([0-9]+)', attach.contents[0]['href'], re.S)
            attachDetail['type'] = parameter[0][0]
            attachDetail['filename'] = parameter[0][1]
            attachDetail['id'] = parameter[0][2]

            return attachDetail

    def parseUploadFile(self, upload):
        if len(upload.contents) > 0:
            uploadDetail = {}

            parameter = re.findall('File_name=(.*)&type=([0-9])&id=([0-9]+)', upload.a['href'], re.S)
            uploadDetail['filename'] = parameter[0][0]
            uploadDetail['type'] = parameter[0][1]
            uploadDetail['id'] = parameter[0][2]

            return uploadDetail

class Notice:
    def __init__(self, requests):
        self.request = requests

    def getNoticeList(self, args = None):
        if args is None:
            return {
                'statusCode': 502,
                'status': 'Params error: no lesson assign'
            }
        self.request.get(URL_FIRST_TO_PAGE + 'y=' + str(args['year']) + '&s=' + str(args['semester']) + '&id=' + args['courseCode'] + '&c=' + args['class'])

        noticelist = []

        #Page 1
        content = BeautifulSoup(self.request.get(URL_NOTICE_PAGE).text, 'lxml')
        posts = content.find_all(class_='PanelPost')
        #pages = self.getPages(content.find(class_='divPageNum'))
        noticelist = noticelist + self.parse(posts)

        return {
        'data': {
            'year': args['year'],
            'semester': args['semester'],
            'courseCode': args['courseCode'],
            'class': args['class'],
            'noticelist': noticelist
        },
        'statusCode': 200,
        'status': 'get notice list successful.'
        }

    def parse(self, posts):
        postList = []
        for post in posts:
            detail = post.find_all('td')
            #if len(re.findall(u'【(教材|作業)】', detail[2].text, re.S)) > 0:
            #if len(re.findall(u'【作業】', detail[2].text, re.S)) > 0:
            #    continue
            postContent = {}
            try:
                postContent['portalId'] = re.findall('ShowPostGridUnique\(([0-9]+),[0-1]\)' ,detail[1].a['href'], re.S)
                postContent['author'] = post.find('img', class_='imgPostAuthor')['title']
                postContent['title'] = re.sub(u'【.*】|\([0-9]{4}_[A-Z]{2}[0-9]{3}_[A-Z]\)', '', detail[2].text)
                postContent['date'] = detail[4].text
                postContent['content'] = self.getNewsContent(postContent['portalId'])
                postContent['attach'] = self.parseAttach()
                postList.append(postContent)
            except Exception,e:
                print 'error',e
                #print(post)
        return postList

    def getNewsContent(self, uid):
        headers = {
            'content-type': 'application/json',
        }
        data = {
            'ParentPostID': uid,
            'pageShow': 0
        }

        content = self.request.post(URL_NOTICE_INNER, data=json.dumps(data), headers=headers)
        self.newsContent = content
        return HTMLParser.unescape(BeautifulSoup(json.loads(content)['d'], 'lxml').find('textarea').text)

    def parseAttach(self):
        if BeautifulSoup(json.loads(self.newsContent)['d'], 'lxml').find('tr').find('a').img is not None:
            url = BeautifulSoup(json.loads(self.newsContent)['d'], 'lxml').find('tr').find('a')['href']
            return {
                'CourseType': re.findall('CourseType=([0-9])', url, re.S)[0],
                'AttachmentID': re.findall('AttachmentID=([0-9]+)', url, re.S)[0],
                'AttachmentFileName': re.findall('AttachmentFileName=(.+)', url, re.S)[0]
            }
        else:
            return {}
