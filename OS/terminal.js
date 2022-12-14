class ClickableCommandListItem {
    constructor(command, args) {
        this.command = command;
        this.arguments = args;
    }

    setTitle(title) {
        this.title = title;
        return this;
    }

    setText(text) {
        this.text = text;
        return this;
    }

    setTags(tags) {
        this.tags = tags;
        return this;
    }

    build() {
        let command = this.command;
        if (this.arguments != undefined && this.arguments.length > 0) {
            command += (' ' + this.arguments.at(0));
        }
        return `• ${clickableCommandRun(this.title, command )} ${this.text}${tags(this.tags)} ${argHint(this.arguments)}`;
    }
}

function splitTextIntoLinesList(formattedCode) {
    return formattedCode.split(/\r?\n|\r|\n/g);
}

function preserveWhitespaceForLines(valueLines) {
    valueLines.forEach((line, i) => {
        valueLines[i] = preserveWhitespaceForLine(line)
    });
    return valueLines;
}

function preserveWhitespaceForLine(singleValue) {
    return singleValue.replaceAll(" ", "&nbsp;");
}