fs = require 'fs'
Path = require 'path'
coffee = require 'coffeescript'



# LINE TYPES

selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link']
headTags = ['meta', 'title', 'style', 'class', 'link', 'base']

tagType             = 0 #if found tag#id.class
tagFilter           = /^[\ \t]*\w+\ *([.#][\w-_]+\ *)*$/i

tagAttributeType     = 1 #if found attribut = "value"
                         # need to replace double quote and ampersand after
                         # to &#34; and &#38
tagAttributeFilter   = /^\s*[\w\-]+ *".*"/

styleClassType      = 2 #if this is tag and the tag is style
styleClassFilter    = /^\s*(style|class)\s+[\w:_-]+/i

stylePropertyType   = 3 #if found property: something
stylePropertyFilter = /^\s*[^"' ]+ *: *.*/i

stringType          = 4 #if found "string"
stringFilter        = /^\s*".*"/i

scriptTagFilter     = /^\s*(script|coffeescript|javascript|coffee)/i
coffeescriptTagFilter = /^\s*(coffeescript|coffee)/i
scriptType          = 5 #if it is under the script tag
scriptTagType       = 9

variableType        = 6 # if found name = something
variableFilter      = /^\s*\w+\s*=\s*[\w\W]+/i

headTagType         = 7
headTagFilter       = /^\s*(meta|title|link|base)/i

moduleType          = 8
moduleFilter        = /^\s*include\s*".+.chris"/i

ignorableType       = -2
emptyFilter         = /^[\W\s_]*$/
commentFilter       = /^\s*#/i








exports.christinize =  (sourceText,
                        options = {
                            indent : 4
                            modulesDirectory : './'
                        }) ->
    chrisFile =
        source : []
        inProgressLines : 
            source : 'html'
            type : tagType
            level : -1
            attributes : []
            styles : []
            children : []
            indent : options.indent

        final : ''
    

    chrisFile.inProgressLines.parent = chrisFile.inProgressLines

    chrisFile.source = cleanupLines sourceText.split '\n'

    chrisFile.source = processModules chrisFile.source, options.modulesDirectory
    processHierarchy chrisFile
    processTypes chrisFile.inProgressLines
    sortByTypes chrisFile.inProgressLines
    sortByBodyHead chrisFile
    finaliseTag chrisFile.inProgressLines

    
    doctype = '<!doctype html>'
    doctype += '\n' if options.indent

    chrisFile.final = doctype + chrisFile.inProgressLines.final

    chrisFile.final




# processVariables



createNewFile = (sourceText,
                 options = {
                    indent : 4
                    modulesDirectory : './'
                }) ->
    
    console.log options
    
    chrisFile =
        source : cleanupLines sourceText.split '\n'
        inProgressLines : 
            source : 'html'
            type : tagType
            level : -1
            attributes : []
            styles : []
            children : []
            indent : options.indent
        
        options : options
        final : ''




loadChrisModule = (moduleFilePath) ->
    msls = fs.readFileSync(moduleFilePath, 'utf8')
    msls = cleanupLines(msls.split '\n')
    msls

processModules = (ls, f) ->
    resultLs = new Array
    moduleLevelFilter = /^\s*/

    for x in [0...ls.length]
        if moduleFilter.test ls[x]
            chrisModulePath = ls[x].split('"')[1]
            moduleLines = loadChrisModule "#{f}/#{chrisModulePath}" 

            moduleLevel = moduleLevelFilter.exec(ls[x])
            for l in [0...moduleLines.length]
                moduleLines[l] = moduleLevel + moduleLines[l] 

            moduleLines = processModules moduleLines,
                                         path.dirname "#{f}/#{chrisModulePath}"
            
            resultLs = resultLs.concat moduleLines
        else
            resultLs.push ls[x]

    resultLs
            


sortByBodyHead = (file) ->
    headTag =
        source : 'head'
        type : tagType
        parent: file.inProgressLines
        level : -1
        attributes : []
        styles : []
        children : []
    
    headTag.children.push
        source : 'style'
        type : headTagType
        parent: headTag
        level : 0
        attributes : []
        styles : []
        children : []


    bodyTag =
        source : 'body'
        type : tagType
        parent: file.inProgressLines
        level : -1
        attributes : []
        styles : []
        children : []
    

    for tag in file.inProgressLines.children
        addedToHead = no

        for headTagTemplate in headTags
            if tag.source == headTagTemplate
                addedToHead = yes
                tag.parent = headTag
                headTag.children.push tag

        if not addedToHead
            if tag.type == styleClassType
                tag.parent = styleTag
                styleTag.children.push tag
            else
                tag.parent = bodyTag
                bodyTag.children.push tag

    bodyTag.styles = file.inProgressLines.styles
    bodyTag.attributes = file.inProgressLines.attributes

    file.inProgressLines.styles = new Array
    file.inProgressLines.attributes = new Array
    file.inProgressLines.children = new Array

    file.inProgressLines.children.push headTag
    file.inProgressLines.children.push bodyTag

    formatLevels file.inProgressLines
    indentLines file.inProgressLines



indentLines = (tag) ->
    for child in tag.children
        child.indentation = child.level * tag.indent
        child.indent = tag.indent

        if child.children
            indentLines child




cleanupLines = (sourceLines) ->
    newSourceLines = new Array

    for line in sourceLines
        if analiseType(line) != -2
            newSourceLines.push line
    
    newSourceLines


analiseType = (line) ->
    lineType = -1

    lineType = ignorableType if commentFilter.test line
    lineType = ignorableType if emptyFilter.test line
    lineType = stylePropertyType if stylePropertyFilter.test line
    if tagFilter.test line
        lineType = tagType 
        if scriptTagFilter.test line
            lineType = scriptTagType

    lineType = headTagType if headTagFilter.test line
    lineType = styleClassType if styleClassFilter.test line
    lineType = tagAttributeType if tagAttributeFilter.test line
    lineType = stringType if stringFilter.test line
    lineType = variableType if variableFilter.test line
    lineType = moduleType if moduleFilter.test line
    
    lineType




countSpaces = (line) ->
    spaces = 0
    if line[0] == ' '
        while line[spaces] == ' '
            spaces += 1
    
    spaces






processHierarchy = (file) ->
    currentParent = file.inProgressLines
    currentChild = file.inProgressLines

    for line in [0...file.source.length]
        lineLevel = countSpaces file.source[line]

        if lineLevel > currentParent.level
            if lineLevel > currentChild.level
               currentParent = currentChild

            newLine =
                source : file.source[line].slice lineLevel
                children : []
                parent : currentParent
                level : lineLevel
                attributes : []
                styles : []

            currentParent.children.push newLine
            currentChild = newLine

        else
            while lineLevel <= currentParent.level
                currentParent = currentParent.parent

            newLine =
                source : file.source[line].slice lineLevel
                children : []
                parent : currentParent
                level : lineLevel
                attributes : []
                styles : []

            currentParent.children.push newLine
            currentChild = newLine







processTypes = (line) ->
    for line in line.children
        if line.source
            line.type = analiseType line.source
        else
            line.type = -2
        
        if line.children.length > 0
            processTypes line






sortByTypes = (lines) ->
    # extract the styles, attributes and strings to their parents

    for line in lines.children
        if line.type == scriptTagType
            typeAllScripts line

    lastChild = lines.children.length - 1

    for line in [lastChild..0]
        if lines.children[line].children.length > 0
            sortByTypes lines.children[line]

        if lines.children[line].type == tagAttributeType
            if !lines.children[line].parent.attributes
                lines.children[line].parent.attributes = new Array
            
            lines.children[line].parent.attributes.push lines.children[line].source
            lines.children[line].parent.children.splice line , 1

            continue
        
        if lines.children[line].type == stylePropertyType
            if !lines.children[line].parent.styles
                lines.children[line].parent.styles = new Array
            
            lines.children[line].parent.styles.push lines.children[line].source
            lines.children[line].parent.children.splice line , 1

            continue






typeAllScripts = (scriptLine) ->
    if scriptLine.children.length > 0
        for codeLine in scriptLine.children
            codeLine.type = scriptType
            codeLine.final = codeLine.source
            typeAllScripts(codeLine) if codeLine.children.length > 0





finaliseTag = (line) ->
    addSpaces = ''
    if line.indent > 0
        addSpaces += ' ' for i in [0...line.indent]

    if line.type == styleClassType
        finaliseStyle line

    if line.type is tagType or 
       line.type is scriptTagType or 
       line.type is headTagType

        coffeeScript = false
        formatTag line

        if line.type == scriptTagType
            if coffeescriptTagFilter.test line.source
                line.source = 'script'
                coffeeScript = true

        line.final = '<' + line.source

        if line.styles.length > 0
            lineStyle = 'style "'

            formatTagStyles line

            for style in line.styles
                lineStyle += style + ';'

            lineStyle += '"'
            line.attributes.push lineStyle
        

        formatAttributes line
        

        if line.attributes.length > 0
            line.final += ' '
            for property in line.attributes
                line.final += property + ' '
        
            line.final = line.final.slice 0, -1
        line.final += '>'
        line.final += '\n' if line.indent > 0


        if line.children.length > 0
            formatStrings line

            if line.type == scriptTagType
                line.indent = 4

            formatScripts line

            for child in line.children
                finaliseTag child
            
            linesOfChildren = ''

            for child in line.children
                newFinal = ''
                childLines = child.final.split '\n'
                
                for l in childLines
                    if l.length > 0
                        l = addSpaces + l
                        newFinal += l + '\n'
                
                newFinal += '\n' if line.indent > 0
                
                newFinal = newFinal.slice 0, -1
                
                child.final = newFinal
                linesOfChildren += newFinal

            if coffeeScript
                linesOfChildren = coffee.compile linesOfChildren
            
            line.final += linesOfChildren
            
        
        if not line.selfClosing
            line.final += '</' + line.source + '>'
            #line.final += '\n' if line.indent > 0
    



finaliseStyle = (styleTag) ->
    addSpaces = ''
    if styleTag.indent > 0
        addSpaces += ' ' for i in [0...styleTag.indent]

    finalTag = '#'

    tagArray = styleTag.source.split ' '

    finalTag = '.' if tagArray[0] == 'class'

    if tagArray[1] == 'tag'
        finalTag = ''
        finalTag += tagArray[2]
    else
        finalTag += tagArray[1]

    finalTag += '{'
    
    formatTagStyles styleTag

    for style in styleTag.styles
        if styleTag.indent > 0
            finalTag += '\n'
            finalTag += addSpaces

        finalTag += style
    
    if styleTag.indent > 0
        finalTag += '\n'

    finalTag += '}'
    styleTag.final = finalTag




    
formatTag = (tag) ->
    tagDetailsFilter = /^[\ \t]*(?<tag>\w+)\ *(?<attributes>([.#][\w-_]+\ *)+)?$/g
    tagIdFilter = /#(?<id>\w+)/
    tagClassFilter = /\.(?<class>[\w-_]+)/g
    
    tagDetails = tagDetailsFilter.exec tag.source
    tag.source = tagDetails.groups.tag

    tagIdFound = tagIdFilter.exec tagDetails.groups.attributes
    if tagIdFound?
        tag.attributes.push "id \"#{tagIdFound.groups.id}\""

    tagClassFound = tagClassFilter.exec tagDetails.groups.attributes
    if tagClassFound?
        allClasses = ""
        while tagClassFound?
            allClasses += tagClassFound.groups.class + " "
            tagClassFound = tagClassFilter.exec tagDetails.groups.attributes
    
        tag.attributes.push "class \"#{allClasses.slice 0, allClasses.length - 1}\""

    ###
    tagArray = tag.source.split /\s+/
    tag.source = tagArray[0]

    tag.selfClosing = false
    for selfClosingTag in selfClosingTags
        if tag.source == selfClosingTag
            tag.selfClosing = true

    tagArray.splice(0,1)

    if tagArray.length > 0
        if tagArray[0] != 'is'
            tag.attributes.push 'id "' + tagArray[0] + '"'
            tagArray.splice(0,1)
        
        if tagArray[0] == 'is'
            tagArray.splice(0,1)
            tagClasses = 'class "'
            for tagClass in tagArray
                tagClasses += tagClass + ' '
            
            tagClasses = tagClasses.slice 0, -1
            tagClasses += '"'

            tag.attributes.push tagClasses###

    tag.final = ''
    tag


formatAttributes = (tag) ->
    if tag.attributes.length > 0
        newattributes = new Array

        for property in tag.attributes
            newProperty = '='

            propertyNameSearch = /^[\w\-]+( *)?"/i
            propertyName = property.match(propertyNameSearch)[0]
            propertyName = propertyName.split(" ")[0]
            propertyName = propertyName.split('"')[0]

            newProperty = propertyName + newProperty

            propertyDetailsSearch = /\".*\"/
            propertyDetails = property.match(propertyDetailsSearch)[0]
            newProperty += propertyDetails

            newattributes.push newProperty

        tag.attributes = newattributes


formatStrings = (tag) ->
    
    for child in tag.children

        if child.type == stringType
            fullStringSearch = /\".*\"/
            cleanString = child.source.match(fullStringSearch)[0]
            cleanString = cleanString.slice 1, -1
            child.final = cleanString
            child.final += '\n' if child.indent > 0 + "\n"




formatScripts = (tag) ->
    indentLines tag

    for child in tag.children
        addSpaces = ''

        if child.indent > 0
            addSpaces += ' ' for i in [0...child.indent]
        
        if child.type == scriptType

            if child.children.length > 0
                child.final += '\n'
                formatScripts child

                for scriptChildLine in child.children
                    scriptChildSliced = scriptChildLine.final.split '\n'
                    scriptChildSliced.pop()
                    newScriptChildFinal = ''
                    for i in scriptChildSliced
                        newScriptChildFinal += addSpaces + i + '\n'
                    scriptChildLine.final = newScriptChildFinal

                    child.final += scriptChildLine.final
                child.final = child.final.slice 0, -1
                
            child.final += '\n'




formatTagStyles = (tag) ->
    for style in tag.styles
        dividerPosition = style.indexOf ':'
        propertyAfter = style.slice (dividerPosition + 1)
        cleanStyleProperty = style.split(':')[0] + ':'
        afterArray = propertyAfter.split ' '

        for x in [0...afterArray.length]
            if afterArray[x] != ''
                cleanStyleProperty += afterArray[x]
                cleanStyleProperty += ' ' if x < afterArray.length - 1

        style = cleanStyleProperty


formatLevels = (tag) ->
    for child in tag.children
        child.level = tag.level + 1

        if child.children
            formatLevels child


cleanUpFile = (sFile) ->
    carriageTabTest = /[\r\t]/gmi

    rFile = sFile
    while carriageTabTest.test(rFile)
        rFile = rFile.replace('\r', '\n').replace('\t', '    ')
    rFile



exports.christinizeFile = (chrisFilePath,
                 options = {
                    indent : 4
                    modulesDirectory : './'
                }) ->

    sourceFile = fs.readFileSync(chrisFilePath, 'utf8')
    sourceFile = cleanUpFile(sourceFile) 

    chrisRootFolder = Path.dirname chrisFilePath
    christinizedFile = @christinize(sourceFile, indent)

    #fs.writeFile('./' + chrisFilePath + '.html', christinizedFile)
    #christinizedFile

exports.christinizeAndSave = (chrisSource,
                 options = {
                    indent : 4
                    modulesDirectory : './'
                }) ->

    christinizedFile = @christinize(chrisSource, options)
    fs.writeFile('./chrisPreview.html', christinizedFile)


exports.buildFile = (chrisFilePath,
                 options = {
                    indent : 4
                    modulesDirectory : './'
                }) ->
    
    sourceFile = fs.readFileSync(chrisFilePath, 'utf8')
    sourceFile = cleanUpFile(sourceFile)

    chrisRootFolder = Path.dirname chrisFilePath
    christinizedFile = @christinize(sourceFile, indent)


    fs.writeFile('./' + chrisFilePath + '.html', christinizedFile)
    christinizedFile