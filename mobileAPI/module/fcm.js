"use strict"

const FCM = require('fcm-node');
const fcm = new FCM(__mobileAPIConfig.FCM_key);
const extend = require('util')._extend

function FCMException(exception) {
  this.message = exception;
}

function pushFCM() {
  this.payload = {
    time_to_live: 7 * 24 * 60 * 60, // 7 days
    priority: "normal",
    collapse_key: "App Message", 
    data: {},
    notification: {}
  }

  this.messageiOS = {
    registration_ids: [],
    priority: 5
  };

  this.messageAndroid = {
    registration_ids: [],
    priority: "normal"
  };

  this.messageTopic = {
    to : "", 
    priority: "normal",
  };


  this.setCollapseKey = (key) => {
    let legalKey = ["App Message", "Course Message"];
    if(legalKey.indexOf(key) >= 0) {
        this.payload.collapse_key = key;
    }
    else{
        return new Promise(() => {
          throw new FCMException("Collapse key error");
        });
    }
    return this;
  }

  this.setPriority = (priority) => {
    let legalKey = ["normal", "high"];
    switch (legalKey.indexOf(priority)) {
      case 0:
        this.messageiOS.priority = 5;
        this.messageAndroid.priority = "normal";
        break;
      case 1:
        this.messageiOS.priority = 10;
        this.messageAndroid.priority = "high";
        break;
      default:
        return new Promise(() => {
          throw new FCMException("Priority error");
        });
    }
    return this;
  }

  this.addAndroidTarget = (target) => {
    if (target instanceof Array) {
      this.messageAndroid.registration_ids = this.messageAndroid.registration_ids.concat(target);
    } else {
      this.messageAndroid.registration_ids.push(target);
    }

    return this;
  }

  this.addiOSTarget = (target) => {
    if (target instanceof Array) {
      this.messageiOS.registration_ids = this.messageiOS.registration_ids.concat(target);
    } else {
      this.messageiOS.registration_ids.push(target);
    }
    return this;
  }

  this.setTopic = (topic) => {
    if (topic != ""){
      this.messageTopic.to = "/topics/" + topic;
    }
    return this;
  }

  this.setNotificationTitle = (title) => {
    if (title != null){
      this.payload.notification.title = title;
    }
    return this;
  }

  this.setNotificationBody = (body) => {
    if (body != null){
      this.payload.notification.body = body;
    }
      
    return this;
  }

  this.PostFCM = () => {
    let PromiseTask = [];
    if (this.messageiOS.registration_ids.length > 0) {
      PromiseTask.push(new Promise((resolve) => {
        fcm.send(extend(this.payload, this.messageiOS), (err, res) => {
          if (err) {
            throw new FCMException("occure error when post FCM to iOS device", err);
          } else {
            resolve("iOS");
          }
        });
      }));
    }
    if (this.messageAndroid.registration_ids.length > 0) {
      PromiseTask.push(new Promise((resolve) => {
        fcm.send(extend(this.payload, this.messageAndroid), (err, res) => {
          if (err) {
            throw new FCMException("occure error when post FCM to Android device", err);
          } else {
            resolve();
          }
        });
      }));
    }

    if (/^\/topics\/\w+$/.test(this.messageTopic.to)) {
      PromiseTask.push(new Promise((resolve) => {
        fcm.send(extend(this.payload, this.messageTopic), (err, res) => {
          if (err) {
            throw new FCMException("occure error when post FCM to Topic", err);
          } else {
            resolve();
          }
        });
      }));
    }

    let checkTask = PromiseTask.map((promise) => {
      return promise.then((resolveTask) => {
        return {ok: true}
      }).catch((rejectTask) => {
        return {ok: false, rejectTask}
      });
    });

    return Promise.all(PromiseTask);
  }
}

module.exports = pushFCM;
