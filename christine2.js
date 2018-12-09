(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, finaliseTag, formatLevels, formatProperties, formatScripts, formatStrings, formatTag, formatTagStyles, headTagFilter, headTagType, headTags, ignorableType, indentLines, moduleFilter, moduleType, processHierarchy, processTypes, scriptTagFilter, scriptTagType, scriptType, selfClosingTags, sortByBodyHead, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, typeAllScripts, variableFilter, variableType;

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
        console.log("script detected");
      }
    }
    if (styleClassFilter.test(line)) {
      // lineType = headTagType if headTagFilter.test line
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
    console.log(scriptLine);
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
    if (line.type === 0 || line.type === 9) {
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
          console.log(childLines);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLGFBQUEsRUFBQSxTQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxnQkFBQSxFQUFBLFlBQUEsRUFBQSxlQUFBLEVBQUEsYUFBQSxFQUFBLFVBQUEsRUFBQSxlQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQSxjQUFBLEVBQUE7O0VBRUEsZUFBQSxHQUFrQixDQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsT0FBZCxFQUF1QixJQUF2QixFQUE2QixNQUE3QixFQUFxQyxNQUFyQzs7RUFDbEIsUUFBQSxHQUFXLENBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsT0FBbEIsRUFBMkIsT0FBM0IsRUFBb0MsTUFBcEMsRUFBNEMsTUFBNUM7O0VBRVgsT0FBQSxHQUFzQixFQUx0Qjs7RUFNQSxTQUFBLEdBQXNCOztFQUV0QixlQUFBLEdBQXNCLEVBUnRCOztFQVNBLGlCQUFBLEdBQXNCOztFQUV0QixjQUFBLEdBQXNCLEVBWHRCOztFQVlBLGdCQUFBLEdBQXNCOztFQUV0QixpQkFBQSxHQUFzQixFQWR0Qjs7RUFlQSxtQkFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQixFQWpCdEI7O0VBa0JBLFlBQUEsR0FBc0I7O0VBRXRCLGVBQUEsR0FBc0I7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QUFzQixJQUF0QjtXQUZKOztNQURKO21CQUtBLEtBQUEsR0FBUTtJQVhaLENBQUE7O0VBRGM7O0VBZWxCLFlBQUEsR0FBZSxRQUFBLENBQUMsR0FBRCxDQUFBO0FBQ1gsUUFBQSxLQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUE7QUFBQTtBQUFBO0lBQUEsS0FBQSxxQ0FBQTs7TUFDSSxLQUFLLENBQUMsS0FBTixHQUFjLEdBQUcsQ0FBQyxLQUFKLEdBQVk7TUFFMUIsSUFBRyxLQUFLLENBQUMsUUFBVDtxQkFDSSxZQUFBLENBQWEsS0FBYixHQURKO09BQUEsTUFBQTs2QkFBQTs7SUFISixDQUFBOztFQURXO0FBdmRmIiwic291cmNlc0NvbnRlbnQiOlsiIyBMSU5FIFRZUEVTXG5cbnNlbGZDbG9zaW5nVGFncyA9IFsnYnInLCAnaW1nJywgJ2lucHV0JywgJ2hyJywgJ21ldGEnLCAnbGluayddXG5oZWFkVGFncyA9IFsnbWV0YScsICd0aXRsZScsICdzdHlsZScsICdjbGFzcycsICdsaW5rJywgJ2Jhc2UnXVxuXG50YWdUeXBlICAgICAgICAgICAgID0gMCAjaWYgbm8gYW5vdGhlciB0eXBlIGZvdW5kIGFuZCB0aGlzIGlzIG5vdCBhIHNjcmlwdFxudGFnRmlsdGVyICAgICAgICAgICA9IC9eXFxzKlxcdysgKigoICtcXHcrKT8oICopPyggK2lzKCArLiopPyk/KT8kL2lcblxudGFnUHJvcGVydHlUeXBlICAgICA9IDEgI2lmIGZvdW5kIHByb3BlcnR5IFwic29tZXRoaW5nXCJcbnRhZ1Byb3BlcnR5RmlsdGVyICAgPSAvXlxccypbXFx3XFwtXSsgKlwiLipcIi9cblxuc3R5bGVDbGFzc1R5cGUgICAgICA9IDIgI2lmIHRoaXMgaXMgdGFnIGFuZCB0aGUgdGFnIGlzIHN0eWxlXG5zdHlsZUNsYXNzRmlsdGVyICAgID0gL15cXHMqKHN0eWxlfGNsYXNzKVxccytbXFx3Ol8tXSsvaVxuXG5zdHlsZVByb3BlcnR5VHlwZSAgID0gMyAjaWYgZm91bmQgcHJvcGVydHk6IHNvbWV0aGluZ1xuc3R5bGVQcm9wZXJ0eUZpbHRlciA9IC9eXFxzKlteXCInIF0rICo6ICouKi9pXG5cbnN0cmluZ1R5cGUgICAgICAgICAgPSA0ICNpZiBmb3VuZCBcInN0cmluZ1wiXG5zdHJpbmdGaWx0ZXIgICAgICAgID0gL15cXHMqXCIuKlwiL2lcblxuc2NyaXB0VGFnRmlsdGVyICAgICA9IC9eXFxzKihzY3JpcHR8Y29mZmVlc2NyaXB0fGphdmFzY3JpcHR8Y29mZmVlKS9pXG5zY3JpcHRUeXBlICAgICAgICAgID0gNSAjaWYgaXQgaXMgdW5kZXIgdGhlIHNjcmlwdCB0YWdcbnNjcmlwdFRhZ1R5cGUgICAgICAgPSA5XG5cbnZhcmlhYmxlVHlwZSAgICAgICAgPSA2ICMgaWYgZm91bmQgbmFtZSA9IHNvbWV0aGluZ1xudmFyaWFibGVGaWx0ZXIgICAgICA9IC9eXFxzKlxcdytcXHMqPVxccypbXFx3XFxXXSsvaVxuXG5oZWFkVGFnVHlwZSAgICAgICAgID0gN1xuaGVhZFRhZ0ZpbHRlciAgICAgICA9IC9eXFxzKihtZXRhfHRpdGxlfGxpbmt8YmFzZSkvaVxuXG5tb2R1bGVUeXBlICAgICAgICAgID0gOFxubW9kdWxlRmlsdGVyICAgICAgICA9IC9eXFxzKmluY2x1ZGVcXHMqXCIuKy5jaHJpc1wiL2lcblxuaWdub3JhYmxlVHlwZSAgICAgICA9IC0yXG5lbXB0eUZpbHRlciAgICAgICAgID0gL15bXFxXXFxzX10qJC9cbmNvbW1lbnRGaWx0ZXIgICAgICAgPSAvXlxccyojL2lcblxuXG5cblxuXG5cblxuXG5AY2hyaXN0aW5lID1cbiAgICBjaHJpc3Rpbml6ZSA6IChzb3VyY2VUZXh0LCBpbmRlbnQpIC0+XG4gICAgICAgIGNocmlzRmlsZSA9XG4gICAgICAgICAgICBzb3VyY2UgOiBbXVxuICAgICAgICAgICAgaW5Qcm9ncmVzc0xpbmVzIDogXG4gICAgICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiAnaHRtbCdcbiAgICAgICAgICAgICAgICB0eXBlIDogMFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG4gICAgICAgICAgICAgICAgaW5kZW50IDogaW5kZW50XG5cbiAgICAgICAgICAgIGZpbmFsIDogJydcbiAgICAgICAgXG5cbiAgICAgICAgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5wYXJlbnQgPSBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICAgICAgY2hyaXNGaWxlLnNvdXJjZSA9IGNsZWFudXBMaW5lcyBzb3VyY2VUZXh0LnNwbGl0ICdcXG4nXG5cbiAgICAgICAgcHJvY2Vzc0hpZXJhcmNoeSBjaHJpc0ZpbGVcblxuICAgICAgICBwcm9jZXNzVHlwZXMgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIHNvcnRCeVR5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBzb3J0QnlCb2R5SGVhZCBjaHJpc0ZpbGVcblxuICAgICAgICBmaW5hbGlzZVRhZyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICAgICAgXG4gICAgICAgIGRvY3R5cGUgPSAnPCFkb2N0eXBlIGh0bWw+J1xuICAgICAgICBkb2N0eXBlICs9ICdcXG4nIGlmIGluZGVudFxuXG4gICAgICAgIGNocmlzRmlsZS5maW5hbCA9IGRvY3R5cGUgKyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLmZpbmFsXG5cbiAgICAgICAgY29uc29sZS5sb2cgY2hyaXNGaWxlLmZpbmFsXG4gICAgICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZVxuICAgICAgICBjaHJpc0ZpbGVcblxuXG5cblxuc29ydEJ5Qm9keUhlYWQgPSAoZmlsZSkgLT5cbiAgICBoZWFkVGFnID1cbiAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgc291cmNlIDogJ2hlYWQnXG4gICAgICAgIHR5cGUgOiAwXG4gICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgYm9keVRhZyA9XG4gICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgcGFyZW50OiBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgIHNvdXJjZSA6ICdib2R5J1xuICAgICAgICB0eXBlIDogMFxuICAgICAgICBwcm9wZXJ0aWVzIDogW11cbiAgICAgICAgc3R5bGVzIDogW11cbiAgICBcblxuICAgIGZvciB0YWcgaW4gZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW5cbiAgICAgICAgYWRkZWRUb0hlYWQgPSBmYWxzZVxuXG4gICAgICAgIGZvciBoZWFkVGFnVGVtcGxhdGUgaW4gaGVhZFRhZ3NcbiAgICAgICAgICAgIGlmIHRhZy5zb3VyY2UgPT0gaGVhZFRhZ1RlbXBsYXRlXG4gICAgICAgICAgICAgICAgYWRkZWRUb0hlYWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgaGVhZFRhZy5jaGlsZHJlbi5wdXNoIHRhZ1xuXG4gICAgICAgIGlmIG5vdCBhZGRlZFRvSGVhZFxuICAgICAgICAgICAgYm9keVRhZy5jaGlsZHJlbi5wdXNoIHRhZ1xuXG4gICAgYm9keVRhZy5zdHlsZXMgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5zdHlsZXNcbiAgICBib2R5VGFnLnByb3BlcnRpZXMgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5wcm9wZXJ0aWVzXG5cbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5zdHlsZXMgPSBuZXcgQXJyYXlcbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5wcm9wZXJ0aWVzID0gbmV3IEFycmF5XG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuY2hpbGRyZW4gPSBuZXcgQXJyYXlcblxuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuLnB1c2ggaGVhZFRhZ1xuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuLnB1c2ggYm9keVRhZ1xuXG4gICAgZm9ybWF0TGV2ZWxzIGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgaW5kZW50TGluZXMgZmlsZS5pblByb2dyZXNzTGluZXNcblxuXG5cbmluZGVudExpbmVzID0gKHRhZykgLT5cbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGNoaWxkLmluZGVudGF0aW9uID0gY2hpbGQubGV2ZWwgKiB0YWcuaW5kZW50XG4gICAgICAgIGNoaWxkLmluZGVudCA9IHRhZy5pbmRlbnRcblxuICAgICAgICBpZiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgaW5kZW50TGluZXMgY2hpbGRcblxuXG5cblxuY2xlYW51cExpbmVzID0gKHNvdXJjZUxpbmVzKSAtPlxuICAgIG5ld1NvdXJjZUxpbmVzID0gbmV3IEFycmF5XG5cbiAgICBmb3IgbGluZSBpbiBzb3VyY2VMaW5lc1xuICAgICAgICBpZiBhbmFsaXNlVHlwZShsaW5lKSAhPSAtMlxuICAgICAgICAgICAgbmV3U291cmNlTGluZXMucHVzaCBsaW5lXG4gICAgXG4gICAgbmV3U291cmNlTGluZXNcblxuXG5hbmFsaXNlVHlwZSA9IChsaW5lKSAtPlxuICAgIGxpbmVUeXBlID0gLTFcblxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBjb21tZW50RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBlbXB0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlUHJvcGVydHlUeXBlIGlmIHN0eWxlUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgaWYgdGFnRmlsdGVyLnRlc3QgbGluZVxuICAgICAgICBsaW5lVHlwZSA9IHRhZ1R5cGUgXG4gICAgICAgIGlmIHNjcmlwdFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICAgICAgICAgIGxpbmVUeXBlID0gc2NyaXB0VGFnVHlwZVxuICAgICAgICAgICAgY29uc29sZS5sb2cgXCJzY3JpcHQgZGV0ZWN0ZWRcIlxuXG4gICAgIyBsaW5lVHlwZSA9IGhlYWRUYWdUeXBlIGlmIGhlYWRUYWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZUNsYXNzVHlwZSBpZiBzdHlsZUNsYXNzRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdGFnUHJvcGVydHlUeXBlIGlmIHRhZ1Byb3BlcnR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3RyaW5nVHlwZSBpZiBzdHJpbmdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB2YXJpYWJsZVR5cGUgaWYgdmFyaWFibGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBtb2R1bGVUeXBlIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBcbiAgICBsaW5lVHlwZVxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsaW5lKSAtPlxuICAgIHNwYWNlcyA9IDBcbiAgICBpZiBsaW5lWzBdID09ICcgJ1xuICAgICAgICB3aGlsZSBsaW5lW3NwYWNlc10gPT0gJyAnXG4gICAgICAgICAgICBzcGFjZXMgKz0gMVxuICAgIFxuICAgIHNwYWNlc1xuXG5cblxuXG5cblxucHJvY2Vzc0hpZXJhcmNoeSA9IChmaWxlKSAtPlxuICAgIGN1cnJlbnRQYXJlbnQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGN1cnJlbnRDaGlsZCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBmb3IgbGluZSBpbiBbMC4uLmZpbGUuc291cmNlLmxlbmd0aF1cbiAgICAgICAgbGluZUxldmVsID0gY291bnRTcGFjZXMgZmlsZS5zb3VyY2VbbGluZV1cblxuICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50UGFyZW50LmxldmVsXG4gICAgICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50Q2hpbGQubGV2ZWxcbiAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Q2hpbGRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbGluZUxldmVsIDw9IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cblxuXG5cblxuXG5cbnByb2Nlc3NUeXBlcyA9IChsaW5lcykgLT5cbiAgICBmb3IgbGluZSBpbiBsaW5lcy5jaGlsZHJlblxuICAgICAgICBpZiBsaW5lLnNvdXJjZVxuICAgICAgICAgICAgbGluZS50eXBlID0gYW5hbGlzZVR5cGUgbGluZS5zb3VyY2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGluZS50eXBlID0gLTJcbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgcHJvY2Vzc1R5cGVzIGxpbmVcblxuXG5cbnNvcnRCeVR5cGVzID0gKGxpbmVzKSAtPlxuICAgICMgZXh0cmFjdCB0aGUgc3R5bGVzLCBwcm9wZXJ0aWVzIGFuZCBzdHJpbmdzIHRvIHRoZWlyIHBhcmVudHNcblxuICAgIGZvciBsaW5lIGluIGxpbmVzLmNoaWxkcmVuXG4gICAgICAgIGlmIGxpbmUudHlwZSA9PSBzY3JpcHRUYWdUeXBlXG4gICAgICAgICAgICB0eXBlQWxsU2NyaXB0cyBsaW5lXG5cbiAgICBsYXN0Q2hpbGQgPSBsaW5lcy5jaGlsZHJlbi5sZW5ndGggLSAxXG5cbiAgICBmb3IgbGluZSBpbiBbbGFzdENoaWxkLi4wXVxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBzb3J0QnlUeXBlcyBsaW5lcy5jaGlsZHJlbltsaW5lXVxuXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnR5cGUgPT0gdGFnUHJvcGVydHlUeXBlXG4gICAgICAgICAgICBpZiAhbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQucHJvcGVydGllcyA9IG5ldyBBcnJheVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQucHJvcGVydGllcy5wdXNoIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnNvdXJjZVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICBcbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSBzdHlsZVByb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXS5zb3VyY2VcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5jaGlsZHJlbi5zcGxpY2UgbGluZSAsIDFcblxuICAgICAgICAgICAgY29udGludWVcblxuXG50eXBlQWxsU2NyaXB0cyA9IChzY3JpcHRMaW5lKSAtPlxuICAgIGNvbnNvbGUubG9nIHNjcmlwdExpbmVcbiAgICBpZiBzY3JpcHRMaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgZm9yIGNvZGVMaW5lIGluIHNjcmlwdExpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgIGNvZGVMaW5lLnR5cGUgPSA1XG4gICAgICAgICAgICBjb2RlTGluZS5maW5hbCA9IGNvZGVMaW5lLnNvdXJjZVxuICAgICAgICAgICAgdHlwZUFsbFNjcmlwdHMoY29kZUxpbmUpIGlmIGNvZGVMaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcblxuXG5maW5hbGlzZVRhZyA9IChsaW5lKSAtPlxuICAgIGFkZFNwYWNlcyA9ICcnXG4gICAgaWYgbGluZS5pbmRlbnQgPiAwXG4gICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLi5saW5lLmluZGVudF1cblxuXG4gICAgaWYgbGluZS50eXBlID09IDAgb3IgbGluZS50eXBlID09IDlcbiAgICAgICAgZm9ybWF0VGFnIGxpbmVcblxuICAgICAgICBsaW5lLmZpbmFsID0gJzwnICsgbGluZS5zb3VyY2VcblxuICAgICAgICBpZiBsaW5lLnN0eWxlcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lU3R5bGUgPSAnc3R5bGUgXCInXG5cbiAgICAgICAgICAgIGZvcm1hdFRhZ1N0eWxlcyBsaW5lXG5cbiAgICAgICAgICAgIGZvciBzdHlsZSBpbiBsaW5lLnN0eWxlc1xuICAgICAgICAgICAgICAgIGxpbmVTdHlsZSArPSBzdHlsZSArICc7J1xuXG4gICAgICAgICAgICBsaW5lU3R5bGUgKz0gJ1wiJ1xuICAgICAgICAgICAgbGluZS5wcm9wZXJ0aWVzLnB1c2ggbGluZVN0eWxlXG4gICAgICAgIFxuXG4gICAgICAgIGZvcm1hdFByb3BlcnRpZXMgbGluZVxuICAgICAgICBcblxuICAgICAgICBpZiBsaW5lLnByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnICdcbiAgICAgICAgICAgIGZvciBwcm9wZXJ0eSBpbiBsaW5lLnByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBsaW5lLmZpbmFsICs9IHByb3BlcnR5ICsgJyAnXG4gICAgICAgIFxuICAgICAgICAgICAgbGluZS5maW5hbCA9IGxpbmUuZmluYWwuc2xpY2UgMCwgLTFcbiAgICAgICAgbGluZS5maW5hbCArPSAnPidcbiAgICAgICAgbGluZS5maW5hbCArPSAnXFxuJyBpZiBsaW5lLmluZGVudCA+IDBcblxuXG4gICAgICAgIGlmIGxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgZm9ybWF0U3RyaW5ncyBsaW5lXG5cbiAgICAgICAgICAgIGlmIGxpbmUudHlwZSA9PSBzY3JpcHRUYWdUeXBlXG4gICAgICAgICAgICAgICAgbGluZS5pbmRlbnQgPSA0XG5cbiAgICAgICAgICAgIGZvcm1hdFNjcmlwdHMgbGluZVxuXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZpbmFsaXNlVGFnIGNoaWxkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjaGlsZCBpbiBsaW5lLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgY2hpbGRMaW5lcyA9IGNoaWxkLmZpbmFsLnNwbGl0ICdcXG4nXG4gICAgICAgICAgICAgICAgbmV3RmluYWwgPSAnJ1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nIGNoaWxkTGluZXNcbiAgICAgICAgICAgICAgICBmb3IgbCBpbiBjaGlsZExpbmVzXG4gICAgICAgICAgICAgICAgICAgIGlmIGwubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICAgICAgbCA9IGFkZFNwYWNlcyArIGxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZpbmFsICs9IGwgKyAnXFxuJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5ld0ZpbmFsID0gbmV3RmluYWwuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IG5ld0ZpbmFsXG5cbiAgICAgICAgICAgICAgICBsaW5lLmZpbmFsICs9IGNoaWxkLmZpbmFsXG4gICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBsaW5lLnNlbGZDbG9zaW5nXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICc8LycgKyBsaW5lLnNvdXJjZSArICc+J1xuICAgICAgICAgICAgI2xpbmUuZmluYWwgKz0gJ1xcbicgaWYgbGluZS5pbmRlbnQgPiAwXG4gICAgXG4gICAgXG4gICAgXG5mb3JtYXRUYWcgPSAodGFnKSAtPlxuICAgIHRhZ0FycmF5ID0gdGFnLnNvdXJjZS5zcGxpdCAvXFxzKy9cbiAgICB0YWcuc291cmNlID0gdGFnQXJyYXlbMF1cblxuICAgIHRhZy5zZWxmQ2xvc2luZyA9IGZhbHNlXG4gICAgZm9yIHNlbGZDbG9zaW5nVGFnIGluIHNlbGZDbG9zaW5nVGFnc1xuICAgICAgICBpZiB0YWcuc291cmNlID09IHNlbGZDbG9zaW5nVGFnXG4gICAgICAgICAgICB0YWcuc2VsZkNsb3NpbmcgPSB0cnVlXG5cbiAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuXG4gICAgaWYgdGFnQXJyYXkubGVuZ3RoID4gMFxuICAgICAgICBpZiB0YWdBcnJheVswXSAhPSAnaXMnXG4gICAgICAgICAgICB0YWcucHJvcGVydGllcy5wdXNoICdpZCBcIicgKyB0YWdBcnJheVswXSArICdcIidcbiAgICAgICAgICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG4gICAgICAgIFxuICAgICAgICBpZiB0YWdBcnJheVswXSA9PSAnaXMnXG4gICAgICAgICAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuICAgICAgICAgICAgdGFnQ2xhc3NlcyA9ICdjbGFzcyBcIidcbiAgICAgICAgICAgIGZvciB0YWdDbGFzcyBpbiB0YWdBcnJheVxuICAgICAgICAgICAgICAgIHRhZ0NsYXNzZXMgKz0gdGFnQ2xhc3MgKyAnICdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGFnQ2xhc3NlcyA9IHRhZ0NsYXNzZXMuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgKz0gJ1wiJ1xuXG4gICAgICAgICAgICB0YWcucHJvcGVydGllcy5wdXNoIHRhZ0NsYXNzZXNcblxuICAgIHRhZy5maW5hbCA9ICcnXG4gICAgdGFnXG5cblxuZm9ybWF0UHJvcGVydGllcyA9ICh0YWcpIC0+XG4gICAgaWYgdGFnLnByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICBuZXdQcm9wZXJ0aWVzID0gbmV3IEFycmF5XG5cbiAgICAgICAgZm9yIHByb3BlcnR5IGluIHRhZy5wcm9wZXJ0aWVzXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSA9ICc9J1xuXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWVTZWFyY2ggPSAvXltcXHdcXC1dKyggKik/XCIvaVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHkubWF0Y2gocHJvcGVydHlOYW1lU2VhcmNoKVswXVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lLnNwbGl0KFwiIFwiKVswXVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lLnNwbGl0KCdcIicpWzBdXG5cbiAgICAgICAgICAgIG5ld1Byb3BlcnR5ID0gcHJvcGVydHlOYW1lICsgbmV3UHJvcGVydHlcblxuICAgICAgICAgICAgcHJvcGVydHlEZXRhaWxzU2VhcmNoID0gL1xcXCIuKlxcXCIvXG4gICAgICAgICAgICBwcm9wZXJ0eURldGFpbHMgPSBwcm9wZXJ0eS5tYXRjaChwcm9wZXJ0eURldGFpbHNTZWFyY2gpWzBdXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSArPSBwcm9wZXJ0eURldGFpbHNcblxuICAgICAgICAgICAgbmV3UHJvcGVydGllcy5wdXNoIG5ld1Byb3BlcnR5XG5cbiAgICAgICAgdGFnLnByb3BlcnRpZXMgPSBuZXdQcm9wZXJ0aWVzXG5cblxuZm9ybWF0U3RyaW5ncyA9ICh0YWcpIC0+XG4gICAgXG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuXG4gICAgICAgIGlmIGNoaWxkLnR5cGUgPT0gc3RyaW5nVHlwZVxuICAgICAgICAgICAgZnVsbFN0cmluZ1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgPSBjaGlsZC5zb3VyY2UubWF0Y2goZnVsbFN0cmluZ1NlYXJjaClbMF1cbiAgICAgICAgICAgIGNsZWFuU3RyaW5nID0gY2xlYW5TdHJpbmcuc2xpY2UgMSwgLTFcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gY2xlYW5TdHJpbmdcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nIGlmIGNoaWxkLmluZGVudCA+IDAgKyBcIlxcblwiXG5cblxuXG5cbmZvcm1hdFNjcmlwdHMgPSAodGFnKSAtPlxuICAgIGluZGVudExpbmVzIHRhZ1xuXG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBhZGRTcGFjZXMgPSAnJ1xuXG4gICAgICAgIGlmIGNoaWxkLmluZGVudCA+IDBcbiAgICAgICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLi5jaGlsZC5pbmRlbnRdXG4gICAgICAgIFxuICAgICAgICBpZiBjaGlsZC50eXBlID09IHNjcmlwdFR5cGVcblxuICAgICAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nXG4gICAgICAgICAgICAgICAgZm9ybWF0U2NyaXB0cyBjaGlsZFxuXG4gICAgICAgICAgICAgICAgZm9yIHNjcmlwdENoaWxkTGluZSBpbiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZCA9IHNjcmlwdENoaWxkTGluZS5maW5hbC5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBuZXdTY3JpcHRDaGlsZEZpbmFsID0gJydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGkgaW4gc2NyaXB0Q2hpbGRTbGljZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1NjcmlwdENoaWxkRmluYWwgKz0gYWRkU3BhY2VzICsgaSArICdcXG4nXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENoaWxkTGluZS5maW5hbCA9IG5ld1NjcmlwdENoaWxkRmluYWxcblxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCArPSBzY3JpcHRDaGlsZExpbmUuZmluYWxcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IGNoaWxkLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGlsZC5maW5hbCArPSAnXFxuJ1xuXG5cblxuXG5mb3JtYXRUYWdTdHlsZXMgPSAodGFnKSAtPlxuICAgIGZvciBzdHlsZSBpbiB0YWcuc3R5bGVzXG4gICAgICAgIGRpdmlkZXJQb3NpdGlvbiA9IHN0eWxlLmluZGV4T2YgJzonXG4gICAgICAgIHByb3BlcnR5QWZ0ZXIgPSBzdHlsZS5zbGljZSAoZGl2aWRlclBvc2l0aW9uICsgMSlcbiAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ID0gc3R5bGUuc3BsaXQoJzonKVswXSArICc6J1xuICAgICAgICBhZnRlckFycmF5ID0gcHJvcGVydHlBZnRlci5zcGxpdCAnICdcblxuICAgICAgICBmb3IgeCBpbiBbMC4uLmFmdGVyQXJyYXkubGVuZ3RoXVxuICAgICAgICAgICAgaWYgYWZ0ZXJBcnJheVt4XSAhPSAnJ1xuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSArPSBhZnRlckFycmF5W3hdXG4gICAgICAgICAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ICs9ICcgJyBpZiB4IDwgYWZ0ZXJBcnJheS5sZW5ndGggLSAxXG5cbiAgICAgICAgc3R5bGUgPSBjbGVhblN0eWxlUHJvcGVydHlcblxuXG5mb3JtYXRMZXZlbHMgPSAodGFnKSAtPlxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgY2hpbGQubGV2ZWwgPSB0YWcubGV2ZWwgKyAxXG5cbiAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgIGZvcm1hdExldmVscyBjaGlsZCJdfQ==
//# sourceURL=coffeescript