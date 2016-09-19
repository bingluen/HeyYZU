"use strict"

const FCM = require('fcm-node');
const fcm = new FCM(__mobileAPIConfig.FCM_key);

function FCMException(exception) {
  this.message = exception;
}

function pushFCM() {
  this.messageiOS = {
    registration_ids: [],
    time_to_live: 7 * 24 * 60 * 60, // 7 days
    collapse_key: "App Message", // Default
    priority: 5,
    data: null,
    notification: null
  };

  this.messageAndroid = {
    registration_ids: [],
    time_to_live: 7 * 24 * 60 * 60, // 7 days
    collapse_key: "App Message", // Default
    priority: "normal",
    data: null,
    notification: null
  };

  this.setCollapseKey = (key) => {
    let legalKey = ["App Message", "Course Message"];
    switch (legalKey.indexOf(key)) {
      case 0:
        this.messageiOS.collapse_key = "App Message";
        this.messageAndroid.collapse_key = "App Message";
        break;
      case 1:
        this.messageiOS.collapse_key = "Course Message";
        this.messageAndroid.collapse_key = "Course Message";
        break;
      default:
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

  this.setNotificationTitle = (title) => {
    if (this.messageiOS.notification == null) {
      this.messageiOS.notification = {};
    }
    if (this.messageAndroid.notification == null) {
      this.messageAndroid.notification = {};
    }

    this.messageAndroid.notification.title = title;
    this.messageiOS.notification.title = title;

    return this;
  }

  this.setNotificationBody = (body) => {
    if (this.messageiOS.notification == null) {
      this.messageiOS.notification = {};
    }
    if (this.messageAndroid.notification == null) {
      this.messageAndroid.notification = {};
    }
    this.messageAndroid.notification.body = body;
    this.messageiOS.notification.body = body;

    return this;
  }

  this.PostFCM = () => {
    let PromiseTask = [];
    if (this.messageiOS.registration_ids.length > 0) {
      PromiseTask.push(new Promise((resolve) => {
        fcm.send(this.messageiOS, (err, res) => {
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
        fcm.send(this.messageAndroid, (err, res) => {
          if (err) {
            throw new FCMException("occure error when post FCM to Android device", err);
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
