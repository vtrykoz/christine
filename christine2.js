(function() {
  var Path, analiseType, cleanupLines, coffee, commentFilter, countSpaces, emptyFilter, finaliseStyle, finaliseTag, formatLevels, formatProperties, formatScripts, formatStrings, formatTag, formatTagStyles, fs, headTagFilter, headTagType, headTags, ignorableType, indentLines, loadChrisModule, moduleFilter, moduleType, processHierarchy, processModules, processTypes, scriptTagFilter, scriptTagType, scriptType, selfClosingTags, sortByBodyHead, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, typeAllScripts, variableFilter, variableType;

  fs = require('fs');

  Path = require('path');

  coffee = require('coffee-script');

  // LINE TYPES
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

  exports.christinize = function(sourceText, indent) {
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
    chrisFile.source = processModules(chrisFile.source, '');
    console.log("hey!");
    console.log(chrisFile.source);
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
  };

  loadChrisModule = function(moduleFilePath) {
    var msls;
    msls = fs.readFileSync('./' + moduleFilePath, 'utf8');
    msls = cleanupLines(msls.split('\n'));
    return msls;
  };

  processModules = function(ls, f) {
    var chrisModulePath, j, k, l, moduleLevel, moduleLevelFilter, moduleLines, ref, ref1, resultLs, x;
    resultLs = new Array;
    moduleLevelFilter = /^\s*/;
    for (x = j = 0, ref = ls.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (moduleFilter.test(ls[x])) {
        chrisModulePath = ls[x].split('"')[1];
        moduleLines = loadChrisModule(f + '/' + chrisModulePath);
        moduleLevel = moduleLevelFilter.exec(ls[x]);
        for (l = k = 0, ref1 = moduleLines.length; (0 <= ref1 ? k < ref1 : k > ref1); l = 0 <= ref1 ? ++k : --k) {
          moduleLines[l] = moduleLevel + moduleLines[l];
        }
        moduleLines = processModules(moduleLines, path.dirname(f + '/' + chrisModulePath));
        resultLs = resultLs.concat(moduleLines);
      } else {
        resultLs.push(ls[x]);
      }
    }
    return resultLs;
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
          tag.parent = headTag;
          headTag.children.push(tag);
        }
      }
      if (!addedToHead) {
        if (tag.type === styleClassType) {
          tag.parent = styleTag;
          styleTag.children.push(tag);
        } else {
          tag.parent = bodyTag;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxhQUFBLEVBQUEsU0FBQSxFQUFBLGVBQUEsRUFBQSxFQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxRQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxlQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxnQkFBQSxFQUFBLGNBQUEsRUFBQSxZQUFBLEVBQUEsZUFBQSxFQUFBLGFBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxnQkFBQSxFQUFBLGNBQUEsRUFBQSxtQkFBQSxFQUFBLGlCQUFBLEVBQUEsU0FBQSxFQUFBLGlCQUFBLEVBQUEsZUFBQSxFQUFBLE9BQUEsRUFBQSxjQUFBLEVBQUEsY0FBQSxFQUFBOztFQUFBLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSLEVBRlQ7OztFQU1BLGVBQUEsR0FBa0IsQ0FBQyxJQUFELEVBQU8sS0FBUCxFQUFjLE9BQWQsRUFBdUIsSUFBdkIsRUFBNkIsTUFBN0IsRUFBcUMsTUFBckM7O0VBQ2xCLFFBQUEsR0FBVyxDQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLE9BQWxCLEVBQTJCLE9BQTNCLEVBQW9DLE1BQXBDLEVBQTRDLE1BQTVDOztFQUVYLE9BQUEsR0FBc0IsRUFUdEI7O0VBVUEsU0FBQSxHQUFzQjs7RUFFdEIsZUFBQSxHQUFzQixFQVp0Qjs7RUFhQSxpQkFB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SUFISixDQUFBOztFQURXO0FBempCZiIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMnXG5QYXRoID0gcmVxdWlyZSAncGF0aCdcbmNvZmZlZSA9IHJlcXVpcmUgJ2NvZmZlZS1zY3JpcHQnXG5cbiMgTElORSBUWVBFU1xuXG5zZWxmQ2xvc2luZ1RhZ3MgPSBbJ2JyJywgJ2ltZycsICdpbnB1dCcsICdocicsICdtZXRhJywgJ2xpbmsnXVxuaGVhZFRhZ3MgPSBbJ21ldGEnLCAndGl0bGUnLCAnc3R5bGUnLCAnY2xhc3MnLCAnbGluaycsICdiYXNlJ11cblxudGFnVHlwZSAgICAgICAgICAgICA9IDAgI2lmIG5vIGFub3RoZXIgdHlwZSBmb3VuZCBhbmQgdGhpcyBpcyBub3QgYSBzY3JpcHRcbnRhZ0ZpbHRlciAgICAgICAgICAgPSAvXlxccypcXHcrICooKCArXFx3Kyk/KCAqKT8oICtpcyggKy4qKT8pPyk/JC9pXG5cbnRhZ1Byb3BlcnR5VHlwZSAgICAgPSAxICNpZiBmb3VuZCBwcm9wZXJ0eSBcInNvbWV0aGluZ1wiXG50YWdQcm9wZXJ0eUZpbHRlciAgID0gL15cXHMqW1xcd1xcLV0rICpcIi4qXCIvXG5cbnN0eWxlQ2xhc3NUeXBlICAgICAgPSAyICNpZiB0aGlzIGlzIHRhZyBhbmQgdGhlIHRhZyBpcyBzdHlsZVxuc3R5bGVDbGFzc0ZpbHRlciAgICA9IC9eXFxzKihzdHlsZXxjbGFzcylcXHMrW1xcdzpfLV0rL2lcblxuc3R5bGVQcm9wZXJ0eVR5cGUgICA9IDMgI2lmIGZvdW5kIHByb3BlcnR5OiBzb21ldGhpbmdcbnN0eWxlUHJvcGVydHlGaWx0ZXIgPSAvXlxccypbXlwiJyBdKyAqOiAqLiovaVxuXG5zdHJpbmdUeXBlICAgICAgICAgID0gNCAjaWYgZm91bmQgXCJzdHJpbmdcIlxuc3RyaW5nRmlsdGVyICAgICAgICA9IC9eXFxzKlwiLipcIi9pXG5cbnNjcmlwdFRhZ0ZpbHRlciAgICAgPSAvXlxccyooc2NyaXB0fGNvZmZlZXNjcmlwdHxqYXZhc2NyaXB0fGNvZmZlZSkvaVxuc2NyaXB0VHlwZSAgICAgICAgICA9IDUgI2lmIGl0IGlzIHVuZGVyIHRoZSBzY3JpcHQgdGFnXG5zY3JpcHRUYWdUeXBlICAgICAgID0gOVxuXG52YXJpYWJsZVR5cGUgICAgICAgID0gNiAjIGlmIGZvdW5kIG5hbWUgPSBzb21ldGhpbmdcbnZhcmlhYmxlRmlsdGVyICAgICAgPSAvXlxccypcXHcrXFxzKj1cXHMqW1xcd1xcV10rL2lcblxuaGVhZFRhZ1R5cGUgICAgICAgICA9IDdcbmhlYWRUYWdGaWx0ZXIgICAgICAgPSAvXlxccyoobWV0YXx0aXRsZXxsaW5rfGJhc2UpL2lcblxubW9kdWxlVHlwZSAgICAgICAgICA9IDhcbm1vZHVsZUZpbHRlciAgICAgICAgPSAvXlxccyppbmNsdWRlXFxzKlwiLisuY2hyaXNcIi9pXG5cbmlnbm9yYWJsZVR5cGUgICAgICAgPSAtMlxuZW1wdHlGaWx0ZXIgICAgICAgICA9IC9eW1xcV1xcc19dKiQvXG5jb21tZW50RmlsdGVyICAgICAgID0gL15cXHMqIy9pXG5cblxuXG5cblxuXG5cblxuZXhwb3J0cy5jaHJpc3Rpbml6ZSA9IChzb3VyY2VUZXh0LCBpbmRlbnQpIC0+XG4gICAgY2hyaXNGaWxlID1cbiAgICAgICAgc291cmNlIDogW11cbiAgICAgICAgaW5Qcm9ncmVzc0xpbmVzIDogXG4gICAgICAgICAgICBsZXZlbCA6IC0xXG4gICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICBzb3VyY2UgOiAnaHRtbCdcbiAgICAgICAgICAgIHR5cGUgOiAwXG4gICAgICAgICAgICBwcm9wZXJ0aWVzIDogW11cbiAgICAgICAgICAgIHN0eWxlcyA6IFtdXG4gICAgICAgICAgICBpbmRlbnQgOiBpbmRlbnRcblxuICAgICAgICBmaW5hbCA6ICcnXG4gICAgXG5cbiAgICBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLnBhcmVudCA9IGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgIGNocmlzRmlsZS5zb3VyY2UgPSBjbGVhbnVwTGluZXMgc291cmNlVGV4dC5zcGxpdCAnXFxuJ1xuXG4gICAgY2hyaXNGaWxlLnNvdXJjZSA9IHByb2Nlc3NNb2R1bGVzIGNocmlzRmlsZS5zb3VyY2UsICcnXG5cbiAgICBjb25zb2xlLmxvZyBcImhleSFcIlxuICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZS5zb3VyY2VcblxuICAgIHByb2Nlc3NIaWVyYXJjaHkgY2hyaXNGaWxlXG5cbiAgICBwcm9jZXNzVHlwZXMgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgc29ydEJ5VHlwZXMgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuXG4gICAgc29ydEJ5Qm9keUhlYWQgY2hyaXNGaWxlXG5cbiAgICBmaW5hbGlzZVRhZyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBcbiAgICBkb2N0eXBlID0gJzwhZG9jdHlwZSBodG1sPidcbiAgICBkb2N0eXBlICs9ICdcXG4nIGlmIGluZGVudFxuXG4gICAgY2hyaXNGaWxlLmZpbmFsID0gZG9jdHlwZSArIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcblxuICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZS5maW5hbFxuICAgIGNvbnNvbGUubG9nIGNocmlzRmlsZVxuICAgIGNocmlzRmlsZVxuXG5cbmxvYWRDaHJpc01vZHVsZSA9IChtb2R1bGVGaWxlUGF0aCkgLT5cbiAgICBtc2xzID0gZnMucmVhZEZpbGVTeW5jKCcuLycgKyBtb2R1bGVGaWxlUGF0aCwgJ3V0ZjgnKVxuICAgIG1zbHMgPSBjbGVhbnVwTGluZXMobXNscy5zcGxpdCAnXFxuJylcbiAgICBtc2xzXG5cbnByb2Nlc3NNb2R1bGVzID0gKGxzLCBmKSAtPlxuICAgIHJlc3VsdExzID0gbmV3IEFycmF5XG4gICAgbW9kdWxlTGV2ZWxGaWx0ZXIgPSAvXlxccyovXG5cbiAgICBmb3IgeCBpbiBbMC4uLmxzLmxlbmd0aF1cbiAgICAgICAgaWYgbW9kdWxlRmlsdGVyLnRlc3QgbHNbeF1cbiAgICAgICAgICAgIGNocmlzTW9kdWxlUGF0aCA9IGxzW3hdLnNwbGl0KCdcIicpWzFdXG4gICAgICAgICAgICBtb2R1bGVMaW5lcyA9IGxvYWRDaHJpc01vZHVsZShmICsgJy8nICsgY2hyaXNNb2R1bGVQYXRoKVxuXG4gICAgICAgICAgICBtb2R1bGVMZXZlbCA9IG1vZHVsZUxldmVsRmlsdGVyLmV4ZWMobHNbeF0pXG4gICAgICAgICAgICBtb2R1bGVMaW5lc1tsXSA9IG1vZHVsZUxldmVsICsgbW9kdWxlTGluZXNbbF0gZm9yIGwgaW4gWzAuLi5tb2R1bGVMaW5lcy5sZW5ndGhdXG5cbiAgICAgICAgICAgIG1vZHVsZUxpbmVzID0gcHJvY2Vzc01vZHVsZXMobW9kdWxlTGluZXMsIHBhdGguZGlybmFtZShmICsgJy8nICsgY2hyaXNNb2R1bGVQYXRoKSlcbiAgICAgICAgICAgIHJlc3VsdExzID0gcmVzdWx0THMuY29uY2F0KG1vZHVsZUxpbmVzKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXN1bHRMcy5wdXNoIGxzW3hdXG5cbiAgICByZXN1bHRMc1xuICAgICAgICAgICAgXG5cblxuc29ydEJ5Qm9keUhlYWQgPSAoZmlsZSkgLT5cbiAgICBoZWFkVGFnID1cbiAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgc291cmNlIDogJ2hlYWQnXG4gICAgICAgIHR5cGUgOiB0YWdUeXBlXG4gICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuICAgIFxuICAgIHN0eWxlVGFnID1cbiAgICAgICAgbGV2ZWwgOiAwXG4gICAgICAgIHBhcmVudDogaGVhZFRhZ1xuICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgIHNvdXJjZSA6ICdzdHlsZSdcbiAgICAgICAgdHlwZSA6IGhlYWRUYWdUeXBlXG4gICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuXG4gICAgaGVhZFRhZy5jaGlsZHJlbi5wdXNoIHN0eWxlVGFnXG5cbiAgICBib2R5VGFnID1cbiAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICBwYXJlbnQ6IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgc291cmNlIDogJ2JvZHknXG4gICAgICAgIHR5cGUgOiB0YWdUeXBlXG4gICAgICAgIHByb3BlcnRpZXMgOiBbXVxuICAgICAgICBzdHlsZXMgOiBbXVxuICAgIFxuXG4gICAgZm9yIHRhZyBpbiBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlblxuICAgICAgICBhZGRlZFRvSGVhZCA9IGZhbHNlXG5cbiAgICAgICAgZm9yIGhlYWRUYWdUZW1wbGF0ZSBpbiBoZWFkVGFnc1xuICAgICAgICAgICAgaWYgdGFnLnNvdXJjZSA9PSBoZWFkVGFnVGVtcGxhdGVcbiAgICAgICAgICAgICAgICBhZGRlZFRvSGVhZCA9IHRydWVcbiAgICAgICAgICAgICAgICB0YWcucGFyZW50ID0gaGVhZFRhZ1xuICAgICAgICAgICAgICAgIGhlYWRUYWcuY2hpbGRyZW4ucHVzaCB0YWdcblxuICAgICAgICBpZiBub3QgYWRkZWRUb0hlYWRcbiAgICAgICAgICAgIGlmIHRhZy50eXBlID09IHN0eWxlQ2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgdGFnLnBhcmVudCA9IHN0eWxlVGFnXG4gICAgICAgICAgICAgICAgc3R5bGVUYWcuY2hpbGRyZW4ucHVzaCB0YWdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0YWcucGFyZW50ID0gYm9keVRhZ1xuICAgICAgICAgICAgICAgIGJvZHlUYWcuY2hpbGRyZW4ucHVzaCB0YWdcblxuICAgIGJvZHlUYWcuc3R5bGVzID0gZmlsZS5pblByb2dyZXNzTGluZXMuc3R5bGVzXG4gICAgYm9keVRhZy5wcm9wZXJ0aWVzID0gZmlsZS5pblByb2dyZXNzTGluZXMucHJvcGVydGllc1xuXG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMuc3R5bGVzID0gbmV3IEFycmF5XG4gICAgZmlsZS5pblByb2dyZXNzTGluZXMucHJvcGVydGllcyA9IG5ldyBBcnJheVxuICAgIGZpbGUuaW5Qcm9ncmVzc0xpbmVzLmNoaWxkcmVuID0gbmV3IEFycmF5XG5cbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbi5wdXNoIGhlYWRUYWdcbiAgICBmaWxlLmluUHJvZ3Jlc3NMaW5lcy5jaGlsZHJlbi5wdXNoIGJvZHlUYWdcblxuICAgIGZvcm1hdExldmVscyBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGluZGVudExpbmVzIGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cblxuXG5pbmRlbnRMaW5lcyA9ICh0YWcpIC0+XG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBjaGlsZC5pbmRlbnRhdGlvbiA9IGNoaWxkLmxldmVsICogdGFnLmluZGVudFxuICAgICAgICBjaGlsZC5pbmRlbnQgPSB0YWcuaW5kZW50XG5cbiAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgIGluZGVudExpbmVzIGNoaWxkXG5cblxuXG5cbmNsZWFudXBMaW5lcyA9IChzb3VyY2VMaW5lcykgLT5cbiAgICBuZXdTb3VyY2VMaW5lcyA9IG5ldyBBcnJheVxuXG4gICAgZm9yIGxpbmUgaW4gc291cmNlTGluZXNcbiAgICAgICAgaWYgYW5hbGlzZVR5cGUobGluZSkgIT0gLTJcbiAgICAgICAgICAgIG5ld1NvdXJjZUxpbmVzLnB1c2ggbGluZVxuICAgIFxuICAgIG5ld1NvdXJjZUxpbmVzXG5cblxuYW5hbGlzZVR5cGUgPSAobGluZSkgLT5cbiAgICBsaW5lVHlwZSA9IC0xXG5cbiAgICBsaW5lVHlwZSA9IGlnbm9yYWJsZVR5cGUgaWYgY29tbWVudEZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IGlnbm9yYWJsZVR5cGUgaWYgZW1wdHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHlsZVByb3BlcnR5VHlwZSBpZiBzdHlsZVByb3BlcnR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGlmIHRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICAgICAgbGluZVR5cGUgPSB0YWdUeXBlIFxuICAgICAgICBpZiBzY3JpcHRUYWdGaWx0ZXIudGVzdCBsaW5lXG4gICAgICAgICAgICBsaW5lVHlwZSA9IHNjcmlwdFRhZ1R5cGVcblxuICAgIGxpbmVUeXBlID0gaGVhZFRhZ1R5cGUgaWYgaGVhZFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlQ2xhc3NUeXBlIGlmIHN0eWxlQ2xhc3NGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB0YWdQcm9wZXJ0eVR5cGUgaWYgdGFnUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHJpbmdUeXBlIGlmIHN0cmluZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHZhcmlhYmxlVHlwZSBpZiB2YXJpYWJsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IG1vZHVsZVR5cGUgaWYgbW9kdWxlRmlsdGVyLnRlc3QgbGluZVxuICAgIFxuICAgIGxpbmVUeXBlXG5cblxuXG5cbmNvdW50U3BhY2VzID0gKGxpbmUpIC0+XG4gICAgc3BhY2VzID0gMFxuICAgIGlmIGxpbmVbMF0gPT0gJyAnXG4gICAgICAgIHdoaWxlIGxpbmVbc3BhY2VzXSA9PSAnICdcbiAgICAgICAgICAgIHNwYWNlcyArPSAxXG4gICAgXG4gICAgc3BhY2VzXG5cblxuXG5cblxuXG5wcm9jZXNzSGllcmFyY2h5ID0gKGZpbGUpIC0+XG4gICAgY3VycmVudFBhcmVudCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgY3VycmVudENoaWxkID0gZmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgIGZvciBsaW5lIGluIFswLi4uZmlsZS5zb3VyY2UubGVuZ3RoXVxuICAgICAgICBsaW5lTGV2ZWwgPSBjb3VudFNwYWNlcyBmaWxlLnNvdXJjZVtsaW5lXVxuXG4gICAgICAgIGlmIGxpbmVMZXZlbCA+IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgIGlmIGxpbmVMZXZlbCA+IGN1cnJlbnRDaGlsZC5sZXZlbFxuICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRDaGlsZFxuXG4gICAgICAgICAgICBuZXdMaW5lID1cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiBmaWxlLnNvdXJjZVtsaW5lXS5zbGljZSBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgcGFyZW50IDogY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgIGxldmVsIDogbGluZUxldmVsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgICAgICAgICAgc3R5bGVzIDogW11cblxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoIG5ld0xpbmVcbiAgICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IG5ld0xpbmVcblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBsaW5lTGV2ZWwgPD0gY3VycmVudFBhcmVudC5sZXZlbFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBjdXJyZW50UGFyZW50LnBhcmVudFxuXG4gICAgICAgICAgICBuZXdMaW5lID1cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiBmaWxlLnNvdXJjZVtsaW5lXS5zbGljZSBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgcGFyZW50IDogY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgIGxldmVsIDogbGluZUxldmVsXG4gICAgICAgICAgICAgICAgcHJvcGVydGllcyA6IFtdXG4gICAgICAgICAgICAgICAgc3R5bGVzIDogW11cblxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5jaGlsZHJlbi5wdXNoIG5ld0xpbmVcbiAgICAgICAgICAgIGN1cnJlbnRDaGlsZCA9IG5ld0xpbmVcblxuXG5cblxuXG5cblxucHJvY2Vzc1R5cGVzID0gKGxpbmVzKSAtPlxuICAgIGZvciBsaW5lIGluIGxpbmVzLmNoaWxkcmVuXG4gICAgICAgIGlmIGxpbmUuc291cmNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSBhbmFsaXNlVHlwZSBsaW5lLnNvdXJjZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSAtMlxuICAgICAgICBcbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBwcm9jZXNzVHlwZXMgbGluZVxuXG5cblxuXG5cblxuc29ydEJ5VHlwZXMgPSAobGluZXMpIC0+XG4gICAgIyBleHRyYWN0IHRoZSBzdHlsZXMsIHByb3BlcnRpZXMgYW5kIHN0cmluZ3MgdG8gdGhlaXIgcGFyZW50c1xuXG4gICAgZm9yIGxpbmUgaW4gbGluZXMuY2hpbGRyZW5cbiAgICAgICAgaWYgbGluZS50eXBlID09IHNjcmlwdFRhZ1R5cGVcbiAgICAgICAgICAgIHR5cGVBbGxTY3JpcHRzIGxpbmVcblxuICAgIGxhc3RDaGlsZCA9IGxpbmVzLmNoaWxkcmVuLmxlbmd0aCAtIDFcblxuICAgIGZvciBsaW5lIGluIFtsYXN0Q2hpbGQuLjBdXG4gICAgICAgIGlmIGxpbmVzLmNoaWxkcmVuW2xpbmVdLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIHNvcnRCeVR5cGVzIGxpbmVzLmNoaWxkcmVuW2xpbmVdXG5cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSB0YWdQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgIGlmICFsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQucHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzLnB1c2ggbGluZXMuY2hpbGRyZW5bbGluZV0uc291cmNlXG4gICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuY2hpbGRyZW4uc3BsaWNlIGxpbmUgLCAxXG5cbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHN0eWxlUHJvcGVydHlUeXBlXG4gICAgICAgICAgICBpZiAhbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlc1xuICAgICAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnN0eWxlcy5wdXNoIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnNvdXJjZVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuXG5cblxuXG5cblxudHlwZUFsbFNjcmlwdHMgPSAoc2NyaXB0TGluZSkgLT5cbiAgICBpZiBzY3JpcHRMaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcbiAgICAgICAgZm9yIGNvZGVMaW5lIGluIHNjcmlwdExpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgIGNvZGVMaW5lLnR5cGUgPSA1XG4gICAgICAgICAgICBjb2RlTGluZS5maW5hbCA9IGNvZGVMaW5lLnNvdXJjZVxuICAgICAgICAgICAgdHlwZUFsbFNjcmlwdHMoY29kZUxpbmUpIGlmIGNvZGVMaW5lLmNoaWxkcmVuLmxlbmd0aCA+IDBcblxuXG5cblxuXG5maW5hbGlzZVRhZyA9IChsaW5lKSAtPlxuICAgIGFkZFNwYWNlcyA9ICcnXG4gICAgaWYgbGluZS5pbmRlbnQgPiAwXG4gICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLi5saW5lLmluZGVudF1cblxuICAgIGlmIGxpbmUudHlwZSA9PSBzdHlsZUNsYXNzVHlwZVxuICAgICAgICBmaW5hbGlzZVN0eWxlIGxpbmVcblxuICAgIGlmIGxpbmUudHlwZSA9PSAwIG9yIGxpbmUudHlwZSA9PSA5IG9yIGxpbmUudHlwZSA9PSBoZWFkVGFnVHlwZVxuICAgICAgICBmb3JtYXRUYWcgbGluZVxuXG4gICAgICAgIGxpbmUuZmluYWwgPSAnPCcgKyBsaW5lLnNvdXJjZVxuXG4gICAgICAgIGlmIGxpbmUuc3R5bGVzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIGxpbmVTdHlsZSA9ICdzdHlsZSBcIidcblxuICAgICAgICAgICAgZm9ybWF0VGFnU3R5bGVzIGxpbmVcblxuICAgICAgICAgICAgZm9yIHN0eWxlIGluIGxpbmUuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZVN0eWxlICs9IHN0eWxlICsgJzsnXG5cbiAgICAgICAgICAgIGxpbmVTdHlsZSArPSAnXCInXG4gICAgICAgICAgICBsaW5lLnByb3BlcnRpZXMucHVzaCBsaW5lU3R5bGVcbiAgICAgICAgXG5cbiAgICAgICAgZm9ybWF0UHJvcGVydGllcyBsaW5lXG4gICAgICAgIFxuXG4gICAgICAgIGlmIGxpbmUucHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgICAgICBsaW5lLmZpbmFsICs9ICcgJ1xuICAgICAgICAgICAgZm9yIHByb3BlcnR5IGluIGxpbmUucHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gcHJvcGVydHkgKyAnICdcbiAgICAgICAgXG4gICAgICAgICAgICBsaW5lLmZpbmFsID0gbGluZS5maW5hbC5zbGljZSAwLCAtMVxuICAgICAgICBsaW5lLmZpbmFsICs9ICc+J1xuICAgICAgICBsaW5lLmZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuXG5cbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBmb3JtYXRTdHJpbmdzIGxpbmVcblxuICAgICAgICAgICAgaWYgbGluZS50eXBlID09IHNjcmlwdFRhZ1R5cGVcbiAgICAgICAgICAgICAgICBsaW5lLmluZGVudCA9IDRcblxuICAgICAgICAgICAgZm9ybWF0U2NyaXB0cyBsaW5lXG5cbiAgICAgICAgICAgIGZvciBjaGlsZCBpbiBsaW5lLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgZmluYWxpc2VUYWcgY2hpbGRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGNoaWxkIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBjaGlsZExpbmVzID0gY2hpbGQuZmluYWwuc3BsaXQgJ1xcbidcbiAgICAgICAgICAgICAgICBuZXdGaW5hbCA9ICcnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIGwgaW4gY2hpbGRMaW5lc1xuICAgICAgICAgICAgICAgICAgICBpZiBsLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGwgPSBhZGRTcGFjZXMgKyBsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGaW5hbCArPSBsICsgJ1xcbidcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuZXdGaW5hbCArPSAnXFxuJyBpZiBsaW5lLmluZGVudCA+IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuZXdGaW5hbCA9IG5ld0ZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICAgICAgY2hpbGQuZmluYWwgPSBuZXdGaW5hbFxuXG4gICAgICAgICAgICAgICAgbGluZS5maW5hbCArPSBjaGlsZC5maW5hbFxuICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbGluZS5zZWxmQ2xvc2luZ1xuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnPC8nICsgbGluZS5zb3VyY2UgKyAnPidcbiAgICAgICAgICAgICNsaW5lLmZpbmFsICs9ICdcXG4nIGlmIGxpbmUuaW5kZW50ID4gMFxuICAgIFxuXG5cblxuZmluYWxpc2VTdHlsZSA9IChzdHlsZVRhZykgLT5cbiAgICBhZGRTcGFjZXMgPSAnJ1xuICAgIGlmIHN0eWxlVGFnLmluZGVudCA+IDBcbiAgICAgICAgYWRkU3BhY2VzICs9ICcgJyBmb3IgaSBpbiBbMC4uLnN0eWxlVGFnLmluZGVudF1cblxuICAgIGZpbmFsVGFnID0gJyMnXG5cbiAgICB0YWdBcnJheSA9IHN0eWxlVGFnLnNvdXJjZS5zcGxpdCAnICdcblxuICAgIGZpbmFsVGFnID0gJy4nIGlmIHRhZ0FycmF5WzBdID09ICdjbGFzcydcblxuICAgIGlmIHRhZ0FycmF5WzFdID09ICd0YWcnXG4gICAgICAgIGZpbmFsVGFnID0gJydcbiAgICAgICAgZmluYWxUYWcgKz0gdGFnQXJyYXlbMl1cbiAgICBlbHNlXG4gICAgICAgIGZpbmFsVGFnICs9IHRhZ0FycmF5WzFdXG5cbiAgICBmaW5hbFRhZyArPSAneydcbiAgICBcbiAgICBmb3JtYXRUYWdTdHlsZXMgc3R5bGVUYWdcblxuICAgIGZvciBzdHlsZSBpbiBzdHlsZVRhZy5zdHlsZXNcbiAgICAgICAgaWYgc3R5bGVUYWcuaW5kZW50ID4gMFxuICAgICAgICAgICAgZmluYWxUYWcgKz0gJ1xcbidcbiAgICAgICAgICAgIGZpbmFsVGFnICs9IGFkZFNwYWNlc1xuXG4gICAgICAgIGZpbmFsVGFnICs9IHN0eWxlXG4gICAgXG4gICAgaWYgc3R5bGVUYWcuaW5kZW50ID4gMFxuICAgICAgICBmaW5hbFRhZyArPSAnXFxuJ1xuXG4gICAgZmluYWxUYWcgKz0gJ30nXG4gICAgc3R5bGVUYWcuZmluYWwgPSBmaW5hbFRhZ1xuXG5cblxuXG4gICAgXG5mb3JtYXRUYWcgPSAodGFnKSAtPlxuICAgIHRhZ0FycmF5ID0gdGFnLnNvdXJjZS5zcGxpdCAvXFxzKy9cbiAgICB0YWcuc291cmNlID0gdGFnQXJyYXlbMF1cblxuICAgIHRhZy5zZWxmQ2xvc2luZyA9IGZhbHNlXG4gICAgZm9yIHNlbGZDbG9zaW5nVGFnIGluIHNlbGZDbG9zaW5nVGFnc1xuICAgICAgICBpZiB0YWcuc291cmNlID09IHNlbGZDbG9zaW5nVGFnXG4gICAgICAgICAgICB0YWcuc2VsZkNsb3NpbmcgPSB0cnVlXG5cbiAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuXG4gICAgaWYgdGFnQXJyYXkubGVuZ3RoID4gMFxuICAgICAgICBpZiB0YWdBcnJheVswXSAhPSAnaXMnXG4gICAgICAgICAgICB0YWcucHJvcGVydGllcy5wdXNoICdpZCBcIicgKyB0YWdBcnJheVswXSArICdcIidcbiAgICAgICAgICAgIHRhZ0FycmF5LnNwbGljZSgwLDEpXG4gICAgICAgIFxuICAgICAgICBpZiB0YWdBcnJheVswXSA9PSAnaXMnXG4gICAgICAgICAgICB0YWdBcnJheS5zcGxpY2UoMCwxKVxuICAgICAgICAgICAgdGFnQ2xhc3NlcyA9ICdjbGFzcyBcIidcbiAgICAgICAgICAgIGZvciB0YWdDbGFzcyBpbiB0YWdBcnJheVxuICAgICAgICAgICAgICAgIHRhZ0NsYXNzZXMgKz0gdGFnQ2xhc3MgKyAnICdcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGFnQ2xhc3NlcyA9IHRhZ0NsYXNzZXMuc2xpY2UgMCwgLTFcbiAgICAgICAgICAgIHRhZ0NsYXNzZXMgKz0gJ1wiJ1xuXG4gICAgICAgICAgICB0YWcucHJvcGVydGllcy5wdXNoIHRhZ0NsYXNzZXNcblxuICAgIHRhZy5maW5hbCA9ICcnXG4gICAgdGFnXG5cblxuZm9ybWF0UHJvcGVydGllcyA9ICh0YWcpIC0+XG4gICAgaWYgdGFnLnByb3BlcnRpZXMubGVuZ3RoID4gMFxuICAgICAgICBuZXdQcm9wZXJ0aWVzID0gbmV3IEFycmF5XG5cbiAgICAgICAgZm9yIHByb3BlcnR5IGluIHRhZy5wcm9wZXJ0aWVzXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSA9ICc9J1xuXG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWVTZWFyY2ggPSAvXltcXHdcXC1dKyggKik/XCIvaVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHkubWF0Y2gocHJvcGVydHlOYW1lU2VhcmNoKVswXVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lLnNwbGl0KFwiIFwiKVswXVxuICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lLnNwbGl0KCdcIicpWzBdXG5cbiAgICAgICAgICAgIG5ld1Byb3BlcnR5ID0gcHJvcGVydHlOYW1lICsgbmV3UHJvcGVydHlcblxuICAgICAgICAgICAgcHJvcGVydHlEZXRhaWxzU2VhcmNoID0gL1xcXCIuKlxcXCIvXG4gICAgICAgICAgICBwcm9wZXJ0eURldGFpbHMgPSBwcm9wZXJ0eS5tYXRjaChwcm9wZXJ0eURldGFpbHNTZWFyY2gpWzBdXG4gICAgICAgICAgICBuZXdQcm9wZXJ0eSArPSBwcm9wZXJ0eURldGFpbHNcblxuICAgICAgICAgICAgbmV3UHJvcGVydGllcy5wdXNoIG5ld1Byb3BlcnR5XG5cbiAgICAgICAgdGFnLnByb3BlcnRpZXMgPSBuZXdQcm9wZXJ0aWVzXG5cblxuZm9ybWF0U3RyaW5ncyA9ICh0YWcpIC0+XG4gICAgXG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuXG4gICAgICAgIGlmIGNoaWxkLnR5cGUgPT0gc3RyaW5nVHlwZVxuICAgICAgICAgICAgZnVsbFN0cmluZ1NlYXJjaCA9IC9cXFwiLipcXFwiL1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgPSBjaGlsZC5zb3VyY2UubWF0Y2goZnVsbFN0cmluZ1NlYXJjaClbMF1cbiAgICAgICAgICAgIGNsZWFuU3RyaW5nID0gY2xlYW5TdHJpbmcuc2xpY2UgMSwgLTFcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsID0gY2xlYW5TdHJpbmdcbiAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nIGlmIGNoaWxkLmluZGVudCA+IDAgKyBcIlxcblwiXG5cblxuXG5cbmZvcm1hdFNjcmlwdHMgPSAodGFnKSAtPlxuICAgIGluZGVudExpbmVzIHRhZ1xuXG4gICAgZm9yIGNoaWxkIGluIHRhZy5jaGlsZHJlblxuICAgICAgICBhZGRTcGFjZXMgPSAnJ1xuXG4gICAgICAgIGlmIGNoaWxkLmluZGVudCA+IDBcbiAgICAgICAgICAgIGFkZFNwYWNlcyArPSAnICcgZm9yIGkgaW4gWzAuLi5jaGlsZC5pbmRlbnRdXG4gICAgICAgIFxuICAgICAgICBpZiBjaGlsZC50eXBlID09IHNjcmlwdFR5cGVcblxuICAgICAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIGNoaWxkLmZpbmFsICs9ICdcXG4nXG4gICAgICAgICAgICAgICAgZm9ybWF0U2NyaXB0cyBjaGlsZFxuXG4gICAgICAgICAgICAgICAgZm9yIHNjcmlwdENoaWxkTGluZSBpbiBjaGlsZC5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZCA9IHNjcmlwdENoaWxkTGluZS5maW5hbC5zcGxpdCAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRDaGlsZFNsaWNlZC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICBuZXdTY3JpcHRDaGlsZEZpbmFsID0gJydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGkgaW4gc2NyaXB0Q2hpbGRTbGljZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1NjcmlwdENoaWxkRmluYWwgKz0gYWRkU3BhY2VzICsgaSArICdcXG4nXG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdENoaWxkTGluZS5maW5hbCA9IG5ld1NjcmlwdENoaWxkRmluYWxcblxuICAgICAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCArPSBzY3JpcHRDaGlsZExpbmUuZmluYWxcbiAgICAgICAgICAgICAgICBjaGlsZC5maW5hbCA9IGNoaWxkLmZpbmFsLnNsaWNlIDAsIC0xXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGlsZC5maW5hbCArPSAnXFxuJ1xuXG5cblxuXG5mb3JtYXRUYWdTdHlsZXMgPSAodGFnKSAtPlxuICAgIGZvciBzdHlsZSBpbiB0YWcuc3R5bGVzXG4gICAgICAgIGRpdmlkZXJQb3NpdGlvbiA9IHN0eWxlLmluZGV4T2YgJzonXG4gICAgICAgIHByb3BlcnR5QWZ0ZXIgPSBzdHlsZS5zbGljZSAoZGl2aWRlclBvc2l0aW9uICsgMSlcbiAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ID0gc3R5bGUuc3BsaXQoJzonKVswXSArICc6J1xuICAgICAgICBhZnRlckFycmF5ID0gcHJvcGVydHlBZnRlci5zcGxpdCAnICdcblxuICAgICAgICBmb3IgeCBpbiBbMC4uLmFmdGVyQXJyYXkubGVuZ3RoXVxuICAgICAgICAgICAgaWYgYWZ0ZXJBcnJheVt4XSAhPSAnJ1xuICAgICAgICAgICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSArPSBhZnRlckFycmF5W3hdXG4gICAgICAgICAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ICs9ICcgJyBpZiB4IDwgYWZ0ZXJBcnJheS5sZW5ndGggLSAxXG5cbiAgICAgICAgc3R5bGUgPSBjbGVhblN0eWxlUHJvcGVydHlcblxuXG5mb3JtYXRMZXZlbHMgPSAodGFnKSAtPlxuICAgIGZvciBjaGlsZCBpbiB0YWcuY2hpbGRyZW5cbiAgICAgICAgY2hpbGQubGV2ZWwgPSB0YWcubGV2ZWwgKyAxXG5cbiAgICAgICAgaWYgY2hpbGQuY2hpbGRyZW5cbiAgICAgICAgICAgIGZvcm1hdExldmVscyBjaGlsZCJdfQ==
//# sourceURL=coffeescript