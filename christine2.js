(function() {
  // LINE TYPES
  var analiseType, cleanupLines, commentFilter, countSpaces, emptyFilter, finaliseTag, headTagFilter, headTagType, ignorableType, moduleFilter, moduleType, processHierarchy, processTypes, scriptType, sortByTypes, stringFilter, stringType, styleClassFilter, styleClassType, stylePropertyFilter, stylePropertyType, tagFilter, tagPropertyFilter, tagPropertyType, tagType, variableFilter, variableType;

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
          type: 0
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
          level: lineLevel
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
          level: lineLevel
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
    var addSpaces, child, i, j, k, l, len, len1, len2, len3, m, n, property, ref, ref1, ref2, ref3, ref4, style;
    addSpaces = '';
    if (line.level > 0) {
      for (i = j = 0, ref = line.level; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
        addSpaces += ' ';
      }
    }
    if (line.type === 0) {
      line.final = addSpaces + '<' + line.source;
      if (line.styles) {
        line.final += ' style="';
        ref1 = line.styles;
        for (k = 0, len = ref1.length; k < len; k++) {
          style = ref1[k];
          line.final += style.source + ';';
        }
        line.final += '"';
      }
      if (line.properties) {
        ref2 = line.properties;
        for (l = 0, len1 = ref2.length; l < len1; l++) {
          property = ref2[l];
          line.final += property + ' ';
        }
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

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTtBQUFBLE1BQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsRUFBQSxnQkFBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxVQUFBLEVBQUEsZ0JBQUEsRUFBQSxjQUFBLEVBQUEsbUJBQUEsRUFBQSxpQkFBQSxFQUFBLFNBQUEsRUFBQSxpQkFBQSxFQUFBLGVBQUEsRUFBQSxPQUFBLEVBQUEsY0FBQSxFQUFBOztFQUVBLE9BQUEsR0FBc0IsRUFGdEI7O0VBR0EsU0FBQSxHQUFzQjs7RUFFdEIsZUFBQSxHQUFzQixFQUx0Qjs7RUFNQSxpQkFBQSxHQUFzQjs7RUFFdEIsY0FBQSxHQUFzQixFQVJ0Qjs7RUFTQSxnQkFBQSxHQUFzQjs7RUFFdEIsaUJBQUEsR0FBc0IsRUFYdEI7O0VBWUEsbUJBQUEsR0FBc0I7O0VBRXRCLFVBQUEsR0FBc0IsRUFkdEI7O0VBZUEsWUFBQSxHQUFzQjs7RUFFdEIsVUFBQSxHQUFzQixFQWpCdEI7O0VBbUJBLFlBQUEsR0FBc0IsRUFuQnRCOztFQW9CQSxjQUFBLEdBQXNCOztFQUV0QixXQUFBLEdBQXNCOztFQUN0QixhQUFBLEdBQXNCOztFQUV0QixVQUFBLEdBQXNCOztFQUN0QixZQUFBLEdBQXNCOztFQUV0QixhQUFBLEdBQXNCLENBQUM7O0VBQ3ZCLFdBQUEsR0FBc0I7O0VBQ3RCLGFBQUEsR0FBc0I7O0VBS3RCLElBQUMsQ0FBQSxTQUFELEdBQ0k7SUFBQSxXQUFBLEVBQWMsUUFBQSxDQUFDLFVBQUQsQ0FBQTtBQUNWLFVBQUE7TUFBQSxTQUFBLEdBQ0k7UUFBQSxNQUFBLEVBQVMsRUFBVDtRQUNBLGVBQUEsRUFD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SUFBSSxDQUFDLEtBQUwsSUFBYyxLQUFLLENBQUMsTUFBTixHQUFlO1FBRGpDO1FBR0EsSUFBSSxDQUFDLEtBQUwsSUFBYyxJQUxsQjs7TUFPQSxJQUFHLElBQUksQ0FBQyxVQUFSO0FBQ0k7UUFBQSxLQUFBLHdDQUFBOztVQUNJLElBQUksQ0FBQyxLQUFMLElBQWMsUUFBQSxHQUFXO1FBRDdCLENBREo7O01BSUEsSUFBSSxDQUFDLEtBQUwsSUFBYztNQUVkLElBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFkLEdBQXVCLENBQTFCO0FBQ0k7UUFBQSxLQUFBLHdDQUFBOztVQUNJLFdBQUEsQ0FBWSxLQUFaO1FBREo7QUFHQTtRQUFBLEtBQUEsd0NBQUE7O1VBQ0ksSUFBSSxDQUFDLEtBQUwsSUFBYyxLQUFLLENBQUM7UUFEeEIsQ0FKSjs7YUFPQSxJQUFJLENBQUMsS0FBTCxJQUFjLFNBQUEsR0FBWSxJQUFaLEdBQW1CLElBQUksQ0FBQyxNQUF4QixHQUFpQyxNQXZCbkQ7S0FBQSxNQUFBO2FBMEJJLElBQUksQ0FBQyxLQUFMLEdBQWEsU0FBQSxHQUFZLElBQUksQ0FBQyxNQUFqQixHQUEwQixLQTFCM0M7O0VBTlU7QUFoTGQiLCJzb3VyY2VzQ29udGVudCI6WyIjIExJTkUgVFlQRVNcblxudGFnVHlwZSAgICAgICAgICAgICA9IDAgI2lmIG5vIGFub3RoZXIgdHlwZSBmb3VuZCBhbmQgdGhpcyBpcyBub3QgYSBzY3JpcHRcbnRhZ0ZpbHRlciAgICAgICAgICAgPSAvXlxccypcXHcrICooKCArXFx3Kyk/KCAqKT8oICtpcyggKy4qKT8pPyk/JC9pXG5cbnRhZ1Byb3BlcnR5VHlwZSAgICAgPSAxICNpZiBmb3VuZCBwcm9wZXJ0eSBcInNvbWV0aGluZ1wiXG50YWdQcm9wZXJ0eUZpbHRlciAgID0gL15cXHMqW1xcd1xcLV0rICpcIi4qXCIvXG5cbnN0eWxlQ2xhc3NUeXBlICAgICAgPSAyICNpZiB0aGlzIGlzIHRhZyBhbmQgdGhlIHRhZyBpcyBzdHlsZVxuc3R5bGVDbGFzc0ZpbHRlciAgICA9IC9eXFxzKihzdHlsZXxjbGFzcylcXHMrW1xcdzpfLV0rL2lcblxuc3R5bGVQcm9wZXJ0eVR5cGUgICA9IDMgI2lmIGZvdW5kIHByb3BlcnR5OiBzb21ldGhpbmdcbnN0eWxlUHJvcGVydHlGaWx0ZXIgPSAvXlxccypbXlwiJyBdKyAqOiAqLiovaVxuXG5zdHJpbmdUeXBlICAgICAgICAgID0gNCAjaWYgZm91bmQgXCJzdHJpbmdcIlxuc3RyaW5nRmlsdGVyICAgICAgICA9IC9eXFxzKlwiLipcIi9pXG5cbnNjcmlwdFR5cGUgICAgICAgICAgPSA1ICNpZiBpdCBpcyB1bmRlciB0aGUgc2NyaXB0IHRhZ1xuXG52YXJpYWJsZVR5cGUgICAgICAgID0gNiAjIGlmIGZvdW5kIG5hbWUgPSBzb21ldGhpbmdcbnZhcmlhYmxlRmlsdGVyICAgICAgPSAvXlxccypcXHcrXFxzKj1cXHMqW1xcd1xcV10rL2lcblxuaGVhZFRhZ1R5cGUgICAgICAgICA9IDdcbmhlYWRUYWdGaWx0ZXIgICAgICAgPSAvXlxccyoobWV0YXx0aXRsZXxsaW5rfGJhc2UpL2lcblxubW9kdWxlVHlwZSAgICAgICAgICA9IDhcbm1vZHVsZUZpbHRlciAgICAgICAgPSAvXlxccyppbmNsdWRlXFxzKlwiLisuY2hyaXNcIi9pXG5cbmlnbm9yYWJsZVR5cGUgICAgICAgPSAtMlxuZW1wdHlGaWx0ZXIgICAgICAgICA9IC9eW1xcV1xcc19dKiQvXG5jb21tZW50RmlsdGVyICAgICAgID0gL15cXHMqIy9pXG5cblxuXG5cbkBjaHJpc3RpbmUgPVxuICAgIGNocmlzdGluaXplIDogKHNvdXJjZVRleHQpIC0+XG4gICAgICAgIGNocmlzRmlsZSA9XG4gICAgICAgICAgICBzb3VyY2UgOiBbXVxuICAgICAgICAgICAgaW5Qcm9ncmVzc0xpbmVzIDogXG4gICAgICAgICAgICAgICAgbGV2ZWwgOiAtMVxuICAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW11cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiAnaHRtbCdcbiAgICAgICAgICAgICAgICB0eXBlIDogMFxuXG4gICAgICAgICAgICBmaW5hbCA6ICcnXG4gICAgICAgIFxuICAgICAgICBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLnBhcmVudCA9IGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBjaHJpc0ZpbGUuc291cmNlID0gY2xlYW51cExpbmVzIHNvdXJjZVRleHQuc3BsaXQgJ1xcbidcblxuICAgICAgICBwcm9jZXNzSGllcmFyY2h5IGNocmlzRmlsZVxuICAgICAgICBwcm9jZXNzVHlwZXMgY2hyaXNGaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgICAgICBzb3J0QnlUeXBlcyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzXG4gICAgICAgIGZpbmFsaXNlVGFnIGNocmlzRmlsZS5pblByb2dyZXNzTGluZXNcblxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGUuaW5Qcm9ncmVzc0xpbmVzLmZpbmFsXG4gICAgICAgIGNocmlzRmlsZS5maW5hbCA9IGNocmlzRmlsZS5pblByb2dyZXNzTGluZXMuZmluYWxcblxuICAgICAgICBjb25zb2xlLmxvZyBjaHJpc0ZpbGVcblxuXG5jbGVhbnVwTGluZXMgPSAoc291cmNlTGluZXMpIC0+XG4gICAgbmV3U291cmNlTGluZXMgPSBuZXcgQXJyYXlcblxuICAgIGZvciBsaW5lIGluIHNvdXJjZUxpbmVzXG4gICAgICAgIGlmIGFuYWxpc2VUeXBlKGxpbmUpICE9IC0yXG4gICAgICAgICAgICBjb25zb2xlLmxvZyBcInB1c2hpbmcgbGluZTogXCIgKyBsaW5lXG4gICAgICAgICAgICBuZXdTb3VyY2VMaW5lcy5wdXNoIGxpbmVcbiAgICBcbiAgICBuZXdTb3VyY2VMaW5lc1xuXG5cbmFuYWxpc2VUeXBlID0gKGxpbmUpIC0+XG4gICAgbGluZVR5cGUgPSAtMVxuXG4gICAgbGluZVR5cGUgPSBpZ25vcmFibGVUeXBlIGlmIGNvbW1lbnRGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBpZ25vcmFibGVUeXBlIGlmIGVtcHR5RmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gc3R5bGVQcm9wZXJ0eVR5cGUgaWYgc3R5bGVQcm9wZXJ0eUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHRhZ1R5cGUgaWYgdGFnRmlsdGVyLnRlc3QgbGluZVxuICAgIGxpbmVUeXBlID0gaGVhZFRhZ1R5cGUgaWYgaGVhZFRhZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHN0eWxlQ2xhc3NUeXBlIGlmIHN0eWxlQ2xhc3NGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSB0YWdQcm9wZXJ0eVR5cGUgaWYgdGFnUHJvcGVydHlGaWx0ZXIudGVzdCBsaW5lXG4gICAgbGluZVR5cGUgPSBzdHJpbmdUeXBlIGlmIHN0cmluZ0ZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IHZhcmlhYmxlVHlwZSBpZiB2YXJpYWJsZUZpbHRlci50ZXN0IGxpbmVcbiAgICBsaW5lVHlwZSA9IG1vZHVsZVR5cGUgaWYgbW9kdWxlRmlsdGVyLnRlc3QgbGluZVxuICAgIFxuICAgIGxpbmVUeXBlXG5cblxuXG5cbmNvdW50U3BhY2VzID0gKGxpbmUpIC0+XG4gICAgc3BhY2VzID0gMFxuICAgIGlmIGxpbmVbMF0gPT0gJyAnXG4gICAgICAgIHdoaWxlIGxpbmVbc3BhY2VzXSA9PSAnICdcbiAgICAgICAgICAgIHNwYWNlcyArPSAxXG4gICAgXG4gICAgc3BhY2VzXG5cblxucHJvY2Vzc0hpZXJhcmNoeSA9IChmaWxlKSAtPlxuICAgIGN1cnJlbnRQYXJlbnQgPSBmaWxlLmluUHJvZ3Jlc3NMaW5lc1xuICAgIGN1cnJlbnRDaGlsZCA9IGZpbGUuaW5Qcm9ncmVzc0xpbmVzXG5cbiAgICBmb3IgbGluZSBpbiBbMC4uLmZpbGUuc291cmNlLmxlbmd0aF1cbiAgICAgICAgbGluZUxldmVsID0gY291bnRTcGFjZXMgZmlsZS5zb3VyY2VbbGluZV1cblxuICAgICAgICBpZiBsaW5lTGV2ZWwgPj0gY3VycmVudFBhcmVudC5sZXZlbFxuICAgICAgICAgICAgaWYgbGluZUxldmVsID4gY3VycmVudENoaWxkLmxldmVsXG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRDaGlsZFxuXG4gICAgICAgICAgICBuZXdMaW5lID1cbiAgICAgICAgICAgICAgICBzb3VyY2UgOiBmaWxlLnNvdXJjZVtsaW5lXS5zbGljZSBsaW5lTGV2ZWxcbiAgICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdXG4gICAgICAgICAgICAgICAgcGFyZW50IDogY3VycmVudFBhcmVudFxuICAgICAgICAgICAgICAgIGxldmVsIDogbGluZUxldmVsXG5cbiAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRyZW4ucHVzaCBuZXdMaW5lXG4gICAgICAgICAgICBjdXJyZW50Q2hpbGQgPSBuZXdMaW5lXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbGluZUxldmVsIDw9IGN1cnJlbnRQYXJlbnQubGV2ZWxcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudC5wYXJlbnRcblxuICAgICAgICAgICAgbmV3TGluZSA9XG4gICAgICAgICAgICAgICAgc291cmNlIDogZmlsZS5zb3VyY2VbbGluZV0uc2xpY2UgbGluZUxldmVsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXVxuICAgICAgICAgICAgICAgIHBhcmVudCA6IGN1cnJlbnRQYXJlbnRcbiAgICAgICAgICAgICAgICBsZXZlbCA6IGxpbmVMZXZlbFxuXG4gICAgICAgICAgICBjdXJyZW50UGFyZW50LmNoaWxkcmVuLnB1c2ggbmV3TGluZVxuICAgICAgICAgICAgY3VycmVudENoaWxkID0gbmV3TGluZVxuXG5cblxucHJvY2Vzc1R5cGVzID0gKGxpbmVzKSAtPlxuICAgIGZvciBsaW5lIGluIGxpbmVzLmNoaWxkcmVuXG4gICAgICAgIGlmIGxpbmUuc291cmNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSBhbmFsaXNlVHlwZSBsaW5lLnNvdXJjZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsaW5lLnR5cGUgPSAtMlxuICAgICAgICBcbiAgICAgICAgaWYgbGluZS5jaGlsZHJlbi5sZW5ndGggPiAwXG4gICAgICAgICAgICBwcm9jZXNzVHlwZXMgbGluZVxuXG5cblxuc29ydEJ5VHlwZXMgPSAobGluZXMpIC0+XG4gICAgIyBleHRyYWN0IHRoZSBzdHlsZXMsIHByb3BlcnRpZXMgYW5kIHN0cmluZ3MgdG8gdGhlaXIgcGFyZW50c1xuXG4gICAgbGFzdENoaWxkID0gbGluZXMuY2hpbGRyZW4ubGVuZ3RoIC0gMVxuXG4gICAgZm9yIGxpbmUgaW4gW2xhc3RDaGlsZC4uMF1cbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0uY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgc29ydEJ5VHlwZXMgbGluZXMuY2hpbGRyZW5bbGluZV1cblxuICAgICAgICBpZiBsaW5lcy5jaGlsZHJlbltsaW5lXS50eXBlID09IHRhZ1Byb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5wcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMgPSBuZXcgQXJyYXlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LnByb3BlcnRpZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICBcbiAgICAgICAgaWYgbGluZXMuY2hpbGRyZW5bbGluZV0udHlwZSA9PSBzdHlsZVByb3BlcnR5VHlwZVxuICAgICAgICAgICAgaWYgIWxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXNcbiAgICAgICAgICAgICAgICBsaW5lcy5jaGlsZHJlbltsaW5lXS5wYXJlbnQuc3R5bGVzID0gbmV3IEFycmF5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxpbmVzLmNoaWxkcmVuW2xpbmVdLnBhcmVudC5zdHlsZXMucHVzaCBsaW5lcy5jaGlsZHJlbltsaW5lXVxuICAgICAgICAgICAgbGluZXMuY2hpbGRyZW5bbGluZV0ucGFyZW50LmNoaWxkcmVuLnNwbGljZSBsaW5lICwgMVxuXG4gICAgICAgICAgICBjb250aW51ZVxuXG5cbmZpbmFsaXNlVGFnID0gKGxpbmUpIC0+XG4gICAgYWRkU3BhY2VzID0gJydcbiAgICBpZiBsaW5lLmxldmVsID4gMFxuICAgICAgICBhZGRTcGFjZXMgKz0gJyAnIGZvciBpIGluIFswLi5saW5lLmxldmVsXVxuXG5cbiAgICBpZiBsaW5lLnR5cGUgPT0gMFxuICAgICAgICBsaW5lLmZpbmFsID0gYWRkU3BhY2VzICsgJzwnICsgbGluZS5zb3VyY2VcblxuICAgICAgICBpZiBsaW5lLnN0eWxlc1xuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnIHN0eWxlPVwiJ1xuICAgICAgICAgICAgZm9yIHN0eWxlIGluIGxpbmUuc3R5bGVzXG4gICAgICAgICAgICAgICAgbGluZS5maW5hbCArPSBzdHlsZS5zb3VyY2UgKyAnOydcblxuICAgICAgICAgICAgbGluZS5maW5hbCArPSAnXCInXG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lLnByb3BlcnRpZXNcbiAgICAgICAgICAgIGZvciBwcm9wZXJ0eSBpbiBsaW5lLnByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBsaW5lLmZpbmFsICs9IHByb3BlcnR5ICsgJyAnXG4gICAgICAgIFxuICAgICAgICBsaW5lLmZpbmFsICs9ICc+XFxuJ1xuXG4gICAgICAgIGlmIGxpbmUuY2hpbGRyZW4ubGVuZ3RoID4gMFxuICAgICAgICAgICAgZm9yIGNoaWxkIGluIGxpbmUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmaW5hbGlzZVRhZyBjaGlsZFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgY2hpbGQgaW4gbGluZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGxpbmUuZmluYWwgKz0gY2hpbGQuZmluYWxcbiAgICAgICAgXG4gICAgICAgIGxpbmUuZmluYWwgKz0gYWRkU3BhY2VzICsgJzwvJyArIGxpbmUuc291cmNlICsgJz5cXG4nXG4gICAgXG4gICAgZWxzZVxuICAgICAgICBsaW5lLmZpbmFsID0gYWRkU3BhY2VzICsgbGluZS5zb3VyY2UgKyAnXFxuJ1xuICAgIFxuICAgIFxuIl19
//# sourceURL=coffeescript