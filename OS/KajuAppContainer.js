const APP_TYPE = {
    HOMEPAGE: 'homepage',
    SYSTEM: 'system',
    USELESS: 'useless'
}

class KajuAppContainer {

    constructor(command) {
        this.command = command;
    }

    ofType(appType) {
        this.type = appType;
        return this;
    }

    helpMessage(message) {
        this.help = message;
        return this;
    }

    getHelpMessage() {
        return this.help;
    }

    getType() {
        return this.type;
    }

    getCommand() {
        return this.command;
    }

    main(mainFunction) {
        if (typeof mainFunction != 'function') {
            storeOutput(Actor.BIOS, `Can not install app: ${this.command} . Main function is not a function!`);
        }
        this.mainFunction = mainFunction;
        return this;
    }

    run(args) {
        this.mainFunction(args)
    }
}