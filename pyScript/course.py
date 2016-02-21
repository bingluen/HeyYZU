# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys
from login import loginPortal
import json

URL_FIRST_TO_PAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FPage/FirstToPage.aspx?'
URL_HOMEWORK_PAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/THom/HomeworkList.aspx?Menu=Hom'

class course(loginPortal):
    def pipeline(self, task = None, argSource = None, args = None):
        if self.messages['statusCode'] != 200:
            return
        if task is None or argSource is None:
            self.messages['statusCode'] = 502
            self.messages['status'] = 'Params error: no task assign'
            return
        if task == 'homework':
            self.messages['data'] = []
            if argSource == 'inline':
                self.messages['data'].append(self.getHomeworkList(args))
            else:
                with open(args) as f:
                    courseList = json.loads(f.read())['args']
                for course in courseList:
                    self.messages['data'].append(self.getHomeworkList(course))

            self.messages['statusCode'] = 200
            self.messages['status'] = 'get homewok list successful.'
            return
        else:
            self.messages['statusCode'] = 502
            self.messages['status'] = 'Params error'

    def getHomeworkList(self, args = None):
        if args is None:
            self.messages['statusCode'] = 502
            self.messages['status'] = 'Params error: no lesson assign'
            return
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
            'year': args['year'],
            'semester': args['semester'],
            'courseCode': args['courseCode'],
            'class': args['class'],
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
