(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, finaliseTag, formatProperties, formatStrings, formatTag, formatTagStyles, headTagFilter, headTagType, headTags, ignorableType, moduleFilter, moduleType, processHierarchy, processTypes, scriptType, selfClosingTags, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

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
      var bodyTag, chrisFile, headTag;
      chrisFile = {
        source: [],
        inProgressLines: {
          level: -2,
          children: [],
          source: 'html',
          type: 0,
          properties: [],
          styles: []
        },
        final: ''
      };
      headTag = {
        level: -1,
        parent: chrisFile.inProgressLines,
        children: [],
        source: 'head',
        type: 0,
        properties: [],
        styles: []
      };
      bodyTag = {
        level: -1,
        parent: chrisFile.inProgressLines,
        children: [],
        source: 'body',
        type: 0,
        properties: [],
        styles: []
      };
      chrisFile.inProgressLines.children.push(headTag);
      chrisFile.inProgressLines.children.push(bodyTag);
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
      line.final += '>\n';
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
        return line.final += addSpaces + '</' + line.source + '>\n';
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
    console.log(tag);
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
      if (child.level > 0) {
        for (i = k = 0, ref1 = child.level; (0 <= ref1 ? k <= ref1 : k >= ref1); i = 0 <= ref1 ? ++k : --k) {
          addSpaces += ' ';
        }
      }
      if (child.type === stringType) {
        fullStringSearch = /\".*\"/;
        cleanString = child.source.match(fullStringSearch)[0];
        cleanString = cleanString.slice(1, -1);
        results.push(child.final = addSpaces + cleanString + "\n");
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

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsZ0JBQUEsRUFBQSxhQUFBLEVBQUEsU0FBQSxFQUFBLGVBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsRUFBQSxhQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxnQkFBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQTs7RUFFQSxlQUFBLEdBQWtCLENBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxPQUFkLEVBQXVCLElBQXZCLEVBQTZCLE1BQTdCLEVBQXFDLE1BQXJDOztFQUNsQixRQUFBLEdBQVcsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUEyQixPQUEzQixFQUFvQyxNQUFwQzs7RUFFWCxPQUFBLEdBQXNCLEVBTHRCOztFQU1BLFNBQUEsR0FBc0I7O0VBRXRCLGVBQUEsR0FBc0IsRUFSdEI7O0VBU0EsaUJBQUEsR0FBc0I7O0VBRXRCLGNBQUEsR0FBc0IsRUFYdEI7O0VBWUEsZ0JBQUEsR0FBc0I7O0VBRXRCLGlCQUFBLEdBQXNCLEVBZHRCOztFQWVBLG1CQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCLEVBakJ0Qjs7RUFrQkEsWUFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQixFQXBCdEI7O0VBc0JBLFlBQUEsR0FBc0IsRUF0QnRCOztFQXVCQSxjQUFBLEdBQXNCOztFQUV0QixXQUFBLEdBQXNCOztFQUN0QixhQUFBLEdB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QTs2QkFBQTs7SUFOSixDQUFBOztFQUZZOztFQWVoQixlQUFBLEdBQWtCLFFBQUEsQ0FBQyxHQUFELENBQUE7QUFDZCxRQUFBLFVBQUEsRUFBQSxrQkFBQSxFQUFBLGVBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxhQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBO0FBQUE7QUFBQTtJQUFBLEtBQUEscUNBQUE7O01BQ0ksZUFBQSxHQUFrQixLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQ7TUFDbEIsYUFBQSxHQUFnQixLQUFLLENBQUMsS0FBTixDQUFhLGVBQUEsR0FBa0IsQ0FBL0I7TUFDaEIsa0JBQUEsR0FBcUIsS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaLENBQWlCLENBQUEsQ0FBQSxDQUFqQixHQUFzQjtNQUMzQyxVQUFBLEdBQWEsYUFBYSxDQUFDLEtBQWQsQ0FBb0IsR0FBcEI7TUFFYixLQUFTLGlHQUFUO1FBQ0ksSUFBRyxVQUFXLENBQUEsQ0FBQSxDQUFYLEtBQWlCLEVBQXBCO1VBQ0ksa0JBQUEsSUFBc0IsVUFBVyxDQUFBLENBQUE7VUFDakMsSUFBNkIsQ0FBQSxHQUFJLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLENBQXJEO1lBQUEsa0JBQUEsSUFBc0IsSUFBdEI7V0FGSjs7TUFESjttQkFLQSxLQUFBLEdBQVE7SUFYWixDQUFBOztFQURjO0FBdlZsQiIsInNvdXJjZXNDb250ZW50IjpbIiMgTElORSBUWVBFU1xuXG5zZWxmQ2xvc2luZ1RhZ3MgPSBbJ2JyJywgJ2ltZycsICdpbnB1dCcsICdocicsICdtZXRhJywgJ2xpbmsnXVxuaGVhZFRhZ3MgPSBbJ21ldGEnLCAndGl0bGUnLCAnc3R5bGUnLCAnY2xhc3MnLCAnbGluayddXG5cbnRhZ1R5cGUgICAgICAgICAgICAgPSAwICNpZiBubyBhbm90aGVyIHR5cGUgZm91bmQgYW5kIHRoaXMgaXMgbm90IGEgc2NyaXB0XG50YWdGaWx0ZXIgICAgICAgICAgID0gL15cXHMqXFx3KyAqKCggK1xcdyspPyggKik/KCAraXMoICsuKik/KT8pPyQvaVxuXG50YWdQcm9wZXJ0eVR5cGUgICAgID0gMSAjaWYgZm91bmQgcHJvcGVydHkgXCJzb21ldGhpbmdcIlxudGFnUHJvcGVydHlGaWx0ZXIgICA9IC9eXFxzKltcXHdcXC1dKyAqXCIuKlwiL1xuXG5zdHlsZUNsYXNzVHlwZSAgICAgID0gMiAjaWYgdGhpcyBpcyB0YWcgYW5kIHRoZSB0YWcgaXMgc3R5bGVcbnN0eWxlQ2xhc3NGaWx0ZXIgICAgPSAvXlxccyooc3R5bGV8Y2xhc3MpXFxzK1tcXHc6Xy1dKy9pXG5cbnN0eWxlUHJvcGVydHlUeXBlICAgPSAzICNpZiBmb3VuZCBwcm9wZXJ0eTogc29tZXRoaW5nXG5zdHlsZVByb3BlcnR5RmlsdGVyID0gL15cXHMqW15cIicgXSsgKjogKi4qL2lcblxuc3RyaW5nVHlwZSAgICAgICAgICA9IDQgI2lmIGZvdW5kIFwic3RyaW5nXCJcbnN0cmluZ0ZpbHRlciAgICAgICAgPSAvXlxccypcIi4qXCIvaVxuXG5zY3JpcHRUeXBlICAgICAgICAgID0gNSAjaWYgaXQgaXMgdW5kZXIgdGhlIHNjcmlwdCB0YWdcblxudmFyaWFibGVUeXBlICAgICAgICA9IDYgIyBpZiBmb3VuZCBuYW1lID0gc29tZXRoaW5nXG52YXJpYWJsZUZpbHRlciAgICAgID0gL15cXHMqXFx3K1xccyo9XFxzKltcXHdcXFddKy9pXG5cbmhlYWRUYWdUeXBlICAgICAgICAgPSA3XG5oZWFkVGFnRmlsdGVyICAgICAgID0gL15cXHMqKG1ldGF8dGl0bGV8bGlua3xiYXNlKS9pXG5cbm1vZHVsZVR5cGUgICAgICAgICAgPSA4XG5tb2R1bGVGaWx0ZXIgICAgICAgID0gL15cXHMqaW5jbHVkZVxccypcIi4rLmNocmlzXCIvaVxuXG5pZ25vcmFibGVUeXBlICAgICAgID0gLTJcbmVtcHR5RmlsdGVyICAgICAgICAgPSAvXltcXFdcXHNfXSokL1xuY29tbWVudEZpbHRlciAgICAgICA9IC9eXFxzKiMvaVxuXG5cblxuXG5cblxuXG5cbkBjaHJpc3RpbmUgPVxuICAgIGNocmlzdGluaXplIDogKHNvdXJjZVRleHQpIC0+XG4gICAgICAgIGNocmlzRmlsZSA9XG4gICAgICAgICAgICBzb3VyY2UgOiBbXVxuICAgICAgICAgICAgaW5Qcm9ncmVzc0xpbmVzIDogXG4gICAgICAgICAgICAgICAgbGV2ZWwgOiAtMlxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiAnaHRtbCdcbiAgICAgICAgICAgICAgICB0eXBlIDogMFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGZpbmFsIDogJydcbiAgICAgICAgXG4gICAgICAgIGhlYWRUYWcgPVxuICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgcGFyZW50IDogY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgc291cmNlIDogJ2hlYWQnXG4gICAgICAgICAgICB0eXBlIDogMFxuICAgICAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgICAgIGJvZHlUYWcgPVxuICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgcGFyZW50IDogY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgc291cmNlIDogJ2JvZHknXG4gICAgICAgICAgICB0eXBlIDogMFxuICAgICAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgICAgICBzdHlsZXMgOiBbXVxuICAgICAgICBcbiAgICAgICAgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbi5wdXNoIGhlYWRUYWdcbiAgICAgICAgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbi5wdXNoIGJvZHlUYWdcblxuICAgICAgICBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLnBhcmVudCA9IGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBjaHJpc0ZpbGUuc291cmNlID0gY2xlYW51cExpbmVzIHNvdXJjZVRleHQuc3BsaXQgJ1xcbidcblxuICAgICAgICBwcm9jZXNzSGllcmFyY2h5IGNocmlzRmlsZVxuICAgICAgICBwcm9jZXNzVHlwZXMgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICBzb3J0QnlUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICAgICAgZmluYWxpc2VUYWcgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcbiAgICAgICAgY2hyaXNGaWxlLmZpbmFsID0gY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5maW5hbFxuXG4gICAgICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZVxuXG5cblxuXG5cblxuXG5cblxuY2xlYW51cExpbmVzID0gKHNvdXJjZUxpbmVzKSAtPlxuICAgIG5ld1NvdXJjZUxpbmVzID0gbmV3IEFycmF5XG5cbiAgICBmb3IgbGluZSBpbiBzb3VyY2VMaW5lc1xuICAgICAgICBpZiBhbmFsaXNlVHlwZShsaW5lKSAhPSAtMlxuICAgICAgICAgICAgY29uc29sZS5sb2cgXCJwdXNoaW5nIGxpbmU6IFwiICsgbGluZVxuICAgICAgICAgICAgbmV3U291cmNlTGluZXMucHVzaCBsaW5lXG4gICAgXG4gICAgbmV3U291cmNlTGluZXNcblxuXG5hbmFsaXNlVHlwZSA9IChsaW5lKSAtPlxuICAgIGxpbmVUeXBlID0gLTFcblxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBjb21tZW50RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBlbXB0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlUHJvcGVydHlUeXBlIGlmIHN0eWxlUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB0YWdUeXBlIGlmIHRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IGhlYWRUYWdUeXBlIGlmIGhlYWRUYWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZUNsYXNzVHlwZSBpZiBzdHlsZUNsYXNzRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdGFnUHJvcGVydHlUeXBlIGlmIHRhZ1Byb3BlcnR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3RyaW5nVHlwZSBpZiBzdHJpbmdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB2YXJpYWJsZVR5cGUgaWYgdmFyaWFibGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBtb2R1bGVUeXBlIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBcbiAgICBsaW5lVHlwZVxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsaW5lKSAtPlxuICAgIHNwYWNlcyA9IDBcbiAgICBpZiBsaW5lWzBdID09ICcgJ1xuICAgICAgICB3aGlsZSBsaW5lW3NwYWNlc10gPT0gJyAnXG4gICAgICAgICAgICBzcGFjZXMgKz0gMVxuICAgIFxuICAgIHNwYWNlc1xuXG5cblxuXG5cblxucHJvY2Vzc0hpZXJhcmNoeSA9IChmaWxlKSAtPlxuICAgIGN1cnJlbnRQYXJlbnQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGN1cnJlbnRDaGlsZCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBmb3IgbGluZSBpbiBbMC4uLmZpbGUuc291cmNlLmxlbmd0aF1cbiAgICAgICAgbGluZUxldmVsID0gY291bnRTcGFjZXMgZmlsZS5zb3VyY2VbbGluZV1cblxuICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50UGFyZW50LmxldmVsXG4gICAgICAgICAgICBpZiBsaW5lTGV2ZWwgPiBjdXJyZW50Q2hpbGQubGV2ZWxcbiAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50Q2hpbGRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbGluZUxldmVsIDw9IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cblxuXG5cblxuXG5cbnByb2Nlc3NUeXBlcyA9IChsaW5lcykgLT5cbiAgICBmb3IgbGluZSBpbiBsaW5lcy5jaGlsZHJlblxuICAgICAgICBpZiBsaW5lLnNvdXJjZVxuICAgICAgICAgICAgbGluZS50eXBlID0gYW5hbGlzZVR5cGUgbGluZS5zb3VyY2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGluZS50eXBlID0gLTJcbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgcHJvY2Vzc1R5cGVzIGxpbmVcblxuXG5cbnNvcnRCeVR5cGVzID0gKGxpbmVzKSAtPlxuICAgICMgZXh0cmFjdCB0aGUgc3R5bGVzLCBwcm9wZXJ0aWVzIGFuZCBzdHJpbmdzIHRvIHRoZWlyIHBhcmVudHNcblxuICAgIGxhc3RDaGlsZCA9IGxpbmVzLmNoaWxkcmVuLmxlbmd0aCAtIDFcblxuICAgIGZvciBsaW5lIGluIFtsYXN0Q2hpbGQuLjBdXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHNvcnRCeVR5cGVzIGxpbmVzLmNoaWxkcmVuW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSB0YWdQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQucHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV0uc291cmNlXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHN0eWxlUHJvcGVydHlUeXBlXG4gICAgICAgICAgICBpZiAhbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlcy5wdXNoIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnNvdXJjZVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuXG5cbmZpbmFsaXNlVGFnID0gKGxpbmUpIC0+XG4gICAgYWRkU3BhY2VzID0gJydcbiAgICBpZiBsaW5lLmxldmVsID4gMFxuICAgICAgICBhZGRTcGFjZXMgKz0gJyAnIGZvciBpIGluIFswLi5saW5lLmxldmVsXVxuXG5cbiAgICBpZiBsaW5lLnR5cGUgPT0gMFxuICAgICAgICBmb3JtYXRUYWcgbGluZVxuICAgICAgICBsaW5lLmZpbmFsID0gYWRkU3BhY2VzICsgJzwnICsgbGluZS5zb3VyY2VcblxuICAgICAgICBpZiBsaW5lLnN0eWxlcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lU3R5bGUgPSAnc3R5bGUgXCInXG5cbiAgICAgICAgICAgIGZvcm1hdFRhZ1N0eWxlcyBsaW5lIFxuXG4gICAgICAgICAgICBmb3Igc3R5bGUgaW4gbGluZS5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgKz0gc3R5bGUgKyAnOydcblxuICAgICAgICAgICAgbGluZVN0eWxlICs9ICdcIidcbiAgICAgICAgICAgIGxpbmUucHJvcGVydGllcy5wdXNoIGxpbmVTdHlsZVxuICAgICAgICBcblxuICAgICAgICBmb3JtYXRQcm9wZXJ0aWVzIGxpbmVcbiAgICAgICAgXG5cbiAgICAgICAgaWYgbGluZS5wcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gJyAnXG4gICAgICAgICAgICBmb3IgcHJvcGVydHkgaW4gbGluZS5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgbGluZS5maW5hbCArPSBwcm9wZXJ0eSArICcgJ1xuICAgICAgICBcbiAgICAgICAgICAgIGxpbmUuZmluYWwgPSBsaW5lLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgIGxpbmUuZmluYWwgKz0gJz5cXG4nXG5cblxuICAgICAgICBpZiBsaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGZvcm1hdFN0cmluZ3MgbGluZVxuXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZpbmFsaXNlVGFnIGNoaWxkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjaGlsZCBpbiBsaW5lLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgbGluZS5maW5hbCArPSBjaGlsZC5maW5hbFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGxpbmUuc2VsZkNsb3NpbmdcbiAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gYWRkU3BhY2VzICsgJzwvJyArIGxpbmUuc291cmNlICsgJz5cXG4nXG4gICAgXG4gICAgXG4gICAgXG5mb3JtYXRUYWcgPSAodGFnKSAtPlxuICAgIHRhZ0FycmF5ID0gdGFnLnNvdXJjZS5zcGxpdCAvXFxzKy9cbiAgICB0YWcuc291cmNlID0gdGFnQXJyYXlbMF1cblxuICAgIHRhZy5zZWxmQ2xvc2luZyA9IGZhbHNlXG4gICAgZm9yIHNlbGZDbG9zaW5nVGFnIGluIHNlbGZDbG9zaW5nVGFnc1xuICAgICAgICBpZiB0YWcuc291cmNlID09IHNlbGZDbG9zaW5nVGFnXG4gICAgICAgICAgICB0YWcuc2VsZkNsb3NpbmcgPSB0cnVlXG5cbiAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuXG4gICAgaWYgdGFnQXJyYXkubGVuZ3RoID4gMFxuICAgICAgICBpZiB0YWdBcnJheVswXSAhPSAnaXMnXG4gICAgICAgICAgICB0YWcucHJvcGVydGllcy5wdXNoICdpZCBcIicgKyB0YWdBcnJheVswXSArICdcIidcbiAgICAgICAgICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG4gICAgICAgIFxuICAgICAgICBpZiB0YWdBcnJheVswXSA9PSAnaXMnXG4gICAgICAgICAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuICAgICAgICAgICAgdGFnQ2xhc3NlcyA9ICdjbGFzcyBcIidcbiAgICAgICAgICAgIGZvciB0YWdDbGFzcyBpbiB0YWdBcnJheVxuICAgICAgICAgICAgICAgIHRhZ0NsYXNzZXMgKz0gdGFnQ2xhc3MgKyAnICdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGFnQ2xhc3NlcyA9IHRhZ0NsYXNzZXMuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgKz0gJ1wiJ1xuXG4gICAgICAgICAgICB0YWcucHJvcGVydGllcy5wdXNoIHRhZ0NsYXNzZXNcbiAgICBcbiAgICB0YWdcblxuXG5mb3JtYXRQcm9wZXJ0aWVzID0gKHRhZykgLT5cbiAgICBjb25zb2xlLmxvZyB0YWdcbiAgICBpZiB0YWcucHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgIG5ld1Byb3BlcnRpZXMgPSBuZXcgQXJyYXlcblxuICAgICAgICBmb3IgcHJvcGVydHkgaW4gdGFnLnByb3BlcnRpZXNcbiAgICAgICAgICAgIG5ld1Byb3BlcnR5ID0gJz0nXG5cbiAgICAgICAgICAgIHByb3BlcnR5TmFtZVNlYXJjaCA9IC9eW1xcd1xcLV0rKCAqKT9cIi9pXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eS5tYXRjaChwcm9wZXJ0eU5hbWVTZWFyY2gpWzBdXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eU5hbWUuc3BsaXQoXCIgXCIpWzBdXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eU5hbWUuc3BsaXQoJ1wiJylbMF1cblxuICAgICAgICAgICAgbmV3UHJvcGVydHkgPSBwcm9wZXJ0eU5hbWUgKyBuZXdQcm9wZXJ0eVxuXG4gICAgICAgICAgICBwcm9wZXJ0eURldGFpbHNTZWFyY2ggPSAvXFxcIi4qXFxcIi9cbiAgICAgICAgICAgIHByb3BlcnR5RGV0YWlscyA9IHByb3BlcnR5Lm1hdGNoKHByb3BlcnR5RGV0YWlsc1NlYXJjaClbMF1cbiAgICAgICAgICAgIG5ld1Byb3BlcnR5ICs9IHByb3BlcnR5RGV0YWlsc1xuXG4gICAgICAgICAgICBuZXdQcm9wZXJ0aWVzLnB1c2ggbmV3UHJvcGVydHlcblxuICAgICAgICB0YWcucHJvcGVydGllcyA9IG5ld1Byb3BlcnRpZXNcblxuXG5mb3JtYXRTdHJpbmdzID0gKHRhZykgLT5cbiAgICBcbiAgICBmb3IgY2hpbGQgaW4gdGFnLmNoaWxkcmVuXG4gICAgICAgIGFkZFNwYWNlcyA9ICcnXG5cbiAgICAgICAgaWYgY2hpbGQubGV2ZWwgPiAwXG4gICAgICAgICAgICBhZGRTcGFjZXMgKz0gJyAnIGZvciBpIGluIFswLi5jaGlsZC5sZXZlbF1cblxuICAgICAgICBpZiBjaGlsZC50eXBlID09IHN0cmluZ1R5cGVcbiAgICAgICAgICAgIGZ1bGxTdHJpbmdTZWFyY2ggPSAvXFxcIi4qXFxcIi9cbiAgICAgICAgICAgIGNsZWFuU3RyaW5nID0gY2hpbGQuc291cmNlLm1hdGNoKGZ1bGxTdHJpbmdTZWFyY2gpWzBdXG4gICAgICAgICAgICBjbGVhblN0cmluZyA9IGNsZWFuU3RyaW5nLnNsaWNlIDEsIC0xXG4gICAgICAgICAgICBjaGlsZC5maW5hbCA9IGFkZFNwYWNlcyArIGNsZWFuU3RyaW5nICsgXCJcXG5cIlxuXG5cbmZvcm1hdFRhZ1N0eWxlcyA9ICh0YWcpIC0+XG4gICAgZm9yIHN0eWxlIGluIHRhZy5zdHlsZXNcbiAgICAgICAgZGl2aWRlclBvc2l0aW9uID0gc3R5bGUuaW5kZXhPZiAnOidcbiAgICAgICAgcHJvcGVydHlBZnRlciA9IHN0eWxlLnNsaWNlIChkaXZpZGVyUG9zaXRpb24gKyAxKVxuICAgICAgICBjbGVhblN0eWxlUHJvcGVydHkgPSBzdHlsZS5zcGxpdCgnOicpWzBdICsgJzonXG4gICAgICAgIGFmdGVyQXJyYXkgPSBwcm9wZXJ0eUFmdGVyLnNwbGl0ICcgJ1xuXG4gICAgICAgIGZvciB4IGluIFswLi4uYWZ0ZXJBcnJheS5sZW5ndGhdXG4gICAgICAgICAgICBpZiBhZnRlckFycmF5W3hdICE9ICcnXG4gICAgICAgICAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ICs9IGFmdGVyQXJyYXlbeF1cbiAgICAgICAgICAgICAgICBjbGVhblN0eWxlUHJvcGVydHkgKz0gJyAnIGlmIHggPCBhZnRlckFycmF5Lmxlbmd0aCAtIDFcblxuICAgICAgICBzdHlsZSA9IGNsZWFuU3R5bGVQcm9wZXJ0eSJdfQ==
//# sourceURL=coffeescript