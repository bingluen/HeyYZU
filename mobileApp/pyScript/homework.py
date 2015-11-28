# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys
import json
import time

URL_LOGIN = 'https://portalx.yzu.edu.tw/PortalSocialVB/Login.aspx'
URL_PORTAL_HOMEPAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/DefaultPage.aspx?Menu=Default'
URL_STUDY_HISTORY = 'https://portalx.yzu.edu.tw/PortalSocialVB/FMain/PageByDuty.aspx?DutyType=std'
URL_FIRST_TO_PAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/FPage/FirstToPage.aspx?PageID='
URL_HOMEWORK_PAGE = 'https://portalx.yzu.edu.tw/PortalSocialVB/THom/HomeworkList.aspx?Menu=Hom'
URL_DOWNLOAD_ATTACH = 'https://portalx.yzu.edu.tw/PortalSocialVB/File_DownLoad_Wk_zip.aspx?'

r = requests.Session()


def writeFile(filename, content):
    f = open(filename, 'w')
    f.write(content)
    f.close()

class catchHomework:

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
        content = r.get(URL_PORTAL_HOMEPAGE).text


        ### init data structure
        ### item of course list is
        """
        year
        semester
        course code
        course name
        """
        self.courseList = []


    def getCourseHistory(self):
        ###get all of course
        content = BeautifulSoup(r.get(URL_STUDY_HISTORY).text, 'lxml')
        isFirst = True
        for course in content.find('div', id='divDutyCoursePage').table.find_all('tr'):
            if(isFirst):
                isFirst = False
                continue
            row = course.find_all('td')
            courseDetail = {}
            courseDetail['year'] = row[0].text.strip(' ')
            courseDetail['semester'] = row[1].text.strip(' ')
            courseDetail['code'] = row[2].text.strip(' ')
            courseDetail['class'] = row[3].text.strip(' ')
            courseDetail['pageID'] = re.findall('PageID=([0-9]+)', row[4].a['href'], re.S)[0]
            self.courseList.append(courseDetail.copy())

    def getHomework(self, pageID, year, semester, code, _class):
        ###connect FirstToPage (because set cookie)
        r.get(URL_FIRST_TO_PAGE+pageID)
        content = BeautifulSoup(r.get(URL_HOMEWORK_PAGE).text, 'lxml').find('table', id='Table1').find_all('tr')
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
                homeworkItem['year'] = year
                homeworkItem['semester'] = semester
                homeworkItem['code'] = code
                homeworkItem['class'] = _class
                homeworkItem['schedule'] = tds[1].text
                homeworkItem['title'] = tds[2].text
                homeworkItem['attach'] = self.parseAttach(tds[3])
                homeworkItem['deadline'] = tds[4].text
                homeworkItem['uploadFile'] = self.parseUploadFile(tds[5])
                homeworkItem['isGroup'] = False if tds[7].text == u'個人' else True
                homeworkItem['freeSubmit'] = False if tds[8].text == 'N' else True
                homeworkItem['grade'] = tds[9].text
                homeworkItem['comment'] = tds[10].text


            else:
                isFinishGetRecord = True
                homeworkItem['description'] = tds[0].text
                homeworkList.append(homeworkItem.copy())
                homeworkItem.clear()

        return homeworkList

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

    def getAttach(self, attach):
        download = r.get(URL_DOWNLOAD_ATTACH+'File_name='+attach['filename']+'&id='+attach['id']+'&type='+attach['type'])
        writeFile(attach['filename'], download.content)

    def doing(self, year, semester):
        resultList = []
        self.getCourseHistory()
        for course in self.courseList:
            if int(course['year']) == year and int(course['semester']) == semester:
                resultList = resultList + self.getHomework(course['pageID'], course['year'], course['semester'], course['code'], course['class'])
        print (json.dumps(resultList))



start_time = time.time()

argv = sys.argv

if len(argv) == 5:
    try:
        crawler = catchHomework(argv[1], argv[2])
        crawler.doing(int(argv[3]), int(argv[4]))
    except Exception,e:
        print 'error:', e

else:
    print('No action specified.')
    sys.exit()

print("--- %s seconds ---" % (time.time() - start_time))
