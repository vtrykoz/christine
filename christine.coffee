selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link']
headTags = ['meta', 'title', 'style', 'class', 'link']

formatHtml = false
debugMode = false

chrisRootFolder = ''

fs = require 'fs'
Path = require 'path'
coffee = require 'coffee-script'



# LINE TYPES
tagType             = 0 #if no another type found and this is not a script
tagFilter           = /^\s*[\w\-]+ *(( +\w+)?( *)?( +is( +.*)?)?)?$/i

tagPropertyType     = 1 #if found property "something"
tagPropertyFilter   = /^\s*[\w\-]+ *".*"/

styleClassType      = 2 #if this is tag and the tag is style
styleClassFilter    = /^\s*(style|class)\s+[\w:_-]+/i

stylePropertyType   = 3 #if found property: something
stylePropertyFilter = /^\s*[^"' ]+ *: *.*/i

stringType          = 4 #if found "string"
stringFilter        = /^\s*".*"/i

scriptType          = 5 #if it is under the script tag

variableType        = 6 # if found name = something
variableFilter      = /^\s*\w+\s*=\s*[\w\W]+/i

headTagType         = 7
headTagFilter       = /^\s*(meta|title|link|base)/i

moduleType          = 8
moduleFilter        = /^\s*include\s*".+.chris"/i

ignorableType       = -2
emptyFilter         = /^[\W\s_]*$/
commentFilter       = /^\s*#/i





countSpaces = (l) ->
    x = 0
    if l[0] == " "
        while l[x] == " "
            x+=1
    x



analiseType = (l) ->
    ln = -1

    ln = ignorableType if commentFilter.test l
    ln = ignorableType if emptyFilter.test l
    ln = stylePropertyType if stylePropertyFilter.test l
    ln = tagType if tagFilter.test l
    ln = headTagType if headTagFilter.test l
    ln = styleClassType if styleClassFilter.test l
    ln = tagPropertyType if tagPropertyFilter.test l
    ln = stringType if stringFilter.test l
    ln = variableType if variableFilter.test l
    ln = moduleType if moduleFilter.test l
    ln


getHierarchy = (lines) ->
    lineLevels = []
    lineParents=[]

    lastLineOfLevel = [-1]
    currentLevel = [0]
    currentRealLevel = 0

    for x in [0...lines.length]
        n = countSpaces lines[x]
        #lines[x] = lines[x].slice(n)

        if n > currentLevel[currentRealLevel]
            lastLineOfLevel.push x - 1
            currentLevel.push n
            currentRealLevel += 1

        while n < currentLevel[currentRealLevel]
            if n < currentLevel[currentRealLevel]
                currentLevel.pop()
                lastLineOfLevel.pop()
                currentRealLevel -= 1

        lineLevels.push currentRealLevel
        lineParents[x] = lastLineOfLevel[lastLineOfLevel.length-1]

    lineParents


formatVariable = (l) ->
    exportArray = []
    varContent = ''

    varName = l.split('=')[0]
    w = 0
    while varName.split(' ')[w] == ''
        w += 1
    varName = varName.split(' ')[w]

    c = l.split('=')
    c = c[1].split(' ')
    w = 0
    while w < c.length
        if c[w] != ''
            varContent += ' ' if varContent != ''
            varContent += c[w]
        w += 1

    exportArray[0] = varName
    exportArray[1] = varContent
    exportArray


processVariables = (ls, tps) ->
    varNames    = []
    varContents = []

    for x in [0...ls.length]
        if tps[x] == variableType
            varNames.push formatVariable(ls[x])[0]
            varContents.push formatVariable(ls[x])[1]

        if tps[x] == stylePropertyType
            for f in [0...varNames.length]
                ls[x] = ls[x].replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f]).replace(varNames[f], varContents[f])

    ls


 # Module processing functions

loadChrisModule = (moduleFilePath) ->
    msls = fs.readFileSync(moduleFilePath, 'utf8')
    msls = cleanUpFile(msls)
    mls = msls.split '\n'
    mls

processModules = (ls, f) ->
    resultLs = []
    moduleLevelFilter = /^\s*/

    for x in [0...ls.length]
        if moduleFilter.test ls[x]
            chrisModulePath = ls[x].split('"')[1]
            moduleLines = loadChrisModule(f + '/' + chrisModulePath)

            moduleLevel = moduleLevelFilter.exec(ls[x])
            moduleLines[l] = moduleLevel + moduleLines[l] for l in [0...moduleLines.length]

            moduleLines = processModules(moduleLines, Path.dirname(f + '/' + chrisModulePath))
            resultLs = resultLs.concat(moduleLines)
        else
            resultLs.push ls[x]

    resultLs



# MAIN CHRISTINE FUNCTION

exports.christinize = (st) ->
    shtml(st)

    
cleanUpLines = (ls) ->
    newLs = []
    
    for x in [0...ls.length]
        if analiseType(ls[x]) != -2
                newLs.push ls[x]
          
    newLs


shtml = (sourceText) ->

    lines       = []
    resultLines = []
    lineTypes   = []
    lineParents = []
    lineNums    = []
    resultText  = ''

    lines = sourceText.split '\n'

    lines = processModules(lines, chrisRootFolder)


    lines = cleanUpLines(lines, lineTypes)

    # process types and filter lines
    for x in [0...lines.length]
        t = analiseType(lines[x])
        lineTypes.push t
        resultLines.push lines[x]

    resultLines = processVariables(resultLines, lineTypes)

    lineParents = getHierarchy resultLines

    lineNums.push(x) for x in [0...resultLines.length]

    resultText += "##{lineNums[x]} #{lineTypes[x]} #{resultLines[x]} - #{lineParents[x]}\n" for x in [0...resultLines.length] if debugMode

    resultText += '<!doctype html>'
    resultText += '<html>'
    resultText += processHead(resultLines, lineParents, lineTypes, lineNums)
    resultText += processTag("body", -1, resultLines, lineParents, lineTypes, lineNums)
    resultText += '</html>'

    resultText




formatTag = (l) ->

    # get rid of indentation
    sp = countSpaces l
    l = l.slice(sp)

    tagArray = l.split ' '
    cleanTag = []

    for x in [0...tagArray.length]
        cleanTag.push tagArray[x] if tagArray[x] != ""

    finalTag = '<' + cleanTag[0]

    if cleanTag.length > 1
        if cleanTag[1] != 'is'
            finalTag += ' id="' + cleanTag[1] + '"'

        x = 0
        tagClass = ""
        collectClasses = false
        while x < cleanTag.length
            if collectClasses
                tagClass += cleanTag[x]
                tagClass += ' ' if x < cleanTag.length - 1
            else
                if cleanTag[x] == 'is'
                    collectClasses = true if x < cleanTag.length - 1
            x += 1
        finalTag += ' class="' + tagClass + '"' if tagClass.length > 0

    finalTag




formatProperty = (l) ->

    # get rid of indentation
    sp = countSpaces l
    l = l.slice(sp)

    cleanProperty = '="'
    propertyNameSearch = /^[\w\-]+( *)?"/i
    t = l.match(propertyNameSearch)[0]
    t = t.split(" ")[0]
    t = t.split('"')[0]
    cleanProperty = t + cleanProperty
    t = l.split('"')[1]
    cleanProperty += t + '"'
    cleanProperty

formatStyleProperty = (l) ->

    # get rid of indentation
    sp = countSpaces l
    l = l.slice(sp)

    dividerPosition = l.indexOf ':'
    propertyAfter = l.slice (dividerPosition + 1)
    cleanStyleProperty = l.split(':')[0] + ':'
    afterArray = propertyAfter.split ' '

    for x in [0...afterArray.length]
        if afterArray[x] != ''
            cleanStyleProperty += afterArray[x]
            cleanStyleProperty += ' ' if x < afterArray.length - 1

    cleanStyleProperty


formatString = (l) ->
    cleanString = l.split('"')[1]
    cleanString

checkSelfClosing = (t) ->
    selfClosing = true
    for i in [0..selfClosingTags.length]
        selfClosing = false if t == selfClosingTags[i]
    selfClosing





# the main recursive machines!

processHead = (lines = [], links, types, lineNums) ->
    finalHead = '<head>'

    # collect children

    childStyleNums = []
    childTagNums = []

    if lines.length > 0
        for x in [0...lines.length]
            if links[x] == -1
                childStyleNums.push x if types[x] == styleClassType
                childTagNums.push x if types[x] == headTagType


    # process head styles

    if childStyleNums.length > 0
        finalHead += '<style>'
        x = 0
        while x < childStyleNums.length
            finalHead += '\n' if formatHtml

            styleChildLines = []
            styleChildTypes = []

            p = childStyleNums[x] + 1
            while links[p] >= childStyleNums[x]
                if p < lines.length
                    styleChildLines.push lines[p]
                    styleChildTypes.push types[p]
                    p += 1
                else
                    break
            finalHead += processStyleTag(lines[childStyleNums[x]], styleChildLines, styleChildTypes)

            x += 1

        finalHead += '</style>'

    # process head tags

    if childTagNums.length > 0
        x = 0
        while x < childTagNums.length
            finalHead += '\n' if formatHtml
            tagChildLines = []
            tagChildLinks = []
            tagChildTypes = []
            tagChildLineNums = []

            p = childTagNums[x] + 1
            while links[p] >= childTagNums[x]
                if p < lines.length
                    tagChildLines.push lines[p]
                    tagChildLinks.push links[p]
                    tagChildTypes.push types[p]
                    tagChildLineNums.push lineNums[p]
                    p += 1
                else
                    break
            tn = childTagNums[x]
            finalHead += processTag(lines[tn], lineNums[tn], tagChildLines, tagChildLinks, tagChildTypes, tagChildLineNums)

            x += 1


    finalHead += '</head>'
    finalHead






processStyleTag = (tagLine, childLines = [], childTypes) ->
    finalTag = '#'
    finalTag = '.' if tagLine.split(' ')[0] == 'class'

    if tagLine.split(' ')[1] == 'tag' #if styling tag, not the id or class
        finalTag = ''
        finalTag += tagLine.split(' ')[2] + '{'
    else
        finalTag += tagLine.split(' ')[1] + '{'

    for x in [0...childLines.length]
        finalTag += formatStyleProperty(childLines[x]) + ';' if childTypes[x] == stylePropertyType

    finalTag += '}'
    finalTag






processTag = (tagLine, selfLink, childLines = [], childLinks, childTypes, lineNums) ->
    # get rid of indentation
    sp = countSpaces tagLine
    tagLine = tagLine.slice(sp)

    tagName = tagLine.split(' ')[0]
    finalTag = formatTag tagLine
    closable = checkSelfClosing(tagLine.split(' ')[0])

    # collect all the children
    tagProperties = []
    tagStyles     = []
    childs        = []
    childStrings  = []
    variables     = []

    if childLines.length > 0
        for x in [0...childLines.length]
            if childLinks[x] == selfLink
                tagProperties.push childLines[x] if childTypes[x] == tagPropertyType
                tagStyles.push childLines[x]     if childTypes[x] == stylePropertyType
                childs.push x                    if childTypes[x] == tagType
                childs.push x                    if childTypes[x] == stringType
                childs.push x                    if childTypes[x] == styleClassType
                childs.push x                    if childTypes[x] == variableType

    # add tag properties
    if tagProperties.length > 0
        for x in [0...tagProperties.length]
            tagProperties[x] = formatProperty tagProperties[x]
            finalTag += ' ' + tagProperties[x]

    # add tag style
    if tagStyles.length > 0
        finalTag += ' style="'
        for x in [0...tagStyles.length]
            finalTag += formatStyleProperty(tagStyles[x]) + ';'
        finalTag += '"'

    finalTag += '>'

    #... process child tags, strings, styleTags
    x = 0
    if tagName!='coffeescript'
        while x < childs.length
            tl = childs[x]

            if childTypes[tl] == stringType
                finalTag += formatString(childLines[tl])

            if childTypes[tl] == styleClassType
                if childLinks[tl] != -1
                    finalTag += '\n' if formatHtml
                    styleChildLines = []
                    styleChildTypes = []

                    p = tl + 1
                    while childLinks[p] >= tl
                        if p < childLines.length
                            styleChildLines.push childLines[p]
                            styleChildTypes.push childTypes[p]
                            p += 1
                        else
                            break
                    finalTag += processStyleTag(childLines[tl], styleChildLines, styleChildTypes)

            if childTypes[tl] == tagType
                finalTag += '\n' if formatHtml
                tagChildLines  = []
                tagChildLinks  = []
                tagChildTypes  = []
                tagChildLineNums = []

                p = tl + 1
                while childLinks[p] >= tl
                    if p < childLines.length
                        tagChildLines.push childLines[p]
                        tagChildLinks.push childLinks[p]
                        tagChildTypes.push childTypes[p]
                        tagChildLineNums.push lineNums[p]
                        p += 1
                    else
                        break


                finalTag += processTag(childLines[tl], lineNums[tl], tagChildLines, tagChildLinks, tagChildTypes, tagChildLineNums)

            x += 1
    else
        scriptBefore = ''
        for l in [0...childLines.length]
            scriptBefore += childLines[l] + '\n'

        finalTag = '<script>'
        tagName = 'script'
        finalTag += coffee.compile(scriptBefore)

    # close tag and return final string
    if closable
        finalTag += '</' + tagName + '>'

    finalTag += '\n' if formatHtml

    finalTag


cleanUpFile = (sFile) ->
    carriageTabTest = /[\r\t]/gmi

    rFile = sFile
    while carriageTabTest.test(rFile)
        rFile = rFile.replace('\r', '\n').replace('\t', '    ')
    rFile

exports.christinizeFile = (chrisFilePath) ->
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8')
    sourceFile = cleanUpFile(sourceFile)

    chrisRootFolder = Path.dirname chrisFilePath
    christinizedFile = shtml(sourceFile)

    fs.writeFile(chrisFilePath + '.html', christinizedFile, -> console.log 'ok')
    christinizedFile


exports.christinizeAndSave = (chrisSource) ->
    christinizedFile = shtml(chrisSource)
    fs.writeFile('./chrisPreview.html', christinizedFile)


exports.christinizeFileWithoutSaving = (chrisFilePath) ->
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8')
    sourceFile = cleanUpFile(sourceFile)

    chrisRootFolder = Path.dirname chrisFilePath
    shtml(sourceFile)