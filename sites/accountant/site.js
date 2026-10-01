
'use strict';



const TARIFF = {
  tiers: {
    company : {base:185, name:'Company accounts & tax',   detail:'Year-end accounts and Corporation Tax return'},
    sole    : {base: 95, name:'Sole trader accounts & tax',detail:'Annual accounts and Self Assessment return'},
    landlord: {base: 75, name:'Property income & tax',     detail:'Rental accounts and Self Assessment; up to two properties'}
  },
  modifiers: {vat:35, payroll:30}
};

const DIARY = {
  times: ['09:30','11:00','14:00','15:30'],
  days: 3,                       
  held: {day:1, time:'09:30'},   
  minutes: 20
};


const partsLondon = (d = new Date()) => {
  const s = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London', year:'numeric', month:'2-digit', day:'2-digit'}).format(d);
  const [y, m, day] = s.split('-').map(Number);
  return {y, m, d: day};
};
const P = partsLondon();
const TODAY = new Date(Date.UTC(P.y, P.m - 1, P.d));
const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const addMonths = (d, n) => {                    
  const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m + n, Math.min(day, last)));
};
const isWorkingDay = d => ![0, 6].includes(d.getUTCDay());
const addWorkingDays = (d, n) => { let out = d, left = n; while (left > 0) { out = addDays(out, 1); if (isWorkingDay(out)) left--; } return out; };
const nextWorkingDay = d => isWorkingDay(d) ? d : addWorkingDays(d, 1);
const fmtDate = d => new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'}).format(d);
const fmtShort = d => new Intl.DateTimeFormat('en-GB', {weekday:'short', day:'numeric', month:'short', timeZone:'UTC'}).format(d);
const fmtDay = d => new Intl.DateTimeFormat('en-GB', {weekday:'long', day:'numeric', month:'long', timeZone:'UTC'}).format(d);
const fmtMonthYear = d => new Intl.DateTimeFormat('en-GB', {month:'long', year:'numeric', timeZone:'UTC'}).format(d);
const iso = d => d.toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
const inWords = d => { const n = daysBetween(TODAY, d); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 0 ? 'in ' + n + ' days' : Math.abs(n) + ' days ago'; };
const gbp = n => new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP', maximumFractionDigits:0}).format(n);

const pence = (el, on) => { if (el) el.hidden = !on; };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];


const PAGES = [
  ['index.html', 'Home', '00'], ['services.html', 'What we do', '01'], ['pricing.html', 'Fees', '02'],
  ['sector-trades.html', 'Building trades', '03'], ['sector-landlords.html', 'Landlords', '04'],
  ['people.html', 'Who you deal with', '05'], ['proof.html', 'Client stories', '06'],
  ['insight-mtd-itsa.html', 'Making Tax Digital', '07'], ['insight-deadlines.html', 'Your deadlines', '08'],
  ['switching.html', 'Moving to us', '09'], ['book.html', 'Book a call', '10'], ['legal.html', 'Legal & regulatory', '11']
];

function buildMenu () {
  const opener = $('.menu-open');
  if (!opener) return;
  const here = (location.pathname.split('/').pop() || 'index.html');
  const dlg = document.createElement('dialog');
  dlg.id = 'menu';
  dlg.innerHTML =
    '<div class="menu-inner"><div class="menu-top"><span class="brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i></span>tallymere</span>' +
    '<button class="quiet" data-close>Close &times;</button></div><nav aria-label="All pages"><ol>' +
    PAGES.map(([href, label, no]) =>
      '<li><a href="./' + href + '"' + (href === here ? ' aria-current="page"' : '') + '>' + label + '<span>' + no + '</span></a></li>').join('') +
    '</ol></nav><p class="menu-foot">Tallymere &middot; 14 Barlow Fold, West Didsbury, Manchester M20<br>' +
    '<a href="tel:01614960271">0161&nbsp;496&nbsp;0271</a> &middot; hello@tallymere.example</p></div>';
  document.body.append(dlg);
  const btn = document.createElement('button');
  btn.className = opener.className; btn.type = 'button';
  btn.innerHTML = opener.innerHTML;
  btn.setAttribute('aria-haspopup', 'dialog');
  opener.replaceWith(btn);
  btn.addEventListener('click', () => dlg.showModal());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
}

function wireDialogs () {
  $$('[data-dialog]').forEach(b => b.addEventListener('click', () => { const d = document.getElementById(b.dataset.dialog); if (d) d.showModal(); }));
  document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) c.closest('dialog')?.close(); });
}

function stampDates () {
  $$('[data-today]').forEach(el => { el.textContent = fmtDate(TODAY); });
  $$('[data-review-shown]').forEach(el => { el.textContent = fmtDate(new Date(el.dataset.reviewShown + 'T00:00:00Z')); });
}


function cashBook () {
  const out = $('#closing');
  if (!out) return;
  const sample = {opening:8400, receipts:18600, payments:14520, statement:12480};
  const balance = sample.opening + sample.receipts - sample.payments;
  out.textContent = gbp(balance);        
  $('#difference').textContent = 'Difference ' + gbp(balance - sample.statement);
  const previous = utc(P.y, P.m - 1, 1);                  
  $('#period').textContent = fmtMonthYear(previous);
}


function tariffFoot () {
  const cell = $('#tariff-total');
  if (!cell) return;
  cell.textContent = gbp(TARIFF.tiers.company.base + TARIFF.modifiers.vat);
}


function tradeRegister () {
  const out = $('#trade-filings');
  if (!out) return;
  
  const rows = $$('[data-count]', out.closest('table'));
  out.textContent = rows.reduce((n, td) => n + Number(td.dataset.count || 0), 0);
}


function subbieRegister () {
  const out = $('#subbie-total');
  if (!out) return;
  const rows = $$('[data-subbie]', out.closest('table'));
  out.textContent = rows.reduce((n, td) => n + Number(td.dataset.subbie || 0), 0);
}


function annualFees () {
  const cells = $$('[data-annual]');
  if (!cells.length) return;
  const n = v => new Intl.NumberFormat('en-GB').format(v);
  cells.forEach(td => {
    const k = td.dataset.annual;
    const monthly = k === 'example' ? TARIFF.tiers.company.base + TARIFF.modifiers.vat
      : k in TARIFF.modifiers ? TARIFF.modifiers[k]
      : TARIFF.tiers[k].base;
    td.textContent = n(monthly * 12);
  });
}


function askAfter () {
  const cells = $$('[data-after]');
  if (!cells.length) return;
  const start = nextWorkingDay(TODAY);
  cells.forEach(td => {
    const n = Number(td.dataset.after || 0);
    td.textContent = fmtShort(n === 0 ? start : addWorkingDays(start, n));
  });
}


function feeEstimator () {
  const entity = $('#entity');
  if (!entity) return;
  const scope = $('#scope'), vat = $('#vat'), payroll = $('#payroll');
  const fee = $('#fee-total'), state = $('#fee-state'), feePence = $('#fee-pence');
  const basePence = $('#base-amount') && $('#base-amount').parentElement.querySelector('.pc');
  const modPence  = $$('.item .amount .pc').filter(el => el !== feePence && el !== basePence);
  const DEFAULT_STATE = 'Sample company · VAT returns included';
  let cleared = false;

  function render () {
    if (cleared) {
      pence(feePence, false); pence(basePence, false); modPence.forEach(el => pence(el, false));
      fee.textContent = '—';
      state.textContent = 'Cleared. Choose a business type, or reset the sample.';
      publish(''); return;
    }
    const t = TARIFF.tiers[entity.value];
    if (!t) {                                            
      pence(feePence, false);
      fee.textContent = '—';
      state.textContent = 'Choose a business type to continue.';
      publish(''); return;
    }
    $('#base-name').textContent = t.name;
    $('#base-detail').textContent = t.detail;
    $('#base-amount').textContent = gbp(t.base);
    pence(basePence, true);
    const landlord = entity.value === 'landlord';
    [vat, payroll].forEach(c => {
      c.disabled = landlord;
      if (landlord) c.checked = false;
      c.closest('.item').classList.toggle('disabled', landlord);
    });
    modPence.forEach(el => pence(el, true));
    if (scope.value === 'complex') {                     
      pence(feePence, false);
      fee.textContent = 'Let’s talk';
      fee.style.fontSize = '28px';
      state.textContent = 'Outside this example’s scope. A fee for that needs a conversation, not a calculator.';
      publish('fee estimator: ' + t.name + ', outside the example scope — no figure given'); return;
    }
    fee.style.fontSize = '';
    pence(feePence, true);
    const total = t.base + (vat.checked ? TARIFF.modifiers.vat : 0) + (payroll.checked ? TARIFF.modifiers.payroll : 0);
    fee.textContent = gbp(total);
    state.textContent = landlord
      ? 'Landlord sample excludes VAT returns and payroll.'
      : 'Illustrative fee only. No information is sent.';
    publish('fee estimator: ' + t.name + ' ' + gbp(t.base)
      + (vat.checked ? ' + VAT returns ' + gbp(TARIFF.modifiers.vat) : '')
      + (payroll.checked ? ' + payroll ' + gbp(TARIFF.modifiers.payroll) : '')
      + ' = ' + gbp(total) + ' a month excluding VAT (illustrative)');
  }

  
  let touched = false;
  function publish (text) { document.dispatchEvent(new CustomEvent('tm:instrument', {detail:{id:'fee-estimator', text, touched}})); }

  [entity, scope, vat, payroll].forEach(el => el.addEventListener('change', () => { cleared = false; touched = true; render(); }));

  $('#reset-fees').addEventListener('click', () => {
    cleared = false; touched = true;
    entity.value = 'company'; scope.value = 'standard';
    vat.disabled = false; payroll.disabled = false;
    vat.checked = true; payroll.checked = false;
    render(); state.textContent = DEFAULT_STATE;
  });
  $('#clear-fees').addEventListener('click', () => {
    cleared = true; touched = true;
    entity.selectedIndex = -1; scope.value = 'standard';
    vat.checked = false; payroll.checked = false;
    vat.disabled = true; payroll.disabled = true;
    $('#base-name').textContent = 'Choose your business';
    $('#base-detail').textContent = 'A new example starts with the business type';
    $('#base-amount').textContent = '—';
    render(); entity.focus();
  });

  render();
  state.textContent = DEFAULT_STATE;   
}


const RULES = {
  ch_accounts : 'Companies House accounts: nine months after the year end, for a private company.',
  ct_payment  : 'Corporation Tax payment: nine months and one day after the end of the accounting period.',
  ct_return   : 'Company Tax Return (CT600): twelve months after the end of the accounting period.',
  sa_online   : 'Self Assessment online return and balancing payment: 31 January after the tax year ends on 5 April.',
  sa_paper    : 'Self Assessment paper return: 31 October after the tax year ends on 5 April.',
  poa         : 'Payments on account: 31 January and 31 July.',
  p11d        : 'P11D and P11D(b) for employee benefits: 6 July after the tax year ends on 5 April.',
  vat         : 'VAT return and payment: one month and seven days after the end of the VAT quarter.',
  paye        : 'PAYE and NIC paid electronically: the 22nd of the following tax month. Check current HMRC guidance.',
  mtd         : 'MTD for Income Tax quarterly updates: 7 August, 7 November, 7 February and 7 May. Check current HMRC guidance — the quarterly dates were not confirmed against gov.uk for this example.'
};

function statutoryDates (opts) {
  const {yearEndMonth = 3, yearEndDay = 31, vatStagger = 'mar'} = opts || {};
  const rows = [];
  const add = (when, tag, title, note, basis) => rows.push({when, tag, title, note, basis});

  
  if (yearEndMonth) {
    let ye = utc(P.y, yearEndMonth, yearEndDay);
    if (ye > TODAY) ye = utc(P.y - 1, yearEndMonth, yearEndDay);
    for (const k of [0, 1]) {
      const end = k ? addMonths(ye, 12) : ye;
      const label = 'period ended ' + fmtDate(end);
      add(addMonths(end, 9), 'Companies House', 'Accounts filed at Companies House',
        'Statutory accounts for the ' + label + ' reach Companies House.', RULES.ch_accounts);
      add(addDays(addMonths(end, 9), 1), 'Corporation Tax', 'Corporation Tax paid',
        'The tax on the ' + label + ' is paid before the return is due.', RULES.ct_payment);
      add(addMonths(end, 12), 'Corporation Tax', 'Company Tax Return filed',
        'The CT600 for the ' + label + ' is filed with HMRC.', RULES.ct_return);
    }
  }

  
  let tye = utc(P.y, 4, 5);
  if (tye > TODAY) tye = utc(P.y - 1, 4, 5);
  for (const k of [0, 1]) {
    const y = tye.getUTCFullYear() + k;
    const yr = (y - 1) + '–' + String(y).slice(2);
    add(utc(y, 10, 31), 'Self Assessment', 'Paper tax return deadline',
      'Paper returns for ' + yr + '. Filing online instead buys three more months.', RULES.sa_paper);
    add(utc(y + 1, 1, 31), 'Self Assessment', 'Tax return filed and tax paid',
      'The ' + yr + ' return is filed online and the balancing payment is made.', RULES.sa_online);
    add(utc(y + 1, 1, 31), 'Self Assessment', 'First payment on account',
      'Paid on the same day as the balancing payment for ' + yr + '.', RULES.poa);
    add(utc(y + 1, 7, 31), 'Self Assessment', 'Second payment on account',
      'The second instalment towards the following year’s tax.', RULES.poa);
    add(utc(y, 7, 6), 'PAYE', 'P11D and P11D(b) filed',
      'Benefits in kind reported for ' + yr + ', if any were provided.', RULES.p11d);
  }

  
  if (vatStagger !== 'none') {
    const months = {mar:[3, 6, 9, 12], jan:[1, 4, 7, 10], feb:[2, 5, 8, 11]}[vatStagger] || [3, 6, 9, 12];
    for (const y of [P.y - 1, P.y, P.y + 1]) {
      for (const m of months) {
        const qEnd = new Date(Date.UTC(y, m, 0));                 
        add(addDays(addMonths(qEnd, 1), 7), 'VAT', 'VAT return filed and paid',
          'The quarter ending ' + fmtDate(qEnd) + ' is filed and the VAT paid.', RULES.vat);
      }
    }
  }

  
  for (let k = -1; k < 4; k++) {
    const due = addMonths(utc(P.y, P.m, 22), k);
    add(due, 'PAYE', 'PAYE and NIC paid to HMRC',
      'For the tax month ending the 5th of ' + fmtMonthYear(addMonths(due, -1)) + '.', RULES.paye);
  }

  
  for (const y of [P.y, P.y + 1]) {
    [[8, 7, '6 April – 5 July'], [11, 7, '6 July – 5 October'], [2, 7, '6 October – 5 January'], [5, 7, '6 January – 5 April']]
      .forEach(([m, d, period]) => add(utc(y, m, d), 'MTD', 'Quarterly update sent to HMRC',
        'The quarterly update covering ' + period + '.', RULES.mtd));
  }

  const from = addDays(TODAY, -75), to = addDays(TODAY, 400);
  return rows.filter(r => r.when >= from && r.when <= to).sort((a, b) => a.when - b.when);
}


function deadlineCalendar () {
  const list = $('#calendar');
  if (!list) return;
  const yearEnd = $('#year-end'), stagger = $('#vat-stagger'), state = $('#cal-state');
  const filters = $('.cal-filters'), counted = $('#cal-count');
  let tag = 'All';

  function options () {
    const v = yearEnd.value;
    if (v === 'other') return {yearEndMonth: 0, out: true};
    const [m, d] = v.split('-').map(Number);
    return {yearEndMonth: m, yearEndDay: d, out: false};
  }

  function render () {
    const o = options();
    const rows = statutoryDates({yearEndMonth: o.yearEndMonth, yearEndDay: o.yearEndDay, vatStagger: stagger.value});
    const shown = rows.filter(r => tag === 'All' || r.tag === tag);
    list.replaceChildren();
    if (!shown.length) {
      const p = document.createElement('p');
      p.className = 'cal-empty';
      p.textContent = stagger.value === 'none' && tag === 'VAT'
        ? 'No VAT dates: this example is set to “not VAT registered”. Change the VAT setting or choose another category.'
        : 'Nothing falls in this category over the next twelve months for the settings you have chosen.';
      list.append(p);
    } else {
      shown.forEach(r => {
        const days = daysBetween(TODAY, r.when);
        const row = document.createElement('article');
        row.className = 'cal-row' + (days < 0 ? ' past' : '');
        if (days >= 0 && days <= 30) row.dataset.urgency = 'now';
        row.innerHTML =
          '<p class="cal-when">' + fmtDate(r.when) + '<small>' + inWords(r.when) + '</small></p>' +
          '<div class="cal-what"><h3></h3><p></p><span class="basis"></span></div>' +
          '<p class="cal-tag"></p>';
        row.querySelector('h3').textContent = r.title;
        row.querySelector('.cal-what p').textContent = r.note;
        row.querySelector('.basis').textContent = 'Rule used: ' + r.basis;
        row.querySelector('.cal-tag').textContent = r.tag;
        list.append(row);
      });
    }
    counted.textContent = shown.length;
    const upcoming = shown.find(r => r.when >= TODAY);
    state.textContent = o.out
      ? 'Your year end is not one of the sample dates, so the company deadlines are not shown. The Self Assessment, VAT, PAYE and MTD rules below do not depend on a year end. Tell us your year end and we will work the rest out with you.'
      : (upcoming
        ? 'Worked from today, ' + fmtDate(TODAY) + '. Next up: ' + upcoming.title.toLowerCase() + ' on ' + fmtDate(upcoming.when) + ' — ' + inWords(upcoming.when) + '.'
        : 'Nothing upcoming in this category. Choose another category or reset the example.');
  }

  [yearEnd, stagger].forEach(el => el.addEventListener('change', render));
  filters.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    tag = b.dataset.tag;
    $$('button', filters).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  $('#cal-reset').addEventListener('click', () => {
    yearEnd.value = '3-31'; stagger.value = 'mar'; tag = 'All';
    $$('button', filters).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.tag === 'All')));
    render();
    state.textContent = 'Sample reset: a 31 March year end, VAT quarters ending March, June, September and December, worked from today, ' + fmtDate(TODAY) + '.';
  });
  render();
}


function nextDue () {
  const el = $('#next-due-date');
  if (!el) return;
  
  const COMPANY = ['Companies House', 'Corporation Tax', 'VAT'];
  const row = statutoryDates({}).find(r => r.when >= TODAY && COMPANY.includes(r.tag));
  el.textContent = fmtDate(row.when);
  $('#next-due-what').textContent = row.title.toLowerCase();
  $('#next-due-when').textContent = inWords(row.when);
  $('#next-due-basis').textContent = 'Rule used: ' + row.basis + ' Worked from today, ' + fmtDate(TODAY) + ', against a sample 31 March year end with VAT quarters ending March, June, September and December.';
}


function bookingDiary () {
  const root = $('#diary');
  if (!root) return;
  const state = $('#diary-state'), windowSel = $('#diary-window');
  let selected = null, empty = false, out = false, touched = false;

  const days = (() => {
    const list = []; let d = TODAY;
    while (list.length < DIARY.days) { d = addWorkingDays(d, 1); list.push(d); }
    return list;
  })();
  const isHeld = (i, t) => i === DIARY.held.day && t === DIARY.held.time;

  function publish () {
    const text = selected
      ? 'book a call: ' + fmtDay(selected.date) + ' at ' + selected.time + ' UK, ' + DIARY.minutes + ' minutes (sample diary, nothing reserved)'
      : '';
    document.dispatchEvent(new CustomEvent('tm:instrument', {detail:{id:'book-a-call', text, touched}}));
  }

  function paint () {
    $$('.slot', root).forEach(b => {
      if (b.disabled) return;
      const on = selected && b.dataset.key === selected.i + '|' + selected.time;
      b.setAttribute('aria-pressed', String(!!on));
    });
    publish();
  }

  function render () {
    root.replaceChildren();
    if (out) {
      const p = document.createElement('p');
      p.className = 'diary-empty';
      p.textContent = 'The sample diary only runs to ' + fmtDate(days[days.length - 1]) + '. For a date beyond that, say so in the message below and we will come back with times.';
      root.append(p);
      state.textContent = 'Outside the sample diary. No times are shown for that window.';
      selected = null; publish(); return;
    }
    if (empty) {
      const p = document.createElement('p');
      p.className = 'diary-empty';
      p.textContent = 'Nothing free on these three days. This is what an empty diary looks like — restore the sample, or ask for a time in the message below.';
      root.append(p);
      state.textContent = 'No sample times available. Restore the sample times to try again.';
      selected = null; publish(); return;
    }
    days.forEach((date, i) => {
      const sec = document.createElement('section');
      sec.className = 'day';
      const h = document.createElement('h3');
      h.innerHTML = '<b></b> · working day ' + (i + 1) + ' from today';
      h.querySelector('b').textContent = fmtDay(date);
      const row = document.createElement('div');
      row.className = 'slot-row';
      DIARY.times.forEach(time => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'slot';
        b.dataset.key = i + '|' + time;
        b.textContent = time + ' UK';
        if (isHeld(i, time)) { b.disabled = true; b.append(document.createTextNode(' · taken')); }
        else {
          const on = selected && selected.i === i && selected.time === time;
          b.setAttribute('aria-pressed', String(!!on));
          b.addEventListener('click', () => {
            
            selected = {i, date, time}; touched = true; paint();
            state.textContent = 'Sample time chosen: ' + fmtDay(date) + ' at ' + time + ' UK, ' + DIARY.minutes + ' minutes. Nothing is booked and nobody will call — tick the box below to carry it into your message.';
          });
        }
        row.append(b);
      });
      sec.append(h, row);
      root.append(sec);
    });
    publish();
  }

  windowSel.addEventListener('change', () => { out = windowSel.value === 'later'; empty = false; touched = true; render(); });
  $('#diary-none').addEventListener('click', e => {
    empty = !empty; out = false; windowSel.value = 'next'; touched = true;
    e.currentTarget.textContent = empty ? 'Restore the sample times' : 'Show me an empty diary';
    render();
  });
  $('#diary-clear').addEventListener('click', () => {
    selected = null; touched = true; render();
    state.textContent = 'Selection cleared. Choose a time, or leave it and tell us when suits in the message below.';
  });
  $('#diary-reset').addEventListener('click', () => {
    empty = false; out = false; windowSel.value = 'next'; touched = false;
    selected = {i:0, date:days[0], time:DIARY.times[0]};
    render();
    state.textContent = 'Sample reset: ' + fmtDay(days[0]) + ' at ' + DIARY.times[0] + ' UK. Illustrative times only — nothing is booked.';
  });

  selected = {i:0, date:days[0], time:DIARY.times[0]};   
  render();
  state.textContent = 'Worked example: ' + fmtDay(days[0]) + ' at ' + DIARY.times[0] + ' UK, ' + DIARY.minutes + ' minutes. These are sample times computed from today, not real availability.';
}


function switchingFlow () {
  const start = $('#switch-start');
  if (!start) return;
  const yearEnd = $('#switch-year-end'), state = $('#flow-state');
  start.value = iso(TODAY);
  start.min = iso(addDays(TODAY, -30));

  function render () {
    const raw = start.value;
    const d = raw ? new Date(raw + 'T00:00:00Z') : null;
    const set = (id, when, note) => {
      $('#' + id).textContent = when;
      $('#' + id + '-note').textContent = note;
    };
    if (!d || isNaN(d)) {                                   
      ['step1', 'step2', 'step3'].forEach(id => set(id, '—', 'Waiting for a start date.'));
      state.textContent = 'That is not a date we can work from. Pick a day, or reset the example to today.';
      $('#switch-first-deadline').textContent = '—'; return;
    }
    if (d < addDays(TODAY, -30)) {
      ['step1', 'step2', 'step3'].forEach(id => set(id, '—', 'Start dates more than a month in the past are not worked here.'));
      state.textContent = 'That date has passed. If a handover stalled a while ago, that is a conversation rather than a calculator — call us.';
      $('#switch-first-deadline').textContent = '—'; return;
    }
    if (d > addMonths(TODAY, 12)) {                         
      ['step1', 'step2', 'step3'].forEach(id => set(id, '—', 'Beyond the twelve months this example plans.'));
      state.textContent = 'That is more than a year ahead. Worth a conversation nearer the time — the clearance letter is only useful once you have decided.';
      $('#switch-first-deadline').textContent = '—'; return;
    }
    const s1 = nextWorkingDay(d);
    const s2 = addWorkingDays(s1, 2);
    const s3 = addWorkingDays(s2, 10);
    set('step1', fmtDate(s1), 'The day you say yes' + (isWorkingDay(d) ? '.' : ' — the next working day after ' + fmtDate(d) + '.'));
    set('step2', fmtDate(s2), 'Two working days after we have your authority.');
    set('step3', fmtDate(s3), 'Ten working days is what we plan for; some practices reply the same week.');
    const [m, dd] = yearEnd.value.split('-').map(Number);
    const rows = statutoryDates({yearEndMonth:m, yearEndDay:dd});
    
    const OWNED = ['Companies House', 'Corporation Tax', 'VAT', 'Self Assessment'];
    const first = rows.find(r => r.when >= s3 && OWNED.includes(r.tag));
    $('#switch-first-deadline').textContent = first ? fmtDate(first.when) + ' — ' + first.title.toLowerCase() : '—';
    state.textContent = 'Worked from ' + fmtDate(d) + '. Handover complete by ' + fmtDate(s3)
      + '. Working days only; no allowance made for bank holidays. Illustrative — nothing is requested from anybody by this page.';
  }

  [start, yearEnd].forEach(el => el.addEventListener('change', render));
  start.addEventListener('input', render);
  $('#switch-reset').addEventListener('click', () => { start.value = iso(TODAY); yearEnd.value = '3-31'; render(); state.textContent = 'Reset to today, ' + fmtDate(TODAY) + ', and a 31 March year end.'; });
  $('#switch-clear').addEventListener('click', () => { start.value = ''; render(); start.focus(); });
  render();
}


function enquiryForm () {
  const form = $('#enquiry');
  if (!form) return;
  const carry = $('#carry'), carryText = $('#carry-text'), stateField = form.elements.instrument_state;
  const states = {};
  form.elements.page.value = (location.pathname.split('/').pop() || 'index.html');

  function refresh () {
    const text = Object.values(states).filter(Boolean).join(' · ');
    carryText.textContent = text || 'Nothing yet — choose a time above and it will appear here.';
    carry.disabled = !text;
    stateField.value = (carry.checked && text) ? text : '';
  }
  document.addEventListener('tm:instrument', e => {
    states[e.detail.id] = e.detail.text;
    if (e.detail.touched && e.detail.text) carry.checked = true;   
    refresh();
  });
  carry.addEventListener('change', refresh);
  form.addEventListener('submit', e => {
    if (form.elements.company_website.value !== '') { e.preventDefault(); return; }
    refresh();
    $('#ask-status').textContent = 'Demonstration only — no enquiry is sent.';
  });
  refresh();
}


function actionBarYield () {
  const bar = document.querySelector('.mobile-action');
  if (!bar) return;
  const live = () => getComputedStyle(bar).position === 'fixed';
  
  const restTop = () => innerHeight - bar.offsetHeight;
  const overlaps = el => {
    const a = el.getBoundingClientRect();
    return a.height > 0 && a.bottom > restTop() - 8 && a.top < innerHeight;
  };
  
  const settle = el => {
    const check = () => {
      if (!live() || bar.contains(el) || document.activeElement !== el) return true;
      if (overlaps(el)) { document.body.classList.add('bar-yield'); return true; }
      return false;
    };
    requestAnimationFrame(() => requestAnimationFrame(check));
    [120, 260, 420, 700].forEach(ms => setTimeout(check, ms));
    addEventListener('scrollend', check, {once: true});
  };
  document.addEventListener('focusin', e => {
    const el = e.target;
    if (!live() || bar.contains(el)) return;
    if (overlaps(el)) document.body.classList.add('bar-yield');
    settle(el);
  });
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      const a = document.activeElement;
      
      if (!a || a === document.body || bar.contains(a) || !overlaps(a)) {
        document.body.classList.remove('bar-yield');
      }
    }, 0);
  });
}


buildMenu(); wireDialogs(); stampDates(); actionBarYield();
enquiryForm();          
cashBook(); tariffFoot(); tradeRegister(); subbieRegister(); annualFees(); askAfter();
feeEstimator(); nextDue(); deadlineCalendar(); bookingDiary(); switchingFlow();
