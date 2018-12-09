(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, finaliseTag, formatProperties, formatTag, headTagFilter, headTagType, headTags, ignorableType, moduleFilter, moduleType, processHierarchy, processTypes, scriptType, selfClosingTags, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

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

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsZ0JBQUEsRUFBQSxTQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxRQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGVBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxnQkFBQSxFQUFBLGNBQUEsRUFBQSxtQkFBQSxFQUFBLGlCQUFBLEVBQUEsU0FBQSxFQUFBLGlCQUFBLEVBQUEsZUFBQSxFQUFBLE9BQUEsRUFBQSxjQUFBLEVBQUE7O0VBRUEsZUFBQSxHQUFrQixDQUFDLElBQUQsRUFBTyxLQUFQLEVBQWMsT0FBZCxFQUF1QixJQUF2QixFQUE2QixNQUE3QixFQUFxQyxNQUFyQzs7RUFDbEIsUUFBQSxHQUFXLENBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsT0FBbEIsRUFBMkIsT0FBM0IsRUFBb0MsTUFBcEM7O0VBRVgsT0FBQSxHQUFzQixFQUx0Qjs7RUFNQSxTQUFBLEdBQXNCOztFQUV0QixlQUFBLEdBQXNCLEVBUnRCOztFQVNBLGlCQUFBLEdBQXNCOztFQUV0QixjQUFBLEdBQXNCLEVBWHRCOztFQVlBLGdCQUFBLEdBQXNCOztFQUV0QixpQkFBQSxHQUFzQixFQWR0Qjs7RUFlQSxtQkFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQixFQWpCdEI7O0VBa0JBLFlBQUEsR0FBc0I7O0VBRXRCLFVBQUEsR0FBc0IsRUFwQnRCOztFQXNCQSxZQUFBLEdBQXNCLEVBdEJ0Qjs7RUF1QkEsY0FBQSxHQUFzQjs7RUFFdEIsV0FBQSxHQUFzQjs7RUFDdEIsYUFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFz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Z0JBO0VBdEJROztFQXlCWixnQkFBQSxHQUFtQixRQUFBLENBQUMsR0FBRCxDQUFBO0FBQ2YsUUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGVBQUEsRUFBQSxxQkFBQSxFQUFBLFlBQUEsRUFBQSxrQkFBQSxFQUFBO0lBQUEsSUFBRyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQWYsR0FBd0IsQ0FBM0I7TUFDSSxhQUFBLEdBQWdCLElBQUk7QUFFcEI7TUFBQSxLQUFBLHFDQUFBOztRQUNJLFdBQUEsR0FBYztRQUVkLGtCQUFBLEdBQXFCO1FBQ3JCLFlBQUEsR0FBZSxRQUFRLENBQUMsS0FBVCxDQUFlLGtCQUFmLENBQW1DLENBQUEsQ0FBQTtRQUNsRCxZQUFBLEdBQWUsWUFBWSxDQUFDLEtBQWIsQ0FBbUIsR0FBbkIsQ0FBd0IsQ0FBQSxDQUFBO1FBQ3ZDLFlBQUEsR0FBZSxZQUFZLENBQUMsS0FBYixDQUFtQixHQUFuQixDQUF3QixDQUFBLENBQUE7UUFFdkMsV0FBQSxHQUFjLFlBQUEsR0FBZTtRQUU3QixxQkFBQSxHQUF3QjtRQUN4QixlQUFBLEdBQWtCLFFBQVEsQ0FBQyxLQUFULENBQWUscUJBQWYsQ0FBc0MsQ0FBQSxDQUFBO1FBQ3hELFdBQUEsSUFBZTtRQUVmLGFBQWEsQ0FBQyxJQUFkLENBQW1CLFdBQW5CO01BZEo7YUFnQkEsR0FBRyxDQUFDLFVBQUosR0FBaUIsY0FuQnJCOztFQURlO0FBalJuQiIsInNvdXJjZXNDb250ZW50IjpbIiMgTElORSBUWVBFU1xuXG5zZWxmQ2xvc2luZ1RhZ3MgPSBbJ2JyJywgJ2ltZycsICdpbnB1dCcsICdocicsICdtZXRhJywgJ2xpbmsnXVxuaGVhZFRhZ3MgPSBbJ21ldGEnLCAndGl0bGUnLCAnc3R5bGUnLCAnY2xhc3MnLCAnbGluayddXG5cbnRhZ1R5cGUgICAgICAgICAgICAgPSAwICNpZiBubyBhbm90aGVyIHR5cGUgZm91bmQgYW5kIHRoaXMgaXMgbm90IGEgc2NyaXB0XG50YWdGaWx0ZXIgICAgICAgICAgID0gL15cXHMqXFx3KyAqKCggK1xcdyspPyggKik/KCAraXMoICsuKik/KT8pPyQvaVxuXG50YWdQcm9wZXJ0eVR5cGUgICAgID0gMSAjaWYgZm91bmQgcHJvcGVydHkgXCJzb21ldGhpbmdcIlxudGFnUHJvcGVydHlGaWx0ZXIgICA9IC9eXFxzKltcXHdcXC1dKyAqXCIuKlwiL1xuXG5zdHlsZUNsYXNzVHlwZSAgICAgID0gMiAjaWYgdGhpcyBpcyB0YWcgYW5kIHRoZSB0YWcgaXMgc3R5bGVcbnN0eWxlQ2xhc3NGaWx0ZXIgICAgPSAvXlxccyooc3R5bGV8Y2xhc3MpXFxzK1tcXHc6Xy1dKy9pXG5cbnN0eWxlUHJvcGVydHlUeXBlICAgPSAzICNpZiBmb3VuZCBwcm9wZXJ0eTogc29tZXRoaW5nXG5zdHlsZVByb3BlcnR5RmlsdGVyID0gL15cXHMqW15cIicgXSsgKjogKi4qL2lcblxuc3RyaW5nVHlwZSAgICAgICAgICA9IDQgI2lmIGZvdW5kIFwic3RyaW5nXCJcbnN0cmluZ0ZpbHRlciAgICAgICAgPSAvXlxccypcIi4qXCIvaVxuXG5zY3JpcHRUeXBlICAgICAgICAgID0gNSAjaWYgaXQgaXMgdW5kZXIgdGhlIHNjcmlwdCB0YWdcblxudmFyaWFibGVUeXBlICAgICAgICA9IDYgIyBpZiBmb3VuZCBuYW1lID0gc29tZXRoaW5nXG52YXJpYWJsZUZpbHRlciAgICAgID0gL15cXHMqXFx3K1xccyo9XFxzKltcXHdcXFddKy9pXG5cbmhlYWRUYWdUeXBlICAgICAgICAgPSA3XG5oZWFkVGFnRmlsdGVyICAgICAgID0gL15cXHMqKG1ldGF8dGl0bGV8bGlua3xiYXNlKS9pXG5cbm1vZHVsZVR5cGUgICAgICAgICAgPSA4XG5tb2R1bGVGaWx0ZXIgICAgICAgID0gL15cXHMqaW5jbHVkZVxccypcIi4rLmNocmlzXCIvaVxuXG5pZ25vcmFibGVUeXBlICAgICAgID0gLTJcbmVtcHR5RmlsdGVyICAgICAgICAgPSAvXltcXFdcXHNfXSokL1xuY29tbWVudEZpbHRlciAgICAgICA9IC9eXFxzKiMvaVxuXG5cblxuXG5cblxuXG5cbkBjaHJpc3RpbmUgPVxuICAgIGNocmlzdGluaXplIDogKHNvdXJjZVRleHQpIC0+XG4gICAgICAgIGNocmlzRmlsZSA9XG4gICAgICAgICAgICBzb3VyY2UgOiBbXVxuICAgICAgICAgICAgaW5Qcm9ncmVzc0xpbmVzIDogXG4gICAgICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiAnaHRtbCdcbiAgICAgICAgICAgICAgICB0eXBlIDogMFxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICAgICAgICAgIHN0eWxlcyA6IFtdXG5cbiAgICAgICAgICAgIGZpbmFsIDogJydcbiAgICAgICAgXG4gICAgICAgIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMucGFyZW50ID0gY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIGNocmlzRmlsZS5zb3VyY2UgPSBjbGVhbnVwTGluZXMgc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuXG4gICAgICAgIHByb2Nlc3NIaWVyYXJjaHkgY2hyaXNGaWxlXG4gICAgICAgIHByb2Nlc3NUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIHNvcnRCeVR5cGVzIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcbiAgICAgICAgZmluYWxpc2VUYWcgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcbiAgICAgICAgY2hyaXNGaWxlLmZpbmFsID0gY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lcy5maW5hbFxuXG4gICAgICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZVxuXG5cblxuXG5cblxuXG5cblxuY2xlYW51cExpbmVzID0gKHNvdXJjZUxpbmVzKSAtPlxuICAgIG5ld1NvdXJjZUxpbmVzID0gbmV3IEFycmF5XG5cbiAgICBmb3IgbGluZSBpbiBzb3VyY2VMaW5lc1xuICAgICAgICBpZiBhbmFsaXNlVHlwZShsaW5lKSAhPSAtMlxuICAgICAgICAgICAgY29uc29sZS5sb2cgXCJwdXNoaW5nIGxpbmU6IFwiICsgbGluZVxuICAgICAgICAgICAgbmV3U291cmNlTGluZXMucHVzaCBsaW5lXG4gICAgXG4gICAgbmV3U291cmNlTGluZXNcblxuXG5hbmFsaXNlVHlwZSA9IChsaW5lKSAtPlxuICAgIGxpbmVUeXBlID0gLTFcblxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBjb21tZW50RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaWdub3JhYmxlVHlwZSBpZiBlbXB0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlUHJvcGVydHlUeXBlIGlmIHN0eWxlUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB0YWdUeXBlIGlmIHRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IGhlYWRUYWdUeXBlIGlmIGhlYWRUYWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZUNsYXNzVHlwZSBpZiBzdHlsZUNsYXNzRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gdGFnUHJvcGVydHlUeXBlIGlmIHRhZ1Byb3BlcnR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3RyaW5nVHlwZSBpZiBzdHJpbmdGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB2YXJpYWJsZVR5cGUgaWYgdmFyaWFibGVGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBtb2R1bGVUeXBlIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBcbiAgICBsaW5lVHlwZVxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsaW5lKSAtPlxuICAgIHNwYWNlcyA9IDBcbiAgICBpZiBsaW5lWzBdID09ICcgJ1xuICAgICAgICB3aGlsZSBsaW5lW3NwYWNlc10gPT0gJyAnXG4gICAgICAgICAgICBzcGFjZXMgKz0gMVxuICAgIFxuICAgIHNwYWNlc1xuXG5cblxuXG5cblxucHJvY2Vzc0hpZXJhcmNoeSA9IChmaWxlKSAtPlxuICAgIGN1cnJlbnRQYXJlbnQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGN1cnJlbnRDaGlsZCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBmb3IgbGluZSBpbiBbMC4uLmZpbGUuc291cmNlLmxlbmd0aF1cbiAgICAgICAgbGluZUxldmVsID0gY291bnRTcGFjZXMgZmlsZS5zb3VyY2VbbGluZV1cblxuICAgICAgICBpZiBsaW5lTGV2ZWwgPj0gY3VycmVudFBhcmVudC5sZXZlbFxuICAgICAgICAgICAgaWYgbGluZUxldmVsID4gY3VycmVudENoaWxkLmxldmVsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRDaGlsZFxuXG4gICAgICAgICAgICBuZXdMaW5lID1cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiBmaWxlLnNvdXJjZVtsaW5lXS5zbGljZSBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgcGFyZW50IDogY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgIGxldmVsIDogbGluZUxldmVsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgICAgICAgICAgc3R5bGVzIDogW11cblxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoIG5ld0xpbmVcbiAgICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IG5ld0xpbmVcblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBsaW5lTGV2ZWwgPD0gY3VycmVudFBhcmVudC5sZXZlbFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudFxuXG4gICAgICAgICAgICBuZXdMaW5lID1cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiBmaWxlLnNvdXJjZVtsaW5lXS5zbGljZSBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgcGFyZW50IDogY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgIGxldmVsIDogbGluZUxldmVsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgICAgICAgICAgc3R5bGVzIDogW11cblxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoIG5ld0xpbmVcbiAgICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IG5ld0xpbmVcblxuXG5cblxuXG5cblxucHJvY2Vzc1R5cGVzID0gKGxpbmVzKSAtPlxuICAgIGZvciBsaW5lIGluIGxpbmVzLmNoaWxkcmVuXG4gICAgICAgIGlmIGxpbmUuc291cmNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSBhbmFsaXNlVHlwZSBsaW5lLnNvdXJjZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSAtMlxuICAgICAgICBcbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBwcm9jZXNzVHlwZXMgbGluZVxuXG5cblxuc29ydEJ5VHlwZXMgPSAobGluZXMpIC0+XG4gICAgIyBleHRyYWN0IHRoZSBzdHlsZXMsIHByb3BlcnRpZXMgYW5kIHN0cmluZ3MgdG8gdGhlaXIgcGFyZW50c1xuXG4gICAgbGFzdENoaWxkID0gbGluZXMuY2hpbGRyZW4ubGVuZ3RoIC0gMVxuXG4gICAgZm9yIGxpbmUgaW4gW2xhc3RDaGlsZC4uMF1cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0uY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgc29ydEJ5VHlwZXMgbGluZXMuY2hpbGRyZW5bbGluZV1cblxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHRhZ1Byb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICBcbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSBzdHlsZVByb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuXG5cbmZpbmFsaXNlVGFnID0gKGxpbmUpIC0+XG4gICAgYWRkU3BhY2VzID0gJydcbiAgICBpZiBsaW5lLmxldmVsID4gMFxuICAgICAgICBhZGRTcGFjZXMgKz0gJyAnIGZvciBpIGluIFswLi5saW5lLmxldmVsXVxuXG5cbiAgICBpZiBsaW5lLnR5cGUgPT0gMFxuICAgICAgICBmb3JtYXRUYWcgbGluZVxuICAgICAgICBsaW5lLmZpbmFsID0gYWRkU3BhY2VzICsgJzwnICsgbGluZS5zb3VyY2VcblxuICAgICAgICBpZiBsaW5lLnN0eWxlcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lU3R5bGUgPSAnc3R5bGUgXCInXG4gICAgICAgICAgICBmb3Igc3R5bGUgaW4gbGluZS5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lU3R5bGUgKz0gc3R5bGUuc291cmNlICsgJzsnXG5cbiAgICAgICAgICAgIGxpbmVTdHlsZSArPSAnXCInXG4gICAgICAgICAgICBsaW5lLnByb3BlcnRpZXMucHVzaCBsaW5lU3R5bGVcbiAgICAgICAgXG5cbiAgICAgICAgZm9ybWF0UHJvcGVydGllcyBsaW5lXG4gICAgICAgIFxuXG4gICAgICAgIGlmIGxpbmUucHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICcgJ1xuICAgICAgICAgICAgZm9yIHByb3BlcnR5IGluIGxpbmUucHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gcHJvcGVydHkgKyAnICdcbiAgICAgICAgXG4gICAgICAgICAgICBsaW5lLmZpbmFsID0gbGluZS5maW5hbC5zbGljZSAwLCAtMVxuICAgICAgICBsaW5lLmZpbmFsICs9ICc+XFxuJ1xuXG5cbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZpbmFsaXNlVGFnIGNoaWxkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjaGlsZCBpbiBsaW5lLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgbGluZS5maW5hbCArPSBjaGlsZC5maW5hbFxuICAgICAgICBcbiAgICAgICAgbGluZS5maW5hbCArPSBhZGRTcGFjZXMgKyAnPC8nICsgbGluZS5zb3VyY2UgKyAnPlxcbidcbiAgICBcbiAgICBlbHNlXG4gICAgICAgIGxpbmUuZmluYWwgPSBhZGRTcGFjZXMgKyBsaW5lLnNvdXJjZSArICdcXG4nXG4gICAgXG4gICAgXG5mb3JtYXRUYWcgPSAodGFnKSAtPlxuICAgIHRhZ0FycmF5ID0gdGFnLnNvdXJjZS5zcGxpdCAvXFxzKy9cbiAgICB0YWcuc291cmNlID0gdGFnQXJyYXlbMF1cbiAgICBjb25zb2xlLmxvZyB0YWcuc291cmNlXG4gICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcblxuICAgIGlmIHRhZ0FycmF5Lmxlbmd0aCA+IDBcbiAgICAgICAgaWYgdGFnQXJyYXlbMF0gIT0gJ2lzJ1xuICAgICAgICAgICAgdGFnLnByb3BlcnRpZXMucHVzaCAnaWQgXCInICsgdGFnQXJyYXlbMF0gKyAnXCInXG4gICAgICAgICAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuICAgICAgICBcbiAgICAgICAgaWYgdGFnQXJyYXlbMF0gPT0gJ2lzJ1xuICAgICAgICAgICAgdGFnQXJyYXkuc3BsaWNlKDAsMSlcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgPSAnY2xhc3MgXCInXG4gICAgICAgICAgICBmb3IgdGFnQ2xhc3MgaW4gdGFnQXJyYXlcbiAgICAgICAgICAgICAgICB0YWdDbGFzc2VzICs9IHRhZ0NsYXNzICsgJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgPSB0YWdDbGFzc2VzLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICB0YWdDbGFzc2VzICs9ICdcIidcblxuICAgICAgICAgICAgdGFnLnByb3BlcnRpZXMucHVzaCB0YWdDbGFzc2VzXG4gICAgXG4gICAgdGFnXG5cblxuZm9ybWF0UHJvcGVydGllcyA9ICh0YWcpIC0+XG4gICAgaWYgdGFnLnByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICBuZXdQcm9wZXJ0aWVzID0gbmV3IEFycmF5XG5cbiAgICAgICAgZm9yIHByb3BlcnR5IGluIHRhZy5wcm9wZXJ0aWVzXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSA9ICc9J1xuXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWVTZWFyY2ggPSAvXltcXHdcXC1dKyggKik/XCIvaVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHkubWF0Y2gocHJvcGVydHlOYW1lU2VhcmNoKVswXVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lLnNwbGl0KFwiIFwiKVswXVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lLnNwbGl0KCdcIicpWzBdXG5cbiAgICAgICAgICAgIG5ld1Byb3BlcnR5ID0gcHJvcGVydHlOYW1lICsgbmV3UHJvcGVydHlcblxuICAgICAgICAgICAgcHJvcGVydHlEZXRhaWxzU2VhcmNoID0gL1xcXCIuKlxcXCIvXG4gICAgICAgICAgICBwcm9wZXJ0eURldGFpbHMgPSBwcm9wZXJ0eS5tYXRjaChwcm9wZXJ0eURldGFpbHNTZWFyY2gpWzBdXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSArPSBwcm9wZXJ0eURldGFpbHNcblxuICAgICAgICAgICAgbmV3UHJvcGVydGllcy5wdXNoIG5ld1Byb3BlcnR5XG5cbiAgICAgICAgdGFnLnByb3BlcnRpZXMgPSBuZXdQcm9wZXJ0aWVzIl19
//# sourceURL=coffeescript