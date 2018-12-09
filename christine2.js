(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, finaliseStyle, finaliseTag, formatLevels, formatProperties, formatScripts, formatStrings, formatTag, formatTagStyles, headTagFilter, headTagType, headTags, ignorableType, indentLines, moduleFilter, moduleType, processHierarchy, processTypes, scriptTagFilter, scriptTagType, scriptType, selfClosingTags, sortByBodyHead, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, typeAllScripts, variableFilter, variableType;

  selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link'];

  headTags = ['meta', 'title', 'style', 'class', 'link', 'base'];

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

  scriptTagFilter = /^\s*(script|coffeescript|javascript|coffee)/i;

  scriptType = 5; //if it is under the script tag

  scriptTagType = 9;

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
      var chrisFile, doctype;
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
      processTypes(chrisFile.inProgressLines);
      sortByTypes(chrisFile.inProgressLines);
      console.log(chrisFile.inProgressLines);
      sortByBodyHead(chrisFile);
      finaliseTag(chrisFile.inProgressLines);
      doctype = '<!doctype html>';
      if (indent) {
        doctype += '\n';
      }
      chrisFile.final = doctype + chrisFile.inProgressLines.final;
      console.log(chrisFile.final);
      console.log(chrisFile);
      return chrisFile;
    }
  };

  sortByBodyHead = function(file) {
    var addedToHead, bodyTag, headTag, headTagTemplate, j, k, len, len1, ref, styleTag, tag;
    headTag = {
      level: -1,
      parent: file.inProgressLines,
      children: [],
      source: 'head',
      type: tagType,
      properties: [],
      styles: []
    };
    styleTag = {
      level: 0,
      parent: headTag,
      children: [],
      source: 'style',
      type: headTagType,
      properties: [],
      styles: []
    };
    headTag.children.push(styleTag);
    bodyTag = {
      level: -1,
      parent: file.inProgressLines,
      children: [],
      source: 'body',
      type: tagType,
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
        if (tag.type === styleClassType) {
          styleTag.children.push(tag);
        } else {
          bodyTag.children.push(tag);
        }
      }
    }
    bodyTag.styles = file.inProgressLines.styles;
    bodyTag.properties = file.inProgressLines.properties;
    file.inProgressLines.styles = new Array;
    file.inProgressLines.properties = new Array;
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
      if (scriptTagFilter.test(line)) {
        lineType = scriptTagType;
      }
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
    var j, k, lastChild, len, line, ref, ref1, results;
    ref = lines.children;
    // extract the styles, properties and strings to their parents
    for (j = 0, len = ref.length; j < len; j++) {
      line = ref[j];
      if (line.type === scriptTagType) {
        typeAllScripts(line);
      }
    }
    lastChild = lines.children.length - 1;
    results = [];
    for (line = k = ref1 = lastChild; (ref1 <= 0 ? k <= 0 : k >= 0); line = ref1 <= 0 ? ++k : --k) {
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

  typeAllScripts = function(scriptLine) {
    var codeLine, j, len, ref, results;
    if (scriptLine.children.length > 0) {
      ref = scriptLine.children;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        codeLine = ref[j];
        codeLine.type = 5;
        codeLine.final = codeLine.source;
        if (codeLine.children.length > 0) {
          results.push(typeAllScripts(codeLine));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  finaliseTag = function(line) {
    var addSpaces, child, childLines, i, j, k, l, len, len1, len2, len3, len4, lineStyle, m, n, newFinal, o, p, property, ref, ref1, ref2, ref3, ref4, style;
    addSpaces = '';
    if (line.indent > 0) {
      for (i = j = 0, ref = line.indent; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        addSpaces += ' ';
      }
    }
    if (line.type === styleClassType) {
      finaliseStyle(line);
    }
    if (line.type === 0 || line.type === 9 || line.type === headTagType) {
      formatTag(line);
      line.final = '<' + line.source;
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
        for (m = 0, len1 = ref2.length; m < len1; m++) {
          property = ref2[m];
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
        if (line.type === scriptTagType) {
          line.indent = 4;
        }
        formatScripts(line);
        ref3 = line.children;
        for (n = 0, len2 = ref3.length; n < len2; n++) {
          child = ref3[n];
          finaliseTag(child);
        }
        ref4 = line.children;
        for (o = 0, len3 = ref4.length; o < len3; o++) {
          child = ref4[o];
          childLines = child.final.split('\n');
          newFinal = '';
          for (p = 0, len4 = childLines.length; p < len4; p++) {
            l = childLines[p];
            if (l.length > 0) {
              l = addSpaces + l;
              newFinal += l + '\n';
            }
          }
          if (line.indent > 0) {
            newFinal += '\n';
          }
          newFinal = newFinal.slice(0, -1);
          child.final = newFinal;
          line.final += child.final;
        }
      }
      if (!line.selfClosing) {
        return line.final += '</' + line.source + '>';
      }
    }
  };

  //line.final += '\n' if line.indent > 0
  finaliseStyle = function(styleTag) {
    var addSpaces, finalTag, i, j, k, len, ref, ref1, style, tagArray;
    addSpaces = '';
    if (styleTag.indent > 0) {
      for (i = j = 0, ref = styleTag.indent; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        addSpaces += ' ';
      }
    }
    finalTag = '#';
    tagArray = styleTag.source.split(' ');
    if (tagArray[0] === 'class') {
      finalTag = '.';
    }
    if (tagArray[1] === 'tag') {
      finalTag = '';
      finalTag += tagArray[2];
    } else {
      finalTag += tagArray[1];
    }
    finalTag += '{';
    formatTagStyles(styleTag);
    ref1 = styleTag.styles;
    for (k = 0, len = ref1.length; k < len; k++) {
      style = ref1[k];
      if (styleTag.indent > 0) {
        finalTag += '\n';
        finalTag += addSpaces;
      }
      finalTag += style;
    }
    if (styleTag.indent > 0) {
      finalTag += '\n';
    }
    finalTag += '}';
    return styleTag.final = finalTag;
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
    tag.final = '';
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
    var child, cleanString, fullStringSearch, j, len, ref, results;
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      if (child.type === stringType) {
        fullStringSearch = /\".*\"/;
        cleanString = child.source.match(fullStringSearch)[0];
        cleanString = cleanString.slice(1, -1);
        child.final = cleanString;
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

  formatScripts = function(tag) {
    var addSpaces, child, i, j, k, len, len1, len2, m, n, newScriptChildFinal, ref, ref1, ref2, results, scriptChildLine, scriptChildSliced;
    indentLines(tag);
    ref = tag.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      addSpaces = '';
      if (child.indent > 0) {
        for (i = k = 0, ref1 = child.indent; (0 <= ref1 ? k < ref1 : k > ref1); i = 0 <= ref1 ? ++k : --k) {
          addSpaces += ' ';
        }
      }
      if (child.type === scriptType) {
        if (child.children.length > 0) {
          child.final += '\n';
          formatScripts(child);
          ref2 = child.children;
          for (m = 0, len1 = ref2.length; m < len1; m++) {
            scriptChildLine = ref2[m];
            scriptChildSliced = scriptChildLine.final.split('\n');
            scriptChildSliced.pop();
            newScriptChildFinal = '';
            for (n = 0, len2 = scriptChildSliced.length; n < len2; n++) {
              i = scriptChildSliced[n];
              newScriptChildFinal += addSpaces + i + '\n';
            }
            scriptChildLine.final = newScriptChildFinal;
            child.final += scriptChildLine.final;
          }
          child.final = child.final.slice(0, -1);
        }
        results.push(child.final += '\n');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxhQUFBLEVBQUEsU0FBQSxFQUFBLGVBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxZQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxnQkFBQSxFQUFBLGNBQUEsRUFBQSxtQkFBQSxFQUFBLGlCQUFBLEVBQUEsU0FBQSxFQUFBLGlCQUFBLEVBQUEsZUFBQSxFQUFBLE9BQUEsRUFBQSxjQUFBLEVBQUEsY0FBQSxFQUFBOztFQUVBLGVBQUEsR0FBa0IsQ0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE9BQWQsRUFBdUIsSUFBdkIsRUFBNkIsTUFBN0IsRUFBcUMsTUFBckM7O0VBQ2xCLFFBQUEsR0FBVyxDQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLE9BQWxCLEVBQTJCLE9BQTNCLEVBQW9DLE1BQXBDLEVBQTRDLE1BQTVDOztFQUVYLE9BQUEsR0FBc0IsRUFMdEI7O0VBTUEsU0FBQSxHQUFzQjs7RUFFdEIsZUFBQSxHQUFzQixFQVJ0Qjs7RUFTQSxpQkFBQSxHQUFzQjs7RUFFdEIsY0FBQSxHQUFzQixFQVh0Qjs7RUFZQSxnQkFBQSxHQUFzQjs7RUFFdEIsaUJBQUEsR0FBc0IsRUFkdEI7O0VBZUEsbUJBQUEsR0FBc0I7O0VBRXRCLFVBQUEsR0FBc0IsRUFqQnRCOztFQWtCQSxZQUFBLEdBQXNCOztFQUV0Qixl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QU4sQ0FBYSxlQUFBLEdBQWtCLENBQS9CO01BQ2hCLGtCQUFBLEdBQXFCLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWixDQUFpQixDQUFBLENBQUEsQ0FBakIsR0FBc0I7TUFDM0MsVUFBQSxHQUFhLGFBQWEsQ0FBQyxLQUFkLENBQW9CLEdBQXBCO01BRWIsS0FBUyxpR0FBVDtRQUNJLElBQUcsVUFBVyxDQUFBLENBQUEsQ0FBWCxLQUFpQixFQUFwQjtVQUNJLGtCQUFBLElBQXNCLFVBQVcsQ0FBQSxDQUFBO1VBQ2pDLElBQTZCLENBQUEsR0FBSSxVQUFVLENBQUMsTUFBWCxHQUFvQixDQUFyRDtZQUFBLGtCQUFBLElBQXNCLElBQXRCO1dBRko7O01BREo7bUJBS0EsS0FBQSxHQUFRO0lBWFosQ0FBQTs7RUFEYzs7RUFlbEIsWUFBQSxHQUFlLFFBQUEsQ0FBQyxHQUFELENBQUE7QUFDWCxRQUFBLEtBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQTtBQUFBO0FBQUE7SUFBQSxLQUFBLHFDQUFBOztNQUNJLEtBQUssQ0FBQyxLQUFOLEdBQWMsR0FBRyxDQUFDLEtBQUosR0FBWTtNQUUxQixJQUFHLEtBQUssQ0FBQyxRQUFUO3FCQUNJLFlBQUEsQ0FBYSxLQUFiLEdBREo7T0FBQSxNQUFBOzZCQUFBOztJQUhKLENBQUE7O0VBRFc7QUF0aEJmIiwic291cmNlc0NvbnRlbnQiOlsiIyBMSU5FIFRZUEVTXG5cbnNlbGZDbG9zaW5nVGFncyA9IFsnYnInLCAnaW1nJywgJ2lucHV0JywgJ2hyJywgJ21ldGEnLCAnbGluayddXG5oZWFkVGFncyA9IFsnbWV0YScsICd0aXRsZScsICdzdHlsZScsICdjbGFzcycsICdsaW5rJywgJ2Jhc2UnXVxuXG50YWdUeXBlICAgICAgICAgICAgID0gMCAjaWYgbm8gYW5vdGhlciB0eXBlIGZvdW5kIGFuZCB0aGlzIGlzIG5vdCBhIHNjcmlwdFxudGFnRmlsdGVyICAgICAgICAgICA9IC9eXFxzKlxcdysgKigoICtcXHcrKT8oICopPyggK2lzKCArLiopPyk/KT8kL2lcblxudGFnUHJvcGVydHlUeXBlICAgICA9IDEgI2lmIGZvdW5kIHByb3BlcnR5IFwic29tZXRoaW5nXCJcbnRhZ1Byb3BlcnR5RmlsdGVyICAgPSAvXlxccypbXFx3XFwtXSsgKlwiLipcIi9cblxuc3R5bGVDbGFzc1R5cGUgICAgICA9IDIgI2lmIHRoaXMgaXMgdGFnIGFuZCB0aGUgdGFnIGlzIHN0eWxlXG5zdHlsZUNsYXNzRmlsdGVyICAgID0gL15cXHMqKHN0eWxlfGNsYXNzKVxccytbXFx3Ol8tXSsvaVxuXG5zdHlsZVByb3BlcnR5VHlwZSAgID0gMyAjaWYgZm91bmQgcHJvcGVydHk6IHNvbWV0aGluZ1xuc3R5bGVQcm9wZXJ0eUZpbHRlciA9IC9eXFxzKlteXCInIF0rICo6ICouKi9pXG5cbnN0cmluZ1R5cGUgICAgICAgICAgPSA0ICNpZiBmb3VuZCBcInN0cmluZ1wiXG5zdHJpbmdGaWx0ZXIgICAgICAgID0gL15cXHMqXCIuKlwiL2lcblxuc2NyaXB0VGFnRmlsdGVyICAgICA9IC9eXFxzKihzY3JpcHR8Y29mZmVlc2NyaXB0fGphdmFzY3JpcHR8Y29mZmVlKS9pXG5zY3JpcHRUeXBlICAgICAgICAgID0gNSAjaWYgaXQgaXMgdW5kZXIgdGhlIHNjcmlwdCB0YWdcbnNjcmlwdFRhZ1R5cGUgICAgICAgPSA5XG5cbnZhcmlhYmxlVHlwZSAgICAgICAgPSA2ICMgaWYgZm91bmQgbmFtZSA9IHNvbWV0aGluZ1xudmFyaWFibGVGaWx0ZXIgICAgICA9IC9eXFxzKlxcdytcXHMqPVxccypbXFx3XFxXXSsvaVxuXG5oZWFkVGFnVHlwZSAgICAgICAgID0gN1xuaGVhZFRhZ0ZpbHRlciAgICAgICA9IC9eXFxzKihtZXRhfHRpdGxlfGxpbmt8YmFzZSkvaVxuXG5tb2R1bGVUeXBlICAgICAgICAgID0gOFxubW9kdWxlRmlsdGVyICAgICAgICA9IC9eXFxzKmluY2x1ZGVcXHMqXCIuKy5jaHJpc1wiL2lcblxuaWdub3JhYmxlVHlwZSAgICAgICA9IC0yXG5lbXB0eUZpbHRlciAgICAgICAgID0gL15bXFxXXFxzX10qJC9cbmNvbW1lbnRGaWx0ZXIgICAgICAgPSAvXlxccyojL2lcblxuXG5cblxuXG5cblxuXG5AY2hyaXN0aW5lID1cbiAgICBjaHJpc3Rpbml6ZSA6IChzb3VyY2VUZXh0LCBpbmRlbnQpIC0+XG4gICAgICAgIGNocmlzRmlsZSA9XG4gICAgICAgICAgICBzb3VyY2UgOiBbXVxuICAgICAgICAgICAgaW5Qcm9ncmVzc0xpbmVzIDogXG4gICAgICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiAnaHRtbCdcbiAgICAgICAgICAgICAgICB0eXBlIDogMFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG4gICAgICAgICAgICAgICAgaW5kZW50IDogaW5kZW50XG5cbiAgICAgICAgICAgIGZpbmFsIDogJydcbiAgICAgICAgXG5cbiAgICAgICAgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5wYXJlbnQgPSBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICAgICAgY2hyaXNGaWxlLnNvdXJjZSA9IGNsZWFudXBMaW5lcyBzb3VyY2VUZXh0LnNwbGl0ICdcXG4nXG5cbiAgICAgICAgcHJvY2Vzc0hpZXJhcmNoeSBjaHJpc0ZpbGVcblxuICAgICAgICBwcm9jZXNzVHlwZXMgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIHNvcnRCeVR5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcbiAgICAgICAgY29uc29sZS5sb2cgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIHNvcnRCeUJvZHlIZWFkIGNocmlzRmlsZVxuXG4gICAgICAgIGZpbmFsaXNlVGFnIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBcbiAgICAgICAgZG9jdHlwZSA9ICc8IWRvY3R5cGUgaHRtbD4nXG4gICAgICAgIGRvY3R5cGUgKz0gJ1xcbicgaWYgaW5kZW50XG5cbiAgICAgICAgY2hyaXNGaWxlLmZpbmFsID0gZG9jdHlwZSArIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcblxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGUuZmluYWxcbiAgICAgICAgY29uc29sZS5sb2cgY2hyaXNGaWxlXG4gICAgICAgIGNocmlzRmlsZVxuXG5cblxuc29ydEJ5Qm9keUhlYWQgPSAoZmlsZSkgLT5cbiAgICBoZWFkVGFnID1cbiAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgc291cmNlIDogJ2hlYWQnXG4gICAgICAgIHR5cGUgOiB0YWdUeXBlXG4gICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuICAgIFxuICAgIHN0eWxlVGFnID1cbiAgICAgICAgbGV2ZWwgOiAwXG4gICAgICAgIHBhcmVudDogaGVhZFRhZ1xuICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgIHNvdXJjZSA6ICdzdHlsZSdcbiAgICAgICAgdHlwZSA6IGhlYWRUYWdUeXBlXG4gICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgaGVhZFRhZy5jaGlsZHJlbi5wdXNoIHN0eWxlVGFnXG5cbiAgICBib2R5VGFnID1cbiAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgc291cmNlIDogJ2JvZHknXG4gICAgICAgIHR5cGUgOiB0YWdUeXBlXG4gICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuICAgIFxuXG4gICAgZm9yIHRhZyBpbiBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlblxuICAgICAgICBhZGRlZFRvSGVhZCA9IGZhbHNlXG5cbiAgICAgICAgZm9yIGhlYWRUYWdUZW1wbGF0ZSBpbiBoZWFkVGFnc1xuICAgICAgICAgICAgaWYgdGFnLnNvdXJjZSA9PSBoZWFkVGFnVGVtcGxhdGVcbiAgICAgICAgICAgICAgICBhZGRlZFRvSGVhZCA9IHRydWVcbiAgICAgICAgICAgICAgICBoZWFkVGFnLmNoaWxkcmVuLnB1c2ggdGFnXG5cbiAgICAgICAgaWYgbm90IGFkZGVkVG9IZWFkXG4gICAgICAgICAgICBpZiB0YWcudHlwZSA9PSBzdHlsZUNsYXNzVHlwZVxuICAgICAgICAgICAgICAgIHN0eWxlVGFnLmNoaWxkcmVuLnB1c2ggdGFnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgYm9keVRhZy5jaGlsZHJlbi5wdXNoIHRhZ1xuXG4gICAgYm9keVRhZy5zdHlsZXMgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5zdHlsZXNcbiAgICBib2R5VGFnLnByb3BlcnRpZXMgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5wcm9wZXJ0aWVzXG5cbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5zdHlsZXMgPSBuZXcgQXJyYXlcbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5wcm9wZXJ0aWVzID0gbmV3IEFycmF5XG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW4gPSBuZXcgQXJyYXlcblxuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuLnB1c2ggaGVhZFRhZ1xuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuLnB1c2ggYm9keVRhZ1xuXG4gICAgZm9ybWF0TGV2ZWxzIGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgaW5kZW50TGluZXMgZmlsZS5pblByb2dyZXNzTGluZXNcblxuXG5cbmluZGVudExpbmVzID0gKHRhZykgLT5cbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGNoaWxkLmluZGVudGF0aW9uID0gY2hpbGQubGV2ZWwgKiB0YWcuaW5kZW50XG4gICAgICAgIGNoaWxkLmluZGVudCA9IHRhZy5pbmRlbnRcblxuICAgICAgICBpZiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgaW5kZW50TGluZXMgY2hpbGRcblxuXG5cblxuY2xlYW51cExpbmVzID0gKHNvdXJjZUxpbmVzKSAtPlxuICAgIG5ld1NvdXJjZUxpbmVzID0gbmV3IEFycmF5XG5cbiAgICBmb3IgbGluZSBpbiBzb3VyY2VMaW5lc1xuICAgICAgICBpZiBhbmFsaXNlVHlwZShsaW5lKSAhPSAtMlxuICAgICAgICAgICAgbmV3U291cmNlTGluZXMucHVzaCBsaW5lXG4gICAgXG4gICAgbmV3U291cmNlTGluZXNcblxuXG5hbmFsaXNlVHlwZSA9IChsaW5lKSAtPlxuICAgIGxpbmVUeXBlID0gLTFcblxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBjb21tZW50RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBlbXB0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlUHJvcGVydHlUeXBlIGlmIHN0eWxlUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgaWYgdGFnRmlsdGVyLnRlc3QgbGluZVxuICAgICAgICBsaW5lVHlwZSA9IHRhZ1R5cGUgXG4gICAgICAgIGlmIHNjcmlwdFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICAgICAgICAgIGxpbmVUeXBlID0gc2NyaXB0VGFnVHlwZVxuXG4gICAgbGluZVR5cGUgPSBoZWFkVGFnVHlwZSBpZiBoZWFkVGFnRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3R5bGVDbGFzc1R5cGUgaWYgc3R5bGVDbGFzc0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHRhZ1Byb3BlcnR5VHlwZSBpZiB0YWdQcm9wZXJ0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0cmluZ1R5cGUgaWYgc3RyaW5nRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdmFyaWFibGVUeXBlIGlmIHZhcmlhYmxlRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gbW9kdWxlVHlwZSBpZiBtb2R1bGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgXG4gICAgbGluZVR5cGVcblxuXG5cblxuY291bnRTcGFjZXMgPSAobGluZSkgLT5cbiAgICBzcGFjZXMgPSAwXG4gICAgaWYgbGluZVswXSA9PSAnICdcbiAgICAgICAgd2hpbGUgbGluZVtzcGFjZXNdID09ICcgJ1xuICAgICAgICAgICAgc3BhY2VzICs9IDFcbiAgICBcbiAgICBzcGFjZXNcblxuXG5cblxuXG5cbnByb2Nlc3NIaWVyYXJjaHkgPSAoZmlsZSkgLT5cbiAgICBjdXJyZW50UGFyZW50ID0gZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICBjdXJyZW50Q2hpbGQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgZm9yIGxpbmUgaW4gWzAuLi5maWxlLnNvdXJjZS5sZW5ndGhdXG4gICAgICAgIGxpbmVMZXZlbCA9IGNvdW50U3BhY2VzIGZpbGUuc291cmNlW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZUxldmVsID4gY3VycmVudFBhcmVudC5sZXZlbFxuICAgICAgICAgICAgaWYgbGluZUxldmVsID4gY3VycmVudENoaWxkLmxldmVsXG4gICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudENoaWxkXG5cbiAgICAgICAgICAgIG5ld0xpbmUgPVxuICAgICAgICAgICAgICAgIHNvdXJjZSA6IGZpbGUuc291cmNlW2xpbmVdLnNsaWNlIGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBwYXJlbnQgOiBjdXJyZW50UGFyZW50XG4gICAgICAgICAgICAgICAgbGV2ZWwgOiBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIDogW11cbiAgICAgICAgICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmNoaWxkcmVuLnB1c2ggbmV3TGluZVxuICAgICAgICAgICAgY3VycmVudENoaWxkID0gbmV3TGluZVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIGxpbmVMZXZlbCA8PSBjdXJyZW50UGFyZW50LmxldmVsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQucGFyZW50XG5cbiAgICAgICAgICAgIG5ld0xpbmUgPVxuICAgICAgICAgICAgICAgIHNvdXJjZSA6IGZpbGUuc291cmNlW2xpbmVdLnNsaWNlIGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBwYXJlbnQgOiBjdXJyZW50UGFyZW50XG4gICAgICAgICAgICAgICAgbGV2ZWwgOiBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIDogW11cbiAgICAgICAgICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmNoaWxkcmVuLnB1c2ggbmV3TGluZVxuICAgICAgICAgICAgY3VycmVudENoaWxkID0gbmV3TGluZVxuXG5cblxuXG5cblxuXG5wcm9jZXNzVHlwZXMgPSAobGluZXMpIC0+XG4gICAgZm9yIGxpbmUgaW4gbGluZXMuY2hpbGRyZW5cbiAgICAgICAgaWYgbGluZS5zb3VyY2VcbiAgICAgICAgICAgIGxpbmUudHlwZSA9IGFuYWxpc2VUeXBlIGxpbmUuc291cmNlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxpbmUudHlwZSA9IC0yXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHByb2Nlc3NUeXBlcyBsaW5lXG5cblxuXG5cblxuXG5zb3J0QnlUeXBlcyA9IChsaW5lcykgLT5cbiAgICAjIGV4dHJhY3QgdGhlIHN0eWxlcywgcHJvcGVydGllcyBhbmQgc3RyaW5ncyB0byB0aGVpciBwYXJlbnRzXG5cbiAgICBmb3IgbGluZSBpbiBsaW5lcy5jaGlsZHJlblxuICAgICAgICBpZiBsaW5lLnR5cGUgPT0gc2NyaXB0VGFnVHlwZVxuICAgICAgICAgICAgdHlwZUFsbFNjcmlwdHMgbGluZVxuXG4gICAgbGFzdENoaWxkID0gbGluZXMuY2hpbGRyZW4ubGVuZ3RoIC0gMVxuXG4gICAgZm9yIGxpbmUgaW4gW2xhc3RDaGlsZC4uMF1cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0uY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgc29ydEJ5VHlwZXMgbGluZXMuY2hpbGRyZW5bbGluZV1cblxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHRhZ1Byb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXS5zb3VyY2VcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5jaGlsZHJlbi5zcGxpY2UgbGluZSAsIDFcblxuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnR5cGUgPT0gc3R5bGVQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlcyA9IG5ldyBBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV0uc291cmNlXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlXG5cblxuXG5cblxuXG50eXBlQWxsU2NyaXB0cyA9IChzY3JpcHRMaW5lKSAtPlxuICAgIGlmIHNjcmlwdExpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICBmb3IgY29kZUxpbmUgaW4gc2NyaXB0TGluZS5jaGlsZHJlblxuICAgICAgICAgICAgY29kZUxpbmUudHlwZSA9IDVcbiAgICAgICAgICAgIGNvZGVMaW5lLmZpbmFsID0gY29kZUxpbmUuc291cmNlXG4gICAgICAgICAgICB0eXBlQWxsU2NyaXB0cyhjb2RlTGluZSkgaWYgY29kZUxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuXG5cblxuXG5cbmZpbmFsaXNlVGFnID0gKGxpbmUpIC0+XG4gICAgYWRkU3BhY2VzID0gJydcbiAgICBpZiBsaW5lLmluZGVudCA+IDBcbiAgICAgICAgYWRkU3BhY2VzICs9ICcgJyBmb3IgaSBpbiBbMC4uLmxpbmUuaW5kZW50XVxuXG4gICAgaWYgbGluZS50eXBlID09IHN0eWxlQ2xhc3NUeXBlXG4gICAgICAgIGZpbmFsaXNlU3R5bGUgbGluZVxuXG4gICAgaWYgbGluZS50eXBlID09IDAgb3IgbGluZS50eXBlID09IDkgb3IgbGluZS50eXBlID09IGhlYWRUYWdUeXBlXG4gICAgICAgIGZvcm1hdFRhZyBsaW5lXG5cbiAgICAgICAgbGluZS5maW5hbCA9ICc8JyArIGxpbmUuc291cmNlXG5cbiAgICAgICAgaWYgbGluZS5zdHlsZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgbGluZVN0eWxlID0gJ3N0eWxlIFwiJ1xuXG4gICAgICAgICAgICBmb3JtYXRUYWdTdHlsZXMgbGluZVxuXG4gICAgICAgICAgICBmb3Igc3R5bGUgaW4gbGluZS5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgKz0gc3R5bGUgKyAnOydcblxuICAgICAgICAgICAgbGluZVN0eWxlICs9ICdcIidcbiAgICAgICAgICAgIGxpbmUucHJvcGVydGllcy5wdXNoIGxpbmVTdHlsZVxuICAgICAgICBcblxuICAgICAgICBmb3JtYXRQcm9wZXJ0aWVzIGxpbmVcbiAgICAgICAgXG5cbiAgICAgICAgaWYgbGluZS5wcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gJyAnXG4gICAgICAgICAgICBmb3IgcHJvcGVydHkgaW4gbGluZS5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgbGluZS5maW5hbCArPSBwcm9wZXJ0eSArICcgJ1xuICAgICAgICBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgPSBsaW5lLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJz4nXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJ1xcbicgaWYgbGluZS5pbmRlbnQgPiAwXG5cblxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGZvcm1hdFN0cmluZ3MgbGluZVxuXG4gICAgICAgICAgICBpZiBsaW5lLnR5cGUgPT0gc2NyaXB0VGFnVHlwZVxuICAgICAgICAgICAgICAgIGxpbmUuaW5kZW50ID0gNFxuXG4gICAgICAgICAgICBmb3JtYXRTY3JpcHRzIGxpbmVcblxuICAgICAgICAgICAgZm9yIGNoaWxkIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmaW5hbGlzZVRhZyBjaGlsZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGNoaWxkTGluZXMgPSBjaGlsZC5maW5hbC5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgICAgIG5ld0ZpbmFsID0gJydcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgbCBpbiBjaGlsZExpbmVzXG4gICAgICAgICAgICAgICAgICAgIGlmIGwubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGFkZFNwYWNlcyArIGxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZpbmFsICs9IGwgKyAnXFxuJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsID0gbmV3RmluYWwuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IG5ld0ZpbmFsXG5cbiAgICAgICAgICAgICAgICBsaW5lLmZpbmFsICs9IGNoaWxkLmZpbmFsXG4gICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBsaW5lLnNlbGZDbG9zaW5nXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICc8LycgKyBsaW5lLnNvdXJjZSArICc+J1xuICAgICAgICAgICAgI2xpbmUuZmluYWwgKz0gJ1xcbicgaWYgbGluZS5pbmRlbnQgPiAwXG4gICAgXG5cblxuXG5maW5hbGlzZVN0eWxlID0gKHN0eWxlVGFnKSAtPlxuICAgIGFkZFNwYWNlcyA9ICcnXG4gICAgaWYgc3R5bGVUYWcuaW5kZW50ID4gMFxuICAgICAgICBhZGRTcGFjZXMgKz0gJyAnIGZvciBpIGluIFswLi4uc3R5bGVUYWcuaW5kZW50XVxuXG4gICAgZmluYWxUYWcgPSAnIydcblxuICAgIHRhZ0FycmF5ID0gc3R5bGVUYWcuc291cmNlLnNwbGl0ICcgJ1xuXG4gICAgZmluYWxUYWcgPSAnLicgaWYgdGFnQXJyYXlbMF0gPT0gJ2NsYXNzJ1xuXG4gICAgaWYgdGFnQXJyYXlbMV0gPT0gJ3RhZydcbiAgICAgICAgZmluYWxUYWcgPSAnJ1xuICAgICAgICBmaW5hbFRhZyArPSB0YWdBcnJheVsyXVxuICAgIGVsc2VcbiAgICAgICAgZmluYWxUYWcgKz0gdGFnQXJyYXlbMV1cblxuICAgIGZpbmFsVGFnICs9ICd7J1xuICAgIFxuICAgIGZvcm1hdFRhZ1N0eWxlcyBzdHlsZVRhZ1xuXG4gICAgZm9yIHN0eWxlIGluIHN0eWxlVGFnLnN0eWxlc1xuICAgICAgICBpZiBzdHlsZVRhZy5pbmRlbnQgPiAwXG4gICAgICAgICAgICBmaW5hbFRhZyArPSAnXFxuJ1xuICAgICAgICAgICAgZmluYWxUYWcgKz0gYWRkU3BhY2VzXG5cbiAgICAgICAgZmluYWxUYWcgKz0gc3R5bGVcbiAgICBcbiAgICBpZiBzdHlsZVRhZy5pbmRlbnQgPiAwXG4gICAgICAgIGZpbmFsVGFnICs9ICdcXG4nXG5cbiAgICBmaW5hbFRhZyArPSAnfSdcbiAgICBzdHlsZVRhZy5maW5hbCA9IGZpbmFsVGFnXG5cblxuXG5cbiAgICBcbmZvcm1hdFRhZyA9ICh0YWcpIC0+XG4gICAgdGFnQXJyYXkgPSB0YWcuc291cmNlLnNwbGl0IC9cXHMrL1xuICAgIHRhZy5zb3VyY2UgPSB0YWdBcnJheVswXVxuXG4gICAgdGFnLnNlbGZDbG9zaW5nID0gZmFsc2VcbiAgICBmb3Igc2VsZkNsb3NpbmdUYWcgaW4gc2VsZkNsb3NpbmdUYWdzXG4gICAgICAgIGlmIHRhZy5zb3VyY2UgPT0gc2VsZkNsb3NpbmdUYWdcbiAgICAgICAgICAgIHRhZy5zZWxmQ2xvc2luZyA9IHRydWVcblxuICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG5cbiAgICBpZiB0YWdBcnJheS5sZW5ndGggPiAwXG4gICAgICAgIGlmIHRhZ0FycmF5WzBdICE9ICdpcydcbiAgICAgICAgICAgIHRhZy5wcm9wZXJ0aWVzLnB1c2ggJ2lkIFwiJyArIHRhZ0FycmF5WzBdICsgJ1wiJ1xuICAgICAgICAgICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcbiAgICAgICAgXG4gICAgICAgIGlmIHRhZ0FycmF5WzBdID09ICdpcydcbiAgICAgICAgICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG4gICAgICAgICAgICB0YWdDbGFzc2VzID0gJ2NsYXNzIFwiJ1xuICAgICAgICAgICAgZm9yIHRhZ0NsYXNzIGluIHRhZ0FycmF5XG4gICAgICAgICAgICAgICAgdGFnQ2xhc3NlcyArPSB0YWdDbGFzcyArICcgJ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0YWdDbGFzc2VzID0gdGFnQ2xhc3Nlcy5zbGljZSAwLCAtMVxuICAgICAgICAgICAgdGFnQ2xhc3NlcyArPSAnXCInXG5cbiAgICAgICAgICAgIHRhZy5wcm9wZXJ0aWVzLnB1c2ggdGFnQ2xhc3Nlc1xuXG4gICAgdGFnLmZpbmFsID0gJydcbiAgICB0YWdcblxuXG5mb3JtYXRQcm9wZXJ0aWVzID0gKHRhZykgLT5cbiAgICBpZiB0YWcucHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgIG5ld1Byb3BlcnRpZXMgPSBuZXcgQXJyYXlcblxuICAgICAgICBmb3IgcHJvcGVydHkgaW4gdGFnLnByb3BlcnRpZXNcbiAgICAgICAgICAgIG5ld1Byb3BlcnR5ID0gJz0nXG5cbiAgICAgICAgICAgIHByb3BlcnR5TmFtZVNlYXJjaCA9IC9eW1xcd1xcLV0rKCAqKT9cIi9pXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eS5tYXRjaChwcm9wZXJ0eU5hbWVTZWFyY2gpWzBdXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eU5hbWUuc3BsaXQoXCIgXCIpWzBdXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eU5hbWUuc3BsaXQoJ1wiJylbMF1cblxuICAgICAgICAgICAgbmV3UHJvcGVydHkgPSBwcm9wZXJ0eU5hbWUgKyBuZXdQcm9wZXJ0eVxuXG4gICAgICAgICAgICBwcm9wZXJ0eURldGFpbHNTZWFyY2ggPSAvXFxcIi4qXFxcIi9cbiAgICAgICAgICAgIHByb3BlcnR5RGV0YWlscyA9IHByb3BlcnR5Lm1hdGNoKHByb3BlcnR5RGV0YWlsc1NlYXJjaClbMF1cbiAgICAgICAgICAgIG5ld1Byb3BlcnR5ICs9IHByb3BlcnR5RGV0YWlsc1xuXG4gICAgICAgICAgICBuZXdQcm9wZXJ0aWVzLnB1c2ggbmV3UHJvcGVydHlcblxuICAgICAgICB0YWcucHJvcGVydGllcyA9IG5ld1Byb3BlcnRpZXNcblxuXG5mb3JtYXRTdHJpbmdzID0gKHRhZykgLT5cbiAgICBcbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG5cbiAgICAgICAgaWYgY2hpbGQudHlwZSA9PSBzdHJpbmdUeXBlXG4gICAgICAgICAgICBmdWxsU3RyaW5nU2VhcmNoID0gL1xcXCIuKlxcXCIvXG4gICAgICAgICAgICBjbGVhblN0cmluZyA9IGNoaWxkLnNvdXJjZS5tYXRjaChmdWxsU3RyaW5nU2VhcmNoKVswXVxuICAgICAgICAgICAgY2xlYW5TdHJpbmcgPSBjbGVhblN0cmluZy5zbGljZSAxLCAtMVxuICAgICAgICAgICAgY2hpbGQuZmluYWwgPSBjbGVhblN0cmluZ1xuICAgICAgICAgICAgY2hpbGQuZmluYWwgKz0gJ1xcbicgaWYgY2hpbGQuaW5kZW50ID4gMCArIFwiXFxuXCJcblxuXG5cblxuZm9ybWF0U2NyaXB0cyA9ICh0YWcpIC0+XG4gICAgaW5kZW50TGluZXMgdGFnXG5cbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGFkZFNwYWNlcyA9ICcnXG5cbiAgICAgICAgaWYgY2hpbGQuaW5kZW50ID4gMFxuICAgICAgICAgICAgYWRkU3BhY2VzICs9ICcgJyBmb3IgaSBpbiBbMC4uLmNoaWxkLmluZGVudF1cbiAgICAgICAgXG4gICAgICAgIGlmIGNoaWxkLnR5cGUgPT0gc2NyaXB0VHlwZVxuXG4gICAgICAgICAgICBpZiBjaGlsZC5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgY2hpbGQuZmluYWwgKz0gJ1xcbidcbiAgICAgICAgICAgICAgICBmb3JtYXRTY3JpcHRzIGNoaWxkXG5cbiAgICAgICAgICAgICAgICBmb3Igc2NyaXB0Q2hpbGRMaW5lIGluIGNoaWxkLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENoaWxkU2xpY2VkID0gc2NyaXB0Q2hpbGRMaW5lLmZpbmFsLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENoaWxkU2xpY2VkLnBvcCgpXG4gICAgICAgICAgICAgICAgICAgIG5ld1NjcmlwdENoaWxkRmluYWwgPSAnJ1xuICAgICAgICAgICAgICAgICAgICBmb3IgaSBpbiBzY3JpcHRDaGlsZFNsaWNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3U2NyaXB0Q2hpbGRGaW5hbCArPSBhZGRTcGFjZXMgKyBpICsgJ1xcbidcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0Q2hpbGRMaW5lLmZpbmFsID0gbmV3U2NyaXB0Q2hpbGRGaW5hbFxuXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9IHNjcmlwdENoaWxkTGluZS5maW5hbFxuICAgICAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gY2hpbGQuZmluYWwuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nXG5cblxuXG5cbmZvcm1hdFRhZ1N0eWxlcyA9ICh0YWcpIC0+XG4gICAgZm9yIHN0eWxlIGluIHRhZy5zdHlsZXNcbiAgICAgICAgZGl2aWRlclBvc2l0aW9uID0gc3R5bGUuaW5kZXhPZiAnOidcbiAgICAgICAgcHJvcGVydHlBZnRlciA9IHN0eWxlLnNsaWNlIChkaXZpZGVyUG9zaXRpb24gKyAxKVxuICAgICAgICBjbGVhblN0eWxlUHJvcGVydHkgPSBzdHlsZS5zcGxpdCgnOicpWzBdICsgJzonXG4gICAgICAgIGFmdGVyQXJyYXkgPSBwcm9wZXJ0eUFmdGVyLnNwbGl0ICcgJ1xuXG4gICAgICAgIGZvciB4IGluIFswLi4uYWZ0ZXJBcnJheS5sZW5ndGhdXG4gICAgICAgICAgICBpZiBhZnRlckFycmF5W3hdICE9ICcnXG4gICAgICAgICAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ICs9IGFmdGVyQXJyYXlbeF1cbiAgICAgICAgICAgICAgICBjbGVhblN0eWxlUHJvcGVydHkgKz0gJyAnIGlmIHggPCBhZnRlckFycmF5Lmxlbmd0aCAtIDFcblxuICAgICAgICBzdHlsZSA9IGNsZWFuU3R5bGVQcm9wZXJ0eVxuXG5cbmZvcm1hdExldmVscyA9ICh0YWcpIC0+XG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBjaGlsZC5sZXZlbCA9IHRhZy5sZXZlbCArIDFcblxuICAgICAgICBpZiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgZm9ybWF0TGV2ZWxzIGNoaWxkIl19
//# sourceURL=coffeescript