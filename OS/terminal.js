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
        return `• ${clickableCommand(this.title, this.command + ' ' + this.arguments.at(0) )} ${this.text}${tags(this.tags)} ${argHint(this.arguments)}`;
    }
}