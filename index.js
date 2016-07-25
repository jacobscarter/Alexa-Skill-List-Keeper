//import needed modules
var textHelper = require('./textHelper');
var storage = require('./storage');

//App ID for the skill
var APP_ID = 'APP_ID_GOES_HERE';

//The AlexaSkill prototype and helper functions
var AlexaSkill = require('./AlexaSkill');

//GroceryList is a child of AlexaSkill.
var GroceryList = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
GroceryList.prototype = Object.create(AlexaSkill.prototype);
GroceryList.prototype.constructor = GroceryList;

GroceryList.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("GroceryList onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

GroceryList.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("GroceryList onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    //Speak welcome message and ask user questions
    //based on whether there are players or not.
    storage.loadList(session, function (currentList) {
        var speechOutput = '',
            reprompt;
        if (currentList.data.items.length === 0) {
            speechOutput += 'Hi Jacob, Let\'s start your list. What\'s your first item?';
            reprompt = "Please tell me what your first item is?";
        } else if (currentList.isEmptyList()) {
            speechOutput += 'Jacob, '
                + 'you have ' + currentList.data.items.length + ' item';
            if (currentList.data.items.length > 1) {
                speechOutput += 's';
            }
            speechOutput += ' in the list. You can add another item, reset the list or exit. Which would you like?';
            reprompt = textHelper.completeHelp;
        } else {
            speechOutput += 'Jacob, What can I do for you?';
            reprompt = textHelper.nextHelp;
        }
        response.ask(speechOutput, reprompt);
    });
};

GroceryList.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("GroceryList onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

GroceryList.prototype.intentHandlers = {
    // register custom intent handlers
    "AMAZON.StopIntent": function (intent, session, response) {
        response.tell("Okay, bye Felicia", "I said bye Felicia");
    },
    "HelpIntent": function (intent, session, response) {
        response.ask(textHelper.completeHelp, textHelper.nextHelp);
    },
    "AddItemIntent": function (intent, session, response) {
        //add an item to the grocery list,
        //terminate or continue the conversation based on whether the intent is from a one shot command or not.
        var newGroceryItem = textHelper.getGroceryItem(intent.slots.itemName.value);
        if (!newGroceryItem) {
            response.ask('OK. What do you want to add?', 'What do you want to add?');
            return;
        }
        storage.loadList(session, function (currentList) {
            var speechOutput;
            var reprompt;
            if (currentList.data.items.indexOf(newGroceryItem) >= 0) {
                speechOutput = newGroceryItem + ' is already on your list.';
                response.ask(speechOutput);
                return;
            }
            speechOutput = newGroceryItem + ' has been added to your list. ';
            currentList.data.items.push(newGroceryItem);
            currentList.save(function () {
                if (reprompt) {
                    response.ask(speechOutput, reprompt);
                } else {
                    response.ask(speechOutput);
                }
            });
       });
    },
    "DeleteItemIntent": function (intent, session, response) {
        var newGroceryItem = textHelper.getGroceryItem(intent.slots.itemName.value);
        if (!newGroceryItem) {
            response.ask('OK. What do you want to remove?', 'What do you want to remove?');
            return;
        }
        storage.loadList(session, function (currentList) {
            var speechOutput;
            var reprompt;
            if (currentList.data.items.indexOf(newGroceryItem) >= 0) {
                speechOutput = newGroceryItem + ' has been removed from your list. ';
                currentList.data.items.splice(currentList.data.items.indexOf(newGroceryItem), 1);
                currentList.save(function () {
                    if (reprompt) {
                        response.ask(speechOutput, reprompt);
                    } else {
                        response.ask(speechOutput);
                    }
                });
                return;
            } else {
                speechOutput = newGroceryItem + ' is not on your list.';
                response.ask(speechOutput);
                return;
            }
       });
    },
    "ReadListIntent": function (intent, session, response) {
        storage.loadList(session, function (currentList) {
            var speechOutput = 'Your list has ';
            var reprompt;
            if (currentList.data.items.length === 0) {
                speechOutput = "Your list is empty";
                reprompt = speechOutput;
                response.ask(speechOutput, reprompt);
                return;
            } else {
                for (var i in currentList.data.items) {
                    speechOutput += (currentList.data.items[i] + ' ');
                    reprompt = speechOutput;
                }
                response.ask(speechOutput, reprompt);
                return;
            }
       });
    },
    "SearchListIntent": function (intent, session, response) {
        var newGroceryItem = textHelper.getGroceryItem(intent.slots.itemName.value);
        if (!newGroceryItem) {
            response.ask('OK. What do you want to search for?', 'What do you want to search for?');
            return;
        }
        storage.loadList(session, function (currentList) {
            if (currentList.data.items.indexOf(newGroceryItem) >= 0) {
                speechOutput = newGroceryItem + ' is on your list';
                reprompt = speechOutput;
                response.ask(speechOutput, reprompt);
                return;
            } else {
                speechOutput = newGroceryItem + ' is not on your list';
                reprompt = speechOutput;
                response.ask(speechOutput, reprompt);
                return;            
            }
       });
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the GroceryList skill.
    var groceryList = new GroceryList();
    groceryList.execute(event, context);
};

