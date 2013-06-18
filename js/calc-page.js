;(function () {

  window.onload = function () {
    var input = document.getElementById("input-one"),
        idScore = document.getElementById("id-score"),
        classesScore = document.getElementById("classes-score"),
        elementsScore = document.getElementById("elements-score");
        idComponents = document.getElementById("id-elements"),
        classesComponents = document.getElementById("classes-elements"),
        elementsComponents = document.getElementById("elements-elements");

    var initialize = function () {
      input.focus();
      updateSpecificity.apply(input);
      bindEvent(input, "keyup", resizeTextarea);
      bindEvent(input, "keyup", updateSpecificity);
    }

    // cross-browser event binder
    var bindEvent = function (element, event, thisFunction, params) {
      if (element.addEventListener) {
        element.addEventListener(event, thisFunction);
      } else {
        element.attachEvent(event, thisFunction);
      }
    };

    var resizeTextarea = function () {
      this.style.height = "95px";
      this.style.height = this.scrollHeight + "px";
    }

    var updateSpecificity = function () {
      var selectors = this.value,
          specificity = specifyMe(selectors),
          score = specificity.score,
          components = specificity.components,
          ids = components.ids.join(", ") || "",
          elements = components.elementsAndPseudoElements.join(", ") || "",
          classes = components.classesPseudoClassesAndAttributes.join(", ") || "";
      idScore.textContent = score[0];
      classesScore.textContent = score[1];
      elementsScore.textContent = score[2];
      idComponents.textContent = ids;
      elementsComponents.textContent = elements;
      classesComponents.textContent = classes;
    };

    initialize();

  };

})();