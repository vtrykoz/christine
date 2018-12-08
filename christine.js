(function() {
  var Path, analiseType, checkSelfClosing, chrisRootFolder, cleanUpFile, cleanUpLines, coffee, commentFilter, countSpaces, debugMode, emptyFilter, formatHtml, formatProperty, formatString, formatStyleProperty, formatTag, formatVariable, fs, getHierarchy, headTagFilter, headTagType, headTags, ignorableType, loadChrisModule, moduleFilter, moduleType, processHead, processModules, processStyleTag, processTag, processVariables, scriptType, selfClosingTags, shtml, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

  selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link'];

  headTags = ['meta', 'title', 'style', 'class', 'link'];

  formatHtml = false;

  debugMode = false;

  chrisRootFolder = '';

  fs = require('fs');

  Path = require('path');

  coffee = require('coffee-script');

  // LINE TYPES
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

  countSpaces = function(l) {
    var x;
    x = 0;
    if (l[0] === " ") {
      while (l[x] === " ") {
        x += 1;
      }
    }
    return x;
  };

  analiseType = function(l) {
    var ln;
    ln = -1;
    if (commentFilter.test(l)) {
      ln = ignorableType;
    }
    if (emptyFilter.test(l)) {
      ln = ignorableType;
    }
    if (stylePropertyFilter.test(l)) {
      ln = stylePropertyType;
    }
    if (tagFilter.test(l)) {
      ln = tagType;
    }
    if (headTagFilter.test(l)) {
      ln = headTagType;
    }
    if (styleClassFilter.test(l)) {
      ln = styleClassType;
    }
    if (tagPropertyFilter.test(l)) {
      ln = tagPropertyType;
    }
    if (stringFilter.test(l)) {
      ln = stringType;
    }
    if (variableFilter.test(l)) {
      ln = variableType;
    }
    if (moduleFilter.test(l)) {
      ln = moduleType;
    }
    return ln;
  };

  getHierarchy = function(lines) {
    var currentLevel, currentRealLevel, j, lastLineOfLevel, lineLevels, lineParents, n, ref, x;
    lineLevels = [];
    lineParents = [];
    lastLineOfLevel = [-1];
    currentLevel = [0];
    currentRealLevel = 0;
    for (x = j = 0, ref = lines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      n = countSpaces(lines[x]);
      //lines[x] = lines[x].slice(n)
      if (n > currentLevel[currentRealLevel]) {
        lastLineOfLevel.push(x - 1);
        currentLevel.push(n);
        currentRealLevel += 1;
      }
      while (n < currentLevel[currentRealLevel]) {
        if (n < currentLevel[currentRealLevel]) {
          currentLevel.pop();
          lastLineOfLevel.pop();
          currentRealLevel -= 1;
        }
      }
      lineLevels.push(currentRealLevel);
      lineParents[x] = lastLineOfLevel[lastLineOfLevel.length - 1];
    }
    return lineParents;
  };

  formatVariable = function(l) {
    var c, exportArray, varContent, varName, w;
    exportArray = [];
    varContent = '';
    varName = l.split('=')[0];
    w = 0;
    while (varName.split(' ')[w] === '') {
      w += 1;
    }
    varName = varName.split(' ')[w];
    c = l.split('=');
    c = c[1].split(' ');
    w = 0;
    while (w < c.length) {
      if (c[w] !== '') {
        if (varContent !== '') {
          varContent += ' ';
        }
        varContent += c[w];
      }
      w += 1;
    }
    exportArray[0] = varName;
    exportArray[1] = varContent;
    return exportArray;
  };

  processVariables = function(ls, tps) {
    var f, j, k, ref, ref1, varContents, varNames, x;
    varNames = [];
    varContents = [];
    for (x = j = 0, ref = ls.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (tps[x] === variableType) {
        varNames.push(formatVariable(ls[x])[0]);
        varContents.push(formatVariable(ls[x])[1]);
      }
      if (tps[x] === stylePropertyType) {
        for (f = k = 0, ref1 = varNames.length; (0 <= ref1 ? k < ref1 : k > ref1); f = 0 <= ref1 ? ++k : --k) {
          ls[x] = ls[x].replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]);
        }
      }
    }
    return ls;
  };

  // Module processing functions
  loadChrisModule = function(moduleFilePath) {
    var mls, msls;
    msls = fs.readFileSync('./' + moduleFilePath, 'utf8');
    msls = cleanUpFile(msls);
    mls = msls.split('\n');
    return mls;
  };

  processModules = function(ls, f) {
    var chrisModulePath, j, k, l, len, len1, moduleLevel, moduleLevelFilter, moduleLine, moduleLines, ref, resultLs;
    moduleLevelFilter = /^\s*/;
    ref = ls.sourceLines;
    for (j = 0, len = ref.length; j < len; j++) {
      l = ref[j];
      if (moduleFilter.test(l)) {
        chrisModulePath = l.split('"')[1];
        moduleLines = {
          sourceLines: loadChrisModule(f + '/' + chrisModulePath)
        };
        moduleLevel = moduleLevelFilter.exec(l);
        for (k = 0, len1 = moduleLines.length; k < len1; k++) {
          moduleLine = moduleLines[k];
          moduleLines.sourceLines.push(moduleLevel + moduleLine);
        }
        moduleLines.sourceLines = processModules(moduleLines.sourceLines, path.dirname(f + '/' + chrisModulePath));
        resultLs = resultLs.concat(moduleLines.sourceLines);
      } else {
        resultLs.push(ls[x]);
      }
    }
    return ls.sourceLines = resultLs;
  };

  // MAIN CHRISTINE FUNCTION
  exports.christinize = function(st) {
    return shtml(st);
  };

  cleanUpLines = function(ls) {
    var j, newLs, ref, x;
    newLs = [];
    for (x = j = 0, ref = ls.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (analiseType(ls[x]) !== -2) {
        newLs.push(ls[x]);
      }
    }
    return newLs;
  };

  shtml = function(sourceText) {
    var chrisFile, j, k, lineParents, linePrototype, m, ref, ref1, ref2, resultLines, t, x;
    chrisFile = {
      sourceLines: [],
      lines: []
    };
    linePrototype = {
      source: '',
      final: '',
      type: -1,
      parent: {},
      children: [],
      number: -1,
      indent: 0
    };
    chrisFile.sourceLines = sourceText.split('\n');
    chrisFile.sourceLines = processModules(chrisFile, chrisRootFolder);
    chrisFile.sourceLines = cleanUpLines(lines, lineTypes);
// process types and filter lines
    for (x = j = 0, ref = lines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      t = analiseType(lines[x]);
      lineTypes.push(t);
      resultLines.push(lines[x]);
    }
    resultLines = processVariables(resultLines, lineTypes);
    lineParents = getHierarchy(resultLines);
    for (x = k = 0, ref1 = resultLines.length; (0 <= ref1 ? k < ref1 : k > ref1); x = 0 <= ref1 ? ++k : --k) {
      lineNums.push(x);
    }
    if (debugMode) {
      for (x = m = 0, ref2 = resultLines.length; (0 <= ref2 ? m < ref2 : m > ref2); x = 0 <= ref2 ? ++m : --m) {
        resultText += `#${lineNums[x]} ${lineTypes[x]} ${resultLines[x]} - ${lineParents[x]}\n`;
      }
    }
    resultText += '<!doctype html>';
    resultText += '<html>';
    resultText += processHead(resultLines, lineParents, lineTypes, lineNums);
    resultText += processTag("body", -1, resultLines, lineParents, lineTypes, lineNums);
    resultText += '</html>';
    return resultText;
  };

  formatTag = function(l) {
    var cleanTag, collectClasses, finalTag, j, ref, sp, tagArray, tagClass, x;
    // get rid of indentation
    sp = countSpaces(l);
    l = l.slice(sp);
    tagArray = l.split(' ');
    cleanTag = [];
    for (x = j = 0, ref = tagArray.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (tagArray[x] !== "") {
        cleanTag.push(tagArray[x]);
      }
    }
    finalTag = '<' + cleanTag[0];
    if (cleanTag.length > 1) {
      if (cleanTag[1] !== 'is') {
        finalTag += ' id="' + cleanTag[1] + '"';
      }
      x = 0;
      tagClass = "";
      collectClasses = false;
      while (x < cleanTag.length) {
        if (collectClasses) {
          tagClass += cleanTag[x];
          if (x < cleanTag.length - 1) {
            tagClass += ' ';
          }
        } else {
          if (cleanTag[x] === 'is') {
            if (x < cleanTag.length - 1) {
              collectClasses = true;
            }
          }
        }
        x += 1;
      }
      if (tagClass.length > 0) {
        finalTag += ' class="' + tagClass + '"';
      }
    }
    return finalTag;
  };

  formatProperty = function(l) {
    var cleanProperty, propertyNameSearch, sp, t;
    // get rid of indentation
    sp = countSpaces(l);
    l = l.slice(sp);
    cleanProperty = '="';
    propertyNameSearch = /^[\w\-]+( *)?"/i;
    t = l.match(propertyNameSearch)[0];
    t = t.split(" ")[0];
    t = t.split('"')[0];
    cleanProperty = t + cleanProperty;
    t = l.split('"')[1];
    cleanProperty += t + '"';
    return cleanProperty;
  };

  formatStyleProperty = function(l) {
    var afterArray, cleanStyleProperty, dividerPosition, j, propertyAfter, ref, sp, x;
    // get rid of indentation
    sp = countSpaces(l);
    l = l.slice(sp);
    dividerPosition = l.indexOf(':');
    propertyAfter = l.slice(dividerPosition + 1);
    cleanStyleProperty = l.split(':')[0] + ':';
    afterArray = propertyAfter.split(' ');
    for (x = j = 0, ref = afterArray.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (afterArray[x] !== '') {
        cleanStyleProperty += afterArray[x];
        if (x < afterArray.length - 1) {
          cleanStyleProperty += ' ';
        }
      }
    }
    return cleanStyleProperty;
  };

  formatString = function(l) {
    var cleanString;
    cleanString = l.split('"')[1];
    return cleanString;
  };

  checkSelfClosing = function(t) {
    var i, j, ref, selfClosing;
    selfClosing = true;
    for (i = j = 0, ref = selfClosingTags.length; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
      if (t === selfClosingTags[i]) {
        selfClosing = false;
      }
    }
    return selfClosing;
  };

  // the main recursive machines!
  processHead = function(lines = [], links, types, lineNums) {
    var childStyleNums, childTagNums, finalHead, j, p, ref, styleChildLines, styleChildTypes, tagChildLineNums, tagChildLines, tagChildLinks, tagChildTypes, tn, x;
    finalHead = '<head>';
    // collect children
    childStyleNums = [];
    childTagNums = [];
    if (lines.length > 0) {
      for (x = j = 0, ref = lines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
        if (links[x] === -1) {
          if (types[x] === styleClassType) {
            childStyleNums.push(x);
          }
          if (types[x] === headTagType) {
            childTagNums.push(x);
          }
        }
      }
    }
    // process head styles
    if (childStyleNums.length > 0) {
      finalHead += '<style>';
      x = 0;
      while (x < childStyleNums.length) {
        if (formatHtml) {
          finalHead += '\n';
        }
        styleChildLines = [];
        styleChildTypes = [];
        p = childStyleNums[x] + 1;
        while (links[p] >= childStyleNums[x]) {
          if (p < lines.length) {
            styleChildLines.push(lines[p]);
            styleChildTypes.push(types[p]);
            p += 1;
          } else {
            break;
          }
        }
        finalHead += processStyleTag(lines[childStyleNums[x]], styleChildLines, styleChildTypes);
        x += 1;
      }
      finalHead += '</style>';
    }
    // process head tags
    if (childTagNums.length > 0) {
      x = 0;
      while (x < childTagNums.length) {
        if (formatHtml) {
          finalHead += '\n';
        }
        tagChildLines = [];
        tagChildLinks = [];
        tagChildTypes = [];
        tagChildLineNums = [];
        p = childTagNums[x] + 1;
        while (links[p] >= childTagNums[x]) {
          if (p < lines.length) {
            tagChildLines.push(lines[p]);
            tagChildLinks.push(links[p]);
            tagChildTypes.push(types[p]);
            tagChildLineNums.push(lineNums[p]);
            p += 1;
          } else {
            break;
          }
        }
        tn = childTagNums[x];
        finalHead += processTag(lines[tn], lineNums[tn], tagChildLines, tagChildLinks, tagChildTypes, tagChildLineNums);
        x += 1;
      }
    }
    finalHead += '</head>';
    return finalHead;
  };

  processStyleTag = function(tagLine, childLines = [], childTypes) {
    var finalTag, j, ref, x;
    finalTag = '#';
    if (tagLine.split(' ')[0] === 'class') {
      finalTag = '.';
    }
    if (tagLine.split(' ')[1] === 'tag') { //if styling tag, not the id or class
      finalTag = '';
      finalTag += tagLine.split(' ')[2] + '{';
    } else {
      finalTag += tagLine.split(' ')[1] + '{';
    }
    for (x = j = 0, ref = childLines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
      if (childTypes[x] === stylePropertyType) {
        finalTag += formatStyleProperty(childLines[x]) + ';';
      }
    }
    finalTag += '}';
    return finalTag;
  };

  processTag = function(tagLine, selfLink, childLines = [], childLinks, childTypes, lineNums) {
    var childStrings, childs, closable, finalTag, j, k, l, m, o, p, ref, ref1, ref2, ref3, scriptBefore, sp, styleChildLines, styleChildTypes, tagChildLineNums, tagChildLines, tagChildLinks, tagChildTypes, tagName, tagProperties, tagStyles, tl, variables, x;
    // get rid of indentation
    sp = countSpaces(tagLine);
    tagLine = tagLine.slice(sp);
    tagName = tagLine.split(' ')[0];
    finalTag = formatTag(tagLine);
    closable = checkSelfClosing(tagLine.split(' ')[0]);
    // collect all the children
    tagProperties = [];
    tagStyles = [];
    childs = [];
    childStrings = [];
    variables = [];
    if (childLines.length > 0) {
      for (x = j = 0, ref = childLines.length; (0 <= ref ? j < ref : j > ref); x = 0 <= ref ? ++j : --j) {
        if (childLinks[x] === selfLink) {
          if (childTypes[x] === tagPropertyType) {
            tagProperties.push(childLines[x]);
          }
          if (childTypes[x] === stylePropertyType) {
            tagStyles.push(childLines[x]);
          }
          if (childTypes[x] === tagType) {
            childs.push(x);
          }
          if (childTypes[x] === stringType) {
            childs.push(x);
          }
          if (childTypes[x] === styleClassType) {
            childs.push(x);
          }
          if (childTypes[x] === variableType) {
            childs.push(x);
          }
        }
      }
    }
    // add tag properties
    if (tagProperties.length > 0) {
      for (x = k = 0, ref1 = tagProperties.length; (0 <= ref1 ? k < ref1 : k > ref1); x = 0 <= ref1 ? ++k : --k) {
        tagProperties[x] = formatProperty(tagProperties[x]);
        finalTag += ' ' + tagProperties[x];
      }
    }
    // add tag style
    if (tagStyles.length > 0) {
      finalTag += ' style="';
      for (x = m = 0, ref2 = tagStyles.length; (0 <= ref2 ? m < ref2 : m > ref2); x = 0 <= ref2 ? ++m : --m) {
        finalTag += formatStyleProperty(tagStyles[x]) + ';';
      }
      finalTag += '"';
    }
    finalTag += '>';
    //... process child tags, strings, styleTags
    x = 0;
    if (tagName !== 'coffeescript') {
      while (x < childs.length) {
        tl = childs[x];
        if (childTypes[tl] === stringType) {
          finalTag += formatString(childLines[tl]);
        }
        if (childTypes[tl] === styleClassType) {
          if (childLinks[tl] !== -1) {
            if (formatHtml) {
              finalTag += '\n';
            }
            styleChildLines = [];
            styleChildTypes = [];
            p = tl + 1;
            while (childLinks[p] >= tl) {
              if (p < childLines.length) {
                styleChildLines.push(childLines[p]);
                styleChildTypes.push(childTypes[p]);
                p += 1;
              } else {
                break;
              }
            }
            finalTag += processStyleTag(childLines[tl], styleChildLines, styleChildTypes);
          }
        }
        if (childTypes[tl] === tagType) {
          if (formatHtml) {
            finalTag += '\n';
          }
          tagChildLines = [];
          tagChildLinks = [];
          tagChildTypes = [];
          tagChildLineNums = [];
          p = tl + 1;
          while (childLinks[p] >= tl) {
            if (p < childLines.length) {
              tagChildLines.push(childLines[p]);
              tagChildLinks.push(childLinks[p]);
              tagChildTypes.push(childTypes[p]);
              tagChildLineNums.push(lineNums[p]);
              p += 1;
            } else {
              break;
            }
          }
          finalTag += processTag(childLines[tl], lineNums[tl], tagChildLines, tagChildLinks, tagChildTypes, tagChildLineNums);
        }
        x += 1;
      }
    } else {
      scriptBefore = '';
      for (l = o = 0, ref3 = childLines.length; (0 <= ref3 ? o < ref3 : o > ref3); l = 0 <= ref3 ? ++o : --o) {
        scriptBefore += childLines[l] + '\n';
      }
      finalTag = '<script>';
      tagName = 'script';
      finalTag += coffee.compile(scriptBefore);
    }
    // close tag and return final string
    if (closable) {
      finalTag += '</' + tagName + '>';
    }
    if (formatHtml) {
      finalTag += '\n';
    }
    return finalTag;
  };

  cleanUpFile = function(sFile) {
    var carriageTabTest, rFile;
    carriageTabTest = /[\r\t]/gmi;
    rFile = sFile;
    while (carriageTabTest.test(rFile)) {
      rFile = rFile.replace('\r', '\n').replace('\t', '    ');
    }
    return rFile;
  };

  exports.christinizeFile = function(chrisFilePath) {
    var christinizedFile, sourceFile;
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8');
    sourceFile = cleanUpFile(sourceFile);
    chrisRootFolder = Path.dirname(chrisFilePath);
    christinizedFile = shtml(sourceFile);
    fs.writeFile('./' + chrisFilePath + '.html', christinizedFile);
    return christinizedFile;
  };

  exports.christinizeAndSave = function(chrisSource) {
    var christinizedFile;
    christinizedFile = shtml(chrisSource);
    return fs.writeFile('./chrisPreview.html', christinizedFile);
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsZ0JBQUEsRUFBQSxlQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLFVBQUEsRUFBQSxjQUFBLEVBQUEsWUFBQSxFQUFBLG1CQUFBLEVBQUEsU0FBQSxFQUFBLGNBQUEsRUFBQSxFQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQSxlQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLGVBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQTs7RUFBQSxlQUFBLEdBQWtCLENBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxPQUFkLEVBQXVCLElBQXZCLEVBQTZCLE1BQTdCLEVBQXFDLE1BQXJDOztFQUNsQixRQUFBLEdBQVcsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUEyQixPQUEzQixFQUFvQyxNQUFwQzs7RUFFWCxVQUFBLEdBQWE7O0VBQ2IsU0FBQSxHQUFZOztFQUVaLGVBQUEsR0FBa0I7O0VBRWxCLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSLEVBVlQ7OztFQWVBLE9BQUEsR0FBc0IsRUFmdEI7O0VBZ0JBLFNBQUEs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QU0sZUFBZSxDQUFDLElBQWhCLENBQXFCLEtBQXJCLENBQU47TUFDSSxLQUFBLEdBQVEsS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLEVBQW9CLElBQXBCLENBQXlCLENBQUMsT0FBMUIsQ0FBa0MsSUFBbEMsRUFBd0MsTUFBeEM7SUFEWjtXQUVBO0VBTlU7O0VBUWQsT0FBTyxDQUFDLGVBQVIsR0FBMEIsUUFBQSxDQUFDLGFBQUQsQ0FBQTtBQUN0QixRQUFBLGdCQUFBLEVBQUE7SUFBQSxVQUFBLEdBQWEsRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsYUFBaEIsRUFBK0IsTUFBL0I7SUFDYixVQUFBLEdBQWEsV0FBQSxDQUFZLFVBQVo7SUFFYixlQUFBLEdBQWtCLElBQUksQ0FBQyxPQUFMLENBQWEsYUFBYjtJQUNsQixnQkFBQSxHQUFtQixLQUFBLENBQU0sVUFBTjtJQUVuQixFQUFFLENBQUMsU0FBSCxDQUFhLElBQUEsR0FBTyxhQUFQLEdBQXVCLE9BQXBDLEVBQTZDLGdCQUE3QztXQUNBO0VBUnNCOztFQVUxQixPQUFPLENBQUMsa0JBQVIsR0FBNkIsUUFBQSxDQUFDLFdBQUQsQ0FBQTtBQUV6QixRQUFBO0lBQUEsZ0JBQUEsR0FBbUIsS0FBQSxDQUFNLFdBQU47V0FDbkIsRUFBRSxDQUFDLFNBQUgsQ0FBYSxxQkFBYixFQUFvQyxnQkFBcEM7RUFIeUI7QUE5aEI3QiIsInNvdXJjZXNDb250ZW50IjpbInNlbGZDbG9zaW5nVGFncyA9IFsnYnInLCAnaW1nJywgJ2lucHV0JywgJ2hyJywgJ21ldGEnLCAnbGluayddXG5oZWFkVGFncyA9IFsnbWV0YScsICd0aXRsZScsICdzdHlsZScsICdjbGFzcycsICdsaW5rJ11cblxuZm9ybWF0SHRtbCA9IGZhbHNlXG5kZWJ1Z01vZGUgPSBmYWxzZVxuXG5jaHJpc1Jvb3RGb2xkZXIgPSAnJ1xuXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xuUGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5jb2ZmZWUgPSByZXF1aXJlICdjb2ZmZWUtc2NyaXB0J1xuXG5cblxuIyBMSU5FIFRZUEVTXG50YWdUeXBlICAgICAgICAgICAgID0gMCAjaWYgbm8gYW5vdGhlciB0eXBlIGZvdW5kIGFuZCB0aGlzIGlzIG5vdCBhIHNjcmlwdFxudGFnRmlsdGVyICAgICAgICAgICA9IC9eXFxzKlxcdysgKigoICtcXHcrKT8oICopPyggK2lzKCArLiopPyk/KT8kL2lcblxudGFnUHJvcGVydHlUeXBlICAgICA9IDEgI2lmIGZvdW5kIHByb3BlcnR5IFwic29tZXRoaW5nXCJcbnRhZ1Byb3BlcnR5RmlsdGVyICAgPSAvXlxccypbXFx3XFwtXSsgKlwiLipcIi9cblxuc3R5bGVDbGFzc1R5cGUgICAgICA9IDIgI2lmIHRoaXMgaXMgdGFnIGFuZCB0aGUgdGFnIGlzIHN0eWxlXG5zdHlsZUNsYXNzRmlsdGVyICAgID0gL15cXHMqKHN0eWxlfGNsYXNzKVxccytbXFx3Ol8tXSsvaVxuXG5zdHlsZVByb3BlcnR5VHlwZSAgID0gMyAjaWYgZm91bmQgcHJvcGVydHk6IHNvbWV0aGluZ1xuc3R5bGVQcm9wZXJ0eUZpbHRlciA9IC9eXFxzKlteXCInIF0rICo6ICouKi9pXG5cbnN0cmluZ1R5cGUgICAgICAgICAgPSA0ICNpZiBmb3VuZCBcInN0cmluZ1wiXG5zdHJpbmdGaWx0ZXIgICAgICAgID0gL15cXHMqXCIuKlwiL2lcblxuc2NyaXB0VHlwZSAgICAgICAgICA9IDUgI2lmIGl0IGlzIHVuZGVyIHRoZSBzY3JpcHQgdGFnXG5cbnZhcmlhYmxlVHlwZSAgICAgICAgPSA2ICMgaWYgZm91bmQgbmFtZSA9IHNvbWV0aGluZ1xudmFyaWFibGVGaWx0ZXIgICAgICA9IC9eXFxzKlxcdytcXHMqPVxccypbXFx3XFxXXSsvaVxuXG5oZWFkVGFnVHlwZSAgICAgICAgID0gN1xuaGVhZFRhZ0ZpbHRlciAgICAgICA9IC9eXFxzKihtZXRhfHRpdGxlfGxpbmt8YmFzZSkvaVxuXG5tb2R1bGVUeXBlICAgICAgICAgID0gOFxubW9kdWxlRmlsdGVyICAgICAgICA9IC9eXFxzKmluY2x1ZGVcXHMqXCIuKy5jaHJpc1wiL2lcblxuaWdub3JhYmxlVHlwZSAgICAgICA9IC0yXG5lbXB0eUZpbHRlciAgICAgICAgID0gL15bXFxXXFxzX10qJC9cbmNvbW1lbnRGaWx0ZXIgICAgICAgPSAvXlxccyojL2lcblxuXG5cblxuXG5jb3VudFNwYWNlcyA9IChsKSAtPlxuICAgIHggPSAwXG4gICAgaWYgbFswXSA9PSBcIiBcIlxuICAgICAgICB3aGlsZSBsW3hdID09IFwiIFwiXG4gICAgICAgICAgICB4Kz0xXG4gICAgeFxuXG5cblxuYW5hbGlzZVR5cGUgPSAobCkgLT5cbiAgICBsbiA9IC0xXG5cbiAgICBsbiA9IGlnbm9yYWJsZVR5cGUgaWYgY29tbWVudEZpbHRlci50ZXN0IGxcbiAgICBsbiA9IGlnbm9yYWJsZVR5cGUgaWYgZW1wdHlGaWx0ZXIudGVzdCBsXG4gICAgbG4gPSBzdHlsZVByb3BlcnR5VHlwZSBpZiBzdHlsZVByb3BlcnR5RmlsdGVyLnRlc3QgbFxuICAgIGxuID0gdGFnVHlwZSBpZiB0YWdGaWx0ZXIudGVzdCBsXG4gICAgbG4gPSBoZWFkVGFnVHlwZSBpZiBoZWFkVGFnRmlsdGVyLnRlc3QgbFxuICAgIGxuID0gc3R5bGVDbGFzc1R5cGUgaWYgc3R5bGVDbGFzc0ZpbHRlci50ZXN0IGxcbiAgICBsbiA9IHRhZ1Byb3BlcnR5VHlwZSBpZiB0YWdQcm9wZXJ0eUZpbHRlci50ZXN0IGxcbiAgICBsbiA9IHN0cmluZ1R5cGUgaWYgc3RyaW5nRmlsdGVyLnRlc3QgbFxuICAgIGxuID0gdmFyaWFibGVUeXBlIGlmIHZhcmlhYmxlRmlsdGVyLnRlc3QgbFxuICAgIGxuID0gbW9kdWxlVHlwZSBpZiBtb2R1bGVGaWx0ZXIudGVzdCBsXG4gICAgbG5cblxuXG5nZXRIaWVyYXJjaHkgPSAobGluZXMpIC0+XG4gICAgbGluZUxldmVscyA9IFtdXG4gICAgbGluZVBhcmVudHM9W11cblxuICAgIGxhc3RMaW5lT2ZMZXZlbCA9IFstMV1cbiAgICBjdXJyZW50TGV2ZWwgPSBbMF1cbiAgICBjdXJyZW50UmVhbExldmVsID0gMFxuXG4gICAgZm9yIHggaW4gWzAuLi5saW5lcy5sZW5ndGhdXG4gICAgICAgIG4gPSBjb3VudFNwYWNlcyBsaW5lc1t4XVxuICAgICAgICAjbGluZXNbeF0gPSBsaW5lc1t4XS5zbGljZShuKVxuXG4gICAgICAgIGlmIG4gPiBjdXJyZW50TGV2ZWxbY3VycmVudFJlYWxMZXZlbF1cbiAgICAgICAgICAgIGxhc3RMaW5lT2ZMZXZlbC5wdXNoIHggLSAxXG4gICAgICAgICAgICBjdXJyZW50TGV2ZWwucHVzaCBuXG4gICAgICAgICAgICBjdXJyZW50UmVhbExldmVsICs9IDFcblxuICAgICAgICB3aGlsZSBuIDwgY3VycmVudExldmVsW2N1cnJlbnRSZWFsTGV2ZWxdXG4gICAgICAgICAgICBpZiBuIDwgY3VycmVudExldmVsW2N1cnJlbnRSZWFsTGV2ZWxdXG4gICAgICAgICAgICAgICAgY3VycmVudExldmVsLnBvcCgpXG4gICAgICAgICAgICAgICAgbGFzdExpbmVPZkxldmVsLnBvcCgpXG4gICAgICAgICAgICAgICAgY3VycmVudFJlYWxMZXZlbCAtPSAxXG5cbiAgICAgICAgbGluZUxldmVscy5wdXNoIGN1cnJlbnRSZWFsTGV2ZWxcbiAgICAgICAgbGluZVBhcmVudHNbeF0gPSBsYXN0TGluZU9mTGV2ZWxbbGFzdExpbmVPZkxldmVsLmxlbmd0aC0xXVxuXG4gICAgbGluZVBhcmVudHNcblxuXG5mb3JtYXRWYXJpYWJsZSA9IChsKSAtPlxuICAgIGV4cG9ydEFycmF5ID0gW11cbiAgICB2YXJDb250ZW50ID0gJydcblxuICAgIHZhck5hbWUgPSBsLnNwbGl0KCc9JylbMF1cbiAgICB3ID0gMFxuICAgIHdoaWxlIHZhck5hbWUuc3BsaXQoJyAnKVt3XSA9PSAnJ1xuICAgICAgICB3ICs9IDFcbiAgICB2YXJOYW1lID0gdmFyTmFtZS5zcGxpdCgnICcpW3ddXG5cbiAgICBjID0gbC5zcGxpdCgnPScpXG4gICAgYyA9IGNbMV0uc3BsaXQoJyAnKVxuICAgIHcgPSAwXG4gICAgd2hpbGUgdyA8IGMubGVuZ3RoXG4gICAgICAgIGlmIGNbd10gIT0gJydcbiAgICAgICAgICAgIHZhckNvbnRlbnQgKz0gJyAnIGlmIHZhckNvbnRlbnQgIT0gJydcbiAgICAgICAgICAgIHZhckNvbnRlbnQgKz0gY1t3XVxuICAgICAgICB3ICs9IDFcblxuICAgIGV4cG9ydEFycmF5WzBdID0gdmFyTmFtZVxuICAgIGV4cG9ydEFycmF5WzFdID0gdmFyQ29udGVudFxuICAgIGV4cG9ydEFycmF5XG5cblxucHJvY2Vzc1ZhcmlhYmxlcyA9IChscywgdHBzKSAtPlxuICAgIHZhck5hbWVzICAgID0gW11cbiAgICB2YXJDb250ZW50cyA9IFtdXG5cbiAgICBmb3IgeCBpbiBbMC4uLmxzLmxlbmd0aF1cbiAgICAgICAgaWYgdHBzW3hdID09IHZhcmlhYmxlVHlwZVxuICAgICAgICAgICAgdmFyTmFtZXMucHVzaCBmb3JtYXRWYXJpYWJsZShsc1t4XSlbMF1cbiAgICAgICAgICAgIHZhckNvbnRlbnRzLnB1c2ggZm9ybWF0VmFyaWFibGUobHNbeF0pWzFdXG5cbiAgICAgICAgaWYgdHBzW3hdID09IHN0eWxlUHJvcGVydHlUeXBlXG4gICAgICAgICAgICBmb3IgZiBpbiBbMC4uLnZhck5hbWVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBsc1t4XSA9IGxzW3hdLnJlcGxhY2UodmFyTmFtZXNbZl0sIHZhckNvbnRlbnRzW2ZdKS5yZXBsYWNlKHZhck5hbWVzW2ZdLCB2YXJDb250ZW50c1tmXSkucmVwbGFjZSh2YXJOYW1lc1tmXSwgdmFyQ29udGVudHNbZl0pLnJlcGxhY2UodmFyTmFtZXNbZl0sIHZhckNvbnRlbnRzW2ZdKVxuXG4gICAgbHNcblxuXG4gIyBNb2R1bGUgcHJvY2Vzc2luZyBmdW5jdGlvbnNcblxubG9hZENocmlzTW9kdWxlID0gKG1vZHVsZUZpbGVQYXRoKSAtPlxuICAgIG1zbHMgPSBmcy5yZWFkRmlsZVN5bmMoJy4vJyArIG1vZHVsZUZpbGVQYXRoLCAndXRmOCcpXG4gICAgbXNscyA9IGNsZWFuVXBGaWxlKG1zbHMpXG4gICAgbWxzID0gbXNscy5zcGxpdCAnXFxuJ1xuICAgIG1sc1xuXG5wcm9jZXNzTW9kdWxlcyA9IChscywgZikgLT5cbiAgICBtb2R1bGVMZXZlbEZpbHRlciA9IC9eXFxzKi9cblxuICAgIGZvciBsIGluIGxzLnNvdXJjZUxpbmVzXG4gICAgICAgIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxcbiAgICAgICAgICAgIGNocmlzTW9kdWxlUGF0aCA9IGwuc3BsaXQoJ1wiJylbMV1cbiAgICAgICAgICAgIG1vZHVsZUxpbmVzID0gXG4gICAgICAgICAgICAgICAgc291cmNlTGluZXMgOiBsb2FkQ2hyaXNNb2R1bGUoZiArICcvJyArIGNocmlzTW9kdWxlUGF0aClcblxuICAgICAgICAgICAgbW9kdWxlTGV2ZWwgPSBtb2R1bGVMZXZlbEZpbHRlci5leGVjKGwpXG4gICAgICAgICAgICBtb2R1bGVMaW5lcy5zb3VyY2VMaW5lcy5wdXNoIG1vZHVsZUxldmVsICsgbW9kdWxlTGluZSBmb3IgbW9kdWxlTGluZSBpbiBtb2R1bGVMaW5lc1xuXG4gICAgICAgICAgICBtb2R1bGVMaW5lcy5zb3VyY2VMaW5lcyA9IHByb2Nlc3NNb2R1bGVzKG1vZHVsZUxpbmVzLnNvdXJjZUxpbmVzLCBwYXRoLmRpcm5hbWUoZiArICcvJyArIGNocmlzTW9kdWxlUGF0aCkpXG4gICAgICAgICAgICByZXN1bHRMcyA9IHJlc3VsdExzLmNvbmNhdChtb2R1bGVMaW5lcy5zb3VyY2VMaW5lcylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0THMucHVzaCBsc1t4XVxuXG4gICAgbHMuc291cmNlTGluZXMgPSByZXN1bHRMc1xuXG5cblxuIyBNQUlOIENIUklTVElORSBGVU5DVElPTlxuXG5leHBvcnRzLmNocmlzdGluaXplID0gKHN0KSAtPlxuICAgIHNodG1sKHN0KVxuXG4gICAgXG5jbGVhblVwTGluZXMgPSAobHMpIC0+XG4gICAgbmV3THMgPSBbXVxuICAgIFxuICAgIGZvciB4IGluIFswLi4ubHMubGVuZ3RoXVxuICAgICAgICBpZiBhbmFsaXNlVHlwZShsc1t4XSkgIT0gLTJcbiAgICAgICAgICAgICAgICBuZXdMcy5wdXNoIGxzW3hdXG4gICAgICAgICAgXG4gICAgbmV3THNcblxuXG5zaHRtbCA9IChzb3VyY2VUZXh0KSAtPlxuICAgIGNocmlzRmlsZSA9XG4gICAgICAgIHNvdXJjZUxpbmVzIDogW11cbiAgICAgICAgbGluZXMgOiBbXVxuICAgIFxuICAgIGxpbmVQcm90b3R5cGUgPVxuICAgICAgICBzb3VyY2UgOiAnJ1xuICAgICAgICBmaW5hbCA6ICcnXG4gICAgICAgIHR5cGUgOiAtMVxuICAgICAgICBwYXJlbnQgOiB7fVxuICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgIG51bWJlciA6IC0xXG4gICAgICAgIGluZGVudCA6IDBcbiAgICBcblxuICAgIGNocmlzRmlsZS5zb3VyY2VMaW5lcyA9IHNvdXJjZVRleHQuc3BsaXQgJ1xcbidcblxuICAgIGNocmlzRmlsZS5zb3VyY2VMaW5lcyA9IHByb2Nlc3NNb2R1bGVzKGNocmlzRmlsZSwgY2hyaXNSb290Rm9sZGVyKVxuXG5cbiAgICBjaHJpc0ZpbGUuc291cmNlTGluZXMgPSBjbGVhblVwTGluZXMobGluZXMsIGxpbmVUeXBlcylcblxuICAgICMgcHJvY2VzcyB0eXBlcyBhbmQgZmlsdGVyIGxpbmVzXG4gICAgZm9yIHggaW4gWzAuLi5saW5lcy5sZW5ndGhdXG4gICAgICAgIHQgPSBhbmFsaXNlVHlwZShsaW5lc1t4XSlcbiAgICAgICAgbGluZVR5cGVzLnB1c2ggdFxuICAgICAgICByZXN1bHRMaW5lcy5wdXNoIGxpbmVzW3hdXG5cbiAgICByZXN1bHRMaW5lcyA9IHByb2Nlc3NWYXJpYWJsZXMocmVzdWx0TGluZXMsIGxpbmVUeXBlcylcblxuICAgIGxpbmVQYXJlbnRzID0gZ2V0SGllcmFyY2h5IHJlc3VsdExpbmVzXG5cbiAgICBsaW5lTnVtcy5wdXNoKHgpIGZvciB4IGluIFswLi4ucmVzdWx0TGluZXMubGVuZ3RoXVxuXG4gICAgcmVzdWx0VGV4dCArPSBcIiMje2xpbmVOdW1zW3hdfSAje2xpbmVUeXBlc1t4XX0gI3tyZXN1bHRMaW5lc1t4XX0gLSAje2xpbmVQYXJlbnRzW3hdfVxcblwiIGZvciB4IGluIFswLi4ucmVzdWx0TGluZXMubGVuZ3RoXSBpZiBkZWJ1Z01vZGVcblxuICAgIHJlc3VsdFRleHQgKz0gJzwhZG9jdHlwZSBodG1sPidcbiAgICByZXN1bHRUZXh0ICs9ICc8aHRtbD4nXG4gICAgcmVzdWx0VGV4dCArPSBwcm9jZXNzSGVhZChyZXN1bHRMaW5lcywgbGluZVBhcmVudHMsIGxpbmVUeXBlcywgbGluZU51bXMpXG4gICAgcmVzdWx0VGV4dCArPSBwcm9jZXNzVGFnKFwiYm9keVwiLCAtMSwgcmVzdWx0TGluZXMsIGxpbmVQYXJlbnRzLCBsaW5lVHlwZXMsIGxpbmVOdW1zKVxuICAgIHJlc3VsdFRleHQgKz0gJzwvaHRtbD4nXG5cbiAgICByZXN1bHRUZXh0XG5cblxuXG5cbmZvcm1hdFRhZyA9IChsKSAtPlxuXG4gICAgIyBnZXQgcmlkIG9mIGluZGVudGF0aW9uXG4gICAgc3AgPSBjb3VudFNwYWNlcyBsXG4gICAgbCA9IGwuc2xpY2Uoc3ApXG5cbiAgICB0YWdBcnJheSA9IGwuc3BsaXQgJyAnXG4gICAgY2xlYW5UYWcgPSBbXVxuXG4gICAgZm9yIHggaW4gWzAuLi50YWdBcnJheS5sZW5ndGhdXG4gICAgICAgIGNsZWFuVGFnLnB1c2ggdGFnQXJyYXlbeF0gaWYgdGFnQXJyYXlbeF0gIT0gXCJcIlxuXG4gICAgZmluYWxUYWcgPSAnPCcgKyBjbGVhblRhZ1swXVxuXG4gICAgaWYgY2xlYW5UYWcubGVuZ3RoID4gMVxuICAgICAgICBpZiBjbGVhblRhZ1sxXSAhPSAnaXMnXG4gICAgICAgICAgICBmaW5hbFRhZyArPSAnIGlkPVwiJyArIGNsZWFuVGFnWzFdICsgJ1wiJ1xuXG4gICAgICAgIHggPSAwXG4gICAgICAgIHRhZ0NsYXNzID0gXCJcIlxuICAgICAgICBjb2xsZWN0Q2xhc3NlcyA9IGZhbHNlXG4gICAgICAgIHdoaWxlIHggPCBjbGVhblRhZy5sZW5ndGhcbiAgICAgICAgICAgIGlmIGNvbGxlY3RDbGFzc2VzXG4gICAgICAgICAgICAgICAgdGFnQ2xhc3MgKz0gY2xlYW5UYWdbeF1cbiAgICAgICAgICAgICAgICB0YWdDbGFzcyArPSAnICcgaWYgeCA8IGNsZWFuVGFnLmxlbmd0aCAtIDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBjbGVhblRhZ1t4XSA9PSAnaXMnXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3RDbGFzc2VzID0gdHJ1ZSBpZiB4IDwgY2xlYW5UYWcubGVuZ3RoIC0gMVxuICAgICAgICAgICAgeCArPSAxXG4gICAgICAgIGZpbmFsVGFnICs9ICcgY2xhc3M9XCInICsgdGFnQ2xhc3MgKyAnXCInIGlmIHRhZ0NsYXNzLmxlbmd0aCA+IDBcblxuICAgIGZpbmFsVGFnXG5cblxuXG5cbmZvcm1hdFByb3BlcnR5ID0gKGwpIC0+XG5cbiAgICAjIGdldCByaWQgb2YgaW5kZW50YXRpb25cbiAgICBzcCA9IGNvdW50U3BhY2VzIGxcbiAgICBsID0gbC5zbGljZShzcClcblxuICAgIGNsZWFuUHJvcGVydHkgPSAnPVwiJ1xuICAgIHByb3BlcnR5TmFtZVNlYXJjaCA9IC9eW1xcd1xcLV0rKCAqKT9cIi9pXG4gICAgdCA9IGwubWF0Y2gocHJvcGVydHlOYW1lU2VhcmNoKVswXVxuICAgIHQgPSB0LnNwbGl0KFwiIFwiKVswXVxuICAgIHQgPSB0LnNwbGl0KCdcIicpWzBdXG4gICAgY2xlYW5Qcm9wZXJ0eSA9IHQgKyBjbGVhblByb3BlcnR5XG4gICAgdCA9IGwuc3BsaXQoJ1wiJylbMV1cbiAgICBjbGVhblByb3BlcnR5ICs9IHQgKyAnXCInXG4gICAgY2xlYW5Qcm9wZXJ0eVxuXG5mb3JtYXRTdHlsZVByb3BlcnR5ID0gKGwpIC0+XG5cbiAgICAjIGdldCByaWQgb2YgaW5kZW50YXRpb25cbiAgICBzcCA9IGNvdW50U3BhY2VzIGxcbiAgICBsID0gbC5zbGljZShzcClcblxuICAgIGRpdmlkZXJQb3NpdGlvbiA9IGwuaW5kZXhPZiAnOidcbiAgICBwcm9wZXJ0eUFmdGVyID0gbC5zbGljZSAoZGl2aWRlclBvc2l0aW9uICsgMSlcbiAgICBjbGVhblN0eWxlUHJvcGVydHkgPSBsLnNwbGl0KCc6JylbMF0gKyAnOidcbiAgICBhZnRlckFycmF5ID0gcHJvcGVydHlBZnRlci5zcGxpdCAnICdcblxuICAgIGZvciB4IGluIFswLi4uYWZ0ZXJBcnJheS5sZW5ndGhdXG4gICAgICAgIGlmIGFmdGVyQXJyYXlbeF0gIT0gJydcbiAgICAgICAgICAgIGNsZWFuU3R5bGVQcm9wZXJ0eSArPSBhZnRlckFycmF5W3hdXG4gICAgICAgICAgICBjbGVhblN0eWxlUHJvcGVydHkgKz0gJyAnIGlmIHggPCBhZnRlckFycmF5Lmxlbmd0aCAtIDFcblxuICAgIGNsZWFuU3R5bGVQcm9wZXJ0eVxuXG5cbmZvcm1hdFN0cmluZyA9IChsKSAtPlxuICAgIGNsZWFuU3RyaW5nID0gbC5zcGxpdCgnXCInKVsxXVxuICAgIGNsZWFuU3RyaW5nXG5cbmNoZWNrU2VsZkNsb3NpbmcgPSAodCkgLT5cbiAgICBzZWxmQ2xvc2luZyA9IHRydWVcbiAgICBmb3IgaSBpbiBbMC4uc2VsZkNsb3NpbmdUYWdzLmxlbmd0aF1cbiAgICAgICAgc2VsZkNsb3NpbmcgPSBmYWxzZSBpZiB0ID09IHNlbGZDbG9zaW5nVGFnc1tpXVxuICAgIHNlbGZDbG9zaW5nXG5cblxuXG5cblxuIyB0aGUgbWFpbiByZWN1cnNpdmUgbWFjaGluZXMhXG5cbnByb2Nlc3NIZWFkID0gKGxpbmVzID0gW10sIGxpbmtzLCB0eXBlcywgbGluZU51bXMpIC0+XG4gICAgZmluYWxIZWFkID0gJzxoZWFkPidcblxuICAgICMgY29sbGVjdCBjaGlsZHJlblxuXG4gICAgY2hpbGRTdHlsZU51bXMgPSBbXVxuICAgIGNoaWxkVGFnTnVtcyA9IFtdXG5cbiAgICBpZiBsaW5lcy5sZW5ndGggPiAwXG4gICAgICAgIGZvciB4IGluIFswLi4ubGluZXMubGVuZ3RoXVxuICAgICAgICAgICAgaWYgbGlua3NbeF0gPT0gLTFcbiAgICAgICAgICAgICAgICBjaGlsZFN0eWxlTnVtcy5wdXNoIHggaWYgdHlwZXNbeF0gPT0gc3R5bGVDbGFzc1R5cGVcbiAgICAgICAgICAgICAgICBjaGlsZFRhZ051bXMucHVzaCB4IGlmIHR5cGVzW3hdID09IGhlYWRUYWdUeXBlXG5cblxuICAgICMgcHJvY2VzcyBoZWFkIHN0eWxlc1xuXG4gICAgaWYgY2hpbGRTdHlsZU51bXMubGVuZ3RoID4gMFxuICAgICAgICBmaW5hbEhlYWQgKz0gJzxzdHlsZT4nXG4gICAgICAgIHggPSAwXG4gICAgICAgIHdoaWxlIHggPCBjaGlsZFN0eWxlTnVtcy5sZW5ndGhcbiAgICAgICAgICAgIGZpbmFsSGVhZCArPSAnXFxuJyBpZiBmb3JtYXRIdG1sXG5cbiAgICAgICAgICAgIHN0eWxlQ2hpbGRMaW5lcyA9IFtdXG4gICAgICAgICAgICBzdHlsZUNoaWxkVHlwZXMgPSBbXVxuXG4gICAgICAgICAgICBwID0gY2hpbGRTdHlsZU51bXNbeF0gKyAxXG4gICAgICAgICAgICB3aGlsZSBsaW5rc1twXSA+PSBjaGlsZFN0eWxlTnVtc1t4XVxuICAgICAgICAgICAgICAgIGlmIHAgPCBsaW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVDaGlsZExpbmVzLnB1c2ggbGluZXNbcF1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGVDaGlsZFR5cGVzLnB1c2ggdHlwZXNbcF1cbiAgICAgICAgICAgICAgICAgICAgcCArPSAxXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgZmluYWxIZWFkICs9IHByb2Nlc3NTdHlsZVRhZyhsaW5lc1tjaGlsZFN0eWxlTnVtc1t4XV0sIHN0eWxlQ2hpbGRMaW5lcywgc3R5bGVDaGlsZFR5cGVzKVxuXG4gICAgICAgICAgICB4ICs9IDFcblxuICAgICAgICBmaW5hbEhlYWQgKz0gJzwvc3R5bGU+J1xuXG4gICAgIyBwcm9jZXNzIGhlYWQgdGFnc1xuXG4gICAgaWYgY2hpbGRUYWdOdW1zLmxlbmd0aCA+IDBcbiAgICAgICAgeCA9IDBcbiAgICAgICAgd2hpbGUgeCA8IGNoaWxkVGFnTnVtcy5sZW5ndGhcbiAgICAgICAgICAgIGZpbmFsSGVhZCArPSAnXFxuJyBpZiBmb3JtYXRIdG1sXG4gICAgICAgICAgICB0YWdDaGlsZExpbmVzID0gW11cbiAgICAgICAgICAgIHRhZ0NoaWxkTGlua3MgPSBbXVxuICAgICAgICAgICAgdGFnQ2hpbGRUeXBlcyA9IFtdXG4gICAgICAgICAgICB0YWdDaGlsZExpbmVOdW1zID0gW11cblxuICAgICAgICAgICAgcCA9IGNoaWxkVGFnTnVtc1t4XSArIDFcbiAgICAgICAgICAgIHdoaWxlIGxpbmtzW3BdID49IGNoaWxkVGFnTnVtc1t4XVxuICAgICAgICAgICAgICAgIGlmIHAgPCBsaW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5lcy5wdXNoIGxpbmVzW3BdXG4gICAgICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGlua3MucHVzaCBsaW5rc1twXVxuICAgICAgICAgICAgICAgICAgICB0YWdDaGlsZFR5cGVzLnB1c2ggdHlwZXNbcF1cbiAgICAgICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5lTnVtcy5wdXNoIGxpbmVOdW1zW3BdXG4gICAgICAgICAgICAgICAgICAgIHAgKz0gMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIHRuID0gY2hpbGRUYWdOdW1zW3hdXG4gICAgICAgICAgICBmaW5hbEhlYWQgKz0gcHJvY2Vzc1RhZyhsaW5lc1t0bl0sIGxpbmVOdW1zW3RuXSwgdGFnQ2hpbGRMaW5lcywgdGFnQ2hpbGRMaW5rcywgdGFnQ2hpbGRUeXBlcywgdGFnQ2hpbGRMaW5lTnVtcylcblxuICAgICAgICAgICAgeCArPSAxXG5cblxuICAgIGZpbmFsSGVhZCArPSAnPC9oZWFkPidcbiAgICBmaW5hbEhlYWRcblxuXG5cblxuXG5cbnByb2Nlc3NTdHlsZVRhZyA9ICh0YWdMaW5lLCBjaGlsZExpbmVzID0gW10sIGNoaWxkVHlwZXMpIC0+XG4gICAgZmluYWxUYWcgPSAnIydcbiAgICBmaW5hbFRhZyA9ICcuJyBpZiB0YWdMaW5lLnNwbGl0KCcgJylbMF0gPT0gJ2NsYXNzJ1xuXG4gICAgaWYgdGFnTGluZS5zcGxpdCgnICcpWzFdID09ICd0YWcnICNpZiBzdHlsaW5nIHRhZywgbm90IHRoZSBpZCBvciBjbGFzc1xuICAgICAgICBmaW5hbFRhZyA9ICcnXG4gICAgICAgIGZpbmFsVGFnICs9IHRhZ0xpbmUuc3BsaXQoJyAnKVsyXSArICd7J1xuICAgIGVsc2VcbiAgICAgICAgZmluYWxUYWcgKz0gdGFnTGluZS5zcGxpdCgnICcpWzFdICsgJ3snXG5cbiAgICBmb3IgeCBpbiBbMC4uLmNoaWxkTGluZXMubGVuZ3RoXVxuICAgICAgICBmaW5hbFRhZyArPSBmb3JtYXRTdHlsZVByb3BlcnR5KGNoaWxkTGluZXNbeF0pICsgJzsnIGlmIGNoaWxkVHlwZXNbeF0gPT0gc3R5bGVQcm9wZXJ0eVR5cGVcblxuICAgIGZpbmFsVGFnICs9ICd9J1xuICAgIGZpbmFsVGFnXG5cblxuXG5cblxuXG5wcm9jZXNzVGFnID0gKHRhZ0xpbmUsIHNlbGZMaW5rLCBjaGlsZExpbmVzID0gW10sIGNoaWxkTGlua3MsIGNoaWxkVHlwZXMsIGxpbmVOdW1zKSAtPlxuICAgICMgZ2V0IHJpZCBvZiBpbmRlbnRhdGlvblxuICAgIHNwID0gY291bnRTcGFjZXMgdGFnTGluZVxuICAgIHRhZ0xpbmUgPSB0YWdMaW5lLnNsaWNlKHNwKVxuXG4gICAgdGFnTmFtZSA9IHRhZ0xpbmUuc3BsaXQoJyAnKVswXVxuICAgIGZpbmFsVGFnID0gZm9ybWF0VGFnIHRhZ0xpbmVcbiAgICBjbG9zYWJsZSA9IGNoZWNrU2VsZkNsb3NpbmcodGFnTGluZS5zcGxpdCgnICcpWzBdKVxuXG4gICAgIyBjb2xsZWN0IGFsbCB0aGUgY2hpbGRyZW5cbiAgICB0YWdQcm9wZXJ0aWVzID0gW11cbiAgICB0YWdTdHlsZXMgICAgID0gW11cbiAgICBjaGlsZHMgICAgICAgID0gW11cbiAgICBjaGlsZFN0cmluZ3MgID0gW11cbiAgICB2YXJpYWJsZXMgICAgID0gW11cblxuICAgIGlmIGNoaWxkTGluZXMubGVuZ3RoID4gMFxuICAgICAgICBmb3IgeCBpbiBbMC4uLmNoaWxkTGluZXMubGVuZ3RoXVxuICAgICAgICAgICAgaWYgY2hpbGRMaW5rc1t4XSA9PSBzZWxmTGlua1xuICAgICAgICAgICAgICAgIHRhZ1Byb3BlcnRpZXMucHVzaCBjaGlsZExpbmVzW3hdIGlmIGNoaWxkVHlwZXNbeF0gPT0gdGFnUHJvcGVydHlUeXBlXG4gICAgICAgICAgICAgICAgdGFnU3R5bGVzLnB1c2ggY2hpbGRMaW5lc1t4XSAgICAgaWYgY2hpbGRUeXBlc1t4XSA9PSBzdHlsZVByb3BlcnR5VHlwZVxuICAgICAgICAgICAgICAgIGNoaWxkcy5wdXNoIHggICAgICAgICAgICAgICAgICAgIGlmIGNoaWxkVHlwZXNbeF0gPT0gdGFnVHlwZVxuICAgICAgICAgICAgICAgIGNoaWxkcy5wdXNoIHggICAgICAgICAgICAgICAgICAgIGlmIGNoaWxkVHlwZXNbeF0gPT0gc3RyaW5nVHlwZVxuICAgICAgICAgICAgICAgIGNoaWxkcy5wdXNoIHggICAgICAgICAgICAgICAgICAgIGlmIGNoaWxkVHlwZXNbeF0gPT0gc3R5bGVDbGFzc1R5cGVcbiAgICAgICAgICAgICAgICBjaGlsZHMucHVzaCB4ICAgICAgICAgICAgICAgICAgICBpZiBjaGlsZFR5cGVzW3hdID09IHZhcmlhYmxlVHlwZVxuXG4gICAgIyBhZGQgdGFnIHByb3BlcnRpZXNcbiAgICBpZiB0YWdQcm9wZXJ0aWVzLmxlbmd0aCA+IDBcbiAgICAgICAgZm9yIHggaW4gWzAuLi50YWdQcm9wZXJ0aWVzLmxlbmd0aF1cbiAgICAgICAgICAgIHRhZ1Byb3BlcnRpZXNbeF0gPSBmb3JtYXRQcm9wZXJ0eSB0YWdQcm9wZXJ0aWVzW3hdXG4gICAgICAgICAgICBmaW5hbFRhZyArPSAnICcgKyB0YWdQcm9wZXJ0aWVzW3hdXG5cbiAgICAjIGFkZCB0YWcgc3R5bGVcbiAgICBpZiB0YWdTdHlsZXMubGVuZ3RoID4gMFxuICAgICAgICBmaW5hbFRhZyArPSAnIHN0eWxlPVwiJ1xuICAgICAgICBmb3IgeCBpbiBbMC4uLnRhZ1N0eWxlcy5sZW5ndGhdXG4gICAgICAgICAgICBmaW5hbFRhZyArPSBmb3JtYXRTdHlsZVByb3BlcnR5KHRhZ1N0eWxlc1t4XSkgKyAnOydcbiAgICAgICAgZmluYWxUYWcgKz0gJ1wiJ1xuXG4gICAgZmluYWxUYWcgKz0gJz4nXG5cbiAgICAjLi4uIHByb2Nlc3MgY2hpbGQgdGFncywgc3RyaW5ncywgc3R5bGVUYWdzXG4gICAgeCA9IDBcbiAgICBpZiB0YWdOYW1lIT0nY29mZmVlc2NyaXB0J1xuICAgICAgICB3aGlsZSB4IDwgY2hpbGRzLmxlbmd0aFxuICAgICAgICAgICAgdGwgPSBjaGlsZHNbeF1cblxuICAgICAgICAgICAgaWYgY2hpbGRUeXBlc1t0bF0gPT0gc3RyaW5nVHlwZVxuICAgICAgICAgICAgICAgIGZpbmFsVGFnICs9IGZvcm1hdFN0cmluZyhjaGlsZExpbmVzW3RsXSlcblxuICAgICAgICAgICAgaWYgY2hpbGRUeXBlc1t0bF0gPT0gc3R5bGVDbGFzc1R5cGVcbiAgICAgICAgICAgICAgICBpZiBjaGlsZExpbmtzW3RsXSAhPSAtMVxuICAgICAgICAgICAgICAgICAgICBmaW5hbFRhZyArPSAnXFxuJyBpZiBmb3JtYXRIdG1sXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlQ2hpbGRMaW5lcyA9IFtdXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlQ2hpbGRUeXBlcyA9IFtdXG5cbiAgICAgICAgICAgICAgICAgICAgcCA9IHRsICsgMVxuICAgICAgICAgICAgICAgICAgICB3aGlsZSBjaGlsZExpbmtzW3BdID49IHRsXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBwIDwgY2hpbGRMaW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZUNoaWxkTGluZXMucHVzaCBjaGlsZExpbmVzW3BdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVDaGlsZFR5cGVzLnB1c2ggY2hpbGRUeXBlc1twXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIGZpbmFsVGFnICs9IHByb2Nlc3NTdHlsZVRhZyhjaGlsZExpbmVzW3RsXSwgc3R5bGVDaGlsZExpbmVzLCBzdHlsZUNoaWxkVHlwZXMpXG5cbiAgICAgICAgICAgIGlmIGNoaWxkVHlwZXNbdGxdID09IHRhZ1R5cGVcbiAgICAgICAgICAgICAgICBmaW5hbFRhZyArPSAnXFxuJyBpZiBmb3JtYXRIdG1sXG4gICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5lcyAgPSBbXVxuICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGlua3MgID0gW11cbiAgICAgICAgICAgICAgICB0YWdDaGlsZFR5cGVzICA9IFtdXG4gICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5lTnVtcyA9IFtdXG5cbiAgICAgICAgICAgICAgICBwID0gdGwgKyAxXG4gICAgICAgICAgICAgICAgd2hpbGUgY2hpbGRMaW5rc1twXSA+PSB0bFxuICAgICAgICAgICAgICAgICAgICBpZiBwIDwgY2hpbGRMaW5lcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGluZXMucHVzaCBjaGlsZExpbmVzW3BdXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmtzLnB1c2ggY2hpbGRMaW5rc1twXVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnQ2hpbGRUeXBlcy5wdXNoIGNoaWxkVHlwZXNbcF1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGluZU51bXMucHVzaCBsaW5lTnVtc1twXVxuICAgICAgICAgICAgICAgICAgICAgICAgcCArPSAxXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cblxuICAgICAgICAgICAgICAgIGZpbmFsVGFnICs9IHByb2Nlc3NUYWcoY2hpbGRMaW5lc1t0bF0sIGxpbmVOdW1zW3RsXSwgdGFnQ2hpbGRMaW5lcywgdGFnQ2hpbGRMaW5rcywgdGFnQ2hpbGRUeXBlcywgdGFnQ2hpbGRMaW5lTnVtcylcblxuICAgICAgICAgICAgeCArPSAxXG4gICAgZWxzZVxuICAgICAgICBzY3JpcHRCZWZvcmUgPSAnJ1xuICAgICAgICBmb3IgbCBpbiBbMC4uLmNoaWxkTGluZXMubGVuZ3RoXVxuICAgICAgICAgICAgc2NyaXB0QmVmb3JlICs9IGNoaWxkTGluZXNbbF0gKyAnXFxuJ1xuXG4gICAgICAgIGZpbmFsVGFnID0gJzxzY3JpcHQ+J1xuICAgICAgICB0YWdOYW1lID0gJ3NjcmlwdCdcbiAgICAgICAgZmluYWxUYWcgKz0gY29mZmVlLmNvbXBpbGUoc2NyaXB0QmVmb3JlKVxuXG4gICAgIyBjbG9zZSB0YWcgYW5kIHJldHVybiBmaW5hbCBzdHJpbmdcbiAgICBpZiBjbG9zYWJsZVxuICAgICAgICBmaW5hbFRhZyArPSAnPC8nICsgdGFnTmFtZSArICc+J1xuXG4gICAgZmluYWxUYWcgKz0gJ1xcbicgaWYgZm9ybWF0SHRtbFxuXG4gICAgZmluYWxUYWdcblxuXG5jbGVhblVwRmlsZSA9IChzRmlsZSkgLT5cbiAgICBjYXJyaWFnZVRhYlRlc3QgPSAvW1xcclxcdF0vZ21pXG5cbiAgICByRmlsZSA9IHNGaWxlXG4gICAgd2hpbGUgY2FycmlhZ2VUYWJUZXN0LnRlc3QockZpbGUpXG4gICAgICAgIHJGaWxlID0gckZpbGUucmVwbGFjZSgnXFxyJywgJ1xcbicpLnJlcGxhY2UoJ1xcdCcsICcgICAgJylcbiAgICByRmlsZVxuXG5leHBvcnRzLmNocmlzdGluaXplRmlsZSA9IChjaHJpc0ZpbGVQYXRoKSAtPlxuICAgIHNvdXJjZUZpbGUgPSBmcy5yZWFkRmlsZVN5bmMoY2hyaXNGaWxlUGF0aCwgJ3V0ZjgnKVxuICAgIHNvdXJjZUZpbGUgPSBjbGVhblVwRmlsZShzb3VyY2VGaWxlKVxuXG4gICAgY2hyaXNSb290Rm9sZGVyID0gUGF0aC5kaXJuYW1lIGNocmlzRmlsZVBhdGhcbiAgICBjaHJpc3Rpbml6ZWRGaWxlID0gc2h0bWwoc291cmNlRmlsZSlcblxuICAgIGZzLndyaXRlRmlsZSgnLi8nICsgY2hyaXNGaWxlUGF0aCArICcuaHRtbCcsIGNocmlzdGluaXplZEZpbGUpXG4gICAgY2hyaXN0aW5pemVkRmlsZVxuXG5leHBvcnRzLmNocmlzdGluaXplQW5kU2F2ZSA9IChjaHJpc1NvdXJjZSkgLT5cblxuICAgIGNocmlzdGluaXplZEZpbGUgPSBzaHRtbChjaHJpc1NvdXJjZSlcbiAgICBmcy53cml0ZUZpbGUoJy4vY2hyaXNQcmV2aWV3Lmh0bWwnLCBjaHJpc3Rpbml6ZWRGaWxlKVxuIl19
//# sourceURL=coffeescript