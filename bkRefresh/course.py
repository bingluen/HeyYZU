# coding=UTF-8
import re, sys, json, datetime, md5, os
import requests
from bs4 import BeautifulSoup
from login import loginPortal
from login import PortalException

URL_FIRST_TO_PAGE = 'https://unipop.yzu.edu.tw/PortalSocialVB/FPage/FirstToPage.aspx?'
URL_HOMEWORK_PAGE = 'https://unipop.yzu.edu.tw/PortalSocialVB/THom/HomeworkList.aspx?Menu=Hom'
URL_NOTICE_PAGE = 'https://unipop.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx?Menu=New'
URL_NOTICE_LIST = 'https://unipop.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx/GetPostWall'
URL_NOTICE_INNER = 'https://unipop.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx/divParentInnerHtml'
URL_MATERIALS = 'https://unipop.yzu.edu.tw/PortalSocialVB/TMat/Materials_S.aspx?Menu=Mat'


class Homework:
    def __init__(self, requests):
        self.request = requests

    def getHomeworkList(self, args = None):
        if args is None:
            raise PortalException(400, 'MUST asign lesson')
        self.request.get(URL_FIRST_TO_PAGE + 'y=' + str(args['lessonYear']) + '&s=' + str(args['lessonSemester']) + '&id=' + args['courseCode'] + '&c=' + args['lessonClass'])
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
            'year': args['lessonYear'],
            'semester': args['lessonSemester'],
            'courseCode': args['courseCode'],
            'class': args['lessonClass'],
            'homework': homeworkList
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

class News:
    def __init__(self, requests):
        self.request = requests

    def getNoticeList(self, args = None):
        if args is None:
            raise PortalException(400, 'MUST asign lesson')

        self.request.get(URL_FIRST_TO_PAGE + 'y=' + str(args['lessonYear']) + '&s=' + str(args['lessonSemester']) + '&id=' + args['courseCode'] + '&c=' + args['lessonClass'])

        noticelist = []

        #Page 1
        content = BeautifulSoup(self.request.get(URL_NOTICE_PAGE).text, 'lxml')

        posts = content.find_all(class_='PanelPost')
        try:
            pages = self.getPages(content.find(class_='divPageNum'))
        except Exception as e:
            raise PortalException(403, 'Premission Denied', e)
        noticelist = noticelist + self.parse(posts)

         # page > 1
        for i in range(2, pages+1):
            noticelist = noticelist + self.parse(self.getNextPageWall(i))

        return {
            'year': args['lessonYear'],
            'semester': args['lessonSemester'],
            'courseCode': args['courseCode'],
            'class': args['lessonClass'],
            'noticelist': noticelist,
        }

    def parse(self, posts):
        postList = []

        for post in posts:
            detail = post.find_all('td')

            postContent = {}
            try:
                postContent['portalId'] = int(re.findall('ShowPostGridUnique\(([0-9]+),[0-1]\)', detail[1].a['href'], re.S)[0])
                postContent['author'] = post.find('img', class_='imgPostAuthor')['title']
                postContent['title'] = re.sub(u'【.*】|\([0-9]{4}_[A-Z]{2}[0-9]{3}_[A-Z]\)', '', detail[1].text)
                postContent['date'] = detail[3].text
                postContent['content'] = self.getNewsContent(postContent['portalId'])
                postContent['attach'] = self.parseAttach()
                postList.append(postContent)


            except Exception,e:
                raise e
                #print(post)
        return postList

    def getNewsContent(self, uid):
        headers = {
            'content-type': 'application/json'
        }
        data = {
            'ParentPostID': uid,
            'pageShow': 0
        }

        self.newsContent = self.request.post(URL_NOTICE_INNER, data=json.dumps(data), headers=headers).json()["d"]

        text = BeautifulSoup(self.newsContent, 'lxml').find('textarea').text
        return text

    def parseAttach(self):
        if BeautifulSoup(self.newsContent, 'lxml').find('tr').find('a').img is not None:
            url = BeautifulSoup(self.newsContent, 'lxml').find('tr').find('a')['href']
            return {
                'CourseType': re.findall('CourseType=([0-9])', url, re.S)[0],
                'AttachmentID': int(re.findall('AttachmentID=([0-9]+)', url, re.S)[0]),
                'AttachmentFileName': re.findall('AttachmentFileName=(.+)', url, re.S)[0]
            }
        else:
            return {}

    def getPages(self, content):
        navlist = content.find_all('a')
        return int(navlist[len(navlist) - 2].text)

    def getNextPageWall(self, page):
        headers = {'content-type': 'application/json'}
        data = {
            'PageIndex': page
        }
        content = self.request.post(URL_NOTICE_LIST, data=json.dumps(data), headers=headers).text
        return BeautifulSoup(json.loads(content)['d'], 'lxml').find_all(class_='PanelPost')

class Material:
    def __init__(self, requests):
        self.request = requests

    def getMaterialList(self, args = None):
        if args is None:
            raise PortalException(400, 'MUST asign lesson')

        self.request.get(URL_FIRST_TO_PAGE + 'y=' + str(args['lessonYear']) + '&s=' + str(args['lessonSemester']) + '&id=' + args['courseCode'] + '&c=' + args['lessonClass'])
        DOM = BeautifulSoup(self.request.get(URL_MATERIALS).text, 'lxml')
        materialsList = []

        if len(re.findall(u'尚未上傳教材', DOM.find(id='Std_info').find_all('table')[1].text, re.S)) > 0:
            return {
                'year': args['lessonYear'],
                'semester': args['lessonSemester'],
                'courseCode': args['courseCode'],
                'class': args['lessonClass'],
                'materials': []
            }

        for tr in DOM.find(id='Std_info').find_all('table')[1].find_all('tr'):
            if len(re.findall(u'getSortMethod', str(tr), re.S)) > 0:
                continue
            else:
                detail = tr.find_all('td')
                material = {}
                material['schedule'] = re.sub('[\r\n]', '', detail[0].text.lstrip().rstrip())
                material['lecture'] = self.parseLecture(detail[1])
                material['link'] = self.parseLink(detail[3])
                material['outline'] = re.sub('[\r\n]', '', detail[4].text)
                material['video'] = self.parseLink(detail[2])
                material['date'] = detail[5].text
                materialsList.append(material)

        return {
            'year': args['lessonYear'],
            'semester': args['lessonSemester'],
            'courseCode': args['courseCode'],
            'class': args['lessonClass'],
            'materials': materialsList,
        }

    def parseLecture(self, content):
        try:
            lectureParams = re.findall(u'File_name=(.+)&id=([0-9]+)&type=([0-9]{1})', content.a['href'], re.S)
            return {
                'filename': lectureParams[0][0],
                'id': int(lectureParams[0][1]),
                'type': 2
            }
        except:
            return {}

    def parseLink(self, content):
        try:
            return content.a['href']
        except:
            return None
