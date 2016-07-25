'use strict';
var textHelper = (function () {
    var nameBlacklist = {
        list: 1,
        lists: 1,
        grocery: 1,
        grocerys: 1
    };

    return {
        completeHelp: 'Here\'s some things you can say,'
        + ' add avacado.'
        + ' reset.'
        + ' and exit.',
        nextHelp: 'You can add another item, exit the list, or say help. What would you like?',

        getGroceryItem: function (recognizedItem) {
            if (!recognizedItem) {
                return undefined;
            }
            if (nameBlacklist[recognizedItem]) {
                //if the item is on our blacklist, it must be mis-recognition
                return undefined;
            }
            return recognizedItem;
        }
    };
})();
module.exports = textHelper;