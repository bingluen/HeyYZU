"use strict"

const FCM = require('fcm-node');
const fcm = new FCM(__mobileAPIConfig.FCM_key);
//const fcm = new FCM('AIzaSyCzDeBThSxXXd56rj1Mqr8F1NNhrm6UK-8');

module.exports = function()
{

  this.payload = {
    to : "", 
    time_to_live: 7 * 24 * 60 * 60, // 7 days
    priority: "normal",
    data: {},
    notification: {}
  };

  this.setNotification = (title, body) => {
    if (this.payload.notification != null) {
      this.payload.notification.title = title;
      this.payload.notification.body = body;
    }
    return this;
  }

  this.setData = (data) => {
    if (this.payload.data != null) {
      this.payload.data.msg = data;
    }
    return this;
  }

  this.sendTopic = (topic) => {
    if(topic == null){
      console.log("topic not set.");
    }

    this.payload.to = "/topics/" + topic;
    let PromiseTask = [];

    PromiseTask.push( new Promise((resolve, reject) => {
        fcm.send(this.payload, (err, res) => {
          if (err) {
            console.log("occure error when post FCM to Topics."+err);
            reject(err);
          } else {
            resolve(res);
          }
        });
    }));

    Promise.all(PromiseTask)
  
  }
}
 