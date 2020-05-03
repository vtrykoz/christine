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

  tagFilter = /^\s*[\w\-]+ *(( +\w+)?( *)?( +is( +.*)?)?)?$/i;

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
    var chrisModulePath, j, k, l, moduleLevel, moduleLevelFilter, moduleLines, ref, ref1, resultLs, x;
    resultLs = [];
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
    var j, k, lineNums, lineParents, lineTypes, lines, m, ref, ref1, ref2, resultLines, resultText, t, x;
    lines = [];
    resultLines = [];
    lineTypes = [];
    lineParents = [];
    lineNums = [];
    resultText = '';
    lines = sourceText.split('\n');
    lines = processModules(lines, chrisRootFolder);
    lines = cleanUpLines(lines, lineTypes);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsZ0JBQUEsRUFBQSxlQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLFVBQUEsRUFBQSxjQUFBLEVBQUEsWUFBQSxFQUFBLG1CQUFBLEVBQUEsU0FBQSxFQUFBLGNBQUEsRUFBQSxFQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQSxlQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLGVBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxVQUFBLEVBQUEsZUFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQUEsVUFBQSxFQUFBLGdCQUFBLEVBQUEsY0FBQSxFQUFBLG1CQUFBLEVBQUEsaUJBQUEsRUFBQSxTQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUEsT0FBQSxFQUFBLGNBQUEsRUFBQTs7RUFBQSxlQUFBLEdBQWtCLENBQUMsSUFBRCxFQUFPLEtBQVAsRUFBYyxPQUFkLEVBQXVCLElBQXZCLEVBQTZCLE1BQTdCLEVBQXFDLE1BQXJDOztFQUNsQixRQUFBLEdBQVcsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixPQUFsQixFQUEyQixPQUEzQixFQUFvQyxNQUFwQzs7RUFFWCxVQUFBLEdBQWE7O0VBQ2IsU0FBQSxHQUFZOztFQUVaLGVBQUEsR0FBa0I7O0VBRWxCLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFDTCxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsTUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSLEVBVlQ7OztFQWVBLE9BQUEsR0FBc0IsRUFmdEI7O0VBZ0JBLFNBQUEsR0FBc0I7O0VBRXRCLGVBQUEsR0FBc0IsRUFsQnRCOztFQW1CQSxpQkFBQSxHQUFzQjs7RUFFdEIsY0FBQSxHQUFzQixFQXJCdEI7O0VBc0JBLGdCQUFBLEdBQXNCOztFQUV0QixpQkFBQSxHQUFzQixFQXhCdEI7O0VBeUJBLG1CQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCLEVBM0J0Qjs7RUE0QkEsWUFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQixFQTlCdEI7O0VBZ0NBLFlBQUEsR0FBc0IsRUFoQ3RCOztFQWlDQSxjQUFBLEdBQXNCOztFQUV0QixXQUFBLEdBQXNCOztFQUN0QixhQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCOztFQUN0QixZQUFBLEdBQXNCOztFQUV0QixhQUFBLEdBQXNCLENBQUM7O0VBQ3ZCLFdBQUEsR0FBc0I7O0VBQ3RCLGFBQUEsR0FBc0I7O0VBTXRCLFdBQUEsR0FBYyxRQUFBLENBQUMsQ0FBRCxDQUFBO0FBQ1YsUUFBQTtJQUFBLENBQUEsR0FBSTtJQUNKLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixLQUFRLEdBQVg7QUFDSSxhQUFNLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxHQUFkO1FBQ0ksQ0FBQSxJQUFHO01BRFAsQ0FESjs7V0FHQTtFQUxVOztFQVNkLFdBQUEsR0FBYyxRQUFBLENBQUMsQ0FBRCxDQUFBO0FBQ1YsUUFBQTtJQUFBLEVBQUEsR0FBSyxDQUFDO0lBRU4sSUFBc0IsYUFBYSxDQUFDLElBQWQsQ0FBbUIsQ0FBbkIsQ0FBdEI7TUFBQSxFQUFBLEdBQUssY0FBTDs7SUFDQSxJQUFzQixXQUFXLENBQUMsSUFBWixDQUFpQixDQUFqQixDQUF0QjtNQUFBLEVBQUEsR0FBSyxjQUFMOztJQUNBLElBQTBCLG1CQUFtQixDQUFDLElBQXBCLENBQXlCLENBQXpCLENBQTFCO01BQUEsRUFBQSxHQUFLLGtCQUFMOztJQUNBLElBQWdCLFNBQVMsQ0FBQyxJQUFWLENBQWUsQ0FBZixDQUFoQjtNQUFBLEVBQUEsR0FBSyxRQUFMOztJQUNBLElBQW9CLGFBQWEsQ0FBQyxJQUFkLENBQW1CLENBQW5CLENBQXBCO01BQUEsRUFBQSxHQUFLLFlBQUw7O0lBQ0EsSUFBdUIsZ0JBQWdCLENBQUMsSUFBakIsQ0FBc0IsQ0FBdEIsQ0FBdkI7TUFBQSxFQUFBLEdBQUssZUFBTDs7SUFDQSxJQUF3QixpQkFBaUIsQ0FBQyxJQUFsQixDQUF1QixDQUF2QixDQUF4QjtNQUFBLEVBQUEsR0FBSyxnQkFBTDs7SUFDQSxJQUFtQixZQUFZLENBQUMsSUFBYixDQUFrQixDQUFsQixDQUFuQjtNQUFBLEVBQUEsR0FBSyxXQUFMOztJQUNBLElBQXFCLGNBQWMsQ0FBQyxJQUFmLENBQW9CLENBQXBCLENBQXJCO01BQUEsRUFBQSxHQUFLLGFBQUw7O0lBQ0EsSUFBbUIsWUFBWSxDQUFDLElBQWIsQ0FBa0IsQ0FBbEIsQ0FBbkI7TUFBQSxFQUFBLEdBQUssV0FBTDs7V0FDQTtFQWJVOztFQWdCZCxZQUFBLEdBQWUsUUFBQSxDQUFDLEtBQUQsQ0FBQTtBQUNYLFFBQUEsWUFBQSxFQUFBLGdCQUFBLEVBQUEsQ0FBQSxFQUFBLGVBQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUE7SUFBQSxVQUFBLEdBQWE7SUFDYixXQUFBLEdBQVk7SUFFWixlQUFBLEdBQWtCLENBQUMsQ0FBQyxDQUFGO0lBQ2xCLFlBQUEsR0FBZSxDQUFDLENBQUQ7SUFDZixnQkFBQSxHQUFtQjtJQUVuQixLQUFTLHVGQUFUO01BQ0ksQ0FBQSxHQUFJLFdBQUEsQ0FBWSxLQUFNLENBQUEsQ0FBQSxDQUFsQixFQUFKOztNQUdBLElBQUcsQ0FBQSxHQUFJLFlBQWEsQ0FBQSxnQkFBQSxDQUFwQjtRQUNJLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixDQUFBLEdBQUksQ0FBekI7UUFDQSxZQUFZLENBQUMsSUFBYixDQUFrQixDQUFsQjtRQUNBLGdCQUFBLElBQW9CLEVBSHhCOztBQUtBLGFBQU0sQ0FBQSxHQUFJLFlBQWEsQ0FBQSxnQkFBQSxDQUF2QjtRQUNJLElBQUcsQ0FBQSxHQUFJLFlBQWEsQ0FBQSxnQkFBQSxDQUFwQjtVQUNJLFlBQVksQ0FBQyxHQUFiLENBQUE7VUFDQSxlQUFlLENBQUMsR0FBaEIsQ0FBQTtVQUNBLGdCQUFBLElBQW9CLEVBSHhCOztNQURKO01BTUEsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsZ0JBQWhCO01BQ0EsV0FBWSxDQUFBLENBQUEsQ0FBWixHQUFpQixlQUFnQixDQUFBLGVBQWUsQ0FBQyxNQUFoQixHQUF1QixDQUF2QjtJQWhCckM7V0FrQkE7RUExQlc7O0VBNkJmLGNBQUEsR0FBaUIsUUFBQSxDQUFDLENBQUQsQ0FBQTtBQUNiLFFBQUEsQ0FBQSxFQUFBLFdBQUEsRUFBQSxVQUFBLEVBQUEsT0FBQSxFQUFBO0lBQUEsV0FBQSxHQUFjO0lBQ2QsVUFBQSxHQUFhO0lBRWIsT0FBQSxHQUFVLENBQUMsQ0FBQyxLQUFGLENBQVEsR0FBUixDQUFhLENBQUEsQ0FBQTtJQUN2QixDQUFBLEdBQUk7QUFDSixXQUFNLE9BQU8sQ0FBQyxLQUFSLENBQWMsR0FBZCxDQUFtQixDQUFBLENBQUEsQ0FBbkIsS0FBeUIsRUFBL0I7TUFDSSxDQUFBLElBQUs7SUFEVDtJQUVBLE9BQUEsR0FBVSxPQUFPLENBQUMsS0FBUixDQUFjLEdBQWQsQ0FBbUIsQ0FBQSxDQUFBO0lBRTdCLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLEdBQVI7SUFDSixDQUFBLEdBQUksQ0FBRSxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQUwsQ0FBVyxHQUFYO0lBQ0osQ0FBQSxHQUFJO0FBQ0osV0FBTSxDQUFBLEdBQUksQ0FBQyxDQUFDLE1BQVo7TUFDSSxJQUFHLENBQUUsQ0FBQSxDQUFBLENBQUYsS0FBUSxFQUFYO1FBQ0ksSUFBcUIsVUFBQSxLQUFjLEVBQW5DO1VBQUEsVUFBQSxJQUFjLElBQWQ7O1FBQ0EsVUFBQSxJQUFjLENBQUUsQ0FBQSxDQUFBLEVBRnBCOztNQUdBLENBQUEsSUFBSztJQUpUO0lBTUEsV0FBWSxDQUFBLENBQUEsQ0FBWixHQUFpQjtJQUNqQixXQUFZLENBQUEsQ0FBQSxDQUFaLEdBQWlCO1dBQ2pCO0VBckJhOztFQXdCakIsZ0JBQUEsR0FBbUIsUUFBQSxDQUFDLEVBQUQsRUFBSyxHQUFMLENBQUE7QUFDZixRQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsRUFBQTtJQUFBLFFBQUEsR0FBYztJQUNkLFdBQUEsR0FBYztJQUVkLEtBQVMsb0ZBQVQ7TUFDSSxJQUFHLEdBQUksQ0FBQSxDQUFBLENBQUosS0FBVSxZQUFiO1FBQ0ksUUFBUSxDQUFDLElBQVQsQ0FBYyxjQUFBLENBQWUsRUFBRyxDQUFBLENBQUEsQ0FBbEIsQ0FBc0IsQ0FBQSxDQUFBLENBQXBDO1FBQ0EsV0FBVyxDQUFDLElBQVosQ0FBaUIsY0FBQSxDQUFlLEVBQUcsQ0FBQSxDQUFBLENBQWxCLENBQXNCLENBQUEsQ0FBQSxDQUF2QyxFQUZKOztNQUlBLElBQUcsR0FBSSxDQUFBLENBQUEsQ0FBSixLQUFVLGlCQUFiO1FBQ0ksS0FBUywrRkFBVDtVQUNJLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBUSxFQUFHLENBQUEsQ0FBQSxDQUFFLENBQUMsT0FBTixDQUFjLFFBQVMsQ0FBQSxDQUFBLENBQXZCLEVBQTJCLFdBQVksQ0FBQSxDQUFBLENBQXZDLENBQTBDLENBQUMsT0FBM0MsQ0FBbUQsUUFBUyxDQUFBLENBQUEsQ0FBNUQsRUFBZ0UsV0FBWSxDQUFBLENBQUEsQ0FBNUUsQ0FBK0UsQ0FBQyxPQUFoRixDQUF3RixRQUFTLENBQUEsQ0FBQSxDQUFqRyxFQUFxRyxXQUFZLENBQUEsQ0FBQSxDQUFqSCxDQUFvSCxDQUFDLE9BQXJILENBQTZILFFBQVMsQ0FBQSxDQUFBLENBQXRJLEVBQTBJLFdBQVksQ0FBQSxDQUFBLENBQXRKO1FBRFosQ0FESjs7SUFMSjtXQVNBO0VBYmUsRUEvSG5COzs7RUFpSkEsZUFBQSxHQUFrQixRQUFBLENBQUMsY0FBRCxDQUFBO0FBQ2QsUUFBQSxHQUFBLEVBQUE7SUFBQSxJQUFBLEdBQU8sRUFBRSxDQUFDLFlBQUgsQ0FBZ0IsSUFBQSxHQUFPLGNBQXZCLEVBQXVDLE1BQXZDO0lBQ1AsSUFBQSxHQUFPLFdBQUEsQ0FBWSxJQUFaO0lBQ1AsR0FBQSxHQUFNLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWDtXQUNOO0VBSmM7O0VBTWxCLGNBQUEsR0FBaUIsUUFBQSxDQUFDLEVBQUQsRUFBSyxDQUFMLENBQUE7QUFDYixRQUFBLGVBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxXQUFBLEVBQUEsaUJBQUEsRUFBQSxXQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxRQUFBLEVBQUE7SUFBQSxRQUFBLEdBQVc7SUFDWCxpQkFBQSxHQUFvQjtJQUVwQixLQUFTLG9GQUFUO01BQ0ksSUFBRyxZQUFZLENBQUMsSUFBYixDQUFrQixFQUFHLENBQUEsQ0FBQSxDQUFyQixDQUFIO1FBQ0ksZUFBQSxHQUFrQixFQUFHLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBaUIsQ0FBQSxDQUFBO1FBQ25DLFdBQUEsR0FBYyxlQUFBLENBQWdCLENBQUEsR0FBSSxHQUFKLEdBQVUsZUFBMUI7UUFFZCxXQUFBLEdBQWMsaUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsRUFBRyxDQUFBLENBQUEsQ0FBMUI7UUFDZ0MsS0FBUyxrR0FBVDtVQUE5QyxXQUFZLENBQUEsQ0FBQSxDQUFaLEdBQWlCLFdBQUEsR0FBYyxXQUFZLENBQUEsQ0FBQTtRQUFHO1FBRTlDLFdBQUEsR0FBYyxjQUFBLENBQWUsV0FBZixFQUE0QixJQUFJLENBQUMsT0FBTCxDQUFhLENBQUEsR0FBSSxHQUFKLEdBQVUsZUFBdkIsQ0FBNUI7UUFDZCxRQUFBLEdBQVcsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsV0FBaEIsRUFSZjtPQUFBLE1BQUE7UUFVSSxRQUFRLENBQUMsSUFBVCxDQUFjLEVBQUcsQ0FBQSxDQUFBLENBQWpCLEVBVko7O0lBREo7V0FhQTtFQWpCYSxFQXZKakI7OztFQThLQSxPQUFPLENBQUMsV0FBUixHQUFzQixRQUFBLENBQUMsRUFBRCxDQUFBO1dBQ2xCLEtBQUEsQ0FBTSxFQUFOO0VBRGtCOztFQUl0QixZQUFBLEdBQWUsUUFBQSxDQUFDLEVBQUQsQ0FBQTtBQUNYLFFBQUEsQ0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUE7SUFBQSxLQUFBLEdBQVE7SUFFUixLQUFTLG9GQUFUO01BQ0ksSUFBRyxXQUFBLENBQVksRUFBRyxDQUFBLENBQUEsQ0FBZixDQUFBLEtBQXNCLENBQUMsQ0FBMUI7UUFDUSxLQUFLLENBQUMsSUFBTixDQUFXLEVBQUcsQ0FBQSxDQUFBLENBQWQsRUFEUjs7SUFESjtXQUlBO0VBUFc7O0VBVWYsS0FBQSxHQUFRLFFBQUEsQ0FBQyxVQUFELENBQUE7QUFFSixRQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsUUFBQSxFQUFBLFdBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxXQUFBLEVBQUEsVUFBQSxFQUFBLENBQUEsRUFBQTtJQUFBLEtBQUEsR0FBYztJQUNkLFdBQUEsR0FBYztJQUNkLFNBQUEsR0FBYztJQUNkLFdBQUEsR0FBYztJQUNkLFFBQUEsR0FBYztJQUNkLFVBQUEsR0FBYztJQUVkLEtBQUEsR0FBUSxVQUFVLENBQUMsS0FBWCxDQUFpQixJQUFqQjtJQUVSLEtBQUEsR0FBUSxjQUFBLENBQWUsS0FBZixFQUFzQixlQUF0QjtJQUdSLEtBQUEsR0FBUSxZQUFBLENBQWEsS0FBYixFQUFvQixTQUFwQixFQVpSOztJQWVBLEtBQVMsdUZBQVQ7TUFDSSxDQUFBLEdBQUksV0FBQSxDQUFZLEtBQU0sQ0FBQSxDQUFBLENBQWxCO01BQ0osU0FBUyxDQUFDLElBQVYsQ0FBZSxDQUFmO01BQ0EsV0FBVyxDQUFDLElBQVosQ0FBaUIsS0FBTSxDQUFBLENBQUEsQ0FBdkI7SUFISjtJQUtBLFdBQUEsR0FBYyxnQkFBQSxDQUFpQixXQUFqQixFQUE4QixTQUE5QjtJQUVkLFdBQUEsR0FBYyxZQUFBLENBQWEsV0FBYjtJQUVHLEtBQVMsa0dBQVQ7TUFBakIsUUFBUSxDQUFDLElBQVQsQ0FBYyxDQUFkO0lBQWlCO0lBRWpCLElBQTZILFNBQTdIO01BQXdGLEtBQVMsa0dBQVQ7UUFBeEYsVUFBQSxJQUFjLENBQUEsQ0FBQSxDQUFBLENBQUksUUFBUyxDQUFBLENBQUEsQ0FBYixFQUFBLENBQUEsQ0FBbUIsU0FBVSxDQUFBLENBQUEsQ0FBN0IsRUFBQSxDQUFBLENBQW1DLFdBQVksQ0FBQSxDQUFBLENBQS9DLENBQWtELEdBQWxELENBQUEsQ0FBdUQsV0FBWSxDQUFBLENBQUEsQ0FBbkUsQ0FBc0UsRUFBdEU7TUFBMEUsQ0FBeEY7O0lBRUEsVUFBQSxJQUFjO0lBQ2QsVUFBQSxJQUFjO0lBQ2QsVUFBQSxJQUFjLFdBQUEsQ0FBWSxXQUFaLEVBQXlCLFdBQXpCLEVBQXNDLFNBQXRDLEVBQWlELFFBQWpEO0lBQ2QsVUFBQSxJQUFjLFVBQUEsQ0FBVyxNQUFYLEVBQW1CLENBQUMsQ0FBcEIsRUFBdUIsV0FBdkIsRUFBb0MsV0FBcEMsRUFBaUQsU0FBakQsRUFBNEQsUUFBNUQ7SUFDZCxVQUFBLElBQWM7V0FFZDtFQXBDSTs7RUF5Q1IsU0FBQSxHQUFZLFFBQUEsQ0FBQyxDQUFELENBQUE7QUFHUixRQUFBLFFBQUEsRUFBQSxjQUFBLEVBQUEsUUFBQSxFQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsRUFBQSxFQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUEsQ0FBQTs7SUFBQSxFQUFBLEdBQUssV0FBQSxDQUFZLENBQVo7SUFDTCxDQUFBLEdBQUksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxFQUFSO0lBRUosUUFBQSxHQUFXLENBQUMsQ0FBQyxLQUFGLENBQVEsR0FBUjtJQUNYLFFBQUEsR0FBVztJQUVYLEtBQVMsMEZBQVQ7TUFDSSxJQUE2QixRQUFTLENBQUEsQ0FBQSxDQUFULEtBQWUsRUFBNUM7UUFBQSxRQUFRLENBQUMsSUFBVCxDQUFjLFFBQVMsQ0FBQSxDQUFBLENBQXZCLEVBQUE7O0lBREo7SUFHQSxRQUFBLEdBQVcsR0FBQSxHQUFNLFFBQVMsQ0FBQSxDQUFBO0lBRTFCLElBQUcsUUFBUSxDQUFDLE1BQVQsR0FBa0IsQ0FBckI7TUFDSSxJQUFHLFFBQVMsQ0FBQSxDQUFBLENBQVQsS0FBZSxJQUFsQjtRQUNJLFFBQUEsSUFBWSxPQUFBLEdBQVUsUUFBUyxDQUFBLENBQUEsQ0FBbkIsR0FBd0IsSUFEeEM7O01BR0EsQ0FBQSxHQUFJO01BQ0osUUFBQSxHQUFXO01BQ1gsY0FBQSxHQUFpQjtBQUNqQixhQUFNLENBQUEsR0FBSSxRQUFRLENBQUMsTUFBbkI7UUFDSSxJQUFHLGNBQUg7VUFDSSxRQUFBLElBQVksUUFBUyxDQUFBLENBQUE7VUFDckIsSUFBbUIsQ0FBQSxHQUFJLFFBQVEsQ0FBQyxNQUFULEdBQWtCLENBQXpDO1lBQUEsUUFBQSxJQUFZLElBQVo7V0FGSjtTQUFBLE1BQUE7VUFJSSxJQUFHLFFBQVMsQ0FBQSxDQUFBLENBQVQsS0FBZSxJQUFsQjtZQUNJLElBQXlCLENBQUEsR0FBSSxRQUFRLENBQUMsTUFBVCxHQUFrQixDQUEvQztjQUFBLGNBQUEsR0FBaUIsS0FBakI7YUFESjtXQUpKOztRQU1BLENBQUEsSUFBSztNQVBUO01BUUEsSUFBMkMsUUFBUSxDQUFDLE1BQVQsR0FBa0IsQ0FBN0Q7UUFBQSxRQUFBLElBQVksVUFBQSxHQUFhLFFBQWIsR0FBd0IsSUFBcEM7T0FmSjs7V0FpQkE7RUEvQlE7O0VBb0NaLGNBQUEsR0FBaUIsUUFBQSxDQUFDLENBQUQsQ0FBQTtBQUdiLFFBQUEsYUFBQSxFQUFBLGtCQUFBLEVBQUEsRUFBQSxFQUFBLENBQUE7O0lBQUEsRUFBQSxHQUFLLFdBQUEsQ0FBWSxDQUFaO0lBQ0wsQ0FBQSxHQUFJLENBQUMsQ0FBQyxLQUFGLENBQVEsRUFBUjtJQUVKLGFBQUEsR0FBZ0I7SUFDaEIsa0JBQUEsR0FBcUI7SUFDckIsQ0FBQSxHQUFJLENBQUMsQ0FBQyxLQUFGLENBQVEsa0JBQVIsQ0FBNEIsQ0FBQSxDQUFBO0lBQ2hDLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLEdBQVIsQ0FBYSxDQUFBLENBQUE7SUFDakIsQ0FBQSxHQUFJLENBQUMsQ0FBQyxLQUFGLENBQVEsR0FBUixDQUFhLENBQUEsQ0FBQTtJQUNqQixhQUFBLEdBQWdCLENBQUEsR0FBSTtJQUNwQixDQUFBLEdBQUksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxHQUFSLENBQWEsQ0FBQSxDQUFBO0lBQ2pCLGFBQUEsSUFBaUIsQ0FBQSxHQUFJO1dBQ3JCO0VBZGE7O0VBZ0JqQixtQkFBQSxHQUFzQixRQUFBLENBQUMsQ0FBRCxDQUFBO0FBR2xCLFFBQUEsVUFBQSxFQUFBLGtCQUFBLEVBQUEsZUFBQSxFQUFBLENBQUEsRUFBQSxhQUFBLEVBQUEsR0FBQSxFQUFBLEVBQUEsRUFBQSxDQUFBOztJQUFBLEVBQUEsR0FBSyxXQUFBLENBQVksQ0FBWjtJQUNMLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLEVBQVI7SUFFSixlQUFBLEdBQWtCLENBQUMsQ0FBQyxPQUFGLENBQVUsR0FBVjtJQUNsQixhQUFBLEdBQWdCLENBQUMsQ0FBQyxLQUFGLENBQVMsZUFBQSxHQUFrQixDQUEzQjtJQUNoQixrQkFBQSxHQUFxQixDQUFDLENBQUMsS0FBRixDQUFRLEdBQVIsQ0FBYSxDQUFBLENBQUEsQ0FBYixHQUFrQjtJQUN2QyxVQUFBLEdBQWEsYUFBYSxDQUFDLEtBQWQsQ0FBb0IsR0FBcEI7SUFFYixLQUFTLDRGQUFUO01BQ0ksSUFBRyxVQUFXLENBQUEsQ0FBQSxDQUFYLEtBQWlCLEVBQXBCO1FBQ0ksa0JBQUEsSUFBc0IsVUFBVyxDQUFBLENBQUE7UUFDakMsSUFBNkIsQ0FBQSxHQUFJLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLENBQXJEO1VBQUEsa0JBQUEsSUFBc0IsSUFBdEI7U0FGSjs7SUFESjtXQUtBO0VBaEJrQjs7RUFtQnRCLFlBQUEsR0FBZSxRQUFBLENBQUMsQ0FBRCxDQUFBO0FBQ1gsUUFBQTtJQUFBLFdBQUEsR0FBYyxDQUFDLENBQUMsS0FBRixDQUFRLEdBQVIsQ0FBYSxDQUFBLENBQUE7V0FDM0I7RUFGVzs7RUFJZixnQkFBQSxHQUFtQixRQUFBLENBQUMsQ0FBRCxDQUFBO0FBQ2YsUUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQTtJQUFBLFdBQUEsR0FBYztJQUNkLEtBQVMsbUdBQVQ7TUFDSSxJQUF1QixDQUFBLEtBQUssZUFBZ0IsQ0FBQSxDQUFBLENBQTVDO1FBQUEsV0FBQSxHQUFjLE1BQWQ7O0lBREo7V0FFQTtFQUplLEVBaFRuQjs7O0VBNFRBLFdBQUEsR0FBYyxRQUFBLENBQUMsUUFBUSxFQUFULEVBQWEsS0FBYixFQUFvQixLQUFwQixFQUEyQixRQUEzQixDQUFBO0FBQ1YsUUFBQSxjQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxlQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLGFBQUEsRUFBQSxhQUFBLEVBQUEsRUFBQSxFQUFBO0lBQUEsU0FBQSxHQUFZLFNBQVo7O0lBSUEsY0FBQSxHQUFpQjtJQUNqQixZQUFBLEdBQWU7SUFFZixJQUFHLEtBQUssQ0FBQyxNQUFOLEdBQWUsQ0FBbEI7TUFDSSxLQUFTLHVGQUFUO1FBQ0ksSUFBRyxLQUFNLENBQUEsQ0FBQSxDQUFOLEtBQVksQ0FBQyxDQUFoQjtVQUNJLElBQXlCLEtBQU0sQ0FBQSxDQUFBLENBQU4sS0FBWSxjQUFyQztZQUFBLGNBQWMsQ0FBQyxJQUFmLENBQW9CLENBQXBCLEVBQUE7O1VBQ0EsSUFBdUIsS0FBTSxDQUFBLENBQUEsQ0FBTixLQUFZLFdBQW5DO1lBQUEsWUFBWSxDQUFDLElBQWIsQ0FBa0IsQ0FBbEIsRUFBQTtXQUZKOztNQURKLENBREo7S0FQQTs7SUFnQkEsSUFBRyxjQUFjLENBQUMsTUFBZixHQUF3QixDQUEzQjtNQUNJLFNBQUEsSUFBYTtNQUNiLENBQUEsR0FBSTtBQUNKLGFBQU0sQ0FBQSxHQUFJLGNBQWMsQ0FBQyxNQUF6QjtRQUNJLElBQXFCLFVBQXJCO1VBQUEsU0FBQSxJQUFhLEtBQWI7O1FBRUEsZUFBQSxHQUFrQjtRQUNsQixlQUFBLEdBQWtCO1FBRWxCLENBQUEsR0FBSSxjQUFlLENBQUEsQ0FBQSxDQUFmLEdBQW9CO0FBQ3hCLGVBQU0sS0FBTSxDQUFBLENBQUEsQ0FBTixJQUFZLGNBQWUsQ0FBQSxDQUFBLENBQWpDO1VBQ0ksSUFBRyxDQUFBLEdBQUksS0FBSyxDQUFDLE1BQWI7WUFDSSxlQUFlLENBQUMsSUFBaEIsQ0FBcUIsS0FBTSxDQUFBLENBQUEsQ0FBM0I7WUFDQSxlQUFlLENBQUMsSUFBaEIsQ0FBcUIsS0FBTSxDQUFBLENBQUEsQ0FBM0I7WUFDQSxDQUFBLElBQUssRUFIVDtXQUFBLE1BQUE7QUFLSSxrQkFMSjs7UUFESjtRQU9BLFNBQUEsSUFBYSxlQUFBLENBQWdCLEtBQU0sQ0FBQSxjQUFlLENBQUEsQ0FBQSxDQUFmLENBQXRCLEVBQTBDLGVBQTFDLEVBQTJELGVBQTNEO1FBRWIsQ0FBQSxJQUFLO01BaEJUO01Ba0JBLFNBQUEsSUFBYSxXQXJCakI7S0FoQkE7O0lBeUNBLElBQUcsWUFBWSxDQUFDLE1BQWIsR0FBc0IsQ0FBekI7TUFDSSxDQUFBLEdBQUk7QUFDSixhQUFNLENBQUEsR0FBSSxZQUFZLENBQUMsTUFBdkI7UUFDSSxJQUFxQixVQUFyQjtVQUFBLFNBQUEsSUFBYSxLQUFiOztRQUNBLGFBQUEsR0FBZ0I7UUFDaEIsYUFBQSxHQUFnQjtRQUNoQixhQUFBLEdBQWdCO1FBQ2hCLGdCQUFBLEdBQW1CO1FBRW5CLENBQUEsR0FBSSxZQUFhLENBQUEsQ0FBQSxDQUFiLEdBQWtCO0FBQ3RCLGVBQU0sS0FBTSxDQUFBLENBQUEsQ0FBTixJQUFZLFlBQWEsQ0FBQSxDQUFBLENBQS9CO1VBQ0ksSUFBRyxDQUFBLEdBQUksS0FBSyxDQUFDLE1BQWI7WUFDSSxhQUFhLENBQUMsSUFBZCxDQUFtQixLQUFNLENBQUEsQ0FBQSxDQUF6QjtZQUNBLGFBQWEsQ0FBQyxJQUFkLENBQW1CLEtBQU0sQ0FBQSxDQUFBLENBQXpCO1lBQ0EsYUFBYSxDQUFDLElBQWQsQ0FBbUIsS0FBTSxDQUFBLENBQUEsQ0FBekI7WUFDQSxnQkFBZ0IsQ0FBQyxJQUFqQixDQUFzQixRQUFTLENBQUEsQ0FBQSxDQUEvQjtZQUNBLENBQUEsSUFBSyxFQUxUO1dBQUEsTUFBQTtBQU9JLGtCQVBKOztRQURKO1FBU0EsRUFBQSxHQUFLLFlBQWEsQ0FBQSxDQUFBO1FBQ2xCLFNBQUEsSUFBYSxVQUFBLENBQVcsS0FBTSxDQUFBLEVBQUEsQ0FBakIsRUFBc0IsUUFBUyxDQUFBLEVBQUEsQ0FBL0IsRUFBb0MsYUFBcEMsRUFBbUQsYUFBbkQsRUFBa0UsYUFBbEUsRUFBaUYsZ0JBQWpGO1FBRWIsQ0FBQSxJQUFLO01BcEJULENBRko7O0lBeUJBLFNBQUEsSUFBYTtXQUNiO0VBcEVVOztFQTJFZCxlQUFBLEdBQWtCLFFBQUEsQ0FBQyxPQUFELEVBQVUsYUFBYSxFQUF2QixFQUEyQixVQUEzQixDQUFBO0FBQ2QsUUFBQSxRQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQTtJQUFBLFFBQUEsR0FBVztJQUNYLElBQWtCLE9BQU8sQ0FBQyxLQUFSLENBQWMsR0FBZCxDQUFtQixDQUFBLENBQUEsQ0FBbkIsS0FBeUIsT0FBM0M7TUFBQSxRQUFBLEdBQVcsSUFBWDs7SUFFQSxJQUFHLE9BQU8sQ0FBQyxLQUFSLENBQWMsR0FBZCxDQUFtQixDQUFBLENBQUEsQ0FBbkIsS0FBeUIsS0FBNUI7TUFDSSxRQUFBLEdBQVc7TUFDWCxRQUFBLElBQVksT0FBTyxDQUFDLEtBQVIsQ0FBYyxHQUFkLENBQW1CLENBQUEsQ0FBQSxDQUFuQixHQUF3QixJQUZ4QztLQUFBLE1BQUE7TUFJSSxRQUFBLElBQVksT0FBTyxDQUFDLEtBQVIsQ0FBYyxHQUFkLENBQW1CLENBQUEsQ0FBQSxDQUFuQixHQUF3QixJQUp4Qzs7SUFNQSxLQUFTLDRGQUFUO01BQ0ksSUFBd0QsVUFBVyxDQUFBLENBQUEsQ0FBWCxLQUFpQixpQkFBekU7UUFBQSxRQUFBLElBQVksbUJBQUEsQ0FBb0IsVUFBVyxDQUFBLENBQUEsQ0FBL0IsQ0FBQSxHQUFxQyxJQUFqRDs7SUFESjtJQUdBLFFBQUEsSUFBWTtXQUNaO0VBZGM7O0VBcUJsQixVQUFBLEdBQWEsUUFBQSxDQUFDLE9BQUQsRUFBVSxRQUFWLEVBQW9CLGFBQWEsRUFBakMsRUFBcUMsVUFBckMsRUFBaUQsVUFBakQsRUFBNkQsUUFBN0QsQ0FBQTtBQUVULFFBQUEsWUFBQSxFQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQSxZQUFBLEVBQUEsRUFBQSxFQUFBLGVBQUEsRUFBQSxlQUFBLEVBQUEsZ0JBQUEsRUFBQSxhQUFBLEVBQUEsYUFBQSxFQUFBLGFBQUEsRUFBQSxPQUFBLEVBQUEsYUFBQSxFQUFBLFNBQUEsRUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBLENBQUE7O0lBQUEsRUFBQSxHQUFLLFdBQUEsQ0FBWSxPQUFaO0lBQ0wsT0FBQSxHQUFVLE9BQU8sQ0FBQyxLQUFSLENBQWMsRUFBZDtJQUVWLE9BQUEsR0FBVSxPQUFPLENBQUMsS0FBUixDQUFjLEdBQWQsQ0FBbUIsQ0FBQSxDQUFBO0lBQzdCLFFBQUEsR0FBVyxTQUFBLENBQVUsT0FBVjtJQUNYLFFBQUEsR0FBVyxnQkFBQSxDQUFpQixPQUFPLENBQUMsS0FBUixDQUFjLEdBQWQsQ0FBbUIsQ0FBQSxDQUFBLENBQXBDLEVBTFg7O0lBUUEsYUFBQSxHQUFnQjtJQUNoQixTQUFBLEdBQWdCO0lBQ2hCLE1BQUEsR0FBZ0I7SUFDaEIsWUFBQSxHQUFnQjtJQUNoQixTQUFBLEdBQWdCO0lBRWhCLElBQUcsVUFBVSxDQUFDLE1BQVgsR0FBb0IsQ0FBdkI7TUFDSSxLQUFTLDRGQUFUO1FBQ0ksSUFBRyxVQUFXLENBQUEsQ0FBQSxDQUFYLEtBQWlCLFFBQXBCO1VBQ0ksSUFBb0MsVUFBVyxDQUFBLENBQUEsQ0FBWCxLQUFpQixlQUFyRDtZQUFBLGFBQWEsQ0FBQyxJQUFkLENBQW1CLFVBQVcsQ0FBQSxDQUFBLENBQTlCLEVBQUE7O1VBQ0EsSUFBb0MsVUFBVyxDQUFBLENBQUEsQ0FBWCxLQUFpQixpQkFBckQ7WUFBQSxTQUFTLENBQUMsSUFBVixDQUFlLFVBQVcsQ0FBQSxDQUFBLENBQTFCLEVBQUE7O1VBQ0EsSUFBb0MsVUFBVyxDQUFBLENBQUEsQ0FBWCxLQUFpQixPQUFyRDtZQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVksQ0FBWixFQUFBOztVQUNBLElBQW9DLFVBQVcsQ0FBQSxDQUFBLENBQVgsS0FBaUIsVUFBckQ7WUFBQSxNQUFNLENBQUMsSUFBUCxDQUFZLENBQVosRUFBQTs7VUFDQSxJQUFvQyxVQUFXLENBQUEsQ0FBQSxDQUFYLEtBQWlCLGNBQXJEO1lBQUEsTUFBTSxDQUFDLElBQVAsQ0FBWSxDQUFaLEVBQUE7O1VBQ0EsSUFBb0MsVUFBVyxDQUFBLENBQUEsQ0FBWCxLQUFpQixZQUFyRDtZQUFBLE1BQU0sQ0FBQyxJQUFQLENBQVksQ0FBWixFQUFBO1dBTko7O01BREosQ0FESjtLQWRBOztJQXlCQSxJQUFHLGFBQWEsQ0FBQyxNQUFkLEdBQXVCLENBQTFCO01BQ0ksS0FBUyxvR0FBVDtRQUNJLGFBQWMsQ0FBQSxDQUFBLENBQWQsR0FBbUIsY0FBQSxDQUFlLGFBQWMsQ0FBQSxDQUFBLENBQTdCO1FBQ25CLFFBQUEsSUFBWSxHQUFBLEdBQU0sYUFBYyxDQUFBLENBQUE7TUFGcEMsQ0FESjtLQXpCQTs7SUErQkEsSUFBRyxTQUFTLENBQUMsTUFBVixHQUFtQixDQUF0QjtNQUNJLFFBQUEsSUFBWTtNQUNaLEtBQVMsZ0dBQVQ7UUFDSSxRQUFBLElBQVksbUJBQUEsQ0FBb0IsU0FBVSxDQUFBLENBQUEsQ0FBOUIsQ0FBQSxHQUFvQztNQURwRDtNQUVBLFFBQUEsSUFBWSxJQUpoQjs7SUFNQSxRQUFBLElBQVksSUFyQ1o7O0lBd0NBLENBQUEsR0FBSTtJQUNKLElBQUcsT0FBQSxLQUFTLGNBQVo7QUFDSSxhQUFNLENBQUEsR0FBSSxNQUFNLENBQUMsTUFBakI7UUFDSSxFQUFBLEdBQUssTUFBTyxDQUFBLENBQUE7UUFFWixJQUFHLFVBQVcsQ0FBQSxFQUFBLENBQVgsS0FBa0IsVUFBckI7VUFDSSxRQUFBLElBQVksWUFBQSxDQUFhLFVBQVcsQ0FBQSxFQUFBLENBQXhCLEVBRGhCOztRQUdBLElBQUcsVUFBVyxDQUFBLEVBQUEsQ0FBWCxLQUFrQixjQUFyQjtVQUNJLElBQUcsVUFBVyxDQUFBLEVBQUEsQ0FBWCxLQUFrQixDQUFDLENBQXRCO1lBQ0ksSUFBb0IsVUFBcEI7Y0FBQSxRQUFBLElBQVksS0FBWjs7WUFDQSxlQUFBLEdBQWtCO1lBQ2xCLGVBQUEsR0FBa0I7WUFFbEIsQ0FBQSxHQUFJLEVBQUEsR0FBSztBQUNULG1CQUFNLFVBQVcsQ0FBQSxDQUFBLENBQVgsSUFBaUIsRUFBdkI7Y0FDSSxJQUFHLENBQUEsR0FBSSxVQUFVLENBQUMsTUFBbEI7Z0JBQ0ksZUFBZSxDQUFDLElBQWhCLENBQXFCLFVBQVcsQ0FBQSxDQUFBLENBQWhDO2dCQUNBLGVBQWUsQ0FBQyxJQUFoQixDQUFxQixVQUFXLENBQUEsQ0FBQSxDQUFoQztnQkFDQSxDQUFBLElBQUssRUFIVDtlQUFBLE1BQUE7QUFLSSxzQkFMSjs7WUFESjtZQU9BLFFBQUEsSUFBWSxlQUFBLENBQWdCLFVBQVcsQ0FBQSxFQUFBLENBQTNCLEVBQWdDLGVBQWhDLEVBQWlELGVBQWpELEVBYmhCO1dBREo7O1FBZ0JBLElBQUcsVUFBVyxDQUFBLEVBQUEsQ0FBWCxLQUFrQixPQUFyQjtVQUNJLElBQW9CLFVBQXBCO1lBQUEsUUFBQSxJQUFZLEtBQVo7O1VBQ0EsYUFBQSxHQUFpQjtVQUNqQixhQUFBLEdBQWlCO1VBQ2pCLGFBQUEsR0FBaUI7VUFDakIsZ0JBQUEsR0FBbUI7VUFFbkIsQ0FBQSxHQUFJLEVBQUEsR0FBSztBQUNULGlCQUFNLFVBQVcsQ0FBQSxDQUFBLENBQVgsSUFBaUIsRUFBdkI7WUFDSSxJQUFHLENBQUEsR0FBSSxVQUFVLENBQUMsTUFBbEI7Y0FDSSxhQUFhLENBQUMsSUFBZCxDQUFtQixVQUFXLENBQUEsQ0FBQSxDQUE5QjtjQUNBLGFBQWEsQ0FBQyxJQUFkLENBQW1CLFVBQVcsQ0FBQSxDQUFBLENBQTlCO2NBQ0EsYUFBYSxDQUFDLElBQWQsQ0FBbUIsVUFBVyxDQUFBLENBQUEsQ0FBOUI7Y0FDQSxnQkFBZ0IsQ0FBQyxJQUFqQixDQUFzQixRQUFTLENBQUEsQ0FBQSxDQUEvQjtjQUNBLENBQUEsSUFBSyxFQUxUO2FBQUEsTUFBQTtBQU9JLG9CQVBKOztVQURKO1VBV0EsUUFBQSxJQUFZLFVBQUEsQ0FBVyxVQUFXLENBQUEsRUFBQSxDQUF0QixFQUEyQixRQUFTLENBQUEsRUFBQSxDQUFwQyxFQUF5QyxhQUF6QyxFQUF3RCxhQUF4RCxFQUF1RSxhQUF2RSxFQUFzRixnQkFBdEYsRUFuQmhCOztRQXFCQSxDQUFBLElBQUs7TUEzQ1QsQ0FESjtLQUFBLE1BQUE7TUE4Q0ksWUFBQSxHQUFlO01BQ2YsS0FBUyxpR0FBVDtRQUNJLFlBQUEsSUFBZ0IsVUFBVyxDQUFBLENBQUEsQ0FBWCxHQUFnQjtNQURwQztNQUdBLFFBQUEsR0FBVztNQUNYLE9BQUEsR0FBVTtNQUNWLFFBQUEsSUFBWSxNQUFNLENBQUMsT0FBUCxDQUFlLFlBQWYsRUFwRGhCO0tBekNBOztJQWdHQSxJQUFHLFFBQUg7TUFDSSxRQUFBLElBQVksSUFBQSxHQUFPLE9BQVAsR0FBaUIsSUFEakM7O0lBR0EsSUFBb0IsVUFBcEI7TUFBQSxRQUFBLElBQVksS0FBWjs7V0FFQTtFQXZHUzs7RUEwR2IsV0FBQSxHQUFjLFFBQUEsQ0FBQyxLQUFELENBQUE7QUFDVixRQUFBLGVBQUEsRUFBQTtJQUFBLGVBQUEsR0FBa0I7SUFFbEIsS0FBQSxHQUFRO0FBQ1IsV0FBTSxlQUFlLENBQUMsSUFBaEIsQ0FBcUIsS0FBckIsQ0FBTjtNQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsRUFBb0IsSUFBcEIsQ0FBeUIsQ0FBQyxPQUExQixDQUFrQyxJQUFsQyxFQUF3QyxNQUF4QztJQURaO1dBRUE7RUFOVTs7RUFRZCxPQUFPLENBQUMsZUFBUixHQUEwQixRQUFBLENBQUMsYUFBRCxDQUFBO0FBQ3RCLFFBQUEsZ0JBQUEsRUFBQTtJQUFBLFVBQUEsR0FBYSxFQUFFLENBQUMsWUFBSCxDQUFnQixhQUFoQixFQUErQixNQUEvQjtJQUNiLFVBQUEsR0FBYSxXQUFBLENBQVksVUFBWjtJQUViLGVBQUEsR0FBa0IsSUFBSSxDQUFDLE9BQUwsQ0FBYSxhQUFiO0lBQ2xCLGdCQUFBLEdBQW1CLEtBQUEsQ0FBTSxVQUFOO0lBRW5CLEVBQUUsQ0FBQyxTQUFILENBQWEsSUFBQSxHQUFPLGFBQVAsR0FBdUIsT0FBcEMsRUFBNkMsZ0JBQTdDO1dBQ0E7RUFSc0I7O0VBVTFCLE9BQU8sQ0FBQyxrQkFBUixHQUE2QixRQUFBLENBQUMsV0FBRCxDQUFBO0FBRXpCLFFBQUE7SUFBQSxnQkFBQSxHQUFtQixLQUFBLENBQU0sV0FBTjtXQUNuQixFQUFFLENBQUMsU0FBSCxDQUFhLHFCQUFiLEVBQW9DLGdCQUFwQztFQUh5QjtBQXhoQjdCIiwic291cmNlc0NvbnRlbnQiOlsic2VsZkNsb3NpbmdUYWdzID0gWydicicsICdpbWcnLCAnaW5wdXQnLCAnaHInLCAnbWV0YScsICdsaW5rJ11cbmhlYWRUYWdzID0gWydtZXRhJywgJ3RpdGxlJywgJ3N0eWxlJywgJ2NsYXNzJywgJ2xpbmsnXVxuXG5mb3JtYXRIdG1sID0gZmFsc2VcbmRlYnVnTW9kZSA9IGZhbHNlXG5cbmNocmlzUm9vdEZvbGRlciA9ICcnXG5cbmZzID0gcmVxdWlyZSAnZnMnXG5QYXRoID0gcmVxdWlyZSAncGF0aCdcbmNvZmZlZSA9IHJlcXVpcmUgJ2NvZmZlZS1zY3JpcHQnXG5cblxuXG4jIExJTkUgVFlQRVNcbnRhZ1R5cGUgICAgICAgICAgICAgPSAwICNpZiBubyBhbm90aGVyIHR5cGUgZm91bmQgYW5kIHRoaXMgaXMgbm90IGEgc2NyaXB0XG50YWdGaWx0ZXIgICAgICAgICAgID0gL15cXHMqW1xcd1xcLV0rICooKCArXFx3Kyk/KCAqKT8oICtpcyggKy4qKT8pPyk/JC9pXG5cbnRhZ1Byb3BlcnR5VHlwZSAgICAgPSAxICNpZiBmb3VuZCBwcm9wZXJ0eSBcInNvbWV0aGluZ1wiXG50YWdQcm9wZXJ0eUZpbHRlciAgID0gL15cXHMqW1xcd1xcLV0rICpcIi4qXCIvXG5cbnN0eWxlQ2xhc3NUeXBlICAgICAgPSAyICNpZiB0aGlzIGlzIHRhZyBhbmQgdGhlIHRhZyBpcyBzdHlsZVxuc3R5bGVDbGFzc0ZpbHRlciAgICA9IC9eXFxzKihzdHlsZXxjbGFzcylcXHMrW1xcdzpfLV0rL2lcblxuc3R5bGVQcm9wZXJ0eVR5cGUgICA9IDMgI2lmIGZvdW5kIHByb3BlcnR5OiBzb21ldGhpbmdcbnN0eWxlUHJvcGVydHlGaWx0ZXIgPSAvXlxccypbXlwiJyBdKyAqOiAqLiovaVxuXG5zdHJpbmdUeXBlICAgICAgICAgID0gNCAjaWYgZm91bmQgXCJzdHJpbmdcIlxuc3RyaW5nRmlsdGVyICAgICAgICA9IC9eXFxzKlwiLipcIi9pXG5cbnNjcmlwdFR5cGUgICAgICAgICAgPSA1ICNpZiBpdCBpcyB1bmRlciB0aGUgc2NyaXB0IHRhZ1xuXG52YXJpYWJsZVR5cGUgICAgICAgID0gNiAjIGlmIGZvdW5kIG5hbWUgPSBzb21ldGhpbmdcbnZhcmlhYmxlRmlsdGVyICAgICAgPSAvXlxccypcXHcrXFxzKj1cXHMqW1xcd1xcV10rL2lcblxuaGVhZFRhZ1R5cGUgICAgICAgICA9IDdcbmhlYWRUYWdGaWx0ZXIgICAgICAgPSAvXlxccyoobWV0YXx0aXRsZXxsaW5rfGJhc2UpL2lcblxubW9kdWxlVHlwZSAgICAgICAgICA9IDhcbm1vZHVsZUZpbHRlciAgICAgICAgPSAvXlxccyppbmNsdWRlXFxzKlwiLisuY2hyaXNcIi9pXG5cbmlnbm9yYWJsZVR5cGUgICAgICAgPSAtMlxuZW1wdHlGaWx0ZXIgICAgICAgICA9IC9eW1xcV1xcc19dKiQvXG5jb21tZW50RmlsdGVyICAgICAgID0gL15cXHMqIy9pXG5cblxuXG5cblxuY291bnRTcGFjZXMgPSAobCkgLT5cbiAgICB4ID0gMFxuICAgIGlmIGxbMF0gPT0gXCIgXCJcbiAgICAgICAgd2hpbGUgbFt4XSA9PSBcIiBcIlxuICAgICAgICAgICAgeCs9MVxuICAgIHhcblxuXG5cbmFuYWxpc2VUeXBlID0gKGwpIC0+XG4gICAgbG4gPSAtMVxuXG4gICAgbG4gPSBpZ25vcmFibGVUeXBlIGlmIGNvbW1lbnRGaWx0ZXIudGVzdCBsXG4gICAgbG4gPSBpZ25vcmFibGVUeXBlIGlmIGVtcHR5RmlsdGVyLnRlc3QgbFxuICAgIGxuID0gc3R5bGVQcm9wZXJ0eVR5cGUgaWYgc3R5bGVQcm9wZXJ0eUZpbHRlci50ZXN0IGxcbiAgICBsbiA9IHRhZ1R5cGUgaWYgdGFnRmlsdGVyLnRlc3QgbFxuICAgIGxuID0gaGVhZFRhZ1R5cGUgaWYgaGVhZFRhZ0ZpbHRlci50ZXN0IGxcbiAgICBsbiA9IHN0eWxlQ2xhc3NUeXBlIGlmIHN0eWxlQ2xhc3NGaWx0ZXIudGVzdCBsXG4gICAgbG4gPSB0YWdQcm9wZXJ0eVR5cGUgaWYgdGFnUHJvcGVydHlGaWx0ZXIudGVzdCBsXG4gICAgbG4gPSBzdHJpbmdUeXBlIGlmIHN0cmluZ0ZpbHRlci50ZXN0IGxcbiAgICBsbiA9IHZhcmlhYmxlVHlwZSBpZiB2YXJpYWJsZUZpbHRlci50ZXN0IGxcbiAgICBsbiA9IG1vZHVsZVR5cGUgaWYgbW9kdWxlRmlsdGVyLnRlc3QgbFxuICAgIGxuXG5cblxuZ2V0SGllcmFyY2h5ID0gKGxpbmVzKSAtPlxuICAgIGxpbmVMZXZlbHMgPSBbXVxuICAgIGxpbmVQYXJlbnRzPVtdXG5cbiAgICBsYXN0TGluZU9mTGV2ZWwgPSBbLTFdXG4gICAgY3VycmVudExldmVsID0gWzBdXG4gICAgY3VycmVudFJlYWxMZXZlbCA9IDBcblxuICAgIGZvciB4IGluIFswLi4ubGluZXMubGVuZ3RoXVxuICAgICAgICBuID0gY291bnRTcGFjZXMgbGluZXNbeF1cbiAgICAgICAgI2xpbmVzW3hdID0gbGluZXNbeF0uc2xpY2UobilcblxuICAgICAgICBpZiBuID4gY3VycmVudExldmVsW2N1cnJlbnRSZWFsTGV2ZWxdXG4gICAgICAgICAgICBsYXN0TGluZU9mTGV2ZWwucHVzaCB4IC0gMVxuICAgICAgICAgICAgY3VycmVudExldmVsLnB1c2ggblxuICAgICAgICAgICAgY3VycmVudFJlYWxMZXZlbCArPSAxXG5cbiAgICAgICAgd2hpbGUgbiA8IGN1cnJlbnRMZXZlbFtjdXJyZW50UmVhbExldmVsXVxuICAgICAgICAgICAgaWYgbiA8IGN1cnJlbnRMZXZlbFtjdXJyZW50UmVhbExldmVsXVxuICAgICAgICAgICAgICAgIGN1cnJlbnRMZXZlbC5wb3AoKVxuICAgICAgICAgICAgICAgIGxhc3RMaW5lT2ZMZXZlbC5wb3AoKVxuICAgICAgICAgICAgICAgIGN1cnJlbnRSZWFsTGV2ZWwgLT0gMVxuXG4gICAgICAgIGxpbmVMZXZlbHMucHVzaCBjdXJyZW50UmVhbExldmVsXG4gICAgICAgIGxpbmVQYXJlbnRzW3hdID0gbGFzdExpbmVPZkxldmVsW2xhc3RMaW5lT2ZMZXZlbC5sZW5ndGgtMV1cblxuICAgIGxpbmVQYXJlbnRzXG5cblxuZm9ybWF0VmFyaWFibGUgPSAobCkgLT5cbiAgICBleHBvcnRBcnJheSA9IFtdXG4gICAgdmFyQ29udGVudCA9ICcnXG5cbiAgICB2YXJOYW1lID0gbC5zcGxpdCgnPScpWzBdXG4gICAgdyA9IDBcbiAgICB3aGlsZSB2YXJOYW1lLnNwbGl0KCcgJylbd10gPT0gJydcbiAgICAgICAgdyArPSAxXG4gICAgdmFyTmFtZSA9IHZhck5hbWUuc3BsaXQoJyAnKVt3XVxuXG4gICAgYyA9IGwuc3BsaXQoJz0nKVxuICAgIGMgPSBjWzFdLnNwbGl0KCcgJylcbiAgICB3ID0gMFxuICAgIHdoaWxlIHcgPCBjLmxlbmd0aFxuICAgICAgICBpZiBjW3ddICE9ICcnXG4gICAgICAgICAgICB2YXJDb250ZW50ICs9ICcgJyBpZiB2YXJDb250ZW50ICE9ICcnXG4gICAgICAgICAgICB2YXJDb250ZW50ICs9IGNbd11cbiAgICAgICAgdyArPSAxXG5cbiAgICBleHBvcnRBcnJheVswXSA9IHZhck5hbWVcbiAgICBleHBvcnRBcnJheVsxXSA9IHZhckNvbnRlbnRcbiAgICBleHBvcnRBcnJheVxuXG5cbnByb2Nlc3NWYXJpYWJsZXMgPSAobHMsIHRwcykgLT5cbiAgICB2YXJOYW1lcyAgICA9IFtdXG4gICAgdmFyQ29udGVudHMgPSBbXVxuXG4gICAgZm9yIHggaW4gWzAuLi5scy5sZW5ndGhdXG4gICAgICAgIGlmIHRwc1t4XSA9PSB2YXJpYWJsZVR5cGVcbiAgICAgICAgICAgIHZhck5hbWVzLnB1c2ggZm9ybWF0VmFyaWFibGUobHNbeF0pWzBdXG4gICAgICAgICAgICB2YXJDb250ZW50cy5wdXNoIGZvcm1hdFZhcmlhYmxlKGxzW3hdKVsxXVxuXG4gICAgICAgIGlmIHRwc1t4XSA9PSBzdHlsZVByb3BlcnR5VHlwZVxuICAgICAgICAgICAgZm9yIGYgaW4gWzAuLi52YXJOYW1lcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgbHNbeF0gPSBsc1t4XS5yZXBsYWNlKHZhck5hbWVzW2ZdLCB2YXJDb250ZW50c1tmXSkucmVwbGFjZSh2YXJOYW1lc1tmXSwgdmFyQ29udGVudHNbZl0pLnJlcGxhY2UodmFyTmFtZXNbZl0sIHZhckNvbnRlbnRzW2ZdKS5yZXBsYWNlKHZhck5hbWVzW2ZdLCB2YXJDb250ZW50c1tmXSlcblxuICAgIGxzXG5cblxuICMgTW9kdWxlIHByb2Nlc3NpbmcgZnVuY3Rpb25zXG5cbmxvYWRDaHJpc01vZHVsZSA9IChtb2R1bGVGaWxlUGF0aCkgLT5cbiAgICBtc2xzID0gZnMucmVhZEZpbGVTeW5jKCcuLycgKyBtb2R1bGVGaWxlUGF0aCwgJ3V0ZjgnKVxuICAgIG1zbHMgPSBjbGVhblVwRmlsZShtc2xzKVxuICAgIG1scyA9IG1zbHMuc3BsaXQgJ1xcbidcbiAgICBtbHNcblxucHJvY2Vzc01vZHVsZXMgPSAobHMsIGYpIC0+XG4gICAgcmVzdWx0THMgPSBbXVxuICAgIG1vZHVsZUxldmVsRmlsdGVyID0gL15cXHMqL1xuXG4gICAgZm9yIHggaW4gWzAuLi5scy5sZW5ndGhdXG4gICAgICAgIGlmIG1vZHVsZUZpbHRlci50ZXN0IGxzW3hdXG4gICAgICAgICAgICBjaHJpc01vZHVsZVBhdGggPSBsc1t4XS5zcGxpdCgnXCInKVsxXVxuICAgICAgICAgICAgbW9kdWxlTGluZXMgPSBsb2FkQ2hyaXNNb2R1bGUoZiArICcvJyArIGNocmlzTW9kdWxlUGF0aClcblxuICAgICAgICAgICAgbW9kdWxlTGV2ZWwgPSBtb2R1bGVMZXZlbEZpbHRlci5leGVjKGxzW3hdKVxuICAgICAgICAgICAgbW9kdWxlTGluZXNbbF0gPSBtb2R1bGVMZXZlbCArIG1vZHVsZUxpbmVzW2xdIGZvciBsIGluIFswLi4ubW9kdWxlTGluZXMubGVuZ3RoXVxuXG4gICAgICAgICAgICBtb2R1bGVMaW5lcyA9IHByb2Nlc3NNb2R1bGVzKG1vZHVsZUxpbmVzLCBwYXRoLmRpcm5hbWUoZiArICcvJyArIGNocmlzTW9kdWxlUGF0aCkpXG4gICAgICAgICAgICByZXN1bHRMcyA9IHJlc3VsdExzLmNvbmNhdChtb2R1bGVMaW5lcylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0THMucHVzaCBsc1t4XVxuXG4gICAgcmVzdWx0THNcblxuXG5cbiMgTUFJTiBDSFJJU1RJTkUgRlVOQ1RJT05cblxuZXhwb3J0cy5jaHJpc3Rpbml6ZSA9IChzdCkgLT5cbiAgICBzaHRtbChzdClcblxuICAgIFxuY2xlYW5VcExpbmVzID0gKGxzKSAtPlxuICAgIG5ld0xzID0gW11cbiAgICBcbiAgICBmb3IgeCBpbiBbMC4uLmxzLmxlbmd0aF1cbiAgICAgICAgaWYgYW5hbGlzZVR5cGUobHNbeF0pICE9IC0yXG4gICAgICAgICAgICAgICAgbmV3THMucHVzaCBsc1t4XVxuICAgICAgICAgIFxuICAgIG5ld0xzXG5cblxuc2h0bWwgPSAoc291cmNlVGV4dCkgLT5cblxuICAgIGxpbmVzICAgICAgID0gW11cbiAgICByZXN1bHRMaW5lcyA9IFtdXG4gICAgbGluZVR5cGVzICAgPSBbXVxuICAgIGxpbmVQYXJlbnRzID0gW11cbiAgICBsaW5lTnVtcyAgICA9IFtdXG4gICAgcmVzdWx0VGV4dCAgPSAnJ1xuXG4gICAgbGluZXMgPSBzb3VyY2VUZXh0LnNwbGl0ICdcXG4nXG5cbiAgICBsaW5lcyA9IHByb2Nlc3NNb2R1bGVzKGxpbmVzLCBjaHJpc1Jvb3RGb2xkZXIpXG5cblxuICAgIGxpbmVzID0gY2xlYW5VcExpbmVzKGxpbmVzLCBsaW5lVHlwZXMpXG5cbiAgICAjIHByb2Nlc3MgdHlwZXMgYW5kIGZpbHRlciBsaW5lc1xuICAgIGZvciB4IGluIFswLi4ubGluZXMubGVuZ3RoXVxuICAgICAgICB0ID0gYW5hbGlzZVR5cGUobGluZXNbeF0pXG4gICAgICAgIGxpbmVUeXBlcy5wdXNoIHRcbiAgICAgICAgcmVzdWx0TGluZXMucHVzaCBsaW5lc1t4XVxuXG4gICAgcmVzdWx0TGluZXMgPSBwcm9jZXNzVmFyaWFibGVzKHJlc3VsdExpbmVzLCBsaW5lVHlwZXMpXG5cbiAgICBsaW5lUGFyZW50cyA9IGdldEhpZXJhcmNoeSByZXN1bHRMaW5lc1xuXG4gICAgbGluZU51bXMucHVzaCh4KSBmb3IgeCBpbiBbMC4uLnJlc3VsdExpbmVzLmxlbmd0aF1cblxuICAgIHJlc3VsdFRleHQgKz0gXCIjI3tsaW5lTnVtc1t4XX0gI3tsaW5lVHlwZXNbeF19ICN7cmVzdWx0TGluZXNbeF19IC0gI3tsaW5lUGFyZW50c1t4XX1cXG5cIiBmb3IgeCBpbiBbMC4uLnJlc3VsdExpbmVzLmxlbmd0aF0gaWYgZGVidWdNb2RlXG5cbiAgICByZXN1bHRUZXh0ICs9ICc8IWRvY3R5cGUgaHRtbD4nXG4gICAgcmVzdWx0VGV4dCArPSAnPGh0bWw+J1xuICAgIHJlc3VsdFRleHQgKz0gcHJvY2Vzc0hlYWQocmVzdWx0TGluZXMsIGxpbmVQYXJlbnRzLCBsaW5lVHlwZXMsIGxpbmVOdW1zKVxuICAgIHJlc3VsdFRleHQgKz0gcHJvY2Vzc1RhZyhcImJvZHlcIiwgLTEsIHJlc3VsdExpbmVzLCBsaW5lUGFyZW50cywgbGluZVR5cGVzLCBsaW5lTnVtcylcbiAgICByZXN1bHRUZXh0ICs9ICc8L2h0bWw+J1xuXG4gICAgcmVzdWx0VGV4dFxuXG5cblxuXG5mb3JtYXRUYWcgPSAobCkgLT5cblxuICAgICMgZ2V0IHJpZCBvZiBpbmRlbnRhdGlvblxuICAgIHNwID0gY291bnRTcGFjZXMgbFxuICAgIGwgPSBsLnNsaWNlKHNwKVxuXG4gICAgdGFnQXJyYXkgPSBsLnNwbGl0ICcgJ1xuICAgIGNsZWFuVGFnID0gW11cblxuICAgIGZvciB4IGluIFswLi4udGFnQXJyYXkubGVuZ3RoXVxuICAgICAgICBjbGVhblRhZy5wdXNoIHRhZ0FycmF5W3hdIGlmIHRhZ0FycmF5W3hdICE9IFwiXCJcblxuICAgIGZpbmFsVGFnID0gJzwnICsgY2xlYW5UYWdbMF1cblxuICAgIGlmIGNsZWFuVGFnLmxlbmd0aCA+IDFcbiAgICAgICAgaWYgY2xlYW5UYWdbMV0gIT0gJ2lzJ1xuICAgICAgICAgICAgZmluYWxUYWcgKz0gJyBpZD1cIicgKyBjbGVhblRhZ1sxXSArICdcIidcblxuICAgICAgICB4ID0gMFxuICAgICAgICB0YWdDbGFzcyA9IFwiXCJcbiAgICAgICAgY29sbGVjdENsYXNzZXMgPSBmYWxzZVxuICAgICAgICB3aGlsZSB4IDwgY2xlYW5UYWcubGVuZ3RoXG4gICAgICAgICAgICBpZiBjb2xsZWN0Q2xhc3Nlc1xuICAgICAgICAgICAgICAgIHRhZ0NsYXNzICs9IGNsZWFuVGFnW3hdXG4gICAgICAgICAgICAgICAgdGFnQ2xhc3MgKz0gJyAnIGlmIHggPCBjbGVhblRhZy5sZW5ndGggLSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgY2xlYW5UYWdbeF0gPT0gJ2lzJ1xuICAgICAgICAgICAgICAgICAgICBjb2xsZWN0Q2xhc3NlcyA9IHRydWUgaWYgeCA8IGNsZWFuVGFnLmxlbmd0aCAtIDFcbiAgICAgICAgICAgIHggKz0gMVxuICAgICAgICBmaW5hbFRhZyArPSAnIGNsYXNzPVwiJyArIHRhZ0NsYXNzICsgJ1wiJyBpZiB0YWdDbGFzcy5sZW5ndGggPiAwXG5cbiAgICBmaW5hbFRhZ1xuXG5cblxuXG5mb3JtYXRQcm9wZXJ0eSA9IChsKSAtPlxuXG4gICAgIyBnZXQgcmlkIG9mIGluZGVudGF0aW9uXG4gICAgc3AgPSBjb3VudFNwYWNlcyBsXG4gICAgbCA9IGwuc2xpY2Uoc3ApXG5cbiAgICBjbGVhblByb3BlcnR5ID0gJz1cIidcbiAgICBwcm9wZXJ0eU5hbWVTZWFyY2ggPSAvXltcXHdcXC1dKyggKik/XCIvaVxuICAgIHQgPSBsLm1hdGNoKHByb3BlcnR5TmFtZVNlYXJjaClbMF1cbiAgICB0ID0gdC5zcGxpdChcIiBcIilbMF1cbiAgICB0ID0gdC5zcGxpdCgnXCInKVswXVxuICAgIGNsZWFuUHJvcGVydHkgPSB0ICsgY2xlYW5Qcm9wZXJ0eVxuICAgIHQgPSBsLnNwbGl0KCdcIicpWzFdXG4gICAgY2xlYW5Qcm9wZXJ0eSArPSB0ICsgJ1wiJ1xuICAgIGNsZWFuUHJvcGVydHlcblxuZm9ybWF0U3R5bGVQcm9wZXJ0eSA9IChsKSAtPlxuXG4gICAgIyBnZXQgcmlkIG9mIGluZGVudGF0aW9uXG4gICAgc3AgPSBjb3VudFNwYWNlcyBsXG4gICAgbCA9IGwuc2xpY2Uoc3ApXG5cbiAgICBkaXZpZGVyUG9zaXRpb24gPSBsLmluZGV4T2YgJzonXG4gICAgcHJvcGVydHlBZnRlciA9IGwuc2xpY2UgKGRpdmlkZXJQb3NpdGlvbiArIDEpXG4gICAgY2xlYW5TdHlsZVByb3BlcnR5ID0gbC5zcGxpdCgnOicpWzBdICsgJzonXG4gICAgYWZ0ZXJBcnJheSA9IHByb3BlcnR5QWZ0ZXIuc3BsaXQgJyAnXG5cbiAgICBmb3IgeCBpbiBbMC4uLmFmdGVyQXJyYXkubGVuZ3RoXVxuICAgICAgICBpZiBhZnRlckFycmF5W3hdICE9ICcnXG4gICAgICAgICAgICBjbGVhblN0eWxlUHJvcGVydHkgKz0gYWZ0ZXJBcnJheVt4XVxuICAgICAgICAgICAgY2xlYW5TdHlsZVByb3BlcnR5ICs9ICcgJyBpZiB4IDwgYWZ0ZXJBcnJheS5sZW5ndGggLSAxXG5cbiAgICBjbGVhblN0eWxlUHJvcGVydHlcblxuXG5mb3JtYXRTdHJpbmcgPSAobCkgLT5cbiAgICBjbGVhblN0cmluZyA9IGwuc3BsaXQoJ1wiJylbMV1cbiAgICBjbGVhblN0cmluZ1xuXG5jaGVja1NlbGZDbG9zaW5nID0gKHQpIC0+XG4gICAgc2VsZkNsb3NpbmcgPSB0cnVlXG4gICAgZm9yIGkgaW4gWzAuLnNlbGZDbG9zaW5nVGFncy5sZW5ndGhdXG4gICAgICAgIHNlbGZDbG9zaW5nID0gZmFsc2UgaWYgdCA9PSBzZWxmQ2xvc2luZ1RhZ3NbaV1cbiAgICBzZWxmQ2xvc2luZ1xuXG5cblxuXG5cbiMgdGhlIG1haW4gcmVjdXJzaXZlIG1hY2hpbmVzIVxuXG5wcm9jZXNzSGVhZCA9IChsaW5lcyA9IFtdLCBsaW5rcywgdHlwZXMsIGxpbmVOdW1zKSAtPlxuICAgIGZpbmFsSGVhZCA9ICc8aGVhZD4nXG5cbiAgICAjIGNvbGxlY3QgY2hpbGRyZW5cblxuICAgIGNoaWxkU3R5bGVOdW1zID0gW11cbiAgICBjaGlsZFRhZ051bXMgPSBbXVxuXG4gICAgaWYgbGluZXMubGVuZ3RoID4gMFxuICAgICAgICBmb3IgeCBpbiBbMC4uLmxpbmVzLmxlbmd0aF1cbiAgICAgICAgICAgIGlmIGxpbmtzW3hdID09IC0xXG4gICAgICAgICAgICAgICAgY2hpbGRTdHlsZU51bXMucHVzaCB4IGlmIHR5cGVzW3hdID09IHN0eWxlQ2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgY2hpbGRUYWdOdW1zLnB1c2ggeCBpZiB0eXBlc1t4XSA9PSBoZWFkVGFnVHlwZVxuXG5cbiAgICAjIHByb2Nlc3MgaGVhZCBzdHlsZXNcblxuICAgIGlmIGNoaWxkU3R5bGVOdW1zLmxlbmd0aCA+IDBcbiAgICAgICAgZmluYWxIZWFkICs9ICc8c3R5bGU+J1xuICAgICAgICB4ID0gMFxuICAgICAgICB3aGlsZSB4IDwgY2hpbGRTdHlsZU51bXMubGVuZ3RoXG4gICAgICAgICAgICBmaW5hbEhlYWQgKz0gJ1xcbicgaWYgZm9ybWF0SHRtbFxuXG4gICAgICAgICAgICBzdHlsZUNoaWxkTGluZXMgPSBbXVxuICAgICAgICAgICAgc3R5bGVDaGlsZFR5cGVzID0gW11cblxuICAgICAgICAgICAgcCA9IGNoaWxkU3R5bGVOdW1zW3hdICsgMVxuICAgICAgICAgICAgd2hpbGUgbGlua3NbcF0gPj0gY2hpbGRTdHlsZU51bXNbeF1cbiAgICAgICAgICAgICAgICBpZiBwIDwgbGluZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlQ2hpbGRMaW5lcy5wdXNoIGxpbmVzW3BdXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlQ2hpbGRUeXBlcy5wdXNoIHR5cGVzW3BdXG4gICAgICAgICAgICAgICAgICAgIHAgKz0gMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGZpbmFsSGVhZCArPSBwcm9jZXNzU3R5bGVUYWcobGluZXNbY2hpbGRTdHlsZU51bXNbeF1dLCBzdHlsZUNoaWxkTGluZXMsIHN0eWxlQ2hpbGRUeXBlcylcblxuICAgICAgICAgICAgeCArPSAxXG5cbiAgICAgICAgZmluYWxIZWFkICs9ICc8L3N0eWxlPidcblxuICAgICMgcHJvY2VzcyBoZWFkIHRhZ3NcblxuICAgIGlmIGNoaWxkVGFnTnVtcy5sZW5ndGggPiAwXG4gICAgICAgIHggPSAwXG4gICAgICAgIHdoaWxlIHggPCBjaGlsZFRhZ051bXMubGVuZ3RoXG4gICAgICAgICAgICBmaW5hbEhlYWQgKz0gJ1xcbicgaWYgZm9ybWF0SHRtbFxuICAgICAgICAgICAgdGFnQ2hpbGRMaW5lcyA9IFtdXG4gICAgICAgICAgICB0YWdDaGlsZExpbmtzID0gW11cbiAgICAgICAgICAgIHRhZ0NoaWxkVHlwZXMgPSBbXVxuICAgICAgICAgICAgdGFnQ2hpbGRMaW5lTnVtcyA9IFtdXG5cbiAgICAgICAgICAgIHAgPSBjaGlsZFRhZ051bXNbeF0gKyAxXG4gICAgICAgICAgICB3aGlsZSBsaW5rc1twXSA+PSBjaGlsZFRhZ051bXNbeF1cbiAgICAgICAgICAgICAgICBpZiBwIDwgbGluZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGluZXMucHVzaCBsaW5lc1twXVxuICAgICAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmtzLnB1c2ggbGlua3NbcF1cbiAgICAgICAgICAgICAgICAgICAgdGFnQ2hpbGRUeXBlcy5wdXNoIHR5cGVzW3BdXG4gICAgICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGluZU51bXMucHVzaCBsaW5lTnVtc1twXVxuICAgICAgICAgICAgICAgICAgICBwICs9IDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB0biA9IGNoaWxkVGFnTnVtc1t4XVxuICAgICAgICAgICAgZmluYWxIZWFkICs9IHByb2Nlc3NUYWcobGluZXNbdG5dLCBsaW5lTnVtc1t0bl0sIHRhZ0NoaWxkTGluZXMsIHRhZ0NoaWxkTGlua3MsIHRhZ0NoaWxkVHlwZXMsIHRhZ0NoaWxkTGluZU51bXMpXG5cbiAgICAgICAgICAgIHggKz0gMVxuXG5cbiAgICBmaW5hbEhlYWQgKz0gJzwvaGVhZD4nXG4gICAgZmluYWxIZWFkXG5cblxuXG5cblxuXG5wcm9jZXNzU3R5bGVUYWcgPSAodGFnTGluZSwgY2hpbGRMaW5lcyA9IFtdLCBjaGlsZFR5cGVzKSAtPlxuICAgIGZpbmFsVGFnID0gJyMnXG4gICAgZmluYWxUYWcgPSAnLicgaWYgdGFnTGluZS5zcGxpdCgnICcpWzBdID09ICdjbGFzcydcblxuICAgIGlmIHRhZ0xpbmUuc3BsaXQoJyAnKVsxXSA9PSAndGFnJyAjaWYgc3R5bGluZyB0YWcsIG5vdCB0aGUgaWQgb3IgY2xhc3NcbiAgICAgICAgZmluYWxUYWcgPSAnJ1xuICAgICAgICBmaW5hbFRhZyArPSB0YWdMaW5lLnNwbGl0KCcgJylbMl0gKyAneydcbiAgICBlbHNlXG4gICAgICAgIGZpbmFsVGFnICs9IHRhZ0xpbmUuc3BsaXQoJyAnKVsxXSArICd7J1xuXG4gICAgZm9yIHggaW4gWzAuLi5jaGlsZExpbmVzLmxlbmd0aF1cbiAgICAgICAgZmluYWxUYWcgKz0gZm9ybWF0U3R5bGVQcm9wZXJ0eShjaGlsZExpbmVzW3hdKSArICc7JyBpZiBjaGlsZFR5cGVzW3hdID09IHN0eWxlUHJvcGVydHlUeXBlXG5cbiAgICBmaW5hbFRhZyArPSAnfSdcbiAgICBmaW5hbFRhZ1xuXG5cblxuXG5cblxucHJvY2Vzc1RhZyA9ICh0YWdMaW5lLCBzZWxmTGluaywgY2hpbGRMaW5lcyA9IFtdLCBjaGlsZExpbmtzLCBjaGlsZFR5cGVzLCBsaW5lTnVtcykgLT5cbiAgICAjIGdldCByaWQgb2YgaW5kZW50YXRpb25cbiAgICBzcCA9IGNvdW50U3BhY2VzIHRhZ0xpbmVcbiAgICB0YWdMaW5lID0gdGFnTGluZS5zbGljZShzcClcblxuICAgIHRhZ05hbWUgPSB0YWdMaW5lLnNwbGl0KCcgJylbMF1cbiAgICBmaW5hbFRhZyA9IGZvcm1hdFRhZyB0YWdMaW5lXG4gICAgY2xvc2FibGUgPSBjaGVja1NlbGZDbG9zaW5nKHRhZ0xpbmUuc3BsaXQoJyAnKVswXSlcblxuICAgICMgY29sbGVjdCBhbGwgdGhlIGNoaWxkcmVuXG4gICAgdGFnUHJvcGVydGllcyA9IFtdXG4gICAgdGFnU3R5bGVzICAgICA9IFtdXG4gICAgY2hpbGRzICAgICAgICA9IFtdXG4gICAgY2hpbGRTdHJpbmdzICA9IFtdXG4gICAgdmFyaWFibGVzICAgICA9IFtdXG5cbiAgICBpZiBjaGlsZExpbmVzLmxlbmd0aCA+IDBcbiAgICAgICAgZm9yIHggaW4gWzAuLi5jaGlsZExpbmVzLmxlbmd0aF1cbiAgICAgICAgICAgIGlmIGNoaWxkTGlua3NbeF0gPT0gc2VsZkxpbmtcbiAgICAgICAgICAgICAgICB0YWdQcm9wZXJ0aWVzLnB1c2ggY2hpbGRMaW5lc1t4XSBpZiBjaGlsZFR5cGVzW3hdID09IHRhZ1Byb3BlcnR5VHlwZVxuICAgICAgICAgICAgICAgIHRhZ1N0eWxlcy5wdXNoIGNoaWxkTGluZXNbeF0gICAgIGlmIGNoaWxkVHlwZXNbeF0gPT0gc3R5bGVQcm9wZXJ0eVR5cGVcbiAgICAgICAgICAgICAgICBjaGlsZHMucHVzaCB4ICAgICAgICAgICAgICAgICAgICBpZiBjaGlsZFR5cGVzW3hdID09IHRhZ1R5cGVcbiAgICAgICAgICAgICAgICBjaGlsZHMucHVzaCB4ICAgICAgICAgICAgICAgICAgICBpZiBjaGlsZFR5cGVzW3hdID09IHN0cmluZ1R5cGVcbiAgICAgICAgICAgICAgICBjaGlsZHMucHVzaCB4ICAgICAgICAgICAgICAgICAgICBpZiBjaGlsZFR5cGVzW3hdID09IHN0eWxlQ2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgY2hpbGRzLnB1c2ggeCAgICAgICAgICAgICAgICAgICAgaWYgY2hpbGRUeXBlc1t4XSA9PSB2YXJpYWJsZVR5cGVcblxuICAgICMgYWRkIHRhZyBwcm9wZXJ0aWVzXG4gICAgaWYgdGFnUHJvcGVydGllcy5sZW5ndGggPiAwXG4gICAgICAgIGZvciB4IGluIFswLi4udGFnUHJvcGVydGllcy5sZW5ndGhdXG4gICAgICAgICAgICB0YWdQcm9wZXJ0aWVzW3hdID0gZm9ybWF0UHJvcGVydHkgdGFnUHJvcGVydGllc1t4XVxuICAgICAgICAgICAgZmluYWxUYWcgKz0gJyAnICsgdGFnUHJvcGVydGllc1t4XVxuXG4gICAgIyBhZGQgdGFnIHN0eWxlXG4gICAgaWYgdGFnU3R5bGVzLmxlbmd0aCA+IDBcbiAgICAgICAgZmluYWxUYWcgKz0gJyBzdHlsZT1cIidcbiAgICAgICAgZm9yIHggaW4gWzAuLi50YWdTdHlsZXMubGVuZ3RoXVxuICAgICAgICAgICAgZmluYWxUYWcgKz0gZm9ybWF0U3R5bGVQcm9wZXJ0eSh0YWdTdHlsZXNbeF0pICsgJzsnXG4gICAgICAgIGZpbmFsVGFnICs9ICdcIidcblxuICAgIGZpbmFsVGFnICs9ICc+J1xuXG4gICAgIy4uLiBwcm9jZXNzIGNoaWxkIHRhZ3MsIHN0cmluZ3MsIHN0eWxlVGFnc1xuICAgIHggPSAwXG4gICAgaWYgdGFnTmFtZSE9J2NvZmZlZXNjcmlwdCdcbiAgICAgICAgd2hpbGUgeCA8IGNoaWxkcy5sZW5ndGhcbiAgICAgICAgICAgIHRsID0gY2hpbGRzW3hdXG5cbiAgICAgICAgICAgIGlmIGNoaWxkVHlwZXNbdGxdID09IHN0cmluZ1R5cGVcbiAgICAgICAgICAgICAgICBmaW5hbFRhZyArPSBmb3JtYXRTdHJpbmcoY2hpbGRMaW5lc1t0bF0pXG5cbiAgICAgICAgICAgIGlmIGNoaWxkVHlwZXNbdGxdID09IHN0eWxlQ2xhc3NUeXBlXG4gICAgICAgICAgICAgICAgaWYgY2hpbGRMaW5rc1t0bF0gIT0gLTFcbiAgICAgICAgICAgICAgICAgICAgZmluYWxUYWcgKz0gJ1xcbicgaWYgZm9ybWF0SHRtbFxuICAgICAgICAgICAgICAgICAgICBzdHlsZUNoaWxkTGluZXMgPSBbXVxuICAgICAgICAgICAgICAgICAgICBzdHlsZUNoaWxkVHlwZXMgPSBbXVxuXG4gICAgICAgICAgICAgICAgICAgIHAgPSB0bCArIDFcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgY2hpbGRMaW5rc1twXSA+PSB0bFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgcCA8IGNoaWxkTGluZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVDaGlsZExpbmVzLnB1c2ggY2hpbGRMaW5lc1twXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlQ2hpbGRUeXBlcy5wdXNoIGNoaWxkVHlwZXNbcF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICBmaW5hbFRhZyArPSBwcm9jZXNzU3R5bGVUYWcoY2hpbGRMaW5lc1t0bF0sIHN0eWxlQ2hpbGRMaW5lcywgc3R5bGVDaGlsZFR5cGVzKVxuXG4gICAgICAgICAgICBpZiBjaGlsZFR5cGVzW3RsXSA9PSB0YWdUeXBlXG4gICAgICAgICAgICAgICAgZmluYWxUYWcgKz0gJ1xcbicgaWYgZm9ybWF0SHRtbFxuICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGluZXMgID0gW11cbiAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmtzICA9IFtdXG4gICAgICAgICAgICAgICAgdGFnQ2hpbGRUeXBlcyAgPSBbXVxuICAgICAgICAgICAgICAgIHRhZ0NoaWxkTGluZU51bXMgPSBbXVxuXG4gICAgICAgICAgICAgICAgcCA9IHRsICsgMVxuICAgICAgICAgICAgICAgIHdoaWxlIGNoaWxkTGlua3NbcF0gPj0gdGxcbiAgICAgICAgICAgICAgICAgICAgaWYgcCA8IGNoaWxkTGluZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmVzLnB1c2ggY2hpbGRMaW5lc1twXVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnQ2hpbGRMaW5rcy5wdXNoIGNoaWxkTGlua3NbcF1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ0NoaWxkVHlwZXMucHVzaCBjaGlsZFR5cGVzW3BdXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdDaGlsZExpbmVOdW1zLnB1c2ggbGluZU51bXNbcF1cbiAgICAgICAgICAgICAgICAgICAgICAgIHAgKz0gMVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG5cbiAgICAgICAgICAgICAgICBmaW5hbFRhZyArPSBwcm9jZXNzVGFnKGNoaWxkTGluZXNbdGxdLCBsaW5lTnVtc1t0bF0sIHRhZ0NoaWxkTGluZXMsIHRhZ0NoaWxkTGlua3MsIHRhZ0NoaWxkVHlwZXMsIHRhZ0NoaWxkTGluZU51bXMpXG5cbiAgICAgICAgICAgIHggKz0gMVxuICAgIGVsc2VcbiAgICAgICAgc2NyaXB0QmVmb3JlID0gJydcbiAgICAgICAgZm9yIGwgaW4gWzAuLi5jaGlsZExpbmVzLmxlbmd0aF1cbiAgICAgICAgICAgIHNjcmlwdEJlZm9yZSArPSBjaGlsZExpbmVzW2xdICsgJ1xcbidcblxuICAgICAgICBmaW5hbFRhZyA9ICc8c2NyaXB0PidcbiAgICAgICAgdGFnTmFtZSA9ICdzY3JpcHQnXG4gICAgICAgIGZpbmFsVGFnICs9IGNvZmZlZS5jb21waWxlKHNjcmlwdEJlZm9yZSlcblxuICAgICMgY2xvc2UgdGFnIGFuZCByZXR1cm4gZmluYWwgc3RyaW5nXG4gICAgaWYgY2xvc2FibGVcbiAgICAgICAgZmluYWxUYWcgKz0gJzwvJyArIHRhZ05hbWUgKyAnPidcblxuICAgIGZpbmFsVGFnICs9ICdcXG4nIGlmIGZvcm1hdEh0bWxcblxuICAgIGZpbmFsVGFnXG5cblxuY2xlYW5VcEZpbGUgPSAoc0ZpbGUpIC0+XG4gICAgY2FycmlhZ2VUYWJUZXN0ID0gL1tcXHJcXHRdL2dtaVxuXG4gICAgckZpbGUgPSBzRmlsZVxuICAgIHdoaWxlIGNhcnJpYWdlVGFiVGVzdC50ZXN0KHJGaWxlKVxuICAgICAgICByRmlsZSA9IHJGaWxlLnJlcGxhY2UoJ1xccicsICdcXG4nKS5yZXBsYWNlKCdcXHQnLCAnICAgICcpXG4gICAgckZpbGVcblxuZXhwb3J0cy5jaHJpc3Rpbml6ZUZpbGUgPSAoY2hyaXNGaWxlUGF0aCkgLT5cbiAgICBzb3VyY2VGaWxlID0gZnMucmVhZEZpbGVTeW5jKGNocmlzRmlsZVBhdGgsICd1dGY4JylcbiAgICBzb3VyY2VGaWxlID0gY2xlYW5VcEZpbGUoc291cmNlRmlsZSlcblxuICAgIGNocmlzUm9vdEZvbGRlciA9IFBhdGguZGlybmFtZSBjaHJpc0ZpbGVQYXRoXG4gICAgY2hyaXN0aW5pemVkRmlsZSA9IHNodG1sKHNvdXJjZUZpbGUpXG5cbiAgICBmcy53cml0ZUZpbGUoJy4vJyArIGNocmlzRmlsZVBhdGggKyAnLmh0bWwnLCBjaHJpc3Rpbml6ZWRGaWxlKVxuICAgIGNocmlzdGluaXplZEZpbGVcblxuZXhwb3J0cy5jaHJpc3Rpbml6ZUFuZFNhdmUgPSAoY2hyaXNTb3VyY2UpIC0+XG5cbiAgICBjaHJpc3Rpbml6ZWRGaWxlID0gc2h0bWwoY2hyaXNTb3VyY2UpXG4gICAgZnMud3JpdGVGaWxlKCcuL2NocmlzUHJldmlldy5odG1sJywgY2hyaXN0aW5pemVkRmlsZSlcbiJdfQ==
//# sourceURL=coffeescript