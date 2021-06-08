'use strict';


/** compare string ignoring case */
String.prototype.isEqualTo = function (str) {

    return this.toLowerCase() === str.toLowerCase();
}