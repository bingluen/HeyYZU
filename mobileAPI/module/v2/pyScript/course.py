# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys
from login import loginPortal
import json
import datetime
import md5
import os

URL_FIRST_TO_PAGE = 'https://unipop.yzu.edu.tw/PortalSocialVB/FPage/FirstToPage.aspx?'
URL_HOMEWORK_PAGE = 'https://unipop.yzu.edu.tw/PortalSocialVB/THom/HomeworkList.aspx?Menu=Hom'
URL_NOTICE_PAGE = 'https://unipop.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx?Menu=New'
URL_NOTICE_LIST = 'https://unipop.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx/GetPostWall'
URL_NOTICE_INNER = 'https://unipop.yzu.edu.tw/PortalSocialVB/FMain/PostWall.aspx/divParentInnerHtml'
URL_MATERIALS = 'https://unipop.yzu.edu.tw/PortalSocialVB/TMat/Materials_S.aspx?Menu=Mat'


class Course(loginPortal):
    def pipeline(self, task = None, args = None):
        if self.messages['statusCode'] != 3100:
            return
        if task is None:
            self.messages['statusCode'] = 3201
            self.messages['status'] = 'Params error: no task assign'
            return
        elif task == 'getHWAttach':
            getAttach = Attach(self.request)
            result = getAttach.getFile('hw', json.loads(args))
            self.messages['data'] = result['data']
            self.messages['statusCode'] = result['statusCode']
            self.messages['status'] = result['status']
            return
        elif task == 'getNoticeAttach':
            getAttach = Attach(self.request)
            result = getAttach.getFile('notice', json.loads(args))
            self.messages['data'] = result['data']
            self.messages['statusCode'] = result['statusCode']
            self.messages['status'] = result['status']
            return
        else:
            self.messages['statusCode'] = 3201
            self.messages['status'] = 'Params error'
            return

class Attach:
    def __init__(self, requests):
        self.requests = requests
    def getFile(self, type, args = None):
        def writeFile(content):
            if not os.path.exists(args['path']):
                os.makedirs(args['path'])
            filename = md5.new(datetime.datetime.utcnow().isoformat() + '_' + args['filename']).hexdigest() + '.' + args['filename'].split('.')[-1]
            f = open(args['path'] + filename, 'w')
            f.write(content)
            f.close()
            return filename

        hw = 'https://unipop.yzu.edu.tw/PortalSocialVB/File_DownLoad_Wk_zip.aspx?'
        notice = 'https://unipop.yzu.edu.tw/PortalSocialVB/DownloadFile.aspx?Source=Course&'
        if type == 'hw':
            download = self.requests.get(hw+'File_name='+args['filename']+'&id='+str(args['id'])+'&type='+str(args['type']))
        elif type == 'notice':
            download = self.requests.get(notice+'AttachmentFileName='+args['filename']+'&AttachmentID='+str(args['id'])+'&CourseType='+str(args['type']))
        return {
            'status': 'Get file successful',
            'statusCode': 3200,
            'data': writeFile(download.content)
        }
