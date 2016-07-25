'use strict';
var AWS = require("aws-sdk");

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    //The Game class stores all game states for the user
    function GroceryList(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                items: []
            };
        }
        this._session = session;
    }

    GroceryList.prototype = {
        isEmptyList: function () {
            //check if the list is empty
            //it can be used as an indication of whether the list has just started or reset
            var allEmpty = true;
            var listData = this.data;
            allEmpty = listData.items.length === 0;
            return allEmpty;
        },
        save: function (callback) {
            //save the game states in the session,
            //so next time we can save a read from dynamoDB
            this._session.attributes.currentList = this.data;
            dynamodb.putItem({
                TableName: 'NAME_OF_YOUR_DYNAMO_DB_TABLE',
                Item: {
                    CustomerId: {
                        S: this._session.user.userId
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadList: function (session, callback) {
            if (session.attributes.currentList) {
                console.log('get game from session=' + session.attributes.currentList);
                callback(new GroceryList(session, session.attributes.currentList));
                return;
            }
            dynamodb.getItem({
                TableName: 'NAME_OF_YOUR_DYNAMO_DB_TABLE',
                Key: {
                    CustomerId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentList;
                if (err) {
                    console.log(err, err.stack);
                    currentList = new GroceryList(session);
                    session.attributes.currentList = currentList.data;
                    callback(currentList);
                } else if (data.Item === undefined) {
                    currentList = new GroceryList(session);
                    session.attributes.currentList = currentList.data;
                    callback(currentList);
                } else {
                    console.log('get list from dynamodb=' + data.Item.Data.S);
                    currentList = new GroceryList(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentList = currentList.data;
                    callback(currentList);
                }
            });
        },
        newList: function (session) {
            //TODO(jcarter): Do I need this?
            return new GroceryList(session);
        }
    };
})();
module.exports = storage;