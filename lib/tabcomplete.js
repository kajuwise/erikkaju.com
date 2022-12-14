/*
 Modified version of https://github.com/erming/tabcomplete
 */
(function($) {
	var keys = {
		backspace: 8,
		tab: 9,
		up: 38,
		down: 40,
		right: 39
	};

	var autoCompleteOptions;

	$.fn.tab = // Alias
	$.fn.tabcomplete = function(args, options) {
		if (this.length > 1) {
			return this.each(function() {
				$(this).tabcomplete(args, options);
			});
		}
		
		// Only enable the plugin on <input> and <textarea> elements.
		var tag = this.prop("tagName");
		if (tag != "INPUT" && tag != "TEXTAREA") {
			return;
		}
		
		// Set default options.
		autoCompleteOptions = $.extend({
			after: "",
			caseSensitive: false,
			hint: "placeholder",
			minLength: 1
		}, options);
		
		// Remove any leftovers.
		// This allows us to override the plugin if necessary.
		this.unbind(".tabcomplete");
		this.prev(".hint").remove();
		
		var self = this;
		var backspace = false;
		var i = -1;
		var words = [];
		var last = "";
		
		var hint = $.noop;
		
		// Determine what type of hinting to use.
		switch (autoCompleteOptions.hint) {
		case "placeholder":
			hint = placeholder;
			break;
		
		case "select":
			hint = select;
			break;
		}
		
		this.on("input.tabcomplete", function() {
			var input = self.val();
			var word = input.split(/ |\n/).pop();
			
			// Reset iteration.
			i = -1;
			last = "";
			words = [];
			
			// Check for matches if the current word is the last word.
			if (self[0].selectionStart == input.length
				&& word.length) {
				if (typeof args === "function") {
					// If the user supplies a function, invoke it
					// and keep the result.
					words = args(word);
				} else {
					// Otherwise, call the .match() function.
					words = match(word, args, autoCompleteOptions.caseSensitive);
				}
				
				// Append 'after' to each word.
				if (autoCompleteOptions.after) {
					words = $.map(words, function(w) { return w + autoCompleteOptions.after; });
				}
			}
			
			// Emit the number of matching words with the 'match' event.
			self.trigger("match", words.length);
			
			if (autoCompleteOptions.hint) {
				if (!(autoCompleteOptions.hint == "select" && backspace) && word.length >= autoCompleteOptions.minLength) {
					// Show hint.
					hint.call(self, words[0]);
				} else {
					// Clear hinting.
					// This call is needed when using backspace.
					hint.call(self, "");
				}
			}
			
			if (backspace) {
				backspace = false;
			}
		});
		
		this.on("keydown.tabcomplete", function(e) {
			var key = e.which;
			if (key == keys.tab /* || key == keys.right */) { //todo key right needs to be worked on
				
				// Don't lose focus on tab click.
				e.preventDefault();
				
				// Iterate the matches with tab and the up and down keys by incrementing
				// or decrementing the 'i' variable.
				if (key != keys.up) {
					i++;
				} else {
					if (i == -1) return;
					if (i == 0) {
						// Jump to the last word.
						i = words.length - 1;
					} else {
						i--;
					}
				}
				
				// Get next match.
				var word = words[i % words.length];
				if (!word) {
					return;
				}
				
				var value = self.val();
				last = last || value.split(/ |\n/).pop();
				
				// Return if the 'minLength' requirement isn't met.
				if (last.length < autoCompleteOptions.minLength) {
					return;
				}
				
				// Update element with the completed text.
				var text = value.substr(0, self[0].selectionStart - last.length) + word;
				self.val(text);
				
				// Put the cursor at the end after completion.
				// This isn't strictly necessary, but solves an issue with
				// Internet Explorer.
				if (autoCompleteOptions.hint == "select") {
					self[0].selectionStart = text.length;
				}
				
				// Remember the word until next time.
				last = word;
				
				// Emit event.
				self.trigger("tabcomplete", last);
				
				if (autoCompleteOptions.hint) {
					// Turn off any additional hinting.
					hint.call(self, "");
				}
			} else if (e.which == keys.backspace) {
				// Remember that backspace was pressed. This is used
				// by the 'input' event.
				backspace = true;
				
				// Reset iteration.
				i = -1;
				last = "";
			}
		});
		
		if (autoCompleteOptions.hint) {
			// If enabled, turn on hinting.
			hint.call(this, "");
		}
		
		return this;
	}
	
	// Simple matching.
	// Filter the array and return the items that begins with 'word'.
	function match(word, array, caseSensitive) {
		return $.grep(
			array,
			function(w) {
				if (caseSensitive) {
					return !w.indexOf(word);
				} else {
					return !w.toLowerCase().indexOf(word.toLowerCase());
				}
			}
		);
	}

	// Show placeholder text.
	// This works by creating a copy of the input and placing it behind
	// the real input.
	function placeholder(word) {
		var input = this;
		var clone = input.prev(".hint");

		input.css({
			backgroundColor: "transparent",
			position: "relative",
		});
		
		// Lets create a clone of the input if it does
		// not already exist.
		if (!clone.length) {
			input.wrap(
				$("<div>").css({position: "relative"})
			);
			clone = input
				.clone()
				.attr("tabindex", -1)
				.removeAttr("id name placeholder")
				.addClass("hint")
				.insertBefore(input);
			clone.css({
				position: "absolute",
				opacity: 0.35,
				color: "#ffffff"
			});
		}
		
		var hint = "";
		if (typeof word !== "undefined") {
			var value = input.val();
			hint = value + word.substr(value.split(/ |\n/).pop().length);
		}

		if (hint.length > autoCompleteOptions.minLength) {
			decideIfShowAutocompleteHint();
		}
		
		clone.val(hint);
	}
	
	// Hint by selecting part of the suggested word.
	function select(word) {	
		var input = this;
		var value = input.val();
		if (word) {
			input.val(
				value
				+ word.substr(value.split(/ |\n/).pop().length)
			);
			
			// Select hint.
			input[0].selectionStart = value.length;
		}
	}
})(jQuery);
