
let names;
const Table = async () => {
    Table.loading(true);
    names = await DB.get.names();
    await Promise.all([Table.fetch('prod-new').then(() => Table.fetch('prod-old')), location.hash == '#BBG' && BBG()]);
    $('#regular').tablesorter();
    Table.loading(false);
    Find() || (Table.count(), Table.flush());
}
Object.assign(Table, {
    limit: 'B-180',
    loading(is) {
        Q('#regular caption').classList.toggle('loading', is);
        Q('input:not([type])', input => input.disabled = input.value = is ? 'Loading' : '');
    },
    async fetch(key, tbody = '#regular tbody') {
        let beys = await DB.get('html', key);
        if (typeof beys == 'string') {
            beys = [...Object.assign(document.createElement('template'), {innerHTML: beys.replaceAll(/(?<=more\d: ?)'([^']+?)'/g, '"$1"')}).content.children];
            Q(tbody).append(...beys);
        } else {
            beys = await beys.reduce((prev, bey) => prev.then(async arr => [...arr, await new Row().create(bey, tbody)]), Promise.resolve([]));
            DB.put('html', [key, Table.trim(beys)]);
        }
        beys.forEach(tr => (tr.classList.toggle('old', key == 'prod-old'), Row.connectedCallback(tr)));
    },
    flush(update = false) {
        document.body.scrollWidth > 666 ?
            Table.colspan(Q('#jap').checked ? 'cjk' : 'both') : Table.colspan(Q('#eng').checked ? 'eng' : 'cjk');
        update && $('#regular').trigger('update', [false]);
    },
    colspan(lang) {
        let colspan = {eng: [5, 1], cjk: [1, 5]}[lang] ?? [2, 4];
        Q('td[data-part$=layer],tbody td:not([data-part]):nth-child(2)', td => new Cell(td).next2(({td}, i) => td.colSpan = colspan[i]));
        Q('table', table => table.classList.toggle('bilingual', lang == 'both'));
    },
    reset() {
        Find.state(false);
        location.search && history.pushState('', '', '/products/');
        Filter.inputs.forEach(input => input.checked = true);
        Q('#filter').classList.remove('active');
        Q('tr[hidden],tr.hidden', tr => tr.classList.toggle('hidden', tr.hidden = false));
        Q('#regular').classList.add('new');
        Table.count();
    },
    entire: () => (Q('#regular').classList.remove('new'), Table.flush(true)),
    count: () => Q('.prod-result').value = document.querySelectorAll(`tbody tr:not(.hidden):not([hidden])`).length,
    trim: rows => rows.reduce((html, tr) => html += tr.outerHTML, '').replace(/<\/t[dr]>|\s(?=>)|\s(?:\s+)/g, '').replaceAll('"', "'"),
});
const BBG = clicked => Q('#BBG tr') || Promise.all([BBG.beys(clicked), BBG.others()]);
Object.assign(BBG, {
    beys: clicked => Table.fetch('prod-BBG-bey', '#BBG tbody').then(() => {
        Q('#regular tr[data-no^=BBG]', tr => tr.remove());
        clicked ? Find() || (Filter.filter(), Table.flush()) : null;
    }),
    others: () => DB.get('html', 'prod-BBG-other').then(others => {
        if (typeof others == 'string')
            return Q('.boards').innerHTML = others;
        Q('.boards').append(...others.map(BBG.board));
        DB.put('html', ['prod-BBG-other', Q('.boards').innerHTML]);
    }),
    board: ([no, img, text]) => Object.assign(document.createElement('li'), {
        innerHTML: `<code>${no}</code>${img ? `<img src=${/^[^/]{15,}$/.test(img) ? `https://pbs.twimg.com/media/${img}?format=png&name=large` : img} alt=${no}>` : ''}${text ?? '不明'}`
    })
});

const Filter = () => {
    let type = Q('#filter label[for]').map(label => label.htmlFor);
    Q('style:empty').innerText += type.map(id => `#${id}:not(:checked)~#filter label[for=${id}]`) + '{opacity:.5;background-color:initial !important;}';
    Q('#filter').before(...type.map(id => Object.assign(document.createElement('input'), {id, name: 'filter', type: 'checkbox', checked: true})));
    [Filter.inputs, Filter.systems] = [Q('input[name=filter]'), Q('#RB-H~input[name=filter]')];
}
Filter.filter = () => {
    let hide = Filter.inputs.filter(i => !i.checked).map(i => `.${i.id.replace('-', '.')}`);
    Q('#filter').classList.toggle('active', hide.length);
    Q('tbody tr', tr => tr.classList.toggle('hidden', hide.length && tr.matches(hide)));
    Filter.systems.some(input => !input.checked) && Q('tr[data-abbr^="/"]', tr => tr.classList.add('hidden'));
    Table.count();
};

const Find = () => {
    Find.regex = [], Find.more = [], Find.prefix = [], Find.wanted = {}, Find.free = '';
    for (const w of ['free', 'form', 'query'])
        if (Find.read(w)) 
            return Find.process(w).buildRegex().findBeys();
};
Object.assign(Find, {
    esc: string => (string ?? '').replaceAll(' ', '').replace(/[’'ʼ´ˊ]/g, '′').replace(/([^\\])?([.*+?^${}()|[\]\\])/g, '$1\\$2'),
    alias: new Mapping(/^A$/i, ['A', 'Ɐ'], /^B$/i, ['B', 'Ｂ'], /^D$/i, ['D', 'Ｄ'], /^T$/i, ['T', 'Ｔ'], /^V$/i, ['V', 'Ｖ']),
    
    existing: (comp, input, searchNames = false) => 
        Object.entries(names[comp]).reduce((arr, [sym, names]) => 
            new RegExp(`^${Find.esc(input)}$`, 'i').test(sym) || 
            searchNames && !/^[^一-龥]{1,2}(′|\\\+)?$/.test(input) && Object.values(names).some(n => new RegExp(Find.esc(input), 'i').test(n)) ?
            [...arr, sym] : arr,
        []),
    format: (comp, typed) => {
        if (/^layer\d.$/.test(comp))
            return Find.alias.find(typed);
        if (comp == 'disk' && /^\d+\D|.*\+S$/i.test(typed)) 
            return typed.replace(/([a-z])/, l => l.toUpperCase());
        if (comp == 'driver') {
            let [, prefix, driver, dash] = typed.match(/^([HM])?\\?([^′]+)?(′)?.*$/i);
            [prefix, driver, dash] = [(prefix ?? '').toUpperCase(), (driver ?? '').toLowerCase(), dash ?? ''];
            return Object.keys(names.driver).map(sym => 
                sym == prefix + driver ? sym + dash : // Mr M 
                sym == driver[0]?.toUpperCase() + driver.slice(1) ? prefix + sym + dash : ''// R MA
            ).filter(sym => sym);
        }
    },
    read(where) {
        if (where == 'free') 
            return Find.free = Q('#free').value;
        Find.wanted = Object.fromEntries(
            [...where == 'form' ? new FormData(Q('form')) : new URLSearchParams(location.search)]
            .filter(([k, v]) => k && v).map(([k, v]) => [k, decodeURIComponent(v).split('/')])
        );
        return Object.keys(Find.wanted).length > 0;
    },
    process(where) {
        Object.keys(names).forEach(comp => {
            let inputs = where == 'form' ? Find.wanted[comp] : where == 'free' ? [Find.free] : null;
            inputs = inputs?.map(typed => [Find.format(comp, typed), Find.existing(comp, typed, where == 'free')]) ?? Find.wanted[comp] ?? [];
            inputs = [...new Set(inputs.flat(9))].filter(s => s);
            if (!inputs.length) 
                return delete Find.wanted[comp];
            Find.more.push(...inputs.map(s => `${s}.${comp}`));
            Find.wanted[comp] = inputs.map(s => (/^\+/.test(s) ? '[^ .]+' : '') + Find.esc(s));
        });
        if (where == 'free') {
            let terms = {H: /^high|ハイ|高位$/i, M: /^metal|メタル|金屬$/i};
            Find.prefix = ['H', 'M'].filter(p => terms[p].test(Find.free));
            Find.free = Find.esc(Find.free);
        }
        Find.wanted.driver?.includes('[^ .]+\\+S') && (Find.wanted.disk ??= []).push('[^ .]+\\+S');
        return this;
    },
    buildRegex() {
        if (Find.free?.length > 3)
            Find.regex.push(new RegExp(Find.free, 'i'));
        let s = Find.wanted;
        if (s.layer7b)
            Find.regex.push(new RegExp('^(' + s.layer7b.join('|') + ')-.+-[HL\\d]+ .+$', 'u'));
        if (s.layer7c)
            Find.regex.push(new RegExp('^.+-(' + s.layer7c.join('|') + ')-[HL\\d]+ .+$', 'u'));
        if (s.layer6r)
            Find.regex.push(new RegExp('^(' + s.layer6r.join('|') + ')(\\+.+)?-.+-(\\d[ABDS]|!(?= [超王皇])) .+$', 'u'));
        if (s.layer6c)
            Find.regex.push(new RegExp('^.+-(' + s.layer6c.join('|') + ')-(\\d[ABDS]|!(?= [超王皇])) .+$', 'u'));
        if (s.layer5b)
            Find.regex.push(new RegExp('^(' + s.layer5b.join('|') + ')-.+-\\W [^超王皇]+$', 'u'));
        if (s.layer5c)
            Find.regex.push(new RegExp('^.+-(' + s.layer5c.join('|') + ')-\\W [^超王皇]+$', 'u'));
        if (s.layer5w || s.layer6s || s.layer7a)
            Find.regex.push(new RegExp('^.+-.+-(' + [...s.layer5w ?? [], ...s.layer6s ?? [], ...s.layer7a ?? []].join('|') + ') .+$', 'u'));
        if (s.layer)
            Find.regex.push(new RegExp('^(' + s.layer.join('|') + ') .+$', 'u'));
        if (s.disk)
            Find.regex.push(new RegExp('^.+? (' + s.disk.join('|') + ')\\+?[^a-z]? .+$'));
        if (s.frame)
            Find.regex.push(new RegExp('^.+? [^A-Za-z]+(' + s.frame.join('|') + ') .+$', 'u'));
        if (s.driver) 
            Find.regex.push(new RegExp('^.+? [MH]?(' + s.driver.join('|') + ')′?(\\+[^a-z]?)?$', 'u'));
        if (Find.free == '′' || Find.prefix?.length)
            Find.regex.push(new RegExp('^.+? (.+ )?' + (Find.prefix.length ? `[${Find.prefix.join('')}][A-ZαβΩ].*` : '[^ ]+') + (Find.free == '′' ? '′' : '')));
        return this;
    },
    findBeys() {
        Q('#regular.new') && Table.entire();
        Q('tbody tr', tr => tr.hidden = !(
            tr.no.match(/\d+/) == Find.free ||
            Find.regex.some(regex => regex.test(tr.abbr)) || 
            tr.more?.split(',').some(m => Find.more.includes(m)) || 
            /-|wbba/i.test(Find.free) && new RegExp(Find.free.replace(/wbba/i, 'bbg'), 'i').test(tr.no)
        ));
        Find.state(true);
        return true;
    },
    state(searching) {
        Q('#regular').classList.toggle('searching', searching);
        Q('html,body', el => el.scrollTop = searching ? Q('tfoot').offsetTop : 0);
        Q('input:not([type])', input => searching ? input.blur() : input.value = '');
        Table.count(), Table.flush(true);
    },
    autofill(comp, sym) {
        Find.state(false);
        Q(`#${/layer7/.test(comp) ? 'DB' : /layer6/.test(comp) ? 'SP' : 'GT'}`).click();
        Q(`input[name=${comp}]`).value = sym;
        Find();
    }
});
