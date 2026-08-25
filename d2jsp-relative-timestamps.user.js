// ==UserScript==
// @name         d2jsp Relative Timestamps
// @namespace    https://github.com/Sunblood/d2jsp-relative-timestamps
// @version      1.1
// @description  Adds a relative time (e.g. "3 hours ago") next to d2jsp's static post timestamps, including "edited by" timestamps.
// @author       Sunblood
// @match        https://forums.d2jsp.org/*
// @match        https://*.d2jsp.org/*
// @run-at       document-end
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Sunblood/d2jsp-relative-timestamps/main/d2jsp-relative-timestamps.user.js
// @downloadURL  https://raw.githubusercontent.com/Sunblood/d2jsp-relative-timestamps/main/d2jsp-relative-timestamps.user.js
// ==/UserScript==

(function () {
    'use strict';

    // d2jsp renders post timestamps like: "Aug 24 2026 02:40pm"
    // e.g. <span id="td693100466">Aug 24 2026 02:40pm</span>
    var MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    var TS_RE = /^([A-Z][a-z]{2}) (\d{1,2}) (\d{4}) (\d{2}):(\d{2})(am|pm)$/;
    // e.g. "This post was edited by Sunblood on Aug 25 2026 09:39am"
    var EDIT_RE = /on ([A-Z][a-z]{2}) (\d{1,2}) (\d{4}) (\d{2}):(\d{2})(am|pm)/;

    function parseTimestampParts(m) {
        var month = MONTHS[m[1]];
        if (month === undefined) return null;
        var hour = parseInt(m[4], 10) % 12;
        if (m[6] === 'pm') hour += 12;
        var d = new Date(parseInt(m[3], 10), month, parseInt(m[2], 10), hour, parseInt(m[5], 10), 0);
        return isNaN(d.getTime()) ? null : d;
    }

    function parseTimestamp(text) {
        var m = TS_RE.exec(text.trim());
        if (!m) return null;
        return parseTimestampParts(m);
    }

    function parseEditTimestamp(text) {
        var m = EDIT_RE.exec(text);
        if (!m) return null;
        return parseTimestampParts(m);
    }

    function relativeFromNow(date) {
        var diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffSec < 0) diffSec = 0; // clock skew guard
        if (diffSec < 5) return 'just now';

        var divisions = [
            { amount: 60, name: 'second' },
            { amount: 60, name: 'minute' },
            { amount: 24, name: 'hour' },
            { amount: 30, name: 'day' },
            { amount: 12, name: 'month' },
            { amount: Infinity, name: 'year' }
        ];

        var value = diffSec;
        for (var i = 0; i < divisions.length; i++) {
            if (value < divisions[i].amount) {
                value = Math.floor(value);
                return value + ' ' + divisions[i].name + (value === 1 ? '' : 's') + ' ago';
            }
            value = value / divisions[i].amount;
        }
    }

    var updaters = [];

    function processElement(el) {
        if (!el || el.nodeType !== 1) return;
        if (el.dataset && el.dataset.d2jspRelts) return;
        if (el.children.length > 0) return;

        var text = el.textContent;
        if (!text || text.length > 25) return;

        var date = parseTimestamp(text);
        if (!date) return;

        el.dataset.d2jspRelts = '1';

        var rel = document.createElement('span');
        rel.className = 'd2jsp-rel-ts';
        rel.style.cssText = 'opacity:.65;margin-left:6px;font-size:.9em;white-space:nowrap;';
        rel.title = text;

        function update() {
            rel.textContent = '(' + relativeFromNow(date) + ')';
        }
        update();

        el.insertAdjacentElement('afterend', rel);
        updaters.push(update);
    }

    function processEditElement(el) {
        if (!el || el.nodeType !== 1) return;
        if (el.dataset && el.dataset.d2jspEditRelts) return;

        var text = el.textContent;
        if (!text || text.length > 200 || text.indexOf('was edited by') === -1) return;

        // Only handle the innermost element containing the whole phrase,
        // so we don't double-insert on every ancestor wrapper too.
        for (var i = 0; i < el.children.length; i++) {
            var childText = el.children[i].textContent;
            if (childText && childText.indexOf('was edited by') !== -1) return;
        }

        var date = parseEditTimestamp(text);
        if (!date) return;

        el.dataset.d2jspEditRelts = '1';

        var rel = document.createElement('span');
        rel.className = 'd2jsp-rel-ts';
        rel.style.cssText = 'opacity:.65;margin-left:6px;font-size:.9em;white-space:nowrap;';
        rel.title = text.trim();

        function update() {
            rel.textContent = '(' + relativeFromNow(date) + ')';
        }
        update();

        el.insertAdjacentElement('afterend', rel);
        updaters.push(update);
    }

    function scan(root) {
        var nodes = root.querySelectorAll('span, div, td');
        for (var i = 0; i < nodes.length; i++) {
            processElement(nodes[i]);
            processEditElement(nodes[i]);
        }
    }

    // Initial pass
    scan(document.body);

    // Keep relative times fresh
    setInterval(function () {
        for (var i = 0; i < updaters.length; i++) updaters[i]();
    }, 30000);

    // Handle content loaded/replaced dynamically (pagination, AJAX, new posts, etc.)
    var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                var node = added[j];
                if (node.nodeType !== 1) continue;
                processElement(node);
                processEditElement(node);
                scan(node);
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
