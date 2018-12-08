@shtml = (sourceText) ->
    chrisFile =
        source : []
        inProgressLines : 
            level : -1
            children : []

        final : ''
    
    chrisFile.inProgressLines.parent = chrisFile.inProgressLines
    
    linePrototype =
        source : ''
        final : ''
        type : -1
        parent : {}
        children : []
        number : -1
        indent : 0
    

    chrisFile.source = sourceText.split '\n'

    processHierarchy chrisFile

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

        if lineLevel >= currentParent.level
            if lineLevel > currentParent.level
                currentParent = currentChild

            newLine =
                source : file.source[line]
                children : []
                parent : currentParent
                level : lineLevel

            currentParent.children.push newLine
            currentChild = newLine

        else
            while lineLevel <= currentParent.level
                console.log lineLevel + ":" + currentParent.level
                currentParent = currentParent.parent
                console.log "new parent level:" + currentParent.level

            newLine =
                source : file.source[line]
                children : []
                parent : currentParent
                level : lineLevel

            currentParent.children.push newLine
            currentChild = newLine

    console.log file


