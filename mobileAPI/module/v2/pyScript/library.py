# coding=UTF-8
import requests
from bs4 import BeautifulSoup
import re
import sys
from login import loginPortal
import json
import time

URL_LIBRARY_LOGIN = 'http://lib.yzu.edu.tw/ajaxYZlib/PersonLogin/PersonLogin.aspx'
URL_LIBRARY_LOAN_CURRENT = 'http://lib.yzu.edu.tw/ajaxYZlib/UserLoan/PersonalLoan.aspx?LoanType=Current'
URL_LIBRARY_LOAN_HISTORY = 'http://lib.yzu.edu.tw/ajaxYZlib/UserLoan/PersonalLoan.aspx?LoanType=History'
URL_LIBRARY_RESERVATION = 'https://lib.yzu.edu.tw/ajaxYZlib/UserLoan/PersonalRequest.aspx'

class Library:
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.messages = {}
        self.request = requests.Session()

    def pipeline(self, task = None, args = None):
        if task == 'loanList':
            self.loginLibrary()
            self.getLoanList(args)
            self.messages['statusCode'] = 3300
            self.messages['status'] = 'Get loan list successful.'
            return
        elif task == 'reservation':
            self.loginLibrary()
            self.getReservation()
            self.messages['statusCode'] = 3300
            self.messages['status'] = 'Get reservation successful.'
        else:
            self.messages['statusCode'] = 3301
            self.messages['status'] = 'Params error'
            return

    def loginLibrary(self):
        DOM = BeautifulSoup(self.request.get(URL_LIBRARY_LOGIN).text, 'lxml')
        data = {
            '__VIEWSTATE': DOM.find('input', id='__VIEWSTATE')['value'],
            '__VIEWSTATEGENERATOR': DOM.find('input', id='__VIEWSTATEGENERATOR')['value'],
            '__EVENTVALIDATION': DOM.find('input', id='__EVENTVALIDATION')['value'],
            'txtUserID': self.username,
            'txtUserPWD': self.password,
            'btnConfirm': u'確定'
        }
        self.request.post(URL_LIBRARY_LOGIN, data=data)

    def getLoanList(self, args = None):

        records = []
        if args == 'current':
            URL_LIBRARY_LOAN = URL_LIBRARY_LOAN_CURRENT
        elif args == 'history':
            URL_LIBRARY_LOAN = URL_LIBRARY_LOAN_HISTORY
        else:
            self.messages['statusCode'] = 3301
            self.messages['status'] = 'Params error'
            return

        #page = 1
        DOM = BeautifulSoup(self.request.get(URL_LIBRARY_LOAN).text, 'lxml')
        records = records + self.parseRecord(DOM)

        if len(records) == 0:
            self.messages['data'] = []
            return

        ##GET last SN
        maxSN = int(records[len(records) - 1]['sn'])

        if maxSN < 10:
            self.messages['data'] = records
            return

        #page > 1
        while True:
            DOM = BeautifulSoup(self.request.post(URL_LIBRARY_LOAN, data ={
                '__EVENTTARGET': 'lbnPageNext',
                '__EVENTARGUMENT': '',
                '__VIEWSTATE': DOM.find('input', id='__VIEWSTATE')['value'],
                '__VIEWSTATEGENERATOR': DOM.find('input', id='__VIEWSTATEGENERATOR')['value'],
                '__EVENTVALIDATION': DOM.find('input', id='__EVENTVALIDATION')['value'],
                'lblOnLineMsg': DOM.find('input', id='lblOnLineMsg')['value']
            }).text, 'lxml')
            parseRecord = self.parseRecord(DOM)

            if int(parseRecord[len(parseRecord) - 1]['sn']) > maxSN:
                records = records + parseRecord
                maxSN = int(parseRecord[len(parseRecord) - 1]['sn'])
            else:
                break


        self.messages['data'] = records

    def parseRecord(self, DOM):
        try:
            trs = DOM.find(class_='table_1').find_all('tr')
        except:
            return []
        records = []
        for i in range(1, len(trs)):
            record = {}
            tds = trs[i].find_all('td')

            record['sn'] = tds[0].text
            record['bibliosno'] = re.findall(u'BiblioSNo=([0-9]+)', tds[1].a['href'], re.S)[0]
            record['title'] = tds[1].text
            record['author'] = tds[2].text
            record['barcode'] = tds[3].text
            record['materialType'] = tds[4].text
            record['loanDate'] = re.findall(u'([0-9]{4}\/[0-9]{2}\/[0-9]{2}\(續借日期\)|[0-9]{4}\/[0-9]{2}\/[0-9]{2}\(召回日期\)|[0-9]{4}\/[0-9]{2}\/[0-9]{2})', tds[5].text, re.S)
            record['dueDate'] = tds[6].text
            records.append(record)

        return records

    def getReservation(self):
        records = []
        #page 1
        DOM = BeautifulSoup(self.request.get(URL_LIBRARY_RESERVATION).text, 'lxml')
        records = records + self.parseReservation(DOM)

        if len(records) == 0:
            self.messages['data'] = []
            return

        ##GET last SN
        maxSN = int(records[len(records) - 1]['sn'])

        if maxSN < 10:
            self.messages['data'] = records
            return

        #page > 1
        while True:
            DOM = BeautifulSoup(self.request.post(URL_LIBRARY_RESERVATION, data = {
                        '__EVENTTARGET': 'lbnPageNext',
                        '__EVENTARGUMENT': '',
                        '__VIEWSTATE': DOM.find('input', id='__VIEWSTATE')['value'],
                        '__VIEWSTATEGENERATOR': DOM.find('input', id='__VIEWSTATEGENERATOR')['value'],
                        '__EVENTVALIDATION': DOM.find('input', id='__EVENTVALIDATION')['value'],
                        'lblOnLineMsg': DOM.find('input', id='lblOnLineMsg')['value']
                    }).text, 'lxml')
            parseRecord = self.parseReservation(DOM)

            if int(parseRecord[len(parseRecord) - 1]['sn']) > maxSN:
                records = records + parseRecord
                maxSN = int(parseRecord[len(parseRecord) - 1]['sn'])
            else:
                break
        self.messages['data'] = records

    def parseReservation(self, DOM):
        try:
            trs = DOM.find(class_='table_1').find_all('tr')
        except:
            return []
        records = []
        for i in range(1, len(trs)):
            record = {}
            tds = trs[i].find_all('td')
            record['sn'] = tds[1].text
            record['bibliosno'] = re.findall(u'BiblioSNo=([0-9]+)', tds[2].a['href'], re.S)[0]
            record['title'] = tds[2].text
            record['barcode'] = tds[3].text
            record['materialType'] = tds[4].text
            record['reserveDate'] = tds[5].text
            record['queuePriority'] = tds[6].text
            record['availableDate'] = tds[7].text
            record['deadlineDate'] = tds[8].text
            records.append(record)
        return records
