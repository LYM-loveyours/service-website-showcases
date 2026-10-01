

(function () {
  'use strict';

  

  var GBP = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
  var DAY_FMT = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' });
  var SHORT_FMT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' });

  
  function londonNow() {
    var s = new Date().toLocaleString('en-US', { timeZone: 'Europe/London' });
    return new Date(s);
  }

  function londonWeekday(d) { return d.getDay(); } // 0 Sun … 6 Sat

  
  function nextWorkingDays(n) {
    var d = londonNow(), out = [];
    d.setHours(12, 0, 0, 0);
    while (out.length < n) {
      d.setDate(d.getDate() + 1);
      var wd = londonWeekday(d);
      if (wd !== 0 && wd !== 6) out.push(new Date(d));
    }
    return out;
  }

  function money(n) { return GBP.format(n); }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  

  $$('[data-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var d = document.getElementById(btn.getAttribute('data-dialog'));
      if (d && typeof d.showModal === 'function') d.showModal();
      else if (d) d.setAttribute('open', '');
    });
  });
  $$('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var d = btn.closest('dialog');
      if (d) d.close();
    });
  });

  

  $$('[data-record]').forEach(function (scene) {
    var buttons = $$('.view-switch button', scene);
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        scene.dataset.view = b.dataset.view;
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
  });

  

  $$('[data-instrument=valuation]').forEach(function (root) {
    var bands;
    try { bands = JSON.parse(root.getAttribute('data-bands')); }
    catch (e) { bands = { didsbury: [425, 475], chorlton: [375, 425] }; }

    var area = $('[data-role=area]', root),
        size = $('[data-role=size]', root),
        out = $('[data-role=result]', root),
        err = $('[data-role=error]', root),
        state = $('[data-role=sample-state]', root);

    var defaults = { area: area.value, size: size.value };
    var touched = false;

    function label(text) { if (state) state.textContent = text; }

    
    function publish(text) {
      root.dataset.state = text;
      root.dataset.touched = String(touched);
    }

    function estimate() {
      var n = Number(size.value);
      err.textContent = '';
      size.removeAttribute('aria-invalid');

      if (!size.value) {
        out.textContent = 'Add your floor area';
        err.textContent = 'Enter 300–5,000 sq ft, or reset the sample.';
        publish('');
        return;
      }
      if (!Number.isFinite(n) || n < 300 || n > 5000 || !Number.isInteger(n)) {
        out.textContent = 'Let’s discuss this home';
        err.textContent = 'Use a whole number from 300 to 5,000 sq ft for this example.';
        size.setAttribute('aria-invalid', 'true');
        publish('');
        return;
      }
      if (!bands[area.value]) {
        out.textContent = 'Outside this example’s area';
        err.textContent = 'Choose Didsbury or Chorlton to try the method.';
        publish('Outside the example area (' + n + ' sq ft)');
        return;
      }
      var lo = n * bands[area.value][0], hi = n * bands[area.value][1];
      out.textContent = money(lo) + ' – ' + money(hi);
      publish(area.options[area.selectedIndex].text + ' · ' + n + ' sq ft · illustrative ' + money(lo) + '–' + money(hi));
    }

    function markTouched() {
      touched = true;
      label('Your exploration · illustrative');
      estimate();
    }

    area.addEventListener('change', markTouched);
    size.addEventListener('input', markTouched);

    var reset = $('[data-role=reset]', root);
    if (reset) reset.addEventListener('click', function () {
      area.value = defaults.area; size.value = defaults.size;
      touched = false;
      label('Sample home');
      estimate();
    });

    var clear = $('[data-role=clear]', root);
    if (clear) clear.addEventListener('click', function () {
      size.value = '';
      touched = true;
      label('Cleared');
      estimate();
      size.focus();
    });

    estimate();
  });

  

  $$('[data-instrument=slots]').forEach(function (root) {
    var kind = root.getAttribute('data-kind') || 'valuation',
        mount = $('[data-role=days]', root),
        chosen = $('[data-role=chosen]', root);
    root.dataset.state = '';

    mount.textContent = 'Loading the next available times…';

    fetch('./assets/slots.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { render(data); })
      .catch(function () {
        mount.innerHTML = '';
        var p = document.createElement('p');
        p.className = 'slot-empty';
        p.textContent = 'The example diary did not load. Ring 0161 496 0184 or say a preferred day in your message.';
        mount.appendChild(p);
      });

    function render(data) {
      var cfg = data.kinds[kind];
      var days = nextWorkingDays(data.days_offered || 4);
      mount.innerHTML = '';
      var anyFree = false;

      days.forEach(function (date, i) {
        var taken = (cfg.unavailable && cfg.unavailable[String(i + 1)]) || [];
        var box = document.createElement('div');
        box.className = 'slot-day';
        var h = document.createElement('h3');
        h.textContent = SHORT_FMT.format(date);
        box.appendChild(h);

        var free = cfg.times.filter(function (t) { return taken.indexOf(t) === -1; });
        if (!free.length) {
          var none = document.createElement('p');
          none.className = 'slot-empty';
          none.textContent = 'Fully booked';
          box.appendChild(none);
        } else {
          anyFree = true;
          var ul = document.createElement('ul');
          free.forEach(function (t) {
            var li = document.createElement('li');
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'slot';
            b.setAttribute('aria-pressed', 'false');
            b.textContent = t;
            b.setAttribute('aria-label', cfg.label + ', ' + DAY_FMT.format(date) + ' at ' + t);
            b.addEventListener('click', function () {
              $$('.slot', mount).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
              b.setAttribute('aria-pressed', 'true');
              var text = cfg.label + ' · ' + DAY_FMT.format(date) + ', ' + t + ' (' + cfg.duration_minutes + ' min)';
              chosen.textContent = 'Chosen: ' + text + '. Demonstration only; no booking is made.';
              root.dataset.state = text;
            });
            li.appendChild(b);
            ul.appendChild(li);
          });
          box.appendChild(ul);
        }
        mount.appendChild(box);
      });

      if (!anyFree) {
        chosen.textContent = 'No times left in this window. Ask for the following week in your message, or ring 0161 496 0184.';
      }

      var clear = $('[data-role=clear-slot]', root);
      if (clear) clear.addEventListener('click', function () {
        $$('.slot', mount).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        chosen.textContent = 'No time chosen. Pick one above, or say a preferred day in your message.';
        root.dataset.state = '';
        var first = $('.slot', mount);
        if (first) first.focus();
      });
    }
  });

  

  

  var market = $('[data-instrument=market]');
  if (market) {
    var bar = $('[data-role=filters]', market),
        countEl = $('[data-role=count]', market),
        emptyEl = $('[data-role=empty]', market),
        cards = $$('.plot', market),
        more = $('.filter-more', market);

    
    if (more) {
      var wide = window.matchMedia('(min-width:701px)');
      var syncOpen = function () { more.open = wide.matches; };
      syncOpen();
      if (wide.addEventListener) wide.addEventListener('change', syncOpen);
    }

    fetch('./assets/properties.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { wireFilters(data.properties); })
      .catch(function () {
        if (countEl) countEl.textContent = 'The example feed did not load, so the filters stay off and every home is listed below.';
      });

    function wireFilters(items) {
      var byId = {};
      items.forEach(function (i) { byId[i.id] = i; });

      
      var orphans = cards.map(function (c) { return c.getAttribute('data-id'); })
                         .filter(function (id) { return !byId[id]; });
      var unshown = items.map(function (i) { return i.id; })
                         .filter(function (id) { return !cards.some(function (c) { return c.getAttribute('data-id') === id; }); });
      if (orphans.length || unshown.length) {
        console.warn('[morrowell] feed and markup disagree — the page is not rebuilt.',
                     { cards_without_feed_row: orphans, feed_rows_without_card: unshown });
      }

      var state = { deal: 'all', beds: 'any', price: 'any', epc: 'any' };
      var dealButtons = $$('.toggle button', bar),
          beds = $('#f-beds', bar),
          price = $('#f-price', bar),
          epc = $('#f-epc', bar),
          clear = $('[data-role=clear-filters]', bar);

      $$('[disabled]', bar).forEach(function (el) { el.disabled = false; });

      dealButtons.forEach(function (b) {
        b.addEventListener('click', function () {
          state.deal = b.getAttribute('data-deal');
          dealButtons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          apply();
        });
      });
      beds.addEventListener('change', function () { state.beds = beds.value; apply(); });
      price.addEventListener('change', function () { state.price = price.value; apply(); });
      epc.addEventListener('change', function () { state.epc = epc.value; apply(); });
      clear.addEventListener('click', function () {
        state = { deal: 'all', beds: 'any', price: 'any', epc: 'any' };
        beds.value = 'any'; price.value = 'any'; epc.value = 'any';
        dealButtons.forEach(function (x, i) { x.setAttribute('aria-pressed', String(i === 0)); });
        apply();
        beds.focus();
      });

      function keeps(item) {
        if (state.deal !== 'all' && item.deal !== state.deal) return false;
        if (state.beds !== 'any' && item.bedrooms < Number(state.beds)) return false;
        if (state.epc !== 'any' && item.epc > state.epc) return false;
        if (state.price === 'sale-500') return item.deal === 'sale' && item.price <= 500000;
        if (state.price === 'sale-500plus') return item.deal === 'sale' && item.price > 500000;
        if (state.price === 'let-1500') return item.deal === 'let' && item.price <= 1500;
        if (state.price === 'let-1500plus') return item.deal === 'let' && item.price > 1500;
        return true;
      }

      function apply() {
        var shown = 0;
        cards.forEach(function (card) {
          var item = byId[card.getAttribute('data-id')];
          var ok = item ? keeps(item) : true;   
          card.hidden = !ok;
          if (ok) shown++;
        });
        emptyEl.hidden = shown !== 0;
        countEl.textContent = shown === 0
          ? 'No example homes match those filters.'
          : shown + (shown === 1 ? ' example home' : ' example homes') + ' shown of ' + cards.length + '. All illustrative.';
      }

      apply();
    }
  }

  

  $$('[data-instrument=branch]').forEach(function (root) {
    var hours;
    try { hours = JSON.parse(root.getAttribute('data-hours')); } catch (e) { return; }
    var out = $('[data-role=open-state]', root);
    if (!out) return;
    var now = londonNow();
    var key = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][londonWeekday(now)];
    var today = hours[key];
    var mins = now.getHours() * 60 + now.getMinutes();
    function toMins(t) { var p = t.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
    if (!today) {
      out.textContent = 'Closed today · the example diary reopens on Monday.';
    } else if (mins < toMins(today[0])) {
      out.textContent = 'Closed now · opens at ' + today[0] + ' today.';
    } else if (mins >= toMins(today[1])) {
      out.textContent = 'Closed now · opens again tomorrow.';
    } else {
      out.textContent = 'Open now · until ' + today[1] + ' today.';
    }
  });

  

  $$('form[data-enquiry]').forEach(function (form) {
    var status = $('[data-role=form-status]', form),
        include = $('[data-role=include-example]', form),
        stateField = form.querySelector('input[name=instrument_state]'),
        ids = (form.getAttribute('data-instruments') || '').split(/\s+/).filter(Boolean);

    
    function composeState() {
      var parts = [];
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el || !el.dataset.state) return;
        if (el.getAttribute('data-instrument') === 'valuation') {
          var wanted = el.dataset.touched === 'true' || (include && include.checked);
          if (!wanted) return;
        }
        parts.push(el.dataset.state);
      });
      return parts.join(' | ');
    }

    if (include && stateField) {
      include.addEventListener('change', function () { stateField.value = composeState(); });
    }

    form.addEventListener('submit', function (e) {
      
      var pot = form.querySelector('input[name=company_website]');
      if (pot && pot.value) {
        e.preventDefault();
        if (status) status.textContent = 'This enquiry could not be sent.';
        return;
      }
      
      var bad = null;
      $$('[required]', form).forEach(function (f) {
        var ok = f.checkValidity();
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = f;
      });
      if (bad) {
        if (status) status.textContent = 'Check the fields marked above, then send again.';
        return; 
      }
      if (stateField) stateField.value = composeState();
      if (status) status.textContent = 'Demonstration only — no enquiry is sent.';
      
    });
  });

}());
