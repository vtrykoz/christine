(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, finaliseTag, formatLevels, formatProperties, formatStrings, formatTag, formatTagStyles, headTagFilter, headTagType, headTags, ignorableType, indentLines, moduleFilter, moduleType, processHierarchy, processTypes, scriptType, selfClosingTags, sortByBodyHead, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

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
    christinize: function(sourceText, indent) {
      var chrisFile;
      chrisFile = {
        source: [],
        inProgressLines: {
          level: -1,
          children: [],
          source: 'html',
          type: 0,
          properties: [],
          styles: [],
          indent: indent
        },
        final: ''
      };
      chrisFile.inProgressLines.parent = chrisFile.inProgressLines;
      chrisFile.source = cleanupLines(sourceText.split('\n'));
      processHierarchy(chrisFile);
      console.log('hierarchy processed');
      processTypes(chrisFile.inProgressLines);
      console.log('types processed');
      sortByTypes(chrisFile.inProgressLines);
      console.log('type sorted');
      sortByBodyHead(chrisFile);
      console.log('body / head sorted');
      console.log(chrisFile.inProgressLines);
      finaliseTag(chrisFile.inProgressLines);
      console.log('tags finalized');
      console.log(chrisFile.inProgressLines.final);
      chrisFile.final = '<1doctype html>' + chrisFile.inProgressLines.final;
      return console.log(chrisFile);
    }
  };

  sortByBodyHead = function(file) {
    var addedToHead, bodyTag, headTag, headTagTemplate, j, k, len, len1, ref, tag;
    headTag = {
      level: -1,
      parent: file.inProgressLines,
      children: [],
      source: 'head',
      type: 0,
      properties: [],
      styles: []
    };
    bodyTag = {
      level: -1,
      parent: file.inProgressLines,
      children: [],
      source: 'body',
      type: 0,
      properties: [],
      styles: []
    };
    ref = file.inProgressLines.children;
    for (j = 0, len = ref.length; j < len; j++) {
      tag = ref[j];
      addedToHead = false;
      for (k = 0, len1 = headTags.length; k < len1; k++) {
        headTagTemplate = headTags[k];
        if (tag.source === headTagTemplate) {
          addedToHead = true;
          headTag.children.push(tag);
        }
      }
      if (!addedToHead) {
        bodyTag.children.push(tag);
      }
    }
    console.log(file.inProgressLines.children);
    file.inProgressLines.children = new Array;
    file.inProgressLines.children.push(headTag);
    file.inProgressLines.children.push(bodyTag);
    formatLevels(file.inProgressLines);
    return indentLines(file.inProgressLines);
  };

  indentLines = function(tag) {
    var child, j, len, ref, results;
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      child.indentation = child.level * tag.indent;
      child.indent = tag.indent;
      if (child.children) {
        results.push(indentLines(child));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  cleanupLines = function(sourceLines) {
    var j, len, line, newSourceLines;
    newSourceLines = new Array;
    for (j = 0, len = sourceLines.length; j < len; j++) {
      line = sourceLines[j];
      if (analiseType(line) !== -2) {
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
      if (lineLevel > currentParent.level) {
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
        lines.children[line].parent.properties.push(lines.children[line].source);
        lines.children[line].parent.children.splice(line, 1);
        continue;
      }
      if (lines.children[line].type === stylePropertyType) {
        if (!lines.children[line].parent.styles) {
          lines.children[line].parent.styles = new Array;
        }
        lines.children[line].parent.styles.push(lines.children[line].source);
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
    if (line.indentation > 0) {
      for (i = j = 0, ref = line.indentation; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
        addSpaces += ' ';
      }
    }
    if (line.type === 0) {
      formatTag(line);
      line.final = addSpaces + '<' + line.source;
      if (line.styles.length > 0) {
        lineStyle = 'style "';
        formatTagStyles(line);
        ref1 = line.styles;
        for (k = 0, len = ref1.length; k < len; k++) {
          style = ref1[k];
          lineStyle += style + ';';
        }
        lineStyle += '"';
        line.properties.push(lineStyle);
      }
      formatProperties(line);
      if (line.properties.length > 0) {
        line.final += ' ';
        ref2 = line.properties;
        for (l = 0, len1 = ref2.length; l < len1; l++) {
          property = ref2[l];
          line.final += property + ' ';
        }
        line.final = line.final.slice(0, -1);
      }
      line.final += '>';
      if (line.indent > 0) {
        line.final += '\n';
      }
      if (line.children.length > 0) {
        formatStrings(line);
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
      if (!line.selfClosing) {
        line.final += addSpaces + '</' + line.source + '>';
        if (line.indent > 0) {
          return line.final += '\n';
        }
      }
    }
  };

  formatTag = function(tag) {
    var j, k, len, len1, selfClosingTag, tagArray, tagClass, tagClasses;
    tagArray = tag.source.split(/\s+/);
    tag.source = tagArray[0];
    tag.selfClosing = false;
    for (j = 0, len = selfClosingTags.length; j < len; j++) {
      selfClosingTag = selfClosingTags[j];
      if (tag.source === selfClosingTag) {
        tag.selfClosing = true;
      }
    }
    tagArray.splice(0, 1);
    if (tagArray.length > 0) {
      if (tagArray[0] !== 'is') {
        tag.properties.push('id "' + tagArray[0] + '"');
        tagArray.splice(0, 1);
      }
      if (tagArray[0] === 'is') {
        tagArray.splice(0, 1);
        tagClasses = 'class "';
        for (k = 0, len1 = tagArray.length; k < len1; k++) {
          tagClass = tagArray[k];
          tagClasses += tagClass + ' ';
        }
        tagClasses = tagClasses.slice(0, -1);
        tagClasses += '"';
        tag.properties.push(tagClasses);
      }
    }
    return tag;
  };

  formatProperties = function(tag) {
    var j, len, newProperties, newProperty, property, propertyDetails, propertyDetailsSearch, propertyName, propertyNameSearch, ref;
    if (tag.properties.length > 0) {
      newProperties = new Array;
      ref = tag.properties;
      for (j = 0, len = ref.length; j < len; j++) {
        property = ref[j];
        newProperty = '=';
        propertyNameSearch = /^[\w\-]+( *)?"/i;
        propertyName = property.match(propertyNameSearch)[0];
        propertyName = propertyName.split(" ")[0];
        propertyName = propertyName.split('"')[0];
        newProperty = propertyName + newProperty;
        propertyDetailsSearch = /\".*\"/;
        propertyDetails = property.match(propertyDetailsSearch)[0];
        newProperty += propertyDetails;
        newProperties.push(newProperty);
      }
      return tag.properties = newProperties;
    }
  };

  formatStrings = function(tag) {
    var addSpaces, child, cleanString, fullStringSearch, i, j, k, len, ref, ref1, results;
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      addSpaces = '';
      if (child.indentation > 0) {
        for (i = k = 0, ref1 = child.indentation; (0 <= ref1 ? k <= ref1 : k >= ref1); i = 0 <= ref1 ? ++k : --k) {
          addSpaces += ' ';
        }
      }
      if (child.type === stringType) {
        fullStringSearch = /\".*\"/;
        cleanString = child.source.match(fullStringSearch)[0];
        cleanString = cleanString.slice(1, -1);
        child.final = addSpaces + cleanString;
        if (child.indent > 0 + "\n") {
          results.push(child.final += '\n');
        } else {
          results.push(void 0);
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  formatTagStyles = function(tag) {
    var afterArray, cleanStyleProperty, dividerPosition, j, k, len, propertyAfter, ref, ref1, results, style, x;
    ref = tag.styles;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      style = ref[j];
      dividerPosition = style.indexOf(':');
      propertyAfter = style.slice(dividerPosition + 1);
      cleanStyleProperty = style.split(':')[0] + ':';
      afterArray = propertyAfter.split(' ');
      for (x = k = 0, ref1 = afterArray.length; (0 <= ref1 ? k < ref1 : k > ref1); x = 0 <= ref1 ? ++k : --k) {
        if (afterArray[x] !== '') {
          cleanStyleProperty += afterArray[x];
          if (x < afterArray.length - 1) {
            cleanStyleProperty += ' ';
          }
        }
      }
      results.push(style = cleanStyleProperty);
    }
    return results;
  };

  formatLevels = function(tag) {
    var child, j, len, ref, results;
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      child.level = tag.level + 1;
      if (child.children) {
        results.push(formatLevels(child));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLFNBQUEsRUFBQSxlQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxRQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxlQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQTs7RUFFQSxlQUFBLEdBQWtCLENBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxPQUFkLEVBQXVCLElBQXZCLEVBQTZCLE1BQTdCLEVBQXFDLE1BQXJDOztFQUNsQixRQUFBLEdBQVcsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUEyQixPQUEzQixFQUFvQyxNQUFwQzs7RUFFWCxPQUFBLEdBQXNCLEVBTHRCOztFQU1BLFNBQUEsR0FBc0I7O0VBRXRCLGVBQUEsR0FBc0IsRUFSdEI7O0VBU0EsaUJBQUEsR0FBc0I7O0VBRXRCLGNBQUEsR0FBc0IsRUFYdEI7O0VBWUEsZ0JBQUEsR0FBc0I7O0VBRXRCLGlCQUFBLEdBQXNCLEVBZHRCOztFQWVBLG1CQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCLEVBakJ0Qjs7RUFrQkEsWUFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQixFQXBCdEI7O0VBc0JBLFlBQUEsR0FBc0IsRUF0QnRCOztFQXVCQSxjQUFBLEdBQXNCOztFQUV0QixXQUFBLEdBQXNCOztFQUN0QixhQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCOztFQUN0QixZQUFBLEdBQXNCOztFQUV0QixhQUFBLEdBQXNCLENBQUM7O0VBQ3ZCLFdBQUEsR0FBc0I7O0VBQ3RCLGFBQUEsR0FBc0I7O0VBU3RCLElBQUMsQ0FBQSxTQUFELEdBQ0k7SUFBQSxXQUFBLEVBQWMsUUFBQSxDQUFDLFVBQUQsRUFBYSxNQUFiLENBQUE7QUFDVixVQUFBO01BQUEsU0FBQSxHQUNJO1FBQUEsTUFBQSxFQUFTLEVBQVQ7UUFDQSxlQUFBLEVBQ0k7VUFBQSxLQUFBLEVBQVEsQ0FBQyxDQUFUO1VBQ0EsUUFBQSxFQUFXLEVBRFg7VUFFQSxNQUFBLEVBQVMsTUFGVDtVQUdBLElBQUEsRUFBTyxDQUhQO1VBSUEsVUFBQSxFQUFhLEVBSmI7VUFLQSxNQUFBLEVBQVMsRUFMVDtVQU1BLE1BQUEsRUFBUztRQU5ULENBRko7UUFVQSxLQUFBLEVBQVE7TUFWUjtNQWFKLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBMUIsR0FBbUMsU0FBUyxDQUFDO01BRTdDLFNBQVMsQ0FBQyxNQUFWLEdBQW1CLFlBQUEsQ0FBYSxVQUFVLENBQUMsS0FBWCxDQUFpQixJQUFqQixDQUFiO01BRW5CLGdCQUFBLENBQWlCLFNBQWpCO01BQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxxQkFBWjtNQUVBLFlBQUEsQ0FBYSxTQUFTLENBQUMsZUFBdkI7TUFDQSxPQUFPLENBQUMsR0FBUixDQUFZLGlCQUFaO01BRUEsV0FBQSxDQUFZLFNBQVMsQ0FBQyxlQUF0QjtNQUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksYUFBWjtNQUVBLGNBQUEsQ0FBZSxTQUFmO01BQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxvQkFBWjtNQUVBLE9BQU8sQ0FBQyxHQUFSLENBQVksU0FBUyxDQUFDLGVBQXRCO01BRUEsV0FBQSxDQUFZLFNBQVMsQ0FBQyxlQUF0QjtNQUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksZ0JBQVo7TUFFQSxPQUFPLENBQUMsR0FBUixDQUFZLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBdEM7TUFDQSxTQUFTLENBQUMsS0FBVixHQUFrQixpQkFBQSxHQUFvQixTQUFTLENBQUMsZUFBZSxDQUFDO2FBRWhFLE9BQU8sQ0FBQyxHQUFSLENBQVksU0FBWjtJQXZDVTtFQUFkOztFQTRDSixjQUFBLEdBQWlCLFFBQUEsQ0FBQyxJQUFELENBQUE7QUFDYixRQUFBLFdBQUEsRUFBQSxPQUFBLEVBQUEsT0FBQSxFQUFBLGVBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBO0lBQUEsT0FBQSxHQUNJO01BQUEsS0FBQSxFQUFRLENBQUMsQ0FBVDtNQUNBLE1BQUEsRUFBUSxJQUFJLENBQUMsZUFEYjtNQUVBLFFBQUEsRUFBVyxFQUZYO01BR0EsTUFBQSxFQUFTLE1BSFQ7TUFJQSxJQUFBLEVBQU8sQ0FKUDtNQUtBLFVBQUEsRUFBYSxFQUxiO01BTUEsTUFBQSxFQUFTO0lBTlQ7SUFRSixPQUFBLEdBQ0k7TUFBQSxLQUFBLEVBQVEsQ0FBQyxDQUFUO01BQ0EsTUFBQSxFQUFRLElBQUksQ0FBQyxlQURiO01BRUEsUUFBQSxFQUFXLEVBRlg7TUFHQSxNQUFBLEVBQVMsTUFIVDtNQUlBLElBQUEsRUFBTyxDQUpQO01BS0EsVUFBQSxFQUFhLEVBTGI7TUFNQSxNQUFBLEVBQVM7SUFOVDtBQVNKO0lBQUEsS0FBQSxxQ0FBQTs7TUFDSSxXQUFBLEdBQWM7TUFFZCxLQUFBLDRDQUFBOztRQUNJLElBQUcsR0FBRyxDQUFDLE1BQUosS0FBYyxlQUFqQjtVQUNJLFdBQUEsR0FBYztVQUNkLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBakIsQ0FBc0IsR0FBdEIsRUFGSjs7TUFESjtNQUtBLElBQUcsQ0FBSSxXQUFQO1FBQ0ksT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFqQixDQUFzQixHQUF0QixFQURKOztJQVJKO0lBV0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQWpDO0lBQ0EsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFyQixHQUFnQyxJQUFJO0lBRXBDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLElBQTlCLENBQW1DLE9BQW5DO0lBQ0EsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBOUIsQ0FBbUMsT0FBbkM7SUFFQSxZQUFBLENBQWEsSUFBSSxDQUFDLGVBQWxCO1dBQ0EsV0FBQSxDQUFZLElBQUksQ0FBQyxlQUFqQjtFQXRDYTs7RUEwQ2pCLFdBQUEsR0FBYyxRQUFBLENBQUMsR0FBRCxDQUFBO0FBQ1YsUUFBQSxLQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUE7QUFBQTtBQUFBO0lBQUEsS0FBQSxxQ0FBQTs7TUFDSSxLQUFLLENBQUMsV0FBTixHQUFvQixLQUFLLENBQUMsS0FBTixHQUFjLEdBQUcsQ0FBQztNQUN0QyxLQUFLLENBQUMsTUFBTixHQUFlLEdBQUcsQ0FBQztNQUVuQixJQUFHLEtBQUssQ0FBQyxRQUFUO3FCQUNJLFdBQUEsQ0FBWSxLQUFaLEdBREo7T0FBQSxNQUFBOzZCQUFBOztJQUpKLENBQUE7O0VBRFU7O0VBV2QsWUFBQSxHQUFlLFFBQUEsQ0FBQyxXQUFELENBQUE7QUFDWCxRQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBO0lBQUEsY0FBQSxHQUFpQixJQUFJO0lBRXJCLEtBQUEsNkNBQUE7O01BQ0ksSUFBRyxXQUFBLENBQVksSUFBWixDQUFBLEtBQXFCLENBQUMsQ0FBekI7UUFDSSxjQUFjLENBQUMsSUFBZixDQUFvQixJQUFwQixFQURKOztJQURKO1dBSUE7RUFQVzs7RUFVZixXQUFBLEdBQWMsUUFBQSxDQUFDLElBQUQsQ0FBQTtBQUNWLFFBQUE7SUFBQSxRQUFBLEdBQVcsQ0FBQztJQUVaLElBQTRCLGFBQWEsQ0FBQyxJQUFkLENBQW1CLElBQW5CLENBQTVCO01BQUEsUUFBQSxHQUFXLGNBQVg7O0lBQ0EsSUFBNEIsV0FBVyxDQUFDLElBQVosQ0FBaUIsSUFBakIsQ0FBNUI7TUFBQSxRQUFBLEdBQVcsY0FBWDs7SUFDQSxJQUFnQyxtQkFBbUIsQ0FBQyxJQUFwQixDQUF5QixJQUF6QixDQUFoQztNQUFBLFFBQUEsR0FBVyxrQkFBWDs7SUFDQSxJQUFzQixTQUFTLENBQUMsSUFBVixDQUFlLElBQWYsQ0FBdEI7TUFBQSxRQUFBLEdBQVcsUUFBWDs7SUFDQSxJQUEwQixhQUFhLENBQUMsSUFBZCxDQUFtQixJQUFuQixDQUExQjtNQUFBLFFBQUEsR0FBVyxZQUFYOztJQUNBLElBQTZCLGdCQUFnQixDQUFDLElBQWpCLENBQXNCLElBQXRCLENBQTdCO01BQUEsUUFBQSxHQUFXLGVBQVg7O0lBQ0EsSUFBOEIsaUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsSUFBdkIsQ0FBOUI7TUFBQSxRQUFBLEdBQVcsZ0JBQVg7O0lBQ0EsSUFBeUIsWUFBWSxDQUFDLElBQWIsQ0FBa0IsSUFBbEIsQ0FBekI7TUFBQSxRQUFBLEdBQVcsV0FBWDs7SUFDQSxJQUEyQixjQUFjLENBQUMsSUFBZixDQUFvQixJQUFwQixDQUEzQjtNQUFBLFFBQUEsR0FBVyxhQUFYOztJQUNBLElBQXlCLFlBQVksQ0FBQyxJQUFiLENBQWtCLElBQWxCLENBQXpCO01BQUEsUUFBQSxHQUFXLFdBQVg7O1dBRUE7RUFkVTs7RUFtQmQsV0FBQSxHQUFjLFFBQUEsQ0FBQyxJQUFELENBQUE7QUFDVixRQUFBO0lBQUEsTUFBQSxHQUFTO0lBQ1QsSUFBRyxJQUFLLENBQUEsQ0FBQSxDQUFMLEtBQVcsR0FBZDtBQUNJLGFBQU0sSUFBSyxDQUFBLE1BQUEsQ0FBTCxLQUFnQixHQUF0QjtRQUNJLE1BQUEsSUFBVTtNQURkLENBREo7O1dBSUE7RUFOVTs7RUFhZCxnQkFBQSxHQUFtQixRQUFBLENBQUMsSUFBRCxDQUFBO0FBQ2YsUUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7SUFBQSxhQUFBLEdBQWdCLElBQUksQ0FBQztJQUNyQixZQUFBLEdBQWUsSUFBSSxDQUFDO0FBRXBCO0lBQUEsS0FBWSxtR0FBWjtNQUNJLFNBQUEsR0FBWSxXQUFBLENBQVksSUFBSSxDQUFDLE1BQU8sQ0FBQSxJQUFBLENBQXhCO01BRVosSUFBRyxTQUFBLEdBQVksYUFBYSxDQUFDLEtBQTdCO1FBQ0ksSUFBRyxTQUFBLEdBQVksWUFBWSxDQUFDLEtBQTVCO1VBQ0csYUFBQSxHQUFnQixhQURuQjs7UUFHQSxPQUFBLEdBQ0k7VUFBQSxNQUFBLEVBQVMsSUFBSSxDQUFDLE1BQU8sQ0FBQSxJQUFBLENBQUssQ0FBQyxLQUFsQixDQUF3QixTQUF4QixDQUFUO1VBQ0EsUUFBQSxFQUFXLEVBRFg7VUFFQSxNQUFBLEVBQVMsYUFGVDtVQUdBLEtBQUEsRUFBUSxTQUhSO1VBSUEsVUFBQSxFQUFhLEVBSmI7VUFLQSxNQUFBLEVBQVM7UUFMVDtRQU9KLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBdkIsQ0FBNEIsT0FBNUI7cUJBQ0EsWUFBQSxHQUFlLFNBYm5CO09BQUEsTUFBQTtBQWdCSSxlQUFNLFNBQUEsSUFBYSxhQUFhLENBQUMsS0FBakM7VUFDSSxhQUFBLEdBQWdCLGFBQWEsQ0FBQztRQURsQztRQUdBLE9BQUEsR0FDSTtVQUFBLE1BQUEsRUFBUyxJQUFJLENBQUMsTUFBTyxDQUFBLElBQUEsQ0FBSyxDQUFDLEtBQWxCLENBQXdCLFNBQXhCLENBQVQ7VUFDQSxRQUFBLEVBQVcsRUFEWDtVQUVBLE1BQUEsRUFBUyxhQUZUO1VBR0EsS0FBQSxFQUFRLFNBSFI7VUFJQSxVQUFBLEVBQWEsRUFKYjtVQUtBLE1BQUEsRUFBUztRQUxUO1FBT0osYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUF2QixDQUE0QixPQUE1QjtxQkFDQSxZQUFBLEdBQWUsU0E1Qm5COztJQUhKLENBQUE7O0VBSmU7O0VBMkNuQixZQUFBLEdBQWUsUUFBQSxDQUFDLEtBQUQsQ0FBQTtBQUNYLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUE7QUFBQTtJQUFBLEtBQUEscUNBQUE7O01BQ0ksSUFBRyxJQUFJLENBQUMsTUFBUjtRQUNJLElBQUksQ0FBQyxJQUFMLEdBQVksV0FBQSxDQUFZLElBQUksQ0FBQyxNQUFqQixFQURoQjtPQUFBLE1BQUE7UUFHSSxJQUFJLENBQUMsSUFBTCxHQUFZLENBQUMsRUFIakI7O01BS0EsSUFBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQWQsR0FBdUIsQ0FBMUI7cUJBQ0ksWUFBQSxDQUFhLElBQWIsR0FESjtPQUFBLE1BQUE7NkJBQUE7O0lBTkosQ0FBQTs7RUFEVzs7RUFZZixXQUFBLEdBQWMsUUFBQSxDQUFDLEtBQUQsQ0FBQTtBQUdWLFFBQUEsQ0FBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUE7O0lBQUEsU0FBQSxHQUFZLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBZixHQUF3QjtBQUVwQztJQUFBLEtBQVkscUZBQVo7TUFDSSxJQUFHLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsUUFBUSxDQUFDLE1BQTlCLEdBQXVDLENBQTFDO1FBQ0ksV0FBQSxDQUFZLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUEzQixFQURKOztNQUdBLElBQUcsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxJQUFyQixLQUE2QixlQUFoQztRQUNJLElBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFoQztVQUNJLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsTUFBTSxDQUFDLFVBQTVCLEdBQXlDLElBQUksTUFEakQ7O1FBR0EsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQXZDLENBQTRDLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsTUFBakU7UUFDQSxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBckMsQ0FBNEMsSUFBNUMsRUFBbUQsQ0FBbkQ7QUFFQSxpQkFQSjs7TUFTQSxJQUFHLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsSUFBckIsS0FBNkIsaUJBQWhDO1FBQ0ksSUFBRyxDQUFDLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsTUFBTSxDQUFDLE1BQWhDO1VBQ0ksS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxNQUFNLENBQUMsTUFBNUIsR0FBcUMsSUFBSSxNQUQ3Qzs7UUFHQSxLQUFLLENBQUMsUUFBUyxDQUFBLElBQUEsQ0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBbkMsQ0FBd0MsS0FBSyxDQUFDLFFBQVMsQ0FBQSxJQUFBLENBQUssQ0FBQyxNQUE3RDtRQUNBLEtBQUssQ0FBQyxRQUFTLENBQUEsSUFBQSxDQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFyQyxDQUE0QyxJQUE1QyxFQUFtRCxDQUFuRDtBQUVBLGlCQVBKO09BQUEsTUFBQTs2QkFBQTs7SUFiSixDQUFBOztFQUxVOztFQTRCZCxXQUFBLEdBQWMsUUFBQSxDQUFDLElBQUQsQ0FBQTtBQUNWLFFBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLFFBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBO0lBQUEsU0FBQSxHQUFZO0lBQ1osSUFBRyxJQUFJLENBQUMsV0FBTCxHQUFtQixDQUF0QjtNQUNxQixLQUFTLDZGQUFUO1FBQWpCLFNBQUEsSUFBYTtNQUFJLENBRHJCOztJQUlBLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxDQUFoQjtNQUNJLFNBQUEsQ0FBVSxJQUFWO01BQ0EsSUFBSSxDQUFDLEtBQUwsR0FBYSxTQUFBLEdBQVksR0FBWixHQUFrQixJQUFJLENBQUM7TUFFcEMsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQVosR0FBcUIsQ0FBeEI7UUFDSSxTQUFBLEdBQVk7UUFFWixlQUFBLENBQWdCLElBQWhCO0FBRUE7UUFBQSxLQUFBLHNDQUFBOztVQUNJLFNBQUEsSUFBYSxLQUFBLEdBQVE7UUFEekI7UUFHQSxTQUFBLElBQWE7UUFDYixJQUFJLENBQUMsVUFBVSxDQUFDLElBQWhCLENBQXFCLFNBQXJCLEVBVEo7O01BWUEsZ0JBQUEsQ0FBaUIsSUFBakI7TUFHQSxJQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBaEIsR0FBeUIsQ0FBNUI7UUFDSSxJQUFJLENBQUMsS0FBTCxJQUFjO0FBQ2Q7UUFBQSxLQUFBLHdDQUFBOztVQUNJLElBQUksQ0FBQyxLQUFMLElBQWMsUUFBQSxHQUFXO1FBRDdCO1FBR0EsSUFBSSxDQUFDLEtBQUwsR0FBYSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQVgsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBQyxDQUFyQixFQUxqQjs7TUFNQSxJQUFJLENBQUMsS0FBTCxJQUFjO01BQ2QsSUFBc0IsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUFwQztRQUFBLElBQUksQ0FBQyxLQUFMLElBQWMsS0FBZDs7TUFHQSxJQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBZCxHQUF1QixDQUExQjtRQUNJLGFBQUEsQ0FBYyxJQUFkO0FBRUE7UUFBQSxLQUFBLHdDQUFBOztVQUNJLFdBQUEsQ0FBWSxLQUFaO1FBREo7QUFHQTtRQUFBLEtBQUEsd0NBQUE7O1VBQ0ksSUFBSSxDQUFDLEtBQUwsSUFBYyxLQUFLLENBQUM7UUFEeEIsQ0FOSjs7TUFTQSxJQUFHLENBQUksSUFBSSxDQUFDLFdBQVo7UUFDSSxJQUFJLENBQUMsS0FBTCxJQUFjLFNBQUEsR0FBWSxJQUFaLEdBQW1CLElBQUksQ0FBQyxNQUF4QixHQUFpQztRQUMvQyxJQUFzQixJQUFJLENBQUMsTUFBTCxHQUFjLENBQXBDO2lCQUFBLElBQUksQ0FBQyxLQUFMLElBQWMsS0FBZDtTQUZKO09BdENKOztFQU5VOztFQWtEZCxTQUFBLEdBQVksUUFBQSxDQUFDLEdBQUQsQ0FBQTtBQUNSLFFBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLGNBQUEsRUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBO0lBQUEsUUFBQSxHQUFXLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBWCxDQUFpQixLQUFqQjtJQUNYLEdBQUcsQ0FBQyxNQUFKLEdBQWEsUUFBUyxDQUFBLENBQUE7SUFFdEIsR0FBRyxDQUFDLFdBQUosR0FBa0I7SUFDbEIsS0FBQSxpREFBQTs7TUFDSSxJQUFHLEdBQUcsQ0FBQyxNQUFKLEtBQWMsY0FBakI7UUFDSSxHQUFHLENBQUMsV0FBSixHQUFrQixLQUR0Qjs7SUFESjtJQUlBLFFBQVEsQ0FBQyxNQUFULENBQWdCLENBQWhCLEVBQWtCLENBQWxCO0lBRUEsSUFBRyxRQUFRLENBQUMsTUFBVCxHQUFrQixDQUFyQjtNQUNJLElBQUcsUUFBUyxDQUFBLENBQUEsQ0FBVCxLQUFlLElBQWxCO1FBQ0ksR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFmLENBQW9CLE1BQUEsR0FBUyxRQUFTLENBQUEsQ0FBQSxDQUFsQixHQUF1QixHQUEzQztRQUNBLFFBQVEsQ0FBQyxNQUFULENBQWdCLENBQWhCLEVBQWtCLENBQWxCLEVBRko7O01BSUEsSUFBRyxRQUFTLENBQUEsQ0FBQSxDQUFULEtBQWUsSUFBbEI7UUFDSSxRQUFRLENBQUMsTUFBVCxDQUFnQixDQUFoQixFQUFrQixDQUFsQjtRQUNBLFVBQUEsR0FBYTtRQUNiLEtBQUEsNENBQUE7O1VBQ0ksVUFBQSxJQUFjLFFBQUEsR0FBVztRQUQ3QjtRQUdBLFVBQUEsR0FBYSxVQUFVLENBQUMsS0FBWCxDQUFpQixDQUFqQixFQUFvQixDQUFDLENBQXJCO1FBQ2IsVUFBQSxJQUFjO1FBRWQsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFmLENBQW9CLFVBQXBCLEVBVEo7T0FMSjs7V0FnQkE7RUEzQlE7O0VBOEJaLGdCQUFBLEdBQW1CLFFBQUEsQ0FBQyxHQUFELENBQUE7QUFDZixRQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxRQUFBLEVBQUEsZUFBQSxFQUFBLHFCQUFBLEVBQUEsWUFBQSxFQUFBLGtCQUFBLEVBQUE7SUFBQSxJQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBZixHQUF3QixDQUEzQjtNQUNJLGFBQUEsR0FBZ0IsSUFBSTtBQUVwQjtNQUFBLEtBQUEscUNBQUE7O1FBQ0ksV0FBQSxHQUFjO1FBRWQsa0JBQUEsR0FBcUI7UUFDckIsWUFBQSxHQUFlLFFBQVEsQ0FBQyxLQUFULENBQWUsa0JBQWYsQ0FBbUMsQ0FBQSxDQUFBO1FBQ2xELFlBQUEsR0FBZSxZQUFZLENBQUMsS0FBYixDQUFtQixHQUFuQixDQUF3QixDQUFBLENBQUE7UUFDdkMsWUFBQSxHQUFlLFlBQVksQ0FBQyxLQUFiLENBQW1CLEdBQW5CLENBQXdCLENBQUEsQ0FBQTtRQUV2QyxXQUFBLEdBQWMsWUFBQSxHQUFlO1FBRTdCLHFCQUFBLEdBQXdCO1FBQ3hCLGVBQUEsR0FBa0IsUUFBUSxDQUFDLEtBQVQsQ0FBZSxxQkFBZixDQUFzQyxDQUFBLENBQUE7UUFDeEQsV0FBQSxJQUFlO1FBRWYsYUFBYSxDQUFDLElBQWQsQ0FBbUIsV0FBbkI7TUFkSjthQWdCQSxHQUFHLENBQUMsVUFBSixHQUFpQixjQW5CckI7O0VBRGU7O0VBdUJuQixhQUFBLEdBQWdCLFFBQUEsQ0FBQyxHQUFELENBQUE7QUFFWixRQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsV0FBQSxFQUFBLGdCQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7QUFBQTtBQUFBO0lBQUEsS0FBQSxxQ0FBQTs7TUFDSSxTQUFBLEdBQVk7TUFFWixJQUFHLEtBQUssQ0FBQyxXQUFOLEdBQW9CLENBQXZCO1FBQ3FCLEtBQVMsbUdBQVQ7VUFBakIsU0FBQSxJQUFhO1FBQUksQ0FEckI7O01BR0EsSUFBRyxLQUFLLENBQUMsSUFBTixLQUFjLFVBQWpCO1FBQ0ksZ0JBQUEsR0FBbUI7UUFDbkIsV0FBQSxHQUFjLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBYixDQUFtQixnQkFBbkIsQ0FBcUMsQ0FBQSxDQUFBO1FBQ25ELFdBQUEsR0FBYyxXQUFXLENBQUMsS0FBWixDQUFrQixDQUFsQixFQUFxQixDQUFDLENBQXRCO1FBQ2QsS0FBSyxDQUFDLEtBQU4sR0FBYyxTQUFBLEdBQVk7UUFDMUIsSUFBdUIsS0FBSyxDQUFDLE1BQU4sR0FBZSxDQUFBLEdBQUksSUFBMUM7dUJBQUEsS0FBSyxDQUFDLEtBQU4sSUFBZSxNQUFmO1NBQUEsTUFBQTsrQkFBQTtTQUxKO09BQUEsTUFBQTs2QkFBQTs7SUFOSixDQUFBOztFQUZZOztFQWdCaEIsZUFBQSxHQUFrQixRQUFBLENBQUMsR0FBRCxDQUFBO0FBQ2QsUUFBQSxVQUFBLEVBQUEsa0JBQUEsRUFBQSxlQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsYUFBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQTtBQUFBO0FBQUE7SUFBQSxLQUFBLHFDQUFBOztNQUNJLGVBQUEsR0FBa0IsS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFkO01BQ2xCLGFBQUEsR0FBZ0IsS0FBSyxDQUFDLEtBQU4sQ0FBYSxlQUFBLEdBQWtCLENBQS9CO01BQ2hCLGtCQUFBLEdBQXFCLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWixDQUFpQixDQUFBLENBQUEsQ0FBakIsR0FBc0I7TUFDM0MsVUFBQSxHQUFhLGFBQWEsQ0FBQyxLQUFkLENBQW9CLEdBQXBCO01BRWIsS0FBUyxpR0FBVDtRQUNJLElBQUcsVUFBVyxDQUFBLENBQUEsQ0FBWCxLQUFpQixFQUFwQjtVQUNJLGtCQUFBLElBQXNCLFVBQVcsQ0FBQSxDQUFBO1VBQ2pDLElBQTZCLENBQUEsR0FBSSxVQUFVLENBQUMsTUFBWCxHQUFvQixDQUFyRDtZQUFBLGtCQUFBLElBQXNCLElBQXRCO1dBRko7O01BREo7bUJBS0EsS0FBQSxHQUFRO0lBWFosQ0FBQTs7RUFEYzs7RUFlbEIsWUFBQSxHQUFlLFFBQUEsQ0FBQyxHQUFELENBQUE7QUFDWCxRQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQTtBQUFBO0FBQUE7SUFBQSxLQUFBLHFDQUFBOztNQUNJLEtBQUssQ0FBQyxLQUFOLEdBQWMsR0FBRyxDQUFDLEtBQUosR0FBWTtNQUUxQixJQUFHLEtBQUssQ0FBQyxRQUFUO3FCQUNJLFlBQUEsQ0FBYSxLQUFiLEdBREo7T0FBQSxNQUFBOzZCQUFBOztJQUhKLENBQUE7O0VBRFc7QUEvWWYiLCJzb3VyY2VzQ29udGVudCI6WyIjIExJTkUgVFlQRVNcblxuc2VsZkNsb3NpbmdUYWdzID0gWydicicsICdpbWcnLCAnaW5wdXQnLCAnaHInLCAnbWV0YScsICdsaW5rJ11cbmhlYWRUYWdzID0gWydtZXRhJywgJ3RpdGxlJywgJ3N0eWxlJywgJ2NsYXNzJywgJ2xpbmsnXVxuXG50YWdUeXBlICAgICAgICAgICAgID0gMCAjaWYgbm8gYW5vdGhlciB0eXBlIGZvdW5kIGFuZCB0aGlzIGlzIG5vdCBhIHNjcmlwdFxudGFnRmlsdGVyICAgICAgICAgICA9IC9eXFxzKlxcdysgKigoICtcXHcrKT8oICopPyggK2lzKCArLiopPyk/KT8kL2lcblxudGFnUHJvcGVydHlUeXBlICAgICA9IDEgI2lmIGZvdW5kIHByb3BlcnR5IFwic29tZXRoaW5nXCJcbnRhZ1Byb3BlcnR5RmlsdGVyICAgPSAvXlxccypbXFx3XFwtXSsgKlwiLipcIi9cblxuc3R5bGVDbGFzc1R5cGUgICAgICA9IDIgI2lmIHRoaXMgaXMgdGFnIGFuZCB0aGUgdGFnIGlzIHN0eWxlXG5zdHlsZUNsYXNzRmlsdGVyICAgID0gL15cXHMqKHN0eWxlfGNsYXNzKVxccytbXFx3Ol8tXSsvaVxuXG5zdHlsZVByb3BlcnR5VHlwZSAgID0gMyAjaWYgZm91bmQgcHJvcGVydHk6IHNvbWV0aGluZ1xuc3R5bGVQcm9wZXJ0eUZpbHRlciA9IC9eXFxzKlteXCInIF0rICo6ICouKi9pXG5cbnN0cmluZ1R5cGUgICAgICAgICAgPSA0ICNpZiBmb3VuZCBcInN0cmluZ1wiXG5zdHJpbmdGaWx0ZXIgICAgICAgID0gL15cXHMqXCIuKlwiL2lcblxuc2NyaXB0VHlwZSAgICAgICAgICA9IDUgI2lmIGl0IGlzIHVuZGVyIHRoZSBzY3JpcHQgdGFnXG5cbnZhcmlhYmxlVHlwZSAgICAgICAgPSA2ICMgaWYgZm91bmQgbmFtZSA9IHNvbWV0aGluZ1xudmFyaWFibGVGaWx0ZXIgICAgICA9IC9eXFxzKlxcdytcXHMqPVxccypbXFx3XFxXXSsvaVxuXG5oZWFkVGFnVHlwZSAgICAgICAgID0gN1xuaGVhZFRhZ0ZpbHRlciAgICAgICA9IC9eXFxzKihtZXRhfHRpdGxlfGxpbmt8YmFzZSkvaVxuXG5tb2R1bGVUeXBlICAgICAgICAgID0gOFxubW9kdWxlRmlsdGVyICAgICAgICA9IC9eXFxzKmluY2x1ZGVcXHMqXCIuKy5jaHJpc1wiL2lcblxuaWdub3JhYmxlVHlwZSAgICAgICA9IC0yXG5lbXB0eUZpbHRlciAgICAgICAgID0gL15bXFxXXFxzX10qJC9cbmNvbW1lbnRGaWx0ZXIgICAgICAgPSAvXlxccyojL2lcblxuXG5cblxuXG5cblxuXG5AY2hyaXN0aW5lID1cbiAgICBjaHJpc3Rpbml6ZSA6IChzb3VyY2VUZXh0LCBpbmRlbnQpIC0+XG4gICAgICAgIGNocmlzRmlsZSA9XG4gICAgICAgICAgICBzb3VyY2UgOiBbXVxuICAgICAgICAgICAgaW5Qcm9ncmVzc0xpbmVzIDogXG4gICAgICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiAnaHRtbCdcbiAgICAgICAgICAgICAgICB0eXBlIDogMFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG4gICAgICAgICAgICAgICAgaW5kZW50IDogaW5kZW50XG5cbiAgICAgICAgICAgIGZpbmFsIDogJydcbiAgICAgICAgXG5cbiAgICAgICAgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5wYXJlbnQgPSBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICAgICAgY2hyaXNGaWxlLnNvdXJjZSA9IGNsZWFudXBMaW5lcyBzb3VyY2VUZXh0LnNwbGl0ICdcXG4nXG5cbiAgICAgICAgcHJvY2Vzc0hpZXJhcmNoeSBjaHJpc0ZpbGVcbiAgICAgICAgY29uc29sZS5sb2cgJ2hpZXJhcmNoeSBwcm9jZXNzZWQnXG5cbiAgICAgICAgcHJvY2Vzc1R5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcbiAgICAgICAgY29uc29sZS5sb2cgJ3R5cGVzIHByb2Nlc3NlZCdcblxuICAgICAgICBzb3J0QnlUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGNvbnNvbGUubG9nICd0eXBlIHNvcnRlZCdcblxuICAgICAgICBzb3J0QnlCb2R5SGVhZCBjaHJpc0ZpbGVcbiAgICAgICAgY29uc29sZS5sb2cgJ2JvZHkgLyBoZWFkIHNvcnRlZCdcblxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICAgICAgZmluYWxpc2VUYWcgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICBjb25zb2xlLmxvZyAndGFncyBmaW5hbGl6ZWQnXG5cbiAgICAgICAgY29uc29sZS5sb2cgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5maW5hbFxuICAgICAgICBjaHJpc0ZpbGUuZmluYWwgPSAnPDFkb2N0eXBlIGh0bWw+JyArIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcblxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGVcblxuXG5cblxuc29ydEJ5Qm9keUhlYWQgPSAoZmlsZSkgLT5cbiAgICBoZWFkVGFnID1cbiAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgc291cmNlIDogJ2hlYWQnXG4gICAgICAgIHR5cGUgOiAwXG4gICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgYm9keVRhZyA9XG4gICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgcGFyZW50OiBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgIHNvdXJjZSA6ICdib2R5J1xuICAgICAgICB0eXBlIDogMFxuICAgICAgICBwcm9wZXJ0aWVzIDogW11cbiAgICAgICAgc3R5bGVzIDogW11cbiAgICBcblxuICAgIGZvciB0YWcgaW4gZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW5cbiAgICAgICAgYWRkZWRUb0hlYWQgPSBmYWxzZVxuXG4gICAgICAgIGZvciBoZWFkVGFnVGVtcGxhdGUgaW4gaGVhZFRhZ3NcbiAgICAgICAgICAgIGlmIHRhZy5zb3VyY2UgPT0gaGVhZFRhZ1RlbXBsYXRlXG4gICAgICAgICAgICAgICAgYWRkZWRUb0hlYWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgaGVhZFRhZy5jaGlsZHJlbi5wdXNoIHRhZ1xuXG4gICAgICAgIGlmIG5vdCBhZGRlZFRvSGVhZFxuICAgICAgICAgICAgYm9keVRhZy5jaGlsZHJlbi5wdXNoIHRhZ1xuXG4gICAgY29uc29sZS5sb2cgZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW5cbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbiA9IG5ldyBBcnJheVxuXG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW4ucHVzaCBoZWFkVGFnXG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW4ucHVzaCBib2R5VGFnXG5cbiAgICBmb3JtYXRMZXZlbHMgZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBpbmRlbnRMaW5lcyBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG5cblxuaW5kZW50TGluZXMgPSAodGFnKSAtPlxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgY2hpbGQuaW5kZW50YXRpb24gPSBjaGlsZC5sZXZlbCAqIHRhZy5pbmRlbnRcbiAgICAgICAgY2hpbGQuaW5kZW50ID0gdGFnLmluZGVudFxuXG4gICAgICAgIGlmIGNoaWxkLmNoaWxkcmVuXG4gICAgICAgICAgICBpbmRlbnRMaW5lcyBjaGlsZFxuXG5cblxuXG5jbGVhbnVwTGluZXMgPSAoc291cmNlTGluZXMpIC0+XG4gICAgbmV3U291cmNlTGluZXMgPSBuZXcgQXJyYXlcblxuICAgIGZvciBsaW5lIGluIHNvdXJjZUxpbmVzXG4gICAgICAgIGlmIGFuYWxpc2VUeXBlKGxpbmUpICE9IC0yXG4gICAgICAgICAgICBuZXdTb3VyY2VMaW5lcy5wdXNoIGxpbmVcbiAgICBcbiAgICBuZXdTb3VyY2VMaW5lc1xuXG5cbmFuYWxpc2VUeXBlID0gKGxpbmUpIC0+XG4gICAgbGluZVR5cGUgPSAtMVxuXG4gICAgbGluZVR5cGUgPSBpZ25vcmFibGVUeXBlIGlmIGNvbW1lbnRGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBpZ25vcmFibGVUeXBlIGlmIGVtcHR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3R5bGVQcm9wZXJ0eVR5cGUgaWYgc3R5bGVQcm9wZXJ0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHRhZ1R5cGUgaWYgdGFnRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaGVhZFRhZ1R5cGUgaWYgaGVhZFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlQ2xhc3NUeXBlIGlmIHN0eWxlQ2xhc3NGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB0YWdQcm9wZXJ0eVR5cGUgaWYgdGFnUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHJpbmdUeXBlIGlmIHN0cmluZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHZhcmlhYmxlVHlwZSBpZiB2YXJpYWJsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IG1vZHVsZVR5cGUgaWYgbW9kdWxlRmlsdGVyLnRlc3QgbGluZVxuICAgIFxuICAgIGxpbmVUeXBlXG5cblxuXG5cbmNvdW50U3BhY2VzID0gKGxpbmUpIC0+XG4gICAgc3BhY2VzID0gMFxuICAgIGlmIGxpbmVbMF0gPT0gJyAnXG4gICAgICAgIHdoaWxlIGxpbmVbc3BhY2VzXSA9PSAnICdcbiAgICAgICAgICAgIHNwYWNlcyArPSAxXG4gICAgXG4gICAgc3BhY2VzXG5cblxuXG5cblxuXG5wcm9jZXNzSGllcmFyY2h5ID0gKGZpbGUpIC0+XG4gICAgY3VycmVudFBhcmVudCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgY3VycmVudENoaWxkID0gZmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgIGZvciBsaW5lIGluIFswLi4uZmlsZS5zb3VyY2UubGVuZ3RoXVxuICAgICAgICBsaW5lTGV2ZWwgPSBjb3VudFNwYWNlcyBmaWxlLnNvdXJjZVtsaW5lXVxuXG4gICAgICAgIGlmIGxpbmVMZXZlbCA+IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgIGlmIGxpbmVMZXZlbCA+IGN1cnJlbnRDaGlsZC5sZXZlbFxuICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRDaGlsZFxuXG4gICAgICAgICAgICBuZXdMaW5lID1cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiBmaWxlLnNvdXJjZVtsaW5lXS5zbGljZSBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgcGFyZW50IDogY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgIGxldmVsIDogbGluZUxldmVsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgICAgICAgICAgc3R5bGVzIDogW11cblxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoIG5ld0xpbmVcbiAgICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IG5ld0xpbmVcblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBsaW5lTGV2ZWwgPD0gY3VycmVudFBhcmVudC5sZXZlbFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudFxuXG4gICAgICAgICAgICBuZXdMaW5lID1cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiBmaWxlLnNvdXJjZVtsaW5lXS5zbGljZSBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgcGFyZW50IDogY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgIGxldmVsIDogbGluZUxldmVsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgICAgICAgICAgc3R5bGVzIDogW11cblxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoIG5ld0xpbmVcbiAgICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IG5ld0xpbmVcblxuXG5cblxuXG5cblxucHJvY2Vzc1R5cGVzID0gKGxpbmVzKSAtPlxuICAgIGZvciBsaW5lIGluIGxpbmVzLmNoaWxkcmVuXG4gICAgICAgIGlmIGxpbmUuc291cmNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSBhbmFsaXNlVHlwZSBsaW5lLnNvdXJjZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSAtMlxuICAgICAgICBcbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBwcm9jZXNzVHlwZXMgbGluZVxuXG5cblxuc29ydEJ5VHlwZXMgPSAobGluZXMpIC0+XG4gICAgIyBleHRyYWN0IHRoZSBzdHlsZXMsIHByb3BlcnRpZXMgYW5kIHN0cmluZ3MgdG8gdGhlaXIgcGFyZW50c1xuXG4gICAgbGFzdENoaWxkID0gbGluZXMuY2hpbGRyZW4ubGVuZ3RoIC0gMVxuXG4gICAgZm9yIGxpbmUgaW4gW2xhc3RDaGlsZC4uMF1cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0uY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgc29ydEJ5VHlwZXMgbGluZXMuY2hpbGRyZW5bbGluZV1cblxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHRhZ1Byb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXS5zb3VyY2VcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5jaGlsZHJlbi5zcGxpY2UgbGluZSAsIDFcblxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnR5cGUgPT0gc3R5bGVQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlcyA9IG5ldyBBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV0uc291cmNlXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlXG5cblxuZmluYWxpc2VUYWcgPSAobGluZSkgLT5cbiAgICBhZGRTcGFjZXMgPSAnJ1xuICAgIGlmIGxpbmUuaW5kZW50YXRpb24gPiAwXG4gICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLmxpbmUuaW5kZW50YXRpb25dXG5cblxuICAgIGlmIGxpbmUudHlwZSA9PSAwXG4gICAgICAgIGZvcm1hdFRhZyBsaW5lXG4gICAgICAgIGxpbmUuZmluYWwgPSBhZGRTcGFjZXMgKyAnPCcgKyBsaW5lLnNvdXJjZVxuXG4gICAgICAgIGlmIGxpbmUuc3R5bGVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGxpbmVTdHlsZSA9ICdzdHlsZSBcIidcblxuICAgICAgICAgICAgZm9ybWF0VGFnU3R5bGVzIGxpbmVcblxuICAgICAgICAgICAgZm9yIHN0eWxlIGluIGxpbmUuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlICs9IHN0eWxlICsgJzsnXG5cbiAgICAgICAgICAgIGxpbmVTdHlsZSArPSAnXCInXG4gICAgICAgICAgICBsaW5lLnByb3BlcnRpZXMucHVzaCBsaW5lU3R5bGVcbiAgICAgICAgXG5cbiAgICAgICAgZm9ybWF0UHJvcGVydGllcyBsaW5lXG4gICAgICAgIFxuXG4gICAgICAgIGlmIGxpbmUucHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICcgJ1xuICAgICAgICAgICAgZm9yIHByb3BlcnR5IGluIGxpbmUucHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gcHJvcGVydHkgKyAnICdcbiAgICAgICAgXG4gICAgICAgICAgICBsaW5lLmZpbmFsID0gbGluZS5maW5hbC5zbGljZSAwLCAtMVxuICAgICAgICBsaW5lLmZpbmFsICs9ICc+J1xuICAgICAgICBsaW5lLmZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuXG5cbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBmb3JtYXRTdHJpbmdzIGxpbmVcblxuICAgICAgICAgICAgZm9yIGNoaWxkIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmaW5hbGlzZVRhZyBjaGlsZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gY2hpbGQuZmluYWxcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBsaW5lLnNlbGZDbG9zaW5nXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9IGFkZFNwYWNlcyArICc8LycgKyBsaW5lLnNvdXJjZSArICc+J1xuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnXFxuJyBpZiBsaW5lLmluZGVudCA+IDBcbiAgICBcbiAgICBcbiAgICBcbmZvcm1hdFRhZyA9ICh0YWcpIC0+XG4gICAgdGFnQXJyYXkgPSB0YWcuc291cmNlLnNwbGl0IC9cXHMrL1xuICAgIHRhZy5zb3VyY2UgPSB0YWdBcnJheVswXVxuXG4gICAgdGFnLnNlbGZDbG9zaW5nID0gZmFsc2VcbiAgICBmb3Igc2VsZkNsb3NpbmdUYWcgaW4gc2VsZkNsb3NpbmdUYWdzXG4gICAgICAgIGlmIHRhZy5zb3VyY2UgPT0gc2VsZkNsb3NpbmdUYWdcbiAgICAgICAgICAgIHRhZy5zZWxmQ2xvc2luZyA9IHRydWVcblxuICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG5cbiAgICBpZiB0YWdBcnJheS5sZW5ndGggPiAwXG4gICAgICAgIGlmIHRhZ0FycmF5WzBdICE9ICdpcydcbiAgICAgICAgICAgIHRhZy5wcm9wZXJ0aWVzLnB1c2ggJ2lkIFwiJyArIHRhZ0FycmF5WzBdICsgJ1wiJ1xuICAgICAgICAgICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcbiAgICAgICAgXG4gICAgICAgIGlmIHRhZ0FycmF5WzBdID09ICdpcydcbiAgICAgICAgICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG4gICAgICAgICAgICB0YWdDbGFzc2VzID0gJ2NsYXNzIFwiJ1xuICAgICAgICAgICAgZm9yIHRhZ0NsYXNzIGluIHRhZ0FycmF5XG4gICAgICAgICAgICAgICAgdGFnQ2xhc3NlcyArPSB0YWdDbGFzcyArICcgJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0YWdDbGFzc2VzID0gdGFnQ2xhc3Nlcy5zbGljZSAwLCAtMVxuICAgICAgICAgICAgdGFnQ2xhc3NlcyArPSAnXCInXG5cbiAgICAgICAgICAgIHRhZy5wcm9wZXJ0aWVzLnB1c2ggdGFnQ2xhc3Nlc1xuICAgIFxuICAgIHRhZ1xuXG5cbmZvcm1hdFByb3BlcnRpZXMgPSAodGFnKSAtPlxuICAgIGlmIHRhZy5wcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgbmV3UHJvcGVydGllcyA9IG5ldyBBcnJheVxuXG4gICAgICAgIGZvciBwcm9wZXJ0eSBpbiB0YWcucHJvcGVydGllc1xuICAgICAgICAgICAgbmV3UHJvcGVydHkgPSAnPSdcblxuICAgICAgICAgICAgcHJvcGVydHlOYW1lU2VhcmNoID0gL15bXFx3XFwtXSsoICopP1wiL2lcbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3BlcnR5Lm1hdGNoKHByb3BlcnR5TmFtZVNlYXJjaClbMF1cbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3BlcnR5TmFtZS5zcGxpdChcIiBcIilbMF1cbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3BlcnR5TmFtZS5zcGxpdCgnXCInKVswXVxuXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSA9IHByb3BlcnR5TmFtZSArIG5ld1Byb3BlcnR5XG5cbiAgICAgICAgICAgIHByb3BlcnR5RGV0YWlsc1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgcHJvcGVydHlEZXRhaWxzID0gcHJvcGVydHkubWF0Y2gocHJvcGVydHlEZXRhaWxzU2VhcmNoKVswXVxuICAgICAgICAgICAgbmV3UHJvcGVydHkgKz0gcHJvcGVydHlEZXRhaWxzXG5cbiAgICAgICAgICAgIG5ld1Byb3BlcnRpZXMucHVzaCBuZXdQcm9wZXJ0eVxuXG4gICAgICAgIHRhZy5wcm9wZXJ0aWVzID0gbmV3UHJvcGVydGllc1xuXG5cbmZvcm1hdFN0cmluZ3MgPSAodGFnKSAtPlxuICAgIFxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgYWRkU3BhY2VzID0gJydcblxuICAgICAgICBpZiBjaGlsZC5pbmRlbnRhdGlvbiA+IDBcbiAgICAgICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLmNoaWxkLmluZGVudGF0aW9uXVxuXG4gICAgICAgIGlmIGNoaWxkLnR5cGUgPT0gc3RyaW5nVHlwZVxuICAgICAgICAgICAgZnVsbFN0cmluZ1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgPSBjaGlsZC5zb3VyY2UubWF0Y2goZnVsbFN0cmluZ1NlYXJjaClbMF1cbiAgICAgICAgICAgIGNsZWFuU3RyaW5nID0gY2xlYW5TdHJpbmcuc2xpY2UgMSwgLTFcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gYWRkU3BhY2VzICsgY2xlYW5TdHJpbmdcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nIGlmIGNoaWxkLmluZGVudCA+IDAgKyBcIlxcblwiXG5cblxuZm9ybWF0VGFnU3R5bGVzID0gKHRhZykgLT5cbiAgICBmb3Igc3R5bGUgaW4gdGFnLnN0eWxlc1xuICAgICAgICBkaXZpZGVyUG9zaXRpb24gPSBzdHlsZS5pbmRleE9mICc6J1xuICAgICAgICBwcm9wZXJ0eUFmdGVyID0gc3R5bGUuc2xpY2UgKGRpdmlkZXJQb3NpdGlvbiArIDEpXG4gICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSA9IHN0eWxlLnNwbGl0KCc6JylbMF0gKyAnOidcbiAgICAgICAgYWZ0ZXJBcnJheSA9IHByb3BlcnR5QWZ0ZXIuc3BsaXQgJyAnXG5cbiAgICAgICAgZm9yIHggaW4gWzAuLi5hZnRlckFycmF5Lmxlbmd0aF1cbiAgICAgICAgICAgIGlmIGFmdGVyQXJyYXlbeF0gIT0gJydcbiAgICAgICAgICAgICAgICBjbGVhblN0eWxlUHJvcGVydHkgKz0gYWZ0ZXJBcnJheVt4XVxuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSArPSAnICcgaWYgeCA8IGFmdGVyQXJyYXkubGVuZ3RoIC0gMVxuXG4gICAgICAgIHN0eWxlID0gY2xlYW5TdHlsZVByb3BlcnR5XG5cblxuZm9ybWF0TGV2ZWxzID0gKHRhZykgLT5cbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGNoaWxkLmxldmVsID0gdGFnLmxldmVsICsgMVxuXG4gICAgICAgIGlmIGNoaWxkLmNoaWxkcmVuXG4gICAgICAgICAgICBmb3JtYXRMZXZlbHMgY2hpbGQiXX0=
//# sourceURL=coffeescript