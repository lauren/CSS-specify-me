// Copyright 2013 Lauren Sperber
// https://github.com/lauren/specify-me/blob/master/LICENSE
//
// A more efficient way to calculate selector specificity. If you want to preserve the
// hierarchy of the inputted selectors, try the version called
// specificity-calculator-with-hierarchy.js

;(function (exports) {
  // does not include the :not pseudoclass, which does not contribute to specificity calc
  var pseudoClasses = [":link", ":visited", ":hover", ":active", ":target", ":lang", ":focus",
                       ":enabled", ":disabled", ":checked", ":indeterminate", ":root", ":nth-child",
                       ":nth-last-child", ":nth-of-type", ":nth-last-of-type", ":first-child",
                       ":last-child", ":first-of-type", ":last-of-type", ":only-child",
                       ":only-of-type", ":empty"],
      pseudoElements = ["::first-line", "::first-letter", "::before", "::after"],
      delimiterRegex = /(\.|#|:|\[|\*|\+|\<|\>|\~|\s)/,
      specialCharRegex = /^(\*|\+|\<|\>|\~|\s|\(|\))+/;

  // checks if input is an array of selectors or a single selector and routes it appropriately
  var inputRouter = function (input) {
    return (typeof input === "string") ?
      calculateSpecificity(input) :
      input.map(calculateSpecificity);
  };

  // takes a single selector string, passes to parser, then calculates specificity
  // of resulting object
  var calculateSpecificity = function (selectors) {
    var selectorCatalogue = categorize(getComponentSelectors(selectors)),
        scoreCategories = [
          ["ids"],
          ["classes", "pseudoClasses", "attributes"],
          ["nodes", "pseudoElements"]
        ];

    selectorCatalogue.score = scoreCategories.map(function (categoryArr) {
      return selectorCatalogue.getCategories(categoryArr).length;
    });
    return selectorCatalogue;
  };

  // takes a selector string and returns an array of its component selectors
  var getComponentSelectors = function (string) {
    string = string.replace(specialCharRegex, "");

    if (string.length === 0) {
      return [];
    }

    var nextSelectorIndex = /^[\:\:]/.test(string) ? string.slice(2).search(delimiterRegex) 
          : string.slice(1).search(delimiterRegex),
        nextSelectorIndex = (nextSelectorIndex >= 0) ? nextSelectorIndex + 1 : string.length,
        thisSelector = string.slice(0,nextSelectorIndex),
        remainingString = string.slice(nextSelectorIndex);

    return [thisSelector].concat(getComponentSelectors(remainingString));
  };

  var Catalogue = function () {
    this.categories = {};
  };

  Catalogue.prototype = {
    add: function (name, el) {
      if (this.categories[name] === undefined) {
        this.categories[name] = [];
      }
      this.categories[name].push(el);
      return this;
    },
    getCategories: function (names) {
      if (names.length === 0) return [];

      var category = this.categories[names[0]];

      return (category === undefined ? [] : category).
        concat(this.getCategories(names.slice(1)));
    }
  };

  // takes an array selectors and categorizes them
  function categorize (selectors) {
    return selectors.reduce(function (accumulator, selector) {
      accumulator.add(selectorType(selector), selector);
      return accumulator;
    }, new Catalogue());
  };

  // takes a selector and returns what type of selector it is based on the first char
  var selectorType = function (selector) {
    switch(selector.charAt(0)) {
      case "#":
        return "ids";
        break;
      case ".":
        return "classes";
        break;
      case "[":
        return "attributes";
        break;
      case ":":
        return string.slice(1, 2) === ":" ? "pseudoElements" : "pseudoClasses";
        break;
      default:
        return "nodes";
        break;
    }
  };

  // Shims

  if (Array.prototype.indexOf === undefined) {
    var inArray = function (array,object) {
      for (var i = 0; i < array.length; i++) {
        if(array[i] === object) {
            return i;
        }
      };
      return -1;
    };
  }

  if (Array.prototype.map === undefined) {
    Array.prototype.map = function(thisFunction) {
      var result = [];
      for (var i = 0; i < this.length; i++) {
        result.push(thisFunction(this[i]));
      }
      return result;
    }
  }

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
  }

  exports.specifyMe = inputRouter;

})(this);
