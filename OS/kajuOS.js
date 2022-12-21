var ver = "5";
$('#ver').html(ver);
hideConsolePromptBox();

$('.console-input').keyup(function() {
  // this.value = this.value.toLowerCase();
});

$('.console-input').keydown(function() {
  this.value = this.value; //todo does it work?
});

function getConsoleInputElement() {
  return document.getElementById("consoleInput")
}

function moveConsoleInputCursorToEnd() {
  setTimeout(function() {
    moveInputCursorToEnd(getConsoleInputElement());
  }, 1);
}

function moveInputCursorToEnd(theInput) {
  let len = theInput.value.length;

  if (theInput.setSelectionRange) {
    theInput.focus();
    theInput.setSelectionRange(len, len);
  } else if (theInput.createTextRange) {
    var t = theInput.createTextRange();
    t.collapse(true);
    t.moveEnd('character', len);
    t.moveStart('character', len);
    t.select();
  }
}

$('.console-input').click(function() {
  this.value = this.value;
});

$("html").click(function() {
  $('.console-input').focus();
});

const bootloaderLineStyle = "font-family: bootloader !important;";
const biosLineStyle = "font-family: bios !important;";

let DEBUG = false;

class Actor {
  static USER = new Actor('User >', 'output-cmd-pre', 'output-text');
  static SYSTEM = new Actor('System >', 'output-text-pre', 'output-text');
  static SYSTEM_INVISIBLE = new Actor(' ', '', 'output-text');
  static BIOS = new Actor('>_', 'output-server-pre', 'output-server').style(biosLineStyle);
  static BIOS_INVISIBLE = new Actor(' ', '', 'output-server').style(biosLineStyle);
  static BOOTLOADER = new Actor('>_', 'output-server-pre', 'output-text').style(bootloaderLineStyle);
  static BOOTLOADER_INVISIBLE = new Actor(' ', '', 'output-text').style(bootloaderLineStyle);

  constructor(name, actorCssClass, textLineCssClass) {
    this.name = name;
    this.actorCssClass = actorCssClass;
    this.textLineCssClass = textLineCssClass;
  }

  style(overrideStyle) {
    this.overriddenStyle = " style='" + overrideStyle + "'";
    return this;
  }
}

class Cookie {
  static BEEN_HERE = "hasBeenHereBefore";
  static LAST_IP = "lastIp";
  static LAST_LOC = "lastLoc";
  static LAST_COLO = "lastColo";
  static LAST_DATETIME = "lastDateTime";
  static CMD_MEMORY = 'commandMemory';
}


class CommandMemory {
  static commands  = [];
  static index = 0;

  static validateAndSave(command) {
    this.resetIndex();
    if (!isNullOrWhitespace(command) && command != this.commands.at(this.index -1)) {
      this.commands.push(command);
      this.index ++;
      saveCookie(Cookie.CMD_MEMORY, JSON.stringify(this.commands))
    }
  }

  static getPrevious() {
    if(this.index > 0) {
      this.index--;
    }

    return this.commands.at(this.index);
  }

  static getNext() {
    if (this.index < this.commands.length) {
      return this.commands.at(++this.index);
    }
  }


  static resetIndex() {
    this.index = this.commands.length;
  }

  static restoreFromCookie() {
    let commandMemoryCookie = getCookie(Cookie.CMD_MEMORY);

    if (commandMemoryCookie) {
      this.commands = JSON.parse(commandMemoryCookie);
      this.resetIndex();
    }
  }
}

CommandMemory.restoreFromCookie();

function log(message) {
  if (DEBUG) {
    console.log(message);
  }
}

// Output to Console
function output(print, skipInput) {

  if (!skipInput) {
    var currentLineValue = LAST_FULL_COMMAND_AND_DATA;
    if (currentLineValue=="") {currentLineValue="<span style='opacity:0;'>...</span>";} //todo is needed?
    storeOutput(Actor.USER, currentLineValue);
  }

  $.each(print, function(index, value) {

    var visibleActor = Actor.SYSTEM;
    if (index > 0) {
      visibleActor = Actor.SYSTEM_INVISIBLE;
    }

    if (value == "") {
      value = "&nbsp;";
    }

    storeOutput(visibleActor, value);
  });

  if (!skipInput) {
    $('.console-input').val("");
    //$('.console-input').focus();
  }

  $("html, body").animate({
    scrollTop: $(document).height()
  }, 750);
}

var lineIdCounter = 0;

function storeOutput(actor, value, specificLineClass, allowDuplicatedLineClass) {

  lineIdCounter++;

  let lineClass;
  if (value === '') {value = "&nbsp;";}

  if (specificLineClass === undefined) {
    lineClass = "line" + lineIdCounter;
  } else {
    lineClass = specificLineClass;
  }

  let style = ""
  if (actor.overriddenStyle != undefined) {
    style = actor.overriddenStyle;
  }

  //add new or modify existing
  if (!document.getElementsByClassName(lineClass).length || allowDuplicatedLineClass) {
    $("#outputs")
      .append("<span class='" + actor.actorCssClass + "'" + style + ">" + actor.name + "</span><span id='" + lineIdCounter + "' class='" + actor.textLineCssClass + " " + lineClass +"'" + style + ">" + value + "</span>");
  } else {
    $("." + lineClass).text(value);
  }

  return lineClass;
}

var newLine = "<br/> &nbsp;";

function clearHint() {
  $(".hint").val("");
}

var installedApps = {};

let LINE_CLASS_APP_LOCATE = "kajuappslocate";
let LINE_CLASS_APP_INSTALL = "kajuappsinstalls";
let nrFoundApps = 0;

function locateAndInstallApps() {

  var autoCompleteConf = {
    after: "",
    caseSensitive: false,
    hint: "placeholder",
    minLength: 2
  };
  const autoCompleteCommands = [];

  storeOutput(Actor.BIOS, "Scanning /apps directory");

  $.ajax({
    url: "/apps",
    async: false,
    success: function (data) {
      log(data);
      var locatedAppNames = $(data).find('a:contains(.kajuapp)');
      storeOutput(Actor.BIOS, "Located " + locatedAppNames.length + " apps to install", LINE_CLASS_APP_LOCATE);

      locatedAppNames.each(function () {
        // will loop through
        var discoveredApp = $(this).attr("href");
        storeOutput(Actor.BIOS, "Installing " + discoveredApp, LINE_CLASS_APP_INSTALL, true);
        let appsRoot = "/apps/";
        $.getScript(appsRoot + discoveredApp, function (data, textStatus, jqxhr) {
          installedApps[app.getCommand()] = app;
          autoCompleteCommands.push(app.getCommand());
        })
      });
      activateInputAutocomplete(autoCompleteCommands, autoCompleteConf);
    }
  });
}

function activateInputAutocomplete(autocompleteCommands, autoCompleteConf) {
  $('.console-input').tabcomplete(
        autocompleteCommands,
        autoCompleteConf
    );
}

function clearConsole() {
  $("#outputs").html("");
}

function removeLastLines(count) {
  if (!count) { count = 1;}

  for (let i = 0; i < count; i++) {
    $("#outputs").find("span:last").remove();
    $("#outputs").find("span:last").remove();
  }
}

function removeLineById(id) {
  $("#outputs").find("#" + id).prev().remove()
  $("#outputs").find("#" + id).remove()
}

function removeLineByLineClass(lineClass) {
  $("#outputs").find("." + lineClass).prev().remove()
  $("#outputs").find("." + lineClass).remove()
}

function isLastLineEmpty() {
  return isNullOrWhitespace($("#outputs").find("span:last")[0].innerText);
}

function isNullOrWhitespace(input) {
  return !input || !input.trim();
}

function saveCookie(key, value) {
  Cookies.set(key, value);
}

function getCookie(key) {
  return Cookies.get(key);
}

function clearCookies() {
  Cookies.remove();
}

function welcomeScreen(userIp, userAgent, location, city) {

  removeLastLines();
  storeOutput(Actor.BIOS_INVISIBLE, "System ready");
  storeOutput(Actor.SYSTEM_INVISIBLE, "");

  var lastLogin = "I've never seen you here before :)";
  if (getCookie(Cookie.BEEN_HERE)) {
    lastLogin = "Last login: "
        + getCookie(Cookie.LAST_DATETIME)
        + " from ";

        var ip = getCookie(Cookie.LAST_IP)
            + " [" + getCookie(Cookie.LAST_COLO)
            + ", " + getCookie(Cookie.LAST_LOC) + "]";

        if (userIp === getCookie(Cookie.LAST_IP)) {
          ip = "same IP"
        }

        lastLogin += ip;
  }

  var welcome = [
    `${highlight('Kaju Geek Web OS')} [Version 0.1337.420] 1990-` + getCurrentYear(),
    "",
    "Welcome User @ " + userIp + " [" + city + ", " + location + "]",
    userAgent,
    "",
    lastLogin,
    preserveWhitespaceForLine("            _ _    _          _                            "),
    preserveWhitespaceForLine("   ___ _ __(_) | _| | ____ _ (_)_   _   ___ ___  _ __ ___  "),
    preserveWhitespaceForLine("  / _ \\ '__| | |/ / |/ / _` || | | | | / __/ _ \\| '_ ` _ \\ "),
    preserveWhitespaceForLine(" |  __/ |  | |   <|   < (_| || | |_| || (_| (_) | | | | | |"),
    preserveWhitespaceForLine("  \\___|_|  |_|_|\\_\\_|\\_\\__,_|/ |\\__,_(_)___\\___/|_| |_| |_|"),
    preserveWhitespaceForLine("                           |__/                            "),
    "",
    "Use '/help' for list of commands.",
    ""
  ];

  output(welcome, true);
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function UUID() {
  return 'xxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

var LAST_FULL_COMMAND_AND_DATA = "";
var LAST_COMMAND_ONLY = "";

function pickLongestStringInArray(arrayOfStrings) {
  return arrayOfStrings.reduce(
      function (a, b) {
        return a.length > b.length ? a : b;
      }
  );
}

var analyticsEvent, analytics;
async function installAnalyticsDriver() {
  var {gaEvent, gaAnalytics} = await import('../driver/firebase.js');
  analyticsEvent = gaEvent;
  analytics = gaAnalytics;
}

function logEvent(eventName, eventParameters) {
  analyticsEvent(analytics, eventName, eventParameters);
}

// Get User Command
$('.console-input').on('keydown', function(event) {
  if (event.which === 13) {
    var str = $(this).val();
    var data = str.split(' '); data.shift(); data = data.join(' ');
    var cmd = str.split(' ')[0];

    LAST_FULL_COMMAND_AND_DATA = pickLongestStringInArray([str, $('.hint').val()]);
    LAST_COMMAND_ONLY = pickLongestStringInArray([cmd, $('.hint').val()]);

    CommandMemory.validateAndSave(LAST_FULL_COMMAND_AND_DATA);

    logEvent('user_run_command', {full_command: LAST_FULL_COMMAND_AND_DATA});

    if (LAST_FULL_COMMAND_AND_DATA.startsWith("sudo ")) {
      output([`Sorry, user is not allowed to execute '${LAST_FULL_COMMAND_AND_DATA.replace("sudo ", '')}' as root`]);
      return;
    }

    if (installedApps[LAST_COMMAND_ONLY] instanceof KajuAppContainer) {
      installedApps[LAST_COMMAND_ONLY].run(data);
    } else {
      output(["Command not found: '" + cmd + "'", "Use '/help' for list of commands."]);
    }

    $(this).val("");
  } else if (event.which === 38) {
    $(this).val(CommandMemory.getPrevious());
    moveConsoleInputCursorToEnd();
    clearHint();
  } else if (event.which === 40) {
    $(this).val(CommandMemory.getNext());
    clearHint();
  }
});

function getConsolePromptBox() {
  return $('.terminal-prompt-box');
}

function hideConsolePromptBox() {
  getConsolePromptBox().hide();
}

function showConsolePromptBox() {
  getConsolePromptBox().show();
  $('.console-input').focus();
}

var hasShownAutocompleteHint = false;
function decideIfShowAutocompleteHint() {
  if (!hasShownAutocompleteHint) {

    if (isLastLineEmpty()) { removeLastLines(1); }

    storeOutput(Actor.SYSTEM_INVISIBLE, "Tip: Press TAB for autocomplete");
    hasShownAutocompleteHint = true;
  }
}

function image(path) {
  return `<img src="${path}">`
}

let LINE_CLASS_PROGRESSBAR = "progressbar";

$(document).ready(function(){

  setTimeout(function(){
  hideConsolePromptBox();
  let bootId = UUID();


  storeOutput(Actor.BIOS, '## Booting erikkaju.com at 0x' + bootId);
  storeOutput(Actor.BIOS, '0%', LINE_CLASS_PROGRESSBAR);
  locateAndInstallApps();
  installAnalyticsDriver().then((value) => {
    storeOutput(Actor.BIOS, "Installed analytics driver");
  });

  for (let l = 0; l < 102; l++) {

    var latestTimeout = l*4;

    setTimeout(function(){

      if (l <= 100) {
        storeOutput(Actor.BIOS, l+'% ' + "█".repeat(l/1.9), LINE_CLASS_PROGRESSBAR);
      } else {
        //todo make this first!
        // removeLastLines();
        storeOutput(Actor.BOOTLOADER, "")
        storeOutput(Actor.BOOTLOADER, "                PEAR II                ".replaceAll(" ", '&nbsp;'))
        storeOutput(Actor.BOOTLOADER, "     DOS VERSION 3.3 SYSTEM MASTER     ".replaceAll(" ", '&nbsp;'))
        storeOutput(Actor.BOOTLOADER, "")
        storeOutput(Actor.BOOTLOADER, "    ALL YOUR BASE ARE BELONG TO US!    ".replaceAll(" ", '&nbsp;'))
        storeOutput(Actor.BOOTLOADER, "          SEPTEMBER 14, 1990           ".replaceAll(" ", '&nbsp;'))
        storeOutput(Actor.BOOTLOADER, " COPYRIGHT PEAR COMPUTER,INC. 1990-2022".replaceAll(" ", '&nbsp;'))
      }
    }, latestTimeout);
  }

  setTimeout(function(){
    removeLineByLineClass(LINE_CLASS_PROGRESSBAR);
    removeLineByLineClass(LINE_CLASS_APP_INSTALL);
    storeOutput(Actor.BIOS, "Installed " + Object.keys(installedApps).length + " .kajuapp(s)", LINE_CLASS_APP_LOCATE);
    removeLastLines(7);
    storeOutput(Actor.BIOS_INVISIBLE, "");
    $.get('https://www.cloudflare.com/cdn-cgi/trace', function(data) {
      data = data.trim().split('\n').reduce(function(obj, pair) {
        pair = pair.split('=');
        return obj[pair[0]] = pair[1], obj;
      }, {});

      welcomeScreen(data.ip, data.uag, data.loc, data.colo); //todo not depend on CF uptime
      showConsolePromptBox();

      saveCookie(Cookie.BEEN_HERE, "true");
      saveCookie(Cookie.LAST_IP, data.ip);
      saveCookie(Cookie.LAST_LOC, data.loc);
      saveCookie(Cookie.LAST_COLO, data.colo);
      saveCookie(Cookie.LAST_DATETIME, new Date().toUTCString());
    }
    );
  }, latestTimeout + 200);
  }, 700);
});

function highlight(string) {
  let highlightedString = "<span class='highlight'>"
  highlightedString += string;
  return highlightedString + "</span>";
}

function clickableCommandRun(string, command) {
  return aLinkWithOnClickJs(string, "simulateCommand(`" + command + "`, true)", "highlight");
}

function clickableCommandEnter(string, command) {
  return aLinkWithOnClickJs(string, "simulateCommand(`" + command + "`, false)", "highlight");
}

function aLinkWithOnClickJs(value, command, htmlClass) {
  let linkHtml = "<a href='javascript: " + command + "' class='" + htmlClass + "'>";
  linkHtml += value;
  return linkHtml + `</a>`;
}

function tags(tags) {
  if (tags === undefined || tags.length == 0) return "";

  let tagList = "<span class='tags'>";
  for (const tag of tags) {
    tagList += ` #${tag}`;
  };

  tagList += "</span>";
  return tagList;
}

function argHint(arguments) {
  if (arguments === undefined || arguments.length == 0) return "";

  let argumentHints = "<span class='argumentHint'>";
  for (const argument of arguments) {
    argumentHints += ` ${argument}`;
  };

  argumentHints += "</span>";
  return argumentHints;
}

function simulateCommand(command, run) {
    hideInputPlaceholder();
    getConsoleInputElement().style.display = "none";
    enterCommand(command);
  getConsoleInputElement().style = "opacity: 1; color: black; background-color: #00ff00";
    getConsoleInputElement().animate({ opacity: 0 }, 450)


  setTimeout(function(){
    if (run == true) {
      const keyboardEvent = new KeyboardEvent('keydown', {bubbles: true, cancelable: true, keyCode: 13});
      getConsoleInputElement().dispatchEvent(keyboardEvent);
    }
    getConsoleInputElement().style = "";
    restoreInputPlaceholder();
  }, 400);
}

function enterCommand(command) {
  getConsoleInputElement().value = command;
}

function hideInputPlaceholder() {
  getConsoleInputElement().placeholder = "";
}

function restoreInputPlaceholder() {
  getConsoleInputElement().placeholder = "Type command...";
}

function ls() {
  let out = [];
  $.ajax({
    url: "/apps",
    async: false,
    success: function (data) {
      var locatedAppNames = $(data).find('a:contains(.kajuapp)');
      locatedAppNames.each(function () {
        out.push($(this).attr("href"));
      });
    }
  });
  return out;
}