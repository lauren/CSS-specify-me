// Copyright 2013 Lauren Sperber
// https://github.com/lauren/specify-me/blob/master/LICENSE
//
// If you want to preserve the hierarchy of the inputted selectors, check out 
// /alt/specificity-calculator-with-hierarchy.js

;(function (exports) {

  // does not include the :not pseudoclass, which does not contribute to specificity calc
  var pseudoClasses = [":link", ":visited", ":hover", ":active", ":target", ":lang", ":focus",
                       ":enabled", ":disabled", ":checked", ":indeterminate", ":root", ":nth-child",
                       ":nth-last-child", ":nth-of-type", ":nth-last-of-type", ":first-child",
                       ":last-child", ":first-of-type", ":last-of-type", ":only-child",
                       ":only-of-type", ":empty"],
      pseudoElements = ["::first-line", "::first-letter", "::before", "::after"],
      delimiterRegex = /(\.|#|:|\[|\*|\+|\<|\>|\~|\s)/,
      specialCharRegex = /^(\*|\+|\<|\>|\~|\s|\()+/;

  // checks if input is an array of selectors or a single selector and routes it appropriately
  var inputRouter = function (input) {
    return (typeof input === "string") ?
      calculateSpecificity(input) :
      input.map(calculateSpecificity);
  };

  // takes a single selector string, passes to getComponentSelectors and categorize,
  // calculates specificity of resulting object, adds a score property, and returns it
  var calculateSpecificity = function (selectors) {
    var specificityInfo = categorize(getComponentSelectors(selectors));
    specificityInfo.score = [specificityInfo.components.ids.length, 
                              specificityInfo.components.classesPseudoClassesAndAttributes.length,
                              specificityInfo.components.elementsAndPseudoElements.length]
    return specificityInfo;
  };

  // takes a selector string and returns an array of its component selectors
  var getComponentSelectors = function (string) {
    string = string.replace(specialCharRegex, "");
    string = string.replace(")","");
    if (string.length === 0) {
      return [];
    }

    // special case for selectors that begin "::" so the first colon doesn't get split off
    var nextSelectorIndex = /^[\:\:]/.test(string) ? string.slice(2).search(delimiterRegex) 
          : string.slice(1).search(delimiterRegex),
        selectorIndexBuffer = /^[\:\:]/.test(string) ? 2 : 1;
    nextSelectorIndex = (nextSelectorIndex >= 0) ? nextSelectorIndex + selectorIndexBuffer : string.length;
    var thisSelector = string.slice(0,nextSelectorIndex),
        remainingString = string.slice(nextSelectorIndex);

    return [thisSelector].concat(getComponentSelectors(remainingString));
  };

  // takes an array selectors and categorizes them
  var categorize = function (selectors) {
    var specificityInfo = {
      components: {
        ids: [],
        classesPseudoClassesAndAttributes: [],
        elementsAndPseudoElements: [],
        pseudoClasses: [] // temp bucket for pseudo-classes until they're scrubbed for psuedo-elements and :not
      }
    };
    specificityInfo = selectors.reduce(function (accumulator, selector) {
      accumulator.components[selectorCategory(selector)].push(selector);
      return accumulator;
    }, specificityInfo);
    findPseudoElements(specificityInfo);
    validatePseudoClasses(specificityInfo);
    return specificityInfo;
  };

  // SpecificityInfo constructor
  var SpecificityInfo = function () {
    this.components = {
      ids: [],
      classesPseudoClassesAndAttributes: [],
      elementsAndPseudoElements: [],
      pseudoClasses: [] // temporary bucket for pseudo-classes until they're scrubbed for psuedo-elements and :not
    };
  };

  // if any pseudo-classes match the acceptable pseudo-elements array, recategorize them 
  // as pseudoElements.
  var findPseudoElements = function (specificityObject) {
    specificityObject.components.pseudoClasses.map(function (selector) {
      if (pseudoElements.indexOf(":" + selector) !== -1) {
        specificityObject.components.elementsAndPseudoElements.push(":" + selector);
      }
    });
  };

  var validatePseudoClasses = function (specificityObject) {
    specificityObject.components.classesPseudoClassesAndAttributes  = 
      specificityObject.components.classesPseudoClassesAndAttributes
      .concat(makeSubset(specificityObject.components.pseudoClasses, pseudoClasses));
    delete specificityObject.components.pseudoClasses;
  };

  // makes sure that xs is a subset of ys. If there are elements that are in xs but not ys, 
  // makeSubset removees them and returns the resulting array, which IS a subset of ys.
  var makeSubset = function (xs, ys) {
    var result = [];
    xs.map(function (item) {
      if (ys.indexOf(item) !== -1) {
        result.push(item);
      }
    });
    return result;
  };

  // takes a selector and returns what category it belongs in based on the first char
  var selectorCategory = function (selector) {
    switch(selector.charAt(0)) {
      case "#":
        return "ids";
        break;
      case ".": case "[":
        return "classesPseudoClassesAndAttributes";
        break;
      case ":":
        return selector.slice(1, 2) === ":" ? "elementsAndPseudoElements" : "pseudoClasses";
        break;
      default:
        return "elementsAndPseudoElements";
        break;
    }
  };

  //// shims

  if (Array.prototype.indexOf === undefined) {
    var inArray = function (array,object) {
      for (var i = 0; i < array.length; i++) {
        if(array[i] === object) {
            return i;
        }
      };
      return -1;
    };
  };

  if (Array.prototype.map === undefined) {
    Array.prototype.map = function(thisFunction) {
      var result = [];
      for (var i = 0; i < this.length; i++) {
        result.push(thisFunction(this[i]));
      }
      return result;
    }
  };

  if (Array.prototype.reduce === undefined) {
    Array.prototype.reduce = function(thisFunction, accumulator) {
      if (this.length === 0 && accumulator === undefined) {
        throw new TypeError("Can't reduce an empty array with no initial value");
      }

      var i = 0;

      if (accumulator === undefined) {
        accumulator = this[0];
        i = 1;
      }

      for (var len=this.length; i < len; i++) {
        accumulator = thisFunction(accumulator, this[i]);
      }

      return accumulator;
    }
  };

  exports.specifyMe = inputRouter;

})(this);