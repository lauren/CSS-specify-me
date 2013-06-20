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
      specialCharRegex = /^(\*|\+|\<|\>|\~|\s)+/;

  // checks if input is an array of selectors or a single selector and routes it appropriately
  var inputRouter = function (input) {
    return (typeof input === "string") ?
      calculateSpecificity(input) :
      input.map(calculateSpecificity);
  };

  // takes a single selector string, passes to parser, then calculates specificity
  // of resulting object
  var calculateSpecificity = function (selectors) {
    var selectorCatalogue = parse(lex(selectors)),
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

  var stripSpecialChars = function (string) {
    return string.replace(specialCharRegex, "");
  };

  // takes a selector string and tokenizes it, returning an array of subselectors
  var lex = function (s) {
    s = stripSpecialChars(s);

    if (s.length === 0) return [];

    var next = s.slice(1).search(delimiterRegex),
        next = (next >= 0) ? next + 1 : s.length,
        token = s.slice(0, next).replace(/\(|\)/, ""),
        rest  = s.slice(next);

    return [token].concat(lex(rest));
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

  // takes an array of tokens (subselectors), and categorizes them
  function parse(tokens) {
    return tokens.reduce(function (acc, token) {
      acc.add(stringType(token), token);
      return acc;
    }, new Catalogue());
  };

  // takes a string and returns what type of selector it is based on the first char
  var stringType = function (string) {
    switch(string.charAt(0)) {
      case "*": case "+": case "~": case "<": case ">":
        return "wildcardAndCombinators";
        break;
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

  // because IE doesn't like indexOf
  var inArray = function (array,object) {
    for (var i = 0; i < array.length; i++) {
      if(array[i] === object) {
          return true;
      }
    };
    return false;
  };

  // Shims

  if (Array.prototype.map === undefined) {
    Array.prototype.map = function(fn) {
      var res = [];
      for (var i = 0, len = this.length; i < len; i++) {
        res.push(fn(this[i]));
      }
      return res;
    }
  }

  if (Array.prototype.reduce === undefined) {
    Array.prototype.reduce = function(fn, acc) {
      if (this.length === 0 && acc === undefined) {
        throw new TypeError("Reduce of empty array with no initial value");
      }

      var i = 0;

      if (acc === undefined) {
        acc = this[0];
        i = 1;
      }

      for (var len=this.length; i < len; i++) {
        acc = fn(acc, this[i]);
      }

      return acc;
    }
  }

  exports.specifyMe = inputRouter;

})(this);
