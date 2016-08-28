# coding=UTF-8
import webbrowser
import os
import codecs

def htmlPreview(htmlString):
    try:
        f = codecs.open('preview.html', 'w', 'utf-8')
        f.write(htmlString)
        f.close()
        webbrowser.open_new('file://'+ os.getcwd() +'/preview.html')
    except Exception, e:
        print e
