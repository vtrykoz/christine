(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, finaliseTag, formatLevels, formatProperties, formatStrings, formatTag, formatTagStyles, headTagFilter, headTagType, headTags, ignorableType, indentLines, moduleFilter, moduleType, processHierarchy, processTypes, scriptType, selfClosingTags, sortByBodyHead, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

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
      console.log(line);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLFNBQUEsRUFBQSxlQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxRQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxlQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQTs7RUFFQSxlQUFBLEdBQWtCLENBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxPQUFkLEVBQXVCLElBQXZCLEVBQTZCLE1BQTdCLEVBQXFDLE1BQXJDOztFQUNsQixRQUFBLEdBQVcsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUEyQixPQUEzQixFQUFvQyxNQUFwQyxFQUE0QyxNQUE1Qzs7RUFFWCxPQUFBLEdBQXNCLEVBTHRCOztFQU1BLFNBQUEsR0FBc0I7O0VBRXRCLGVBQUEsR0FBc0IsRUFSdEI7O0VBU0EsaUJBQUEsR0FBc0I7O0VBRXRCLGNBQUEsR0FBc0IsRUFYdEI7O0VBWUEsZ0JBQUEsR0FBc0I7O0VBRXRCLGlCQUFBLEdBQXNCLEVBZHRCOztFQWVBLG1CQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCLEVBakJ0Qjs7RUFrQkEsWUFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQixFQXBCdEI7O0VBc0JBLFlBQUEsR0FBc0IsRUF0QnRCOztFQXVCQSxj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SUFBc0IsSUFBdEI7V0FGSjs7TUFESjttQkFLQSxLQUFBLEdBQVE7SUFYWixDQUFBOztFQURjOztFQWVsQixZQUFBLEdBQWUsUUFBQSxDQUFDLEdBQUQsQ0FBQTtBQUNYLFFBQUEsS0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUE7QUFBQTtJQUFBLEtBQUEscUNBQUE7O01BQ0ksS0FBSyxDQUFDLEtBQU4sR0FBYyxHQUFHLENBQUMsS0FBSixHQUFZO01BRTFCLElBQUcsS0FBSyxDQUFDLFFBQVQ7cUJBQ0ksWUFBQSxDQUFhLEtBQWIsR0FESjtPQUFBLE1BQUE7NkJBQUE7O0lBSEosQ0FBQTs7RUFEVztBQXBaZiIsInNvdXJjZXNDb250ZW50IjpbIiMgTElORSBUWVBFU1xuXG5zZWxmQ2xvc2luZ1RhZ3MgPSBbJ2JyJywgJ2ltZycsICdpbnB1dCcsICdocicsICdtZXRhJywgJ2xpbmsnXVxuaGVhZFRhZ3MgPSBbJ21ldGEnLCAndGl0bGUnLCAnc3R5bGUnLCAnY2xhc3MnLCAnbGluaycsICdiYXNlJ11cblxudGFnVHlwZSAgICAgICAgICAgICA9IDAgI2lmIG5vIGFub3RoZXIgdHlwZSBmb3VuZCBhbmQgdGhpcyBpcyBub3QgYSBzY3JpcHRcbnRhZ0ZpbHRlciAgICAgICAgICAgPSAvXlxccypcXHcrICooKCArXFx3Kyk/KCAqKT8oICtpcyggKy4qKT8pPyk/JC9pXG5cbnRhZ1Byb3BlcnR5VHlwZSAgICAgPSAxICNpZiBmb3VuZCBwcm9wZXJ0eSBcInNvbWV0aGluZ1wiXG50YWdQcm9wZXJ0eUZpbHRlciAgID0gL15cXHMqW1xcd1xcLV0rICpcIi4qXCIvXG5cbnN0eWxlQ2xhc3NUeXBlICAgICAgPSAyICNpZiB0aGlzIGlzIHRhZyBhbmQgdGhlIHRhZyBpcyBzdHlsZVxuc3R5bGVDbGFzc0ZpbHRlciAgICA9IC9eXFxzKihzdHlsZXxjbGFzcylcXHMrW1xcdzpfLV0rL2lcblxuc3R5bGVQcm9wZXJ0eVR5cGUgICA9IDMgI2lmIGZvdW5kIHByb3BlcnR5OiBzb21ldGhpbmdcbnN0eWxlUHJvcGVydHlGaWx0ZXIgPSAvXlxccypbXlwiJyBdKyAqOiAqLiovaVxuXG5zdHJpbmdUeXBlICAgICAgICAgID0gNCAjaWYgZm91bmQgXCJzdHJpbmdcIlxuc3RyaW5nRmlsdGVyICAgICAgICA9IC9eXFxzKlwiLipcIi9pXG5cbnNjcmlwdFR5cGUgICAgICAgICAgPSA1ICNpZiBpdCBpcyB1bmRlciB0aGUgc2NyaXB0IHRhZ1xuXG52YXJpYWJsZVR5cGUgICAgICAgID0gNiAjIGlmIGZvdW5kIG5hbWUgPSBzb21ldGhpbmdcbnZhcmlhYmxlRmlsdGVyICAgICAgPSAvXlxccypcXHcrXFxzKj1cXHMqW1xcd1xcV10rL2lcblxuaGVhZFRhZ1R5cGUgICAgICAgICA9IDdcbmhlYWRUYWdGaWx0ZXIgICAgICAgPSAvXlxccyoobWV0YXx0aXRsZXxsaW5rfGJhc2UpL2lcblxubW9kdWxlVHlwZSAgICAgICAgICA9IDhcbm1vZHVsZUZpbHRlciAgICAgICAgPSAvXlxccyppbmNsdWRlXFxzKlwiLisuY2hyaXNcIi9pXG5cbmlnbm9yYWJsZVR5cGUgICAgICAgPSAtMlxuZW1wdHlGaWx0ZXIgICAgICAgICA9IC9eW1xcV1xcc19dKiQvXG5jb21tZW50RmlsdGVyICAgICAgID0gL15cXHMqIy9pXG5cblxuXG5cblxuXG5cblxuQGNocmlzdGluZSA9XG4gICAgY2hyaXN0aW5pemUgOiAoc291cmNlVGV4dCwgaW5kZW50KSAtPlxuICAgICAgICBjaHJpc0ZpbGUgPVxuICAgICAgICAgICAgc291cmNlIDogW11cbiAgICAgICAgICAgIGluUHJvZ3Jlc3NMaW5lcyA6IFxuICAgICAgICAgICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgc291cmNlIDogJ2h0bWwnXG4gICAgICAgICAgICAgICAgdHlwZSA6IDBcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIDogW11cbiAgICAgICAgICAgICAgICBzdHlsZXMgOiBbXVxuICAgICAgICAgICAgICAgIGluZGVudCA6IGluZGVudFxuXG4gICAgICAgICAgICBmaW5hbCA6ICcnXG4gICAgICAgIFxuXG4gICAgICAgIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMucGFyZW50ID0gY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIGNocmlzRmlsZS5zb3VyY2UgPSBjbGVhbnVwTGluZXMgc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuXG4gICAgICAgIHByb2Nlc3NIaWVyYXJjaHkgY2hyaXNGaWxlXG5cbiAgICAgICAgcHJvY2Vzc1R5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBzb3J0QnlUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICAgICAgc29ydEJ5Qm9keUhlYWQgY2hyaXNGaWxlXG5cbiAgICAgICAgZmluYWxpc2VUYWcgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIFxuICAgICAgICBkb2N0eXBlID0gJzwhZG9jdHlwZSBodG1sPidcbiAgICAgICAgZG9jdHlwZSArPSAnXFxuJyBpZiBpbmRlbnRcblxuICAgICAgICBjaHJpc0ZpbGUuZmluYWwgPSBkb2N0eXBlICsgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5maW5hbFxuXG4gICAgICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZS5maW5hbFxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGVcbiAgICAgICAgY2hyaXNGaWxlXG5cblxuXG5cbnNvcnRCeUJvZHlIZWFkID0gKGZpbGUpIC0+XG4gICAgaGVhZFRhZyA9XG4gICAgICAgIGxldmVsIDogLTFcbiAgICAgICAgcGFyZW50OiBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgIHNvdXJjZSA6ICdoZWFkJ1xuICAgICAgICB0eXBlIDogMFxuICAgICAgICBwcm9wZXJ0aWVzIDogW11cbiAgICAgICAgc3R5bGVzIDogW11cblxuICAgIGJvZHlUYWcgPVxuICAgICAgICBsZXZlbCA6IC0xXG4gICAgICAgIHBhcmVudDogZmlsZS5pblByb2dyZXNzTGluZXNcbiAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICBzb3VyY2UgOiAnYm9keSdcbiAgICAgICAgdHlwZSA6IDBcbiAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgIHN0eWxlcyA6IFtdXG4gICAgXG5cbiAgICBmb3IgdGFnIGluIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuXG4gICAgICAgIGFkZGVkVG9IZWFkID0gZmFsc2VcblxuICAgICAgICBmb3IgaGVhZFRhZ1RlbXBsYXRlIGluIGhlYWRUYWdzXG4gICAgICAgICAgICBpZiB0YWcuc291cmNlID09IGhlYWRUYWdUZW1wbGF0ZVxuICAgICAgICAgICAgICAgIGFkZGVkVG9IZWFkID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGhlYWRUYWcuY2hpbGRyZW4ucHVzaCB0YWdcblxuICAgICAgICBpZiBub3QgYWRkZWRUb0hlYWRcbiAgICAgICAgICAgIGJvZHlUYWcuY2hpbGRyZW4ucHVzaCB0YWdcblxuICAgIGJvZHlUYWcuc3R5bGVzID0gZmlsZS5pblByb2dyZXNzTGluZXMuc3R5bGVzXG4gICAgYm9keVRhZy5wcm9wZXJ0aWVzID0gZmlsZS5pblByb2dyZXNzTGluZXMucHJvcGVydGllc1xuXG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuc3R5bGVzID0gbmV3IEFycmF5XG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMucHJvcGVydGllcyA9IG5ldyBBcnJheVxuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuID0gbmV3IEFycmF5XG5cbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbi5wdXNoIGhlYWRUYWdcbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbi5wdXNoIGJvZHlUYWdcblxuICAgIGZvcm1hdExldmVscyBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGluZGVudExpbmVzIGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cblxuXG5pbmRlbnRMaW5lcyA9ICh0YWcpIC0+XG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBjaGlsZC5pbmRlbnRhdGlvbiA9IGNoaWxkLmxldmVsICogdGFnLmluZGVudFxuICAgICAgICBjaGlsZC5pbmRlbnQgPSB0YWcuaW5kZW50XG5cbiAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgIGluZGVudExpbmVzIGNoaWxkXG5cblxuXG5cbmNsZWFudXBMaW5lcyA9IChzb3VyY2VMaW5lcykgLT5cbiAgICBuZXdTb3VyY2VMaW5lcyA9IG5ldyBBcnJheVxuXG4gICAgZm9yIGxpbmUgaW4gc291cmNlTGluZXNcbiAgICAgICAgaWYgYW5hbGlzZVR5cGUobGluZSkgIT0gLTJcbiAgICAgICAgICAgIG5ld1NvdXJjZUxpbmVzLnB1c2ggbGluZVxuICAgIFxuICAgIG5ld1NvdXJjZUxpbmVzXG5cblxuYW5hbGlzZVR5cGUgPSAobGluZSkgLT5cbiAgICBsaW5lVHlwZSA9IC0xXG5cbiAgICBsaW5lVHlwZSA9IGlnbm9yYWJsZVR5cGUgaWYgY29tbWVudEZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IGlnbm9yYWJsZVR5cGUgaWYgZW1wdHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZVByb3BlcnR5VHlwZSBpZiBzdHlsZVByb3BlcnR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdGFnVHlwZSBpZiB0YWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgIyBsaW5lVHlwZSA9IGhlYWRUYWdUeXBlIGlmIGhlYWRUYWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZUNsYXNzVHlwZSBpZiBzdHlsZUNsYXNzRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdGFnUHJvcGVydHlUeXBlIGlmIHRhZ1Byb3BlcnR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3RyaW5nVHlwZSBpZiBzdHJpbmdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB2YXJpYWJsZVR5cGUgaWYgdmFyaWFibGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBtb2R1bGVUeXBlIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBcbiAgICBsaW5lVHlwZVxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsaW5lKSAtPlxuICAgIHNwYWNlcyA9IDBcbiAgICBpZiBsaW5lWzBdID09ICcgJ1xuICAgICAgICB3aGlsZSBsaW5lW3NwYWNlc10gPT0gJyAnXG4gICAgICAgICAgICBzcGFjZXMgKz0gMVxuICAgIFxuICAgIHNwYWNlc1xuXG5cblxuXG5cblxucHJvY2Vzc0hpZXJhcmNoeSA9IChmaWxlKSAtPlxuICAgIGN1cnJlbnRQYXJlbnQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGN1cnJlbnRDaGlsZCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBmb3IgbGluZSBpbiBbMC4uLmZpbGUuc291cmNlLmxlbmd0aF1cbiAgICAgICAgbGluZUxldmVsID0gY291bnRTcGFjZXMgZmlsZS5zb3VyY2VbbGluZV1cblxuICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50UGFyZW50LmxldmVsXG4gICAgICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50Q2hpbGQubGV2ZWxcbiAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Q2hpbGRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbGluZUxldmVsIDw9IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cblxuXG5cblxuXG5cbnByb2Nlc3NUeXBlcyA9IChsaW5lcykgLT5cbiAgICBmb3IgbGluZSBpbiBsaW5lcy5jaGlsZHJlblxuICAgICAgICBpZiBsaW5lLnNvdXJjZVxuICAgICAgICAgICAgbGluZS50eXBlID0gYW5hbGlzZVR5cGUgbGluZS5zb3VyY2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGluZS50eXBlID0gLTJcbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgcHJvY2Vzc1R5cGVzIGxpbmVcblxuXG5cbnNvcnRCeVR5cGVzID0gKGxpbmVzKSAtPlxuICAgICMgZXh0cmFjdCB0aGUgc3R5bGVzLCBwcm9wZXJ0aWVzIGFuZCBzdHJpbmdzIHRvIHRoZWlyIHBhcmVudHNcblxuICAgIGxhc3RDaGlsZCA9IGxpbmVzLmNoaWxkcmVuLmxlbmd0aCAtIDFcblxuICAgIGZvciBsaW5lIGluIFtsYXN0Q2hpbGQuLjBdXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHNvcnRCeVR5cGVzIGxpbmVzLmNoaWxkcmVuW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSB0YWdQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQucHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV0uc291cmNlXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHN0eWxlUHJvcGVydHlUeXBlXG4gICAgICAgICAgICBpZiAhbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlcy5wdXNoIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnNvdXJjZVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuXG5cbmZpbmFsaXNlVGFnID0gKGxpbmUpIC0+XG4gICAgYWRkU3BhY2VzID0gJydcbiAgICBpZiBsaW5lLmluZGVudGF0aW9uID4gMFxuICAgICAgICBhZGRTcGFjZXMgKz0gJyAnIGZvciBpIGluIFswLi5saW5lLmluZGVudGF0aW9uXVxuXG5cbiAgICBpZiBsaW5lLnR5cGUgPT0gMFxuICAgICAgICBjb25zb2xlLmxvZyBsaW5lXG4gICAgICAgIGZvcm1hdFRhZyBsaW5lXG5cbiAgICAgICAgbGluZS5maW5hbCA9IGFkZFNwYWNlcyArICc8JyArIGxpbmUuc291cmNlXG5cbiAgICAgICAgaWYgbGluZS5zdHlsZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgbGluZVN0eWxlID0gJ3N0eWxlIFwiJ1xuXG4gICAgICAgICAgICBmb3JtYXRUYWdTdHlsZXMgbGluZVxuXG4gICAgICAgICAgICBmb3Igc3R5bGUgaW4gbGluZS5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgKz0gc3R5bGUgKyAnOydcblxuICAgICAgICAgICAgbGluZVN0eWxlICs9ICdcIidcbiAgICAgICAgICAgIGxpbmUucHJvcGVydGllcy5wdXNoIGxpbmVTdHlsZVxuICAgICAgICBcblxuICAgICAgICBmb3JtYXRQcm9wZXJ0aWVzIGxpbmVcbiAgICAgICAgXG5cbiAgICAgICAgaWYgbGluZS5wcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gJyAnXG4gICAgICAgICAgICBmb3IgcHJvcGVydHkgaW4gbGluZS5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgbGluZS5maW5hbCArPSBwcm9wZXJ0eSArICcgJ1xuICAgICAgICBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgPSBsaW5lLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJz4nXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJ1xcbicgaWYgbGluZS5pbmRlbnQgPiAwXG5cblxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGZvcm1hdFN0cmluZ3MgbGluZVxuXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZpbmFsaXNlVGFnIGNoaWxkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjaGlsZCBpbiBsaW5lLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgbGluZS5maW5hbCArPSBjaGlsZC5maW5hbFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGxpbmUuc2VsZkNsb3NpbmdcbiAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gYWRkU3BhY2VzICsgJzwvJyArIGxpbmUuc291cmNlICsgJz4nXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgIFxuICAgIFxuICAgIFxuZm9ybWF0VGFnID0gKHRhZykgLT5cbiAgICB0YWdBcnJheSA9IHRhZy5zb3VyY2Uuc3BsaXQgL1xccysvXG4gICAgdGFnLnNvdXJjZSA9IHRhZ0FycmF5WzBdXG5cbiAgICB0YWcuc2VsZkNsb3NpbmcgPSBmYWxzZVxuICAgIGZvciBzZWxmQ2xvc2luZ1RhZyBpbiBzZWxmQ2xvc2luZ1RhZ3NcbiAgICAgICAgaWYgdGFnLnNvdXJjZSA9PSBzZWxmQ2xvc2luZ1RhZ1xuICAgICAgICAgICAgdGFnLnNlbGZDbG9zaW5nID0gdHJ1ZVxuXG4gICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcblxuICAgIGlmIHRhZ0FycmF5Lmxlbmd0aCA+IDBcbiAgICAgICAgaWYgdGFnQXJyYXlbMF0gIT0gJ2lzJ1xuICAgICAgICAgICAgdGFnLnByb3BlcnRpZXMucHVzaCAnaWQgXCInICsgdGFnQXJyYXlbMF0gKyAnXCInXG4gICAgICAgICAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuICAgICAgICBcbiAgICAgICAgaWYgdGFnQXJyYXlbMF0gPT0gJ2lzJ1xuICAgICAgICAgICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgPSAnY2xhc3MgXCInXG4gICAgICAgICAgICBmb3IgdGFnQ2xhc3MgaW4gdGFnQXJyYXlcbiAgICAgICAgICAgICAgICB0YWdDbGFzc2VzICs9IHRhZ0NsYXNzICsgJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgPSB0YWdDbGFzc2VzLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICB0YWdDbGFzc2VzICs9ICdcIidcblxuICAgICAgICAgICAgdGFnLnByb3BlcnRpZXMucHVzaCB0YWdDbGFzc2VzXG5cbiAgICB0YWcuZmluYWwgPSAnJ1xuICAgIHRhZ1xuXG5cbmZvcm1hdFByb3BlcnRpZXMgPSAodGFnKSAtPlxuICAgIGlmIHRhZy5wcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgbmV3UHJvcGVydGllcyA9IG5ldyBBcnJheVxuXG4gICAgICAgIGZvciBwcm9wZXJ0eSBpbiB0YWcucHJvcGVydGllc1xuICAgICAgICAgICAgbmV3UHJvcGVydHkgPSAnPSdcblxuICAgICAgICAgICAgcHJvcGVydHlOYW1lU2VhcmNoID0gL15bXFx3XFwtXSsoICopP1wiL2lcbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3BlcnR5Lm1hdGNoKHByb3BlcnR5TmFtZVNlYXJjaClbMF1cbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3BlcnR5TmFtZS5zcGxpdChcIiBcIilbMF1cbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IHByb3BlcnR5TmFtZS5zcGxpdCgnXCInKVswXVxuXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSA9IHByb3BlcnR5TmFtZSArIG5ld1Byb3BlcnR5XG5cbiAgICAgICAgICAgIHByb3BlcnR5RGV0YWlsc1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgcHJvcGVydHlEZXRhaWxzID0gcHJvcGVydHkubWF0Y2gocHJvcGVydHlEZXRhaWxzU2VhcmNoKVswXVxuICAgICAgICAgICAgbmV3UHJvcGVydHkgKz0gcHJvcGVydHlEZXRhaWxzXG5cbiAgICAgICAgICAgIG5ld1Byb3BlcnRpZXMucHVzaCBuZXdQcm9wZXJ0eVxuXG4gICAgICAgIHRhZy5wcm9wZXJ0aWVzID0gbmV3UHJvcGVydGllc1xuXG5cbmZvcm1hdFN0cmluZ3MgPSAodGFnKSAtPlxuICAgIFxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgYWRkU3BhY2VzID0gJydcblxuICAgICAgICBpZiBjaGlsZC5pbmRlbnRhdGlvbiA+IDBcbiAgICAgICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLmNoaWxkLmluZGVudGF0aW9uXVxuXG4gICAgICAgIGlmIGNoaWxkLnR5cGUgPT0gc3RyaW5nVHlwZVxuICAgICAgICAgICAgZnVsbFN0cmluZ1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgPSBjaGlsZC5zb3VyY2UubWF0Y2goZnVsbFN0cmluZ1NlYXJjaClbMF1cbiAgICAgICAgICAgIGNsZWFuU3RyaW5nID0gY2xlYW5TdHJpbmcuc2xpY2UgMSwgLTFcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gYWRkU3BhY2VzICsgY2xlYW5TdHJpbmdcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nIGlmIGNoaWxkLmluZGVudCA+IDAgKyBcIlxcblwiXG5cblxuZm9ybWF0VGFnU3R5bGVzID0gKHRhZykgLT5cbiAgICBmb3Igc3R5bGUgaW4gdGFnLnN0eWxlc1xuICAgICAgICBkaXZpZGVyUG9zaXRpb24gPSBzdHlsZS5pbmRleE9mICc6J1xuICAgICAgICBwcm9wZXJ0eUFmdGVyID0gc3R5bGUuc2xpY2UgKGRpdmlkZXJQb3NpdGlvbiArIDEpXG4gICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSA9IHN0eWxlLnNwbGl0KCc6JylbMF0gKyAnOidcbiAgICAgICAgYWZ0ZXJBcnJheSA9IHByb3BlcnR5QWZ0ZXIuc3BsaXQgJyAnXG5cbiAgICAgICAgZm9yIHggaW4gWzAuLi5hZnRlckFycmF5Lmxlbmd0aF1cbiAgICAgICAgICAgIGlmIGFmdGVyQXJyYXlbeF0gIT0gJydcbiAgICAgICAgICAgICAgICBjbGVhblN0eWxlUHJvcGVydHkgKz0gYWZ0ZXJBcnJheVt4XVxuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSArPSAnICcgaWYgeCA8IGFmdGVyQXJyYXkubGVuZ3RoIC0gMVxuXG4gICAgICAgIHN0eWxlID0gY2xlYW5TdHlsZVByb3BlcnR5XG5cblxuZm9ybWF0TGV2ZWxzID0gKHRhZykgLT5cbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGNoaWxkLmxldmVsID0gdGFnLmxldmVsICsgMVxuXG4gICAgICAgIGlmIGNoaWxkLmNoaWxkcmVuXG4gICAgICAgICAgICBmb3JtYXRMZXZlbHMgY2hpbGQiXX0=
//# sourceURL=coffeescript