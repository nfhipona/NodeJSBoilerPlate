'use strict';


/** compare string ignoring case */
String.prototype.isEqualToStr = function (str) {

    return this.toLowerCase() === str.toLowerCase();
}