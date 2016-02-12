# coding=UTF-8
from __future__ import print_function
import requests
from bs4 import BeautifulSoup
import re
import codecs
import json
from datetime import datetime


proxy = {
}

class CourseCatcher:
	def __init__(self):
		self.url = 'https://portal.yzu.edu.tw/cosSelect/index.aspx?D=G'
		self.requests = requests.Session()
		self.courseData = {
			'update' : str(datetime.now()) ,
			'course': [],
			'courseCount': 0,
			'department': [
				{
				  'deptCode': '300',
				  'deptRawName': '工程學院',
				  'deptName': '工程學院',
				  'type': ''
				}, {
				  'deptCode': '302',
				  'deptRawName': '機械工程學系學士班',
				  'deptName': '機械工程學系',
				  'type': '學士班'
				}, {
				  'deptCode': '303',
				  'deptRawName': '化學工程與材料科學學系學士班',
				  'deptName': '化學工程與材料科學學系',
				  'type': '學士班'
				}, {
				  'deptCode': '305',
				  'deptRawName': '工業工程與管理學系學士班',
				  'deptName': '工業工程與管理學系',
				  'type': '學士班'
				}, {
				  'deptCode': '322',
				  'deptRawName': '機械工程學系碩士班',
				  'deptName': '機械工程學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '323',
				  'deptRawName': '化學工程與材料科學學系碩士班',
				  'deptName': '化學工程與材料科學學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '325',
				  'deptRawName': '工業工程與管理學系碩士班',
				  'deptName': '工業工程與管理學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '329',
				  'deptRawName': '生物科技與工程研究所碩士班',
				  'deptName': '生物科技與工程研究所',
				  'type': '碩士班'
				}, {
				  'deptCode': '330',
				  'deptRawName': '先進能源碩士學位學程',
				  'deptName': '先進能源碩士',
				  'type': '學位學程'
				}, {
				  'deptCode': '352',
				  'deptRawName': '機械工程學系博士班',
				  'deptName': '機械工程學系',
				  'type': '博士班'
				}, {
				  'deptCode': '353',
				  'deptRawName': '化學工程與材料科學學系博士班',
				  'deptName': '化學工程與材料科學學系',
				  'type': '博士班'
				}, {
				  'deptCode': '355',
				  'deptRawName': '工業工程與管理學系博士班',
				  'deptName': '工業工程與管理學系',
				  'type': '博士班'
				}, {
				  'deptCode': '500',
				  'deptRawName': '管理學院',
				  'deptName': '管理學院',
				  'type': ''
				}, {
				  'deptCode': '505',
				  'deptRawName': '管理學院學士班',
				  'deptName': '管理學院',
				  'type': '學士班'
				}, {
				  'deptCode': '530',
				  'deptRawName': '管理學院經營管理碩士班',
				  'deptName': '管理學院經營管理',
				  'type': '碩士班'
				}, {
				  'deptCode': '531',
				  'deptRawName': '管理學院財務金融暨會計碩士班',
				  'deptName': '管理學院財務金融暨會計',
				  'type': '碩士班'
				}, {
				  'deptCode': '532',
				  'deptRawName': '管理學院管理碩士在職專班',
				  'deptName': '管理學院管理',
				  'type': '碩士在職專班'
				}, {
				  'deptCode': '554',
				  'deptRawName': '管理學院博士班',
				  'deptName': '管理學院',
				  'type': '博士班'
				}, {
				  'deptCode': '600',
				  'deptRawName': '人文社會學院',
				  'deptName': '人文社會學院',
				  'type': ''
				}, {
				  'deptCode': '601',
				  'deptRawName': '應用外語學系學士班',
				  'deptName': '應用外語學系',
				  'type': '學士班'
				}, {
				  'deptCode': '602',
				  'deptRawName': '中國語文學系學士班',
				  'deptName': '中國語文學系',
				  'type': '學士班'
				}, {
				  'deptCode': '603',
				  'deptRawName': '藝術與設計學系學士班',
				  'deptName': '藝術與設計學系',
				  'type': '學士班'
				}, {
				  'deptCode': '604',
				  'deptRawName': '社會暨政策科學學系學士班',
				  'deptName': '社會暨政策科學學系',
				  'type': '學士班'
				}, {
				  'deptCode': '621',
				  'deptRawName': '應用外語學系碩士班',
				  'deptName': '應用外語學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '622',
				  'deptRawName': '中國語文學系碩士班',
				  'deptName': '中國語文學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '623',
				  'deptRawName': '藝術與設計學系(藝術管理碩士班)',
				  'deptName': '藝術與設計學系(藝術管理碩士班)',
				  'type': ''
				}, {
				  'deptCode': '624',
				  'deptRawName': '社會暨政策科學學系碩士班',
				  'deptName': '社會暨政策科學學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '656',
				  'deptRawName': '文化產業與文化政策博士學位學程',
				  'deptName': '文化產業與文化政策博士',
				  'type': '學位學程'
				}, {
				  'deptCode': '700',
				  'deptRawName': '資訊學院',
				  'deptName': '資訊學院',
				  'type': ''
				}, {
				  'deptCode': '304',
				  'deptRawName': '資訊工程學系學士班',
				  'deptName': '資訊工程學系',
				  'type': '學士班'
				}, {
				  'deptCode': '701',
				  'deptRawName': '資訊管理學系學士班',
				  'deptName': '資訊管理學系',
				  'type': '學士班'
				}, {
				  'deptCode': '702',
				  'deptRawName': '資訊傳播學系學士班',
				  'deptName': '資訊傳播學系',
				  'type': '學士班'
				}, {
				  'deptCode': '721',
				  'deptRawName': '資訊管理學系碩士班',
				  'deptName': '資訊管理學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '722',
				  'deptRawName': '資訊傳播學系碩士班',
				  'deptName': '資訊傳播學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '723',
				  'deptRawName': '資訊社會學碩士學位學程',
				  'deptName': '資訊社會學碩士',
				  'type': '學位學程'
				}, {
				  'deptCode': '724',
				  'deptRawName': '資訊工程學系碩士班',
				  'deptName': '資訊工程學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '725',
				  'deptRawName': '生物與醫學資訊碩士學位學程',
				  'deptName': '生物與醫學資訊碩士',
				  'type': '學位學程'
				}, {
				  'deptCode': '751',
				  'deptRawName': '資訊管理學系博士班',
				  'deptName': '資訊管理學系',
				  'type': '博士班'
				}, {
				  'deptCode': '754',
				  'deptRawName': '資訊工程學系博士班',
				  'deptName': '資訊工程學系',
				  'type': '博士班'
				}, {
				  'deptCode': '800',
				  'deptRawName': '電機通訊學院',
				  'deptName': '電機通訊學院',
				  'type': ''
				}, {
				  'deptCode': '301',
				  'deptRawName': '電機工程學系學士班',
				  'deptName': '電機工程學系',
				  'type': '學士班'
				}, {
				  'deptCode': '307',
				  'deptRawName': '通訊工程學系學士班',
				  'deptName': '通訊工程學系',
				  'type': '學士班'
				}, {
				  'deptCode': '308',
				  'deptRawName': '光電工程學系學士班',
				  'deptName': '光電工程學系',
				  'type': '學士班'
				}, {
				  'deptCode': '326',
				  'deptRawName': '電機工程學系碩士班',
				  'deptName': '電機工程學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '327',
				  'deptRawName': '通訊工程學系碩士班',
				  'deptName': '通訊工程學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '328',
				  'deptRawName': '光電工程學系碩士班',
				  'deptName': '光電工程學系',
				  'type': '碩士班'
				}, {
				  'deptCode': '356',
				  'deptRawName': '電機工程學系博士班',
				  'deptName': '電機工程學系',
				  'type': '博士班'
				}, {
				  'deptCode': '357',
				  'deptRawName': '通訊工程學系博士班',
				  'deptName': '通訊工程學系',
				  'type': '博士班'
				}, {
				  'deptCode': '358',
				  'deptRawName': '光電工程學系博士班',
				  'deptName': '光電工程學系',
				  'type': '博士班'
				}, {
				  'deptCode': '901',
				  'deptRawName': '通識教學部',
				  'deptName': '通識教學部',
				  'type': ''
				}, {
				  'deptCode': '903',
				  'deptRawName': '軍訓室',
				  'deptName': '軍訓室',
				  'type': ''
				}, {
				  'deptCode': '904',
				  'deptRawName': '體育室',
				  'deptName': '體育室',
				  'type': ''
				}, {
				  'deptCode': '906',
				  'deptRawName': '國際語言文化中心',
				  'deptName': '國際語言文化中心',
				  'type': ''
				}, {
				  'deptCode': '907',
				  'deptRawName': '國際兩岸事務室',
				  'deptName': '國際兩岸事務室',
				  'type': ''
				}
			]
		}
		##self.database = codecs.open("database.sql", "w", "utf-8")
		##self.database.write(u'\ufeff')
		##self.database.write(u'INSERT INTO `coursedatabase` (`code`, `class`, `department`, `degree`, `credit`, `chinese_name`, `chinese_teacherName`, `type`, `url`, `year`, `semester`, `time`) VALUES\r\n')
		##self.jsonDB = write(u'\ufeff')
		self.eco_viewstate = ''
		self.eco_eventvalidation = ''
		self.eco_viewstategenerator = ''
		self.legalDepartment = [300, 302, 303, 305, 322,
			323, 325, 329, 330, 352,
			353, 355, 500, 505, 530,
			531, 532, 554, 600,
			601, 602, 603, 604, 621,
			622, 623, 624, 700, 304,
			701, 702, 721, 722, 723,
			724, 725, 751, 754, 800,
			301, 307, 308, 326, 327,
			328, 356, 357, 358, 901,
			903, 904, 906, 907];
		self.testDepartment = [304, 302];

	###def __del__(self):
		##self.database.close()

	def catch(self, catchYear, catchSemester, department, degree):
		## 第一次連線 - 抓環境變數
		try:
			content = self.requests.get(self.url, proxies=proxy).text
		except requests.exceptions.ConnectionError:
			print ('Department ' + department['deptRawName'])

		self.eco_viewstate = re.findall('id="__VIEWSTATE" value="([^\r\n]*)" />', content, re.S)[0]
		self.eco_eventvalidation = re.findall('id="__EVENTVALIDATION" value="([^\r\n]*)" ', content, re.S)[0]
		self.eco_viewstategenerator = re.findall('id="__VIEWSTATEGENERATOR" value="([^\r\n]*)" ', content, re.S)[0]

		## 第二次連線

		self.postData = {
			'__VIEWSTATE': self.eco_viewstate.decode('utf-8'),
			'__VIEWSTATEGENERATOR': self.eco_viewstategenerator.decode('utf-8'),
			'__EVENTVALIDATION': self.eco_eventvalidation.decode('utf-8'),
	        'DDL_YM': str(catchYear)+','+str(catchSemester)+'  ',
	        'DDL_Dept': int(department['deptCode']),
	        'DDL_Degree': '0',
	        'Q': 'RadioButton1',
	        '__EVENTTARGET': 'DDL_Dept',
	        '__EVENTARGUMENT': '',
	        '__LASTFOCUS': '',
	        'Button1': '\xe7\x99\xbb\xe5\x85\xa5'
		}

		try:
			content = self.requests.post(self.url, data=self.postData, proxies=proxy).text
		except requests.exceptions.ConnectionError:
			print ('Department ' + department['deptRawName'])

		## 第三次連線
		self.eco_viewstate = re.findall('id="__VIEWSTATE" value="([^\r\n]*)" />', content, re.S)[0]
		self.eco_eventvalidation = re.findall('id="__EVENTVALIDATION" value="([^\r\n]*)" ', content, re.S)[0]
		self.eco_viewstategenerator = re.findall('id="__VIEWSTATEGENERATOR" value="([^\r\n]*)" ', content, re.S)[0]
		self.postData = {
			'__VIEWSTATE': self.eco_viewstate.decode('utf-8'),
			'__VIEWSTATEGENERATOR': self.eco_viewstategenerator.decode('utf-8'),
			'__EVENTVALIDATION': self.eco_eventvalidation.decode('utf-8'),
	        'DDL_YM': str(catchYear)+','+str(catchSemester)+'  ',
	        'DDL_Dept': int(department['deptCode']),
	        'DDL_Degree': degree,
	        'Q': 'RadioButton1',
	        '__EVENTTARGET': '',
	        '__EVENTARGUMENT': '',
	        '__LASTFOCUS': '',
	        'Button1': '\xe7\x99\xbb\xe5\x85\xa5'
		}

		try:
			content = self.requests.post(self.url, data=self.postData).text
		except requests.exceptions.ConnectionError:
			print ('Department ' + department['deptRawName'])

		return content

	def parserList(self, content, year, semester, department, degree):
		dom = BeautifulSoup(content, 'lxml')
		courseList = []

		if dom.find('table', id='Table1').find('td', title='No course was selected') is not None:
			return None

		for row in dom.find('table', id='Table1').find_all('tr'):
			try:
				if row['class'][0] == u'title_line':
					continue
				rowData = row.find_all('td')
				courseData = {}
				if len(rowData) > 1:

					#Detail URL
					courseData['url'] = 'https://portal.yzu.edu.tw/cosSelect/'+rowData[1].a['href']

					#chinese name of course
					courseName = rowData[3].find_all('a')
					courseData['chinese_name'] = courseName[0].text

					#type
					courseData['type'] = rowData[4].text


					#classroom & time
					classroomPairString = re.sub('<[/]?span>', '', str(rowData[5].find('span'))).replace('<br/>', '\n').replace(' ', '')
					classroomPair = {}
					classtimeList = []
					try:
						for i in classroomPairString.split('\n'):
							#classroom
							stringSplit = i.split(',')
							classroomPair[stringSplit[0]] = stringSplit[1]
							#time
							classtimeList.append(stringSplit[0])
						courseData['classroom'] = classroomPair
						courseData['time'] = classtimeList
					except IndexError as e:
						##print(courseData['chinese_name'])
						##print(e)
						##print(classroomPairString)
						##print(stringSplit)
						courseData['classroom'] = ''
						courseData['time'] = ''


					#teacher name
					courseData['teacher'] = re.findall('[^()]*', rowData[6].text, re.S)[0]

					#year
					courseData['year'] = year

					#semester
					courseData['semester'] = semester

					#department
					courseData['deptRawName'] = department['deptRawName']
					courseData['deptName'] = department['deptName']
					courseData['deptCode'] = department['deptCode']
					courseData['deptType'] = department['type']

					#degree
					courseData['degree'] = degree


					courseList.append(courseData)
			except KeyError as e:
				print (e)
				continue

		return courseList

	def parseCourse(self, courseList):
		newCourselist = []
		for course in courseList:
			try:
				content = self.requests.get(course['url'], proxies=proxy).text
			except requests.exceptions.ConnectionError:
				print ('ConnectionError - Url ' + course['url'])

			dom = BeautifulSoup(content, 'lxml')

			data = dom.find('div', id='Cos_info').table.find_all('tr')[1].find_all('td')

			#code
			course['code'] = data[2].text.replace(' ', '')

			#class
			course['class'] = data[3].text

			#credit
			course['credit'] = int(data[4].text)

			#create uid
			course['uid'] = self.courseData['courseCount'] + 1

			newCourselist.append(course)

			self.courseData['courseCount'] =  self.courseData['courseCount'] + 1

		return newCourselist

	def writeRow(self, courseList):
		"""
		(`id`, `code`, `class`,
			`department`, `degree`, `credit`,
			`chinese_name`, `chinese_teacherName`, `type`,
			`url`, `year`, `semester`,
			`time`)
		"""
		###print (json.dumps(courseList))
		"""
		for row in courseList:
			self.database.write(u'(')
			self.database.write(u'\''+row['code']+u'\', ')
			self.database.write(u'\''+row['class']+u'\', ')
			self.database.write(u'\''+str(row['department'])+u'\', ')
			self.database.write(u'\''+str(row['degree'])+u'\', ')
			self.database.write(u'\''+str(row['credit'])+u'\', ')
			self.database.write(u'\''+row['chinese_name']+u'\', ')
			self.database.write(u'\''+row['teacher']+u'\', ')
			self.database.write(u'\''+row['type']+u'\', ')
			self.database.write(u'\''+row['url']+u'\', ')
			self.database.write(u'\''+str(row['year'])+u'\', ')
			self.database.write(u'\''+str(row['semester'])+u'\', ')
			self.database.write(u'\''+row['time']+u'\'')
			self.database.write(u'), \r\n')
		"""

	def execute(self):
		for year in range(100, 105):
			for semester in range(1,4):
				self.courseData['update'] = str(datetime.now())
				self.courseData['course'] = []
				self.courseData['courseCount'] = 0
				print('=======year: '+str(year)+' semester: '+str(semester)+'========')
				for department in self.courseData['department']:
					for degree in range(1,5):
						print('catch department = ' + department['deptRawName'] + ' degree = ' + str(degree) + '........start')
						parserList = self.parserList(self.catch(year, semester, department, degree), year, semester, department, degree)
						if parserList is not None:
							self.courseData['course'] = self.courseData['course'] + self.parseCourse(parserList)
							print('catch department = ' + department['deptRawName'] + ' degree = ' + str(degree) + '.........Finish')
						else:
							print('catch department = ' + department['deptRawName'] + ' degree = ' + str(degree) + '.........Empty')
				#print (self.courseData)
				jsonDB = codecs.open("database" + str(year) + "-" + str(semester) +".json", "w", "utf-8")
				jsonDB.write(json.dumps(self.courseData))




courseCatcher = CourseCatcher()
courseCatcher.execute()
