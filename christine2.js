(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, finaliseTag, formatTag, headTagFilter, headTagType, headTags, ignorableType, moduleFilter, moduleType, processHierarchy, processTypes, scriptType, selfClosingTags, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

  selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link'];

  headTags = ['meta', 'title', 'style', 'class', 'link'];

  tagType = 0; //if no another type found and this is not a script

  tagFilter = /^\s*\w+ *(( +\w+)?( *)?( +is( +.*)?)?)?$/i;

  tagPropertyType = 1; //if found property "something"

  tagPropertyFilter = /^\s*[\w\-]+ *".*"/;

  styleClassType = 2; //if this is tag and the tag is style

  styleClassFilter = /^\s*(style|class)\s+[\w:_-]+/i;

  stylePropertyType = 3; //if found property: something

  stylePropertyFilter = /^\s*[^"' ]+ *: *.*/i;

  stringType = 4; //if found "string"

  stringFilter = /^\s*".*"/i;

  scriptType = 5; //if it is under the script tag

  variableType = 6; // if found name = something

  variableFilter = /^\s*\w+\s*=\s*[\w\W]+/i;

  headTagType = 7;

  headTagFilter = /^\s*(meta|title|link|base)/i;

  moduleType = 8;

  moduleFilter = /^\s*include\s*".+.chris"/i;

  ignorableType = -2;

  emptyFilter = /^[\W\s_]*$/;

  commentFilter = /^\s*#/i;

  this.christine = {
    christinize: function(sourceText) {
      var chrisFile;
      chrisFile = {
        source: [],
        inProgressLines: {
          level: -1,
          children: [],
          source: 'html',
          type: 0,
          properties: [],
          styles: []
        },
        final: ''
      };
      chrisFile.inProgressLines.parent = chrisFile.inProgressLines;
      chrisFile.source = cleanupLines(sourceText.split('\n'));
      processHierarchy(chrisFile);
      processTypes(chrisFile.inProgressLines);
      sortByTypes(chrisFile.inProgressLines);
      finaliseTag(chrisFile.inProgressLines);
      console.log(chrisFile.inProgressLines.final);
      chrisFile.final = chrisFile.inProgressLines.final;
      return console.log(chrisFile);
    }
  };

  cleanupLines = function(sourceLines) {
    var j, len, line, newSourceLines;
    newSourceLines = new Array;
    for (j = 0, len = sourceLines.length; j < len; j++) {
      line = sourceLines[j];
      if (analiseType(line) !== -2) {
        console.log("pushing line: " + line);
        newSourceLines.push(line);
      }
    }
    return newSourceLines;
  };

  analiseType = function(line) {
    var lineType;
    lineType = -1;
    if (commentFilter.test(line)) {
      lineType = ignorableType;
    }
    if (emptyFilter.test(line)) {
      lineType = ignorableType;
    }
    if (stylePropertyFilter.test(line)) {
      lineType = stylePropertyType;
    }
    if (tagFilter.test(line)) {
      lineType = tagType;
    }
    if (headTagFilter.test(line)) {
      lineType = headTagType;
    }
    if (styleClassFilter.test(line)) {
      lineType = styleClassType;
    }
    if (tagPropertyFilter.test(line)) {
      lineType = tagPropertyType;
    }
    if (stringFilter.test(line)) {
      lineType = stringType;
    }
    if (variableFilter.test(line)) {
      lineType = variableType;
    }
    if (moduleFilter.test(line)) {
      lineType = moduleType;
    }
    return lineType;
  };

  countSpaces = function(line) {
    var spaces;
    spaces = 0;
    if (line[0] === ' ') {
      while (line[spaces] === ' ') {
        spaces += 1;
      }
    }
    return spaces;
  };

  processHierarchy = function(file) {
    var currentChild, currentParent, j, line, lineLevel, newLine, ref, results;
    currentParent = file.inProgressLines;
    currentChild = file.inProgressLines;
    results = [];
    for (line = j = 0, ref = file.source.length; (0 <= ref ? j < ref : j > ref); line = 0 <= ref ? ++j : --j) {
      lineLevel = countSpaces(file.source[line]);
      if (lineLevel >= currentParent.level) {
        if (lineLevel > currentChild.level) {
          currentParent = currentChild;
        }
        newLine = {
          source: file.source[line].slice(lineLevel),
          children: [],
          parent: currentParent,
          level: lineLevel,
          properties: [],
          styles: []
        };
        currentParent.children.push(newLine);
        results.push(currentChild = newLine);
      } else {
        while (lineLevel <= currentParent.level) {
          currentParent = currentParent.parent;
        }
        newLine = {
          source: file.source[line].slice(lineLevel),
          children: [],
          parent: currentParent,
          level: lineLevel,
          properties: [],
          styles: []
        };
        currentParent.children.push(newLine);
        results.push(currentChild = newLine);
      }
    }
    return results;
  };

  processTypes = function(lines) {
    var j, len, line, ref, results;
    ref = lines.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      line = ref[j];
      if (line.source) {
        line.type = analiseType(line.source);
      } else {
        line.type = -2;
      }
      if (line.children.length > 0) {
        results.push(processTypes(line));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  sortByTypes = function(lines) {
    var j, lastChild, line, ref, results;
    // extract the styles, properties and strings to their parents
    lastChild = lines.children.length - 1;
    results = [];
    for (line = j = ref = lastChild; (ref <= 0 ? j <= 0 : j >= 0); line = ref <= 0 ? ++j : --j) {
      if (lines.children[line].children.length > 0) {
        sortByTypes(lines.children[line]);
      }
      if (lines.children[line].type === tagPropertyType) {
        if (!lines.children[line].parent.properties) {
          lines.children[line].parent.properties = new Array;
        }
        lines.children[line].parent.properties.push(lines.children[line]);
        lines.children[line].parent.children.splice(line, 1);
        continue;
      }
      if (lines.children[line].type === stylePropertyType) {
        if (!lines.children[line].parent.styles) {
          lines.children[line].parent.styles = new Array;
        }
        lines.children[line].parent.styles.push(lines.children[line]);
        lines.children[line].parent.children.splice(line, 1);
        continue;
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  finaliseTag = function(line) {
    var addSpaces, child, i, j, k, l, len, len1, len2, len3, lineStyle, m, n, property, ref, ref1, ref2, ref3, ref4, style;
    addSpaces = '';
    if (line.level > 0) {
      for (i = j = 0, ref = line.level; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
        addSpaces += ' ';
      }
    }
    if (line.type === 0) {
      formatTag(line);
      line.final = addSpaces + '<' + line.source;
      if (line.styles.length > 0) {
        lineStyle = 'style "';
        ref1 = line.styles;
        for (k = 0, len = ref1.length; k < len; k++) {
          style = ref1[k];
          lineStyle += style.source + ';';
        }
        lineStyle += '"';
        line.properties.push(lineStyle);
      }
      if (line.properties.length > 0) {
        line.final += ' ';
        ref2 = line.properties;
        for (l = 0, len1 = ref2.length; l < len1; l++) {
          property = ref2[l];
          line.final += property + ' ';
        }
        line.final = line.final.slice(0, -1);
      }
      line.final += '>\n';
      if (line.children.length > 0) {
        ref3 = line.children;
        for (m = 0, len2 = ref3.length; m < len2; m++) {
          child = ref3[m];
          finaliseTag(child);
        }
        ref4 = line.children;
        for (n = 0, len3 = ref4.length; n < len3; n++) {
          child = ref4[n];
          line.final += child.final;
        }
      }
      return line.final += addSpaces + '</' + line.source + '>\n';
    } else {
      return line.final = addSpaces + line.source + '\n';
    }
  };

  formatTag = function(tag) {
    var j, len, tagArray, tagClass, tagClasses;
    tagArray = tag.source.split(/\s+/);
    tag.source = tagArray[0];
    console.log(tag.source);
    tagArray.splice(0, 1);
    if (tagArray.length > 0) {
      if (tagArray[0] !== 'is') {
        tag.properties.push('id "' + tagArray[0] + '"');
        tagArray.splice(0, 1);
      }
      if (tagArray[0] === 'is') {
        tagArray.splice(0, 1);
        tagClasses = 'class "';
        for (j = 0, len = tagArray.length; j < len; j++) {
          tagClass = tagArray[j];
          tagClasses += tagClass + ' ';
        }
        tagClasses = tagClasses.slice(0, -1);
        tagClasses += '"';
        tag.properties.push(tagClasses);
      }
    }
    return tag;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsU0FBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxlQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxjQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFNBQUEsRUFBQSxpQkFBQSxFQUFBLGVBQUEsRUFBQSxPQUFBLEVBQUEsY0FBQSxFQUFBOztFQUVBLGVBQUEsR0FBa0IsQ0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE9BQWQsRUFBdUIsSUFBdkIsRUFBNkIsTUFBN0IsRUFBcUMsTUFBckM7O0VBQ2xCLFFBQUEsR0FBVyxDQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLE9BQWxCLEVBQTJCLE9BQTNCLEVBQW9DLE1BQXBDOztFQUVYLE9BQUEsR0FBc0IsRUFMdEI7O0VBTUEsU0FBQSxHQUFzQjs7RUFFdEIsZUFBQSxHQUFzQixFQVJ0Qjs7RUFTQSxpQkFBQSxHQUFzQjs7RUFFdEIsY0FBQSxHQUFzQixFQVh0Qjs7RUFZQSxnQkFBQSxHQUFzQjs7RUFFdEIsaUJBQUEsR0FBc0IsRUFkdEI7O0VBZUEsbUJBQUEsR0FBc0I7O0VBRXRCLFVBQUEsR0FBc0IsRUFqQnRCOztFQWtCQSxZQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCLEVBcEJ0Qjs7RUFzQkEsWUFBQSxHQUFzQixFQXRCdEI7O0VBdUJBLGNBQUEsR0FBc0I7O0VBRXRCLFdBQUEsR0FBc0I7O0VBQ3RCLGFBQUEsR0FBc0I7O0VBRXRCLFVBQUEsR0FBc0I7O0VBQ3RCLFlBQUEsR0FBc0I7O0VBRXRCLGFBQUEsR0FBc0IsQ0FBQzs7RUFDdkIsV0FBQSxHQUFzQjs7RUFDdEIsYUFBQSxHQUFzQjs7RUFTdEIsSUFBQyxDQUFBLFNBQUQsR0FDSTtJQUFBLFdBQUEsRUFBYyxRQUFBLENBQUMsVUFBRCxDQUFBO0FBQ1YsVUFBQTtNQUFBLFNBQUEsR0FDSTtRQUFBLE1BQUEsRUFBUyxFQUFUO1FBQ0EsZUFBQSxFQUNJO1VBQUEsS0FBQSxFQUFRLENBQUMsQ0FBVDtVQUNBLFFBQUEsRUFBVyxFQURYO1VBRUEsTUFBQSxFQUFTLE1BRlQ7VUFHQSxJQUFBLEVBQU8sQ0FIUDtVQUlBLFVBQUEsRUFBYSxFQUpiO1VBS0EsTUFBQSxFQUFTO1FBTFQsQ0FGSjtRQVNBLEtBQUEsRUFBUTtNQVRSO01BV0osU0FBUyxDQUFDLGVBQWUsQ0FBQyxNQUExQixHQUFtQyxTQUFTLENBQUM7TUFFN0MsU0FBUyxDQUFDLE1BQVYsR0FBbUIsWUFBQSxDQUFhLFVBQVUsQ0FBQyxLQUFYLENBQWlCLElBQWpCLENBQWI7TUFFbkIsZ0JBQUEsQ0FBaUIsU0FBakI7TUFDQSxZQUFBLENBQWEsU0FBUyxDQUFDLGVBQXZCO01BQ0EsV0FBQSxDQUFZLFNBQVMsQ0FBQyxlQUF0QjtNQUNBLFdBQUEsQ0FBWSxTQUFTLENBQUMsZUFBdEI7TUFFQSxPQUFPLENBQUMsR0FBUixDQUFZLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBdEM7TUFDQSxTQUFTLENBQUMsS0FBVixHQUFrQixTQUFTLENBQUMsZUFBZSxDQUFDO2FBRTVDLE9BQU8sQ0FBQyxHQUFSLENBQVksU0FBWjtJQXpCVTtFQUFkOztFQW1DSixZQUFBLEdBQWUsUUFBQSxDQUFDLFdBQUQsQ0FBQTtBQUNYLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7SUFBQSxjQUFBLEdBQWlCLElBQUk7SUFFckIsS0FBQSw2Q0FBQTs7TUFDSSxJQUFHLFdBQUEsQ0FBWSxJQUFaLENBQUEsS0FBcUIsQ0FBQyxDQUF6QjtRQUNJLE9BQU8sQ0FBQyxHQUFSLENBQVksZ0JBQUEsR0FBbUIsSUFBL0I7UUFDQSxjQUFjLENBQUMsSUFBZixDQUFvQixJQUFwQixFQUZKOztJQURKO1dBS0E7RUFSVzs7RUFXZixXQUFBLEdBQWMsUUFBQSxDQUFDLElBQUQsQ0FBQTtBQUNWLFFBQUE7SUFBQSxRQUFBLEdBQVcsQ0FBQztJQUVaLElBQTRCLGFBQWEsQ0FBQyxJQUFkLENBQW1CLElBQW5CLENBQTVCO01BQUEsUUFBQSxHQUFXLGNBQVg7O0lBQ0EsSUFBNEIsV0FBVyxDQUFDLElBQVosQ0FBaUIsSUFBakIsQ0FBNUI7TUFBQSxRQUFBLEdBQVcsY0FBWDs7SUFDQSxJQUFnQyxtQkFBbUIsQ0FBQyxJQUFwQixDQUF5QixJQUF6QixDQUFoQztNQUFBLFFBQUEsR0FBVyxrQkFBWDs7SUFDQSxJQUFzQixTQUFTLENBQUMsSUFBVixDQUFlLElBQWYsQ0FBdEI7TUFBQSxRQUFBLEdBQVcsUUFBWDs7SUFDQSxJQUEwQixhQUFhLENBQUMsSUFBZCxDQUFtQixJQUFuQixDQUExQjtNQUFBLFFBQUEsR0FBVyxZQUFYOztJQUNBLElBQTZCLGdCQUFnQixDQUFDLElBQWpCLENBQXNCLElBQXRCLENBQTdCO01BQUEsUUFBQSxHQUFXLGVBQVg7O0lBQ0EsSUFBOEIsaUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsSUFBdkIsQ0FBOUI7TUFBQSxRQUFBLEdBQVcsZ0JBQVg7O0lBQ0EsSUFBeUIsWUFBWSxDQUFDLElBQWIsQ0FBa0IsSUFBbEIsQ0FBekI7TUFBQSxRQUFBLEdBQVcsV0FBWDs7SUFDQSxJQUEyQixjQUFjLENBQUMsSUFBZixDQUFvQixJQUFwQixDQUEzQjtNQUFBLFFBQUEsR0FBVyxhQUFYOztJQUNBLElBQXlCLFlBQVksQ0FBQyxJQUFiLENBQWtCLElBQWxCLENBQXpCO01BQUEsUUFBQSxHQUFXLFdBQVg7O1dBRUE7RUFkVTs7RUFtQmQsV0FBQSxHQUFjLFFBQUEsQ0FBQyxJQUFELENBQUE7QUFDVixRQUFBO0lBQUEsTUFBQSxHQUFTO0lBQ1QsSUFBRyxJQUFLLENBQUEsQ0FBQSxDQUFMLEtBQVcsR0FBZDtBQUNJLGFBQU0sSUFBSyxDQUFBLE1BQUEsQ0FBTCxLQUFnQixHQUF0QjtRQUNJLE1BQUEsSUFBVTtNQURkLENBREo7O1dBSUE7RUFOVTs7RUFhZCxnQkFBQSxHQUFtQixRQUFBLENBQUMsSUFBRCxDQUFBO0FBQ2YsUUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7SUFBQSxhQUFBLEdBQWdCLElBQUksQ0FBQztJQUNyQixZQUFBLEdBQWUsSUFBSSxDQUFDO0FBRXBCO0lBQUEsS0FBWSxtR0FBWjtNQUNJLFNBQUEsR0FBWSxXQUFBLENBQVksSUFBSSxDQUFDLE1BQU8sQ0FBQSxJQUFBLENBQXhCO01BRVosSUFBRyxTQUFBLElBQWEsYUFBYSxDQUFDLEtBQTlCO1FBQ0ksSUFBRyxTQUFBLEdBQVksWUFBWSxDQUFDLEtBQTVCO1VBQ0ksYUFBQSxHQUFnQixhQURwQjs7UUFHQSxPQUFBLEdBQ0k7VUFBQSxNQUFBLEVBQVMsSUFBSSxDQUFDLE1BQU8sQ0FBQSxJQUFBLENBQUssQ0FBQyxLQUFsQixDQUF3QixTQUF4QixDQUFUO1VBQ0EsUUFBQSxFQUFXLEVBRFg7VUFFQSxNQUFBLEVBQVMsYUFGVDtVQUdBLEtBQUEsRUFBUSxTQUhSO1VBSUEsVUFBQSxFQUFhLEVBSmI7VUFLQSxNQUFBLEVBQVM7UUFMVDtRQU9KLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBdkIsQ0FBNEIsT0FBNUI7cUJBQ0EsWUFBQSxHQUFlLFNBYm5CO09BQUEsTUFBQTtBQWdCSSxlQUFNLFNBQUEsSUFBYSxhQUFhLENBQUMsS0FBakM7VUFDSSxhQUFBLEdBQWdCLGFBQWEsQ0FBQztRQURsQztRQUdBLE9BQUEsR0FDSTtVQUFBLE1BQUEsRUFBUyxJQUFJLENBQUMsTUFBTyxDQUFBLElBQUEsQ0FBSyxDQUFDLEtBQWxCLENBQXdCLFNBQXhCLENBQVQ7VUFDQSxRQUFBLEVBQVcsRUFEWDtVQUVBLE1BQUEsRUFBUyxhQUZUO1VBR0EsS0FBQSxFQUFRLFNBSFI7VUFJQSxVQUFBLEVBQWEsRUFKYjtVQUtBLE1BQUEsRUFBUztRQUxUO1FBT0osYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUF2QixDQUE0QixPQUE1QjtxQkFDQSxZQUFBLEdBQWUsU0E1Qm5COztJQUhKLENBQUE7O0VBSmU7O0VBMkNuQixZQUFBLEdBQWUsUUFBQSxDQUFDLEtBQUQsQ0FBQTtBQUNYLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUE7QUFBQTtJQUFBLEtBQUEscUNBQUE7O01BQ0ksSUFBRyxJQUFJLENBQUMsTUFBUjtRQUNJLElBQUksQ0FBQyxJQUFMLEdBQVksV0FBQSxDQUFZLElBQUksQ0FBQyxNQUFqQixFQURoQjtPQUFBLE1BQUE7UUFHSSxJQUFJLENBQUMsSUFBTCxHQUFZLENBQUMsRUFIakI7O01BS0EsSUFBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQWQsR0FBdUIsQ0FBMUI7cUJBQ0ksWUFBQSxDQUFhLElBQWIsR0FESjtPQUFBLE1BQUE7NkJBQUE7O0lBTkosQ0FBQTs7RUFEVzs7RUFZZixXQUFBLEdBQWMsUUFBQSxDQUFDLEtBQUQsQ0FBQTtBQUdWLFFBQUEsQ0FBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUE7O0lBQUEsU0FBQSxHQUFZLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBZixHQUF3QjtBQUVwQztJQUFBLEtBQVkscUZBQVo7TUFDSSxJQUFHLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsUUFBUSxDQUFDLE1BQTlCLEdBQXVDLENBQTFDO1FBQ0ksV0FBQSxDQUFZLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUEzQixFQURKOztNQUdBLElBQUcsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxJQUFyQixLQUE2QixlQUFoQztRQUNJLElBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFoQztVQUNJLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsTUFBTSxDQUFDLFVBQTVCLEdBQXlDLElBQUksTUFEakQ7O1FBR0EsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQXZDLENBQTRDLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUEzRDtRQUNBLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFyQyxDQUE0QyxJQUE1QyxFQUFtRCxDQUFuRDtBQUVBLGlCQVBKOztNQVNBLElBQUcsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxJQUFyQixLQUE2QixpQkFBaEM7UUFDSSxJQUFHLENBQUMsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxNQUFNLENBQUMsTUFBaEM7VUFDSSxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUE1QixHQUFxQyxJQUFJLE1BRDdDOztRQUdBLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFuQyxDQUF3QyxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBdkQ7UUFDQSxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBckMsQ0FBNEMsSUFBNUMsRUFBbUQsQ0FBbkQ7QUFFQSxpQkFQSjtPQUFBLE1BQUE7NkJBQUE7O0lBYkosQ0FBQTs7RUFMVTs7RUE0QmQsV0FBQSxHQUFjLFFBQUEsQ0FBQyxJQUFELENBQUE7QUFDVixRQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxRQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQTtJQUFBLFNBQUEsR0FBWTtJQUNaLElBQUcsSUFBSSxDQUFDLEtBQUwsR0FBYSxDQUFoQjtNQUNxQixLQUFTLHVGQUFUO1FBQWpCLFNBQUEsSUFBYTtNQUFJLENBRHJCOztJQUlBLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxDQUFoQjtNQUNJLFNBQUEsQ0FBVSxJQUFWO01BQ0EsSUFBSSxDQUFDLEtBQUwsR0FBYSxTQUFBLEdBQVksR0FBWixHQUFrQixJQUFJLENBQUM7TUFFcEMsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQVosR0FBcUIsQ0FBeEI7UUFDSSxTQUFBLEdBQVk7QUFDWjtRQUFBLEtBQUEsc0NBQUE7O1VBQ0ksU0FBQSxJQUFhLEtBQUssQ0FBQyxNQUFOLEdBQWU7UUFEaEM7UUFHQSxTQUFBLElBQWE7UUFDYixJQUFJLENBQUMsVUFBVSxDQUFDLElBQWhCLENBQXFCLFNBQXJCLEVBTko7O01BUUEsSUFBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQWhCLEdBQXlCLENBQTVCO1FBQ0ksSUFBSSxDQUFDLEtBQUwsSUFBYztBQUNkO1FBQUEsS0FBQSx3Q0FBQTs7VUFDSSxJQUFJLENBQUMsS0FBTCxJQUFjLFFBQUEsR0FBVztRQUQ3QjtRQUdBLElBQUksQ0FBQyxLQUFMLEdBQWEsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFYLENBQWlCLENBQWpCLEVBQW9CLENBQUMsQ0FBckIsRUFMakI7O01BTUEsSUFBSSxDQUFDLEtBQUwsSUFBYztNQUdkLElBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFkLEdBQXVCLENBQTFCO0FBQ0k7UUFBQSxLQUFBLHdDQUFBOztVQUNJLFdBQUEsQ0FBWSxLQUFaO1FBREo7QUFHQTtRQUFBLEtBQUEsd0NBQUE7O1VBQ0ksSUFBSSxDQUFDLEtBQUwsSUFBYyxLQUFLLENBQUM7UUFEeEIsQ0FKSjs7YUFPQSxJQUFJLENBQUMsS0FBTCxJQUFjLFNBQUEsR0FBWSxJQUFaLEdBQW1CLElBQUksQ0FBQyxNQUF4QixHQUFpQyxNQTVCbkQ7S0FBQSxNQUFBO2FBK0JJLElBQUksQ0FBQyxLQUFMLEdBQWEsU0FBQSxHQUFZLElBQUksQ0FBQyxNQUFqQixHQUEwQixLQS9CM0M7O0VBTlU7O0VBd0NkLFNBQUEsR0FBWSxRQUFBLENBQUMsR0FBRCxDQUFBO0FBQ1IsUUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUE7SUFBQSxRQUFBLEdBQVcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFYLENBQWlCLEtBQWpCO0lBQ1gsR0FBRyxDQUFDLE1BQUosR0FBYSxRQUFTLENBQUEsQ0FBQTtJQUN0QixPQUFPLENBQUMsR0FBUixDQUFZLEdBQUcsQ0FBQyxNQUFoQjtJQUNBLFFBQVEsQ0FBQyxNQUFULENBQWdCLENBQWhCLEVBQWtCLENBQWxCO0lBRUEsSUFBRyxRQUFRLENBQUMsTUFBVCxHQUFrQixDQUFyQjtNQUNJLElBQUcsUUFBUyxDQUFBLENBQUEsQ0FBVCxLQUFlLElBQWxCO1FBQ0ksR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFmLENBQW9CLE1BQUEsR0FBUyxRQUFTLENBQUEsQ0FBQSxDQUFsQixHQUF1QixHQUEzQztRQUNBLFFBQVEsQ0FBQyxNQUFULENBQWdCLENBQWhCLEVBQWtCLENBQWxCLEVBRko7O01BSUEsSUFBRyxRQUFTLENBQUEsQ0FBQSxDQUFULEtBQWUsSUFBbEI7UUFDSSxRQUFRLENBQUMsTUFBVCxDQUFnQixDQUFoQixFQUFrQixDQUFsQjtRQUNBLFVBQUEsR0FBYTtRQUNiLEtBQUEsMENBQUE7O1VBQ0ksVUFBQSxJQUFjLFFBQUEsR0FBVztRQUQ3QjtRQUdBLFVBQUEsR0FBYSxVQUFVLENBQUMsS0FBWCxDQUFpQixDQUFqQixFQUFvQixDQUFDLENBQXJCO1FBQ2IsVUFBQSxJQUFjO1FBRWQsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFmLENBQW9CLFVBQXBCLEVBVEo7T0FMSjs7V0FnQkE7RUF0QlE7QUFwUFoiLCJzb3VyY2VzQ29udGVudCI6WyIjIExJTkUgVFlQRVNcblxuc2VsZkNsb3NpbmdUYWdzID0gWydicicsICdpbWcnLCAnaW5wdXQnLCAnaHInLCAnbWV0YScsICdsaW5rJ11cbmhlYWRUYWdzID0gWydtZXRhJywgJ3RpdGxlJywgJ3N0eWxlJywgJ2NsYXNzJywgJ2xpbmsnXVxuXG50YWdUeXBlICAgICAgICAgICAgID0gMCAjaWYgbm8gYW5vdGhlciB0eXBlIGZvdW5kIGFuZCB0aGlzIGlzIG5vdCBhIHNjcmlwdFxudGFnRmlsdGVyICAgICAgICAgICA9IC9eXFxzKlxcdysgKigoICtcXHcrKT8oICopPyggK2lzKCArLiopPyk/KT8kL2lcblxudGFnUHJvcGVydHlUeXBlICAgICA9IDEgI2lmIGZvdW5kIHByb3BlcnR5IFwic29tZXRoaW5nXCJcbnRhZ1Byb3BlcnR5RmlsdGVyICAgPSAvXlxccypbXFx3XFwtXSsgKlwiLipcIi9cblxuc3R5bGVDbGFzc1R5cGUgICAgICA9IDIgI2lmIHRoaXMgaXMgdGFnIGFuZCB0aGUgdGFnIGlzIHN0eWxlXG5zdHlsZUNsYXNzRmlsdGVyICAgID0gL15cXHMqKHN0eWxlfGNsYXNzKVxccytbXFx3Ol8tXSsvaVxuXG5zdHlsZVByb3BlcnR5VHlwZSAgID0gMyAjaWYgZm91bmQgcHJvcGVydHk6IHNvbWV0aGluZ1xuc3R5bGVQcm9wZXJ0eUZpbHRlciA9IC9eXFxzKlteXCInIF0rICo6ICouKi9pXG5cbnN0cmluZ1R5cGUgICAgICAgICAgPSA0ICNpZiBmb3VuZCBcInN0cmluZ1wiXG5zdHJpbmdGaWx0ZXIgICAgICAgID0gL15cXHMqXCIuKlwiL2lcblxuc2NyaXB0VHlwZSAgICAgICAgICA9IDUgI2lmIGl0IGlzIHVuZGVyIHRoZSBzY3JpcHQgdGFnXG5cbnZhcmlhYmxlVHlwZSAgICAgICAgPSA2ICMgaWYgZm91bmQgbmFtZSA9IHNvbWV0aGluZ1xudmFyaWFibGVGaWx0ZXIgICAgICA9IC9eXFxzKlxcdytcXHMqPVxccypbXFx3XFxXXSsvaVxuXG5oZWFkVGFnVHlwZSAgICAgICAgID0gN1xuaGVhZFRhZ0ZpbHRlciAgICAgICA9IC9eXFxzKihtZXRhfHRpdGxlfGxpbmt8YmFzZSkvaVxuXG5tb2R1bGVUeXBlICAgICAgICAgID0gOFxubW9kdWxlRmlsdGVyICAgICAgICA9IC9eXFxzKmluY2x1ZGVcXHMqXCIuKy5jaHJpc1wiL2lcblxuaWdub3JhYmxlVHlwZSAgICAgICA9IC0yXG5lbXB0eUZpbHRlciAgICAgICAgID0gL15bXFxXXFxzX10qJC9cbmNvbW1lbnRGaWx0ZXIgICAgICAgPSAvXlxccyojL2lcblxuXG5cblxuXG5cblxuXG5AY2hyaXN0aW5lID1cbiAgICBjaHJpc3Rpbml6ZSA6IChzb3VyY2VUZXh0KSAtPlxuICAgICAgICBjaHJpc0ZpbGUgPVxuICAgICAgICAgICAgc291cmNlIDogW11cbiAgICAgICAgICAgIGluUHJvZ3Jlc3NMaW5lcyA6IFxuICAgICAgICAgICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgc291cmNlIDogJ2h0bWwnXG4gICAgICAgICAgICAgICAgdHlwZSA6IDBcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIDogW11cbiAgICAgICAgICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgICAgICAgICBmaW5hbCA6ICcnXG4gICAgICAgIFxuICAgICAgICBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLnBhcmVudCA9IGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBjaHJpc0ZpbGUuc291cmNlID0gY2xlYW51cExpbmVzIHNvdXJjZVRleHQuc3BsaXQgJ1xcbidcblxuICAgICAgICBwcm9jZXNzSGllcmFyY2h5IGNocmlzRmlsZVxuICAgICAgICBwcm9jZXNzVHlwZXMgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICBzb3J0QnlUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGZpbmFsaXNlVGFnIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLmZpbmFsXG4gICAgICAgIGNocmlzRmlsZS5maW5hbCA9IGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcblxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGVcblxuXG5cblxuXG5cblxuXG5cbmNsZWFudXBMaW5lcyA9IChzb3VyY2VMaW5lcykgLT5cbiAgICBuZXdTb3VyY2VMaW5lcyA9IG5ldyBBcnJheVxuXG4gICAgZm9yIGxpbmUgaW4gc291cmNlTGluZXNcbiAgICAgICAgaWYgYW5hbGlzZVR5cGUobGluZSkgIT0gLTJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nIFwicHVzaGluZyBsaW5lOiBcIiArIGxpbmVcbiAgICAgICAgICAgIG5ld1NvdXJjZUxpbmVzLnB1c2ggbGluZVxuICAgIFxuICAgIG5ld1NvdXJjZUxpbmVzXG5cblxuYW5hbGlzZVR5cGUgPSAobGluZSkgLT5cbiAgICBsaW5lVHlwZSA9IC0xXG5cbiAgICBsaW5lVHlwZSA9IGlnbm9yYWJsZVR5cGUgaWYgY29tbWVudEZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IGlnbm9yYWJsZVR5cGUgaWYgZW1wdHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZVByb3BlcnR5VHlwZSBpZiBzdHlsZVByb3BlcnR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdGFnVHlwZSBpZiB0YWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBoZWFkVGFnVHlwZSBpZiBoZWFkVGFnRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3R5bGVDbGFzc1R5cGUgaWYgc3R5bGVDbGFzc0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHRhZ1Byb3BlcnR5VHlwZSBpZiB0YWdQcm9wZXJ0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0cmluZ1R5cGUgaWYgc3RyaW5nRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdmFyaWFibGVUeXBlIGlmIHZhcmlhYmxlRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gbW9kdWxlVHlwZSBpZiBtb2R1bGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgXG4gICAgbGluZVR5cGVcblxuXG5cblxuY291bnRTcGFjZXMgPSAobGluZSkgLT5cbiAgICBzcGFjZXMgPSAwXG4gICAgaWYgbGluZVswXSA9PSAnICdcbiAgICAgICAgd2hpbGUgbGluZVtzcGFjZXNdID09ICcgJ1xuICAgICAgICAgICAgc3BhY2VzICs9IDFcbiAgICBcbiAgICBzcGFjZXNcblxuXG5cblxuXG5cbnByb2Nlc3NIaWVyYXJjaHkgPSAoZmlsZSkgLT5cbiAgICBjdXJyZW50UGFyZW50ID0gZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBjdXJyZW50Q2hpbGQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgZm9yIGxpbmUgaW4gWzAuLi5maWxlLnNvdXJjZS5sZW5ndGhdXG4gICAgICAgIGxpbmVMZXZlbCA9IGNvdW50U3BhY2VzIGZpbGUuc291cmNlW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZUxldmVsID49IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgIGlmIGxpbmVMZXZlbCA+IGN1cnJlbnRDaGlsZC5sZXZlbFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Q2hpbGRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbGluZUxldmVsIDw9IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cblxuXG5cblxuXG5cbnByb2Nlc3NUeXBlcyA9IChsaW5lcykgLT5cbiAgICBmb3IgbGluZSBpbiBsaW5lcy5jaGlsZHJlblxuICAgICAgICBpZiBsaW5lLnNvdXJjZVxuICAgICAgICAgICAgbGluZS50eXBlID0gYW5hbGlzZVR5cGUgbGluZS5zb3VyY2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGluZS50eXBlID0gLTJcbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgcHJvY2Vzc1R5cGVzIGxpbmVcblxuXG5cbnNvcnRCeVR5cGVzID0gKGxpbmVzKSAtPlxuICAgICMgZXh0cmFjdCB0aGUgc3R5bGVzLCBwcm9wZXJ0aWVzIGFuZCBzdHJpbmdzIHRvIHRoZWlyIHBhcmVudHNcblxuICAgIGxhc3RDaGlsZCA9IGxpbmVzLmNoaWxkcmVuLmxlbmd0aCAtIDFcblxuICAgIGZvciBsaW5lIGluIFtsYXN0Q2hpbGQuLjBdXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHNvcnRCeVR5cGVzIGxpbmVzLmNoaWxkcmVuW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSB0YWdQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQucHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV1cbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5jaGlsZHJlbi5zcGxpY2UgbGluZSAsIDFcblxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnR5cGUgPT0gc3R5bGVQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlcyA9IG5ldyBBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV1cbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5jaGlsZHJlbi5zcGxpY2UgbGluZSAsIDFcblxuICAgICAgICAgICAgY29udGludWVcblxuXG5maW5hbGlzZVRhZyA9IChsaW5lKSAtPlxuICAgIGFkZFNwYWNlcyA9ICcnXG4gICAgaWYgbGluZS5sZXZlbCA+IDBcbiAgICAgICAgYWRkU3BhY2VzICs9ICcgJyBmb3IgaSBpbiBbMC4ubGluZS5sZXZlbF1cblxuXG4gICAgaWYgbGluZS50eXBlID09IDBcbiAgICAgICAgZm9ybWF0VGFnIGxpbmVcbiAgICAgICAgbGluZS5maW5hbCA9IGFkZFNwYWNlcyArICc8JyArIGxpbmUuc291cmNlXG5cbiAgICAgICAgaWYgbGluZS5zdHlsZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgbGluZVN0eWxlID0gJ3N0eWxlIFwiJ1xuICAgICAgICAgICAgZm9yIHN0eWxlIGluIGxpbmUuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlICs9IHN0eWxlLnNvdXJjZSArICc7J1xuXG4gICAgICAgICAgICBsaW5lU3R5bGUgKz0gJ1wiJ1xuICAgICAgICAgICAgbGluZS5wcm9wZXJ0aWVzLnB1c2ggbGluZVN0eWxlXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lLnByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnICdcbiAgICAgICAgICAgIGZvciBwcm9wZXJ0eSBpbiBsaW5lLnByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBsaW5lLmZpbmFsICs9IHByb3BlcnR5ICsgJyAnXG4gICAgICAgIFxuICAgICAgICAgICAgbGluZS5maW5hbCA9IGxpbmUuZmluYWwuc2xpY2UgMCwgLTFcbiAgICAgICAgbGluZS5maW5hbCArPSAnPlxcbidcblxuXG4gICAgICAgIGlmIGxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgZm9yIGNoaWxkIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmaW5hbGlzZVRhZyBjaGlsZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gY2hpbGQuZmluYWxcbiAgICAgICAgXG4gICAgICAgIGxpbmUuZmluYWwgKz0gYWRkU3BhY2VzICsgJzwvJyArIGxpbmUuc291cmNlICsgJz5cXG4nXG4gICAgXG4gICAgZWxzZVxuICAgICAgICBsaW5lLmZpbmFsID0gYWRkU3BhY2VzICsgbGluZS5zb3VyY2UgKyAnXFxuJ1xuICAgIFxuICAgIFxuZm9ybWF0VGFnID0gKHRhZykgLT5cbiAgICB0YWdBcnJheSA9IHRhZy5zb3VyY2Uuc3BsaXQgL1xccysvXG4gICAgdGFnLnNvdXJjZSA9IHRhZ0FycmF5WzBdXG4gICAgY29uc29sZS5sb2cgdGFnLnNvdXJjZVxuICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG5cbiAgICBpZiB0YWdBcnJheS5sZW5ndGggPiAwXG4gICAgICAgIGlmIHRhZ0FycmF5WzBdICE9ICdpcydcbiAgICAgICAgICAgIHRhZy5wcm9wZXJ0aWVzLnB1c2ggJ2lkIFwiJyArIHRhZ0FycmF5WzBdICsgJ1wiJ1xuICAgICAgICAgICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcbiAgICAgICAgXG4gICAgICAgIGlmIHRhZ0FycmF5WzBdID09ICdpcydcbiAgICAgICAgICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG4gICAgICAgICAgICB0YWdDbGFzc2VzID0gJ2NsYXNzIFwiJ1xuICAgICAgICAgICAgZm9yIHRhZ0NsYXNzIGluIHRhZ0FycmF5XG4gICAgICAgICAgICAgICAgdGFnQ2xhc3NlcyArPSB0YWdDbGFzcyArICcgJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0YWdDbGFzc2VzID0gdGFnQ2xhc3Nlcy5zbGljZSAwLCAtMVxuICAgICAgICAgICAgdGFnQ2xhc3NlcyArPSAnXCInXG5cbiAgICAgICAgICAgIHRhZy5wcm9wZXJ0aWVzLnB1c2ggdGFnQ2xhc3Nlc1xuICAgIFxuICAgIHRhZyJdfQ==
//# sourceURL=coffeescript