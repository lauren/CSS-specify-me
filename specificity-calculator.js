;(function (exports) {
  // does not include the :not pseudoclass, which does not contribute to specificity calc
  var pseudoClasses = [":link", ":visited", ":hover", ":active", ":target", ":lang", ":focus", 
                       ":enabled", ":disabled", ":checked", ":indeterminate", ":root", ":nth-child",
                       ":nth-last-child", ":nth-of-type", ":nth-last-of-type", ":first-child",
                       ":last-child", ":first-of-type", ":last-of-type", ":only-child",
                       ":only-of-type", ":empty"],
      pseudoElements = ["::first-line", "::first-letter", "::before", "::after"];


  var calculateSpecificity = function (selectors) {
    var selectorObjectArray = parseSelectors(selectors),
        specificity = [0,0,0],
        calculateArraySpecificity = function (selectorObjectArray) {
          if (selectorObjectArray.length === 0) {
            return specificity;
          } else if (selectorObjectArray.length === 1) {
            specificity = sumSpecificityArrays(specificity, calculateObjectSpecificity(selectorObjectArray[0]));
          } else {
            specificity = sumSpecificityArrays(specificity, calculateObjectSpecificity(selectorObjectArray[0]));
            if (selectorObjectArray.length > 1) {
              calculateArraySpecificity(selectorObjectArray.slice(1,selectorObjectArray.length));
            }
          }
          return specificity;
        };
    return calculateArraySpecificity(selectorObjectArray);
  };

  // requires two specificity arrays of the same length
  var sumSpecificityArrays = function (array1, array2) {
    var summedArray = [],
        sumArrays = function (xs, ys) {
          if (xs.length === 0) {
            return summedArray;
          } else {
            summedArray.push(xs[0] + ys[0]);
            if (xs.length > 1) {
              sumArrays(xs.slice(1,xs.length), ys.slice(1,ys.length));
            }
          }
          return summedArray;
        };
    return sumArrays(array1,array2);
  };

  // calculates specificity of one selector object
  var calculateObjectSpecificity = function (selectorObject) {
    var specificity = [0,0,0];
    for (type in selectorObject) {
      switch (type) {
        case "node": case "pseudoElement":
          specificity[2] += 1;
          break;
        case "classes": case "pseudoClasses": case "attributes":
          specificity[1] += selectorObject[type].length;
          break;
        case "id":
          specificity[0] += 1;
          break;
      }
    }
    return specificity;
  };

  var parseSelectors = function (selectors) {
    selectors = selectors.split(/(\s|\*|\+|\~|\<)/);
    console.log(selectors);
    // change each selector into object with ID/class/node property based
    // on first character
    // we're going from ["node.class", "node#id", "#id.class.class", ".class.class"] to
    // [{node: 'node.class'}, {node: 'node#id'}, {id: #id.class.class}, {classes: ["class.class"]}]
    for (var i = 0; i < selectors.length; i++) {
      switch(selectors[i].charAt(0)) {
      case "*": case "+": case "~": case "<": case ">": case "": case " ":
          selectors[i] = {wildcardOrCombinator: selectors[i]};
          break;
      case "#":
          selectors[i] = {id: selectors[i]};
          break;
      case ".":
          selectors[i] = {classes: [selectors[i]]};
          break;
      default:
          selectors[i] = {node: selectors[i]};
      }
    };
      
    // find additional classes and IDs in the main selector to flush out the object
    // we're going from 
    // [{node: 'node.class'}, {node: 'node#id'}, {id: #id.class.class}, {classes: ["class.class"]}] to
    // [{node: "node", classes: [".class"]}, {node: "node", id: "#id"}, 
    // {id: "#id", classes: [".class", ".class"]}, {classes: [".class", ".class"]}]
    for (var i = 0; i < selectors.length; i++) {
      if (selectors[i].classes) {
        selectors[i].classes = findClasses(selectors[i].classes[0]);
      }
      if (selectors[i].node) {
        if (/#/.test(selectors[i].node)) {
          selectors[i] = findNodeIds(selectors[i].node);
        }
        if (/\./.test(selectors[i].node)) {
          selectors[i].classes = findClasses(selectors[i].node);
          selectors[i].node = selectors[i].node.split(".")[0];
        }
      }
      if (selectors[i].id) {
        if (/\./.test(selectors[i].id)) {
          selectors[i].classes = findClasses(selectors[i].id);
          selectors[i].id = selectors[i].id.split(".")[0];
        }
      }
      for (type in selectors[i]) {
        if (/::/.test(selectors[i][type])) {
          selectors[i].pseudoElement = findPseudoElements(selectors[i][type]);
          selectors[i][type] = selectors[i][type].split("::")[0];
        }
        if (/:/.test(selectors[i][type])) {
          selectors[i].pseudos = findPseudos(selectors[i][type]);
          selectors[i][type] = selectors[i][type].split(":")[0];
        }
        if (/(\[|\])/.test(selectors[i][type])) {
          selectors[i].attributes = findAttributes(selectors[i][type]);
          selectors[i][type] = selectors[i][type].split("[")[0];
        }
      }
      if (selectors[i].pseudos) {
        selectors[i].pseudoClasses = []
        for (var j = 0; j < selectors[i].pseudos.length; j++) {
          if (inArray(pseudoElements, ":" + selectors[i].pseudos[j])) { //FIX ME
            selectors[i].pseudoElement = ":" + selectors[i].pseudos[j];
          } else if (inArray(pseudoClasses, selectors[i].pseudos[j])) {
            selectors[i].pseudoClasses.push(selectors[i].pseudos[j]);
          }
        }
        delete selectors[i].pseudos;
      }
    };
    return selectors;
  }

  // takes a string like "node#id" and returns an object like {node: node, id: id}
  var findNodeIds = function (string) {
    var nodeAndId = string.split("#");
    return {
      node: nodeAndId[0], 
      id: "#" + nodeAndId[1]
    };
  };
  
  // takes a astring like "node.class.class" and returns an array like "[class, class]" TBD: does it include leading class?
  var findClasses = function (string) {
    var classes = string.split(".");
    classes.shift();
    for (var i = 0; i < classes.length; i++) {
      classes[i] = "." + classes[i];
    }
    return classes;
  };

  // takes a string like "node::pseudo-element" and returns a string like "::pseudo-element"
  var findPseudoElements = function (string) {
    var mainAndPseudo = string.split("::");
    return "::" + mainAndPseudo[1];
  };

  // takes a string like "node:pseudo-selector:pseudo-selector" and returns an array like 
  // [":pseudo-selector", "pseudo-selector"]
  var findPseudos = function (string) {
    var pseudos = string.split(":");
    pseudos.shift();
    for (var i = 0; i < pseudos.length; i++) {
      if (/\(/.test(pseudos[i])) { // strip out any parameters passed to pseudo elements
        pseudos[i].split(")");
        pseudos[i] = pseudos[i][0];
      }
      pseudos[i] = ":" + pseudos[i];
    }
    return pseudos;
  };

  // takes a string like "node[attribute][attribute]" and returns an array like 
  // [attribute, attribute]
  var findAttributes = function (string) {
    var attributes = string.split(/(\[|\])/),
        cleanedAttributes = [];
    attributes.shift();
    for (var i = 0; i < attributes.length; i++) {
      switch(attributes[i]) {
        case "": case "[": case "]":
          delete attributes[i];
          break;
        default:
          cleanedAttributes.push(attributes[i]);
          break;
      }
    }
    for (var i = 0; i < cleanedAttributes.length; i++) {
      attributes[i] = "[" + attributes[i] + "]";
    }
    return cleanedAttributes;
  }

  // because IE doesn't like indexOf
  var inArray = function (array,object) {
    for (var i = 0; i < array.length; i++) {
      if(array[i] === object) {
          return true;
      }
    };
    return false;
  };

  exports.specifyMe = calculateSpecificity;

})(this);