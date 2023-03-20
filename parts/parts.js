[Parts.comp, Parts.category] = [...new URLSearchParams(location.search)]?.[0] ?? [];
Parts = {
    ...Parts,
    list: () => Parts.firstly().then(Parts.listing).then(Parts.finally),
    catalog: () => Parts.firstly().then(Parts.before).then(Parts.cataloging).then(Parts.after).then(Parts.finally),
    count: group => Q('.part-result').value = group == 'LB' ? '3  3' : document.querySelectorAll('.catalog>a:not([id^="+"]):not([hidden])').length,

    firstly: async () => {
        Q('#menu').remove();
        await Part.firstly();
    },
    before: async () => {
        Parts.meta = (await DB.get('meta', Parts.comp))[Parts.category];
        ['info', 'title', 'label'].forEach(async m => {
            let meta = await DB.get('meta', m);
            Parts.meta[m] = Parts.meta.groups.reduce((obj, g) => ({...obj, [g]: meta[g] ?? Parts.meta[m]}), {});
        });
    },
    cataloging: async () => {
        let compare = (u, v, f = p => p) => +(f(u) > f(v)) || -(f(u) < f(v));
        let sorting = (p, q) => p.group == 'LB'  && compare(q, p, p => p.comp)
            || /^layer\d|MFB|BSB$/.test(p.group) && compare(q, p, p => p.group)
            || compare(p, q, p => p.sym[0] == '+')
            || p.group == 'layer7b'              && compare(p, q, p => p.sym.match(/[A-Z]/g)?.length) 
            || compare(p, q, p => parseInt(p.sym))
            || p.group == 'BSB'                  && compare(p, q, p => p.sym.match(/^..[^S]?/))
            || compare(p, q, p => p.strip('dash').toLowerCase());

        Parts.unmade = await Promise.all(Parts.meta.groups.map(g => DB.get.parts(g)));
        Parts.unmade = Parts.unmade.flat().map(p => new Part(p)).sort(sorting).map(p => p.prepare());
    },
    listing: async () => {
        Parts.unmade = await Promise.all(location.hash.substring(1).split(',').map(p => DB.get('parts', decodeURI(p))));
        Parts.unmade = Parts.unmade.map(p => new Part(p).prepare());
    },
    after: async () => {
        Ruler(), Filter();
        let hash = decodeURI(location.hash.substring(1));
        let target = Parts.unmade.find(p => p.sym == hash);
        await Q(`dl[title=group] #${(target?.group ?? hash) || Parts.meta.groups[0]}`)?.onchange(null, true);
        target?.sym && (location.hash = target.sym);
    },
    finally: async () => {
        Magnifier();
        Parts.comp || await Promise.all(Parts.unmade.map(p => p.catalog(true)));
        Q('.loading').classList.remove('loading');
    },
    switch: async group => {
        Parts.unmade = Parts.unmade.map(p => group == 'all' || group == p.group || /^\+/.test(p.sym) ? p.catalog() : p);
        Parts.unmade = (await Promise.all(Parts.unmade)).filter(p => p);
        if (group == 'all') return;
        location.hash = group;
        document.title = document.title.replace(/^.*?(?= ￨ )/, Parts.meta.title[group]);
        Q('details article').innerHTML = Parts.meta.info[group];
        Q('details').hidden = !Parts.meta.info[group];
    },
}

const Magnifier = () => {
    Q('nav').before(...Magnifier.inputs());
    Q('nav data').before(Magnifier.create());
    Q(`#${Cookie.pref?.button || 'mag2'}`).checked = true;
    Magnifier.range = Q('input[type=range]');
    Magnifier.events();
    Magnifier.switch();
};
Object.assign(Magnifier, {
    inputs: () => [1,2,3].map(n => Object.assign(document.createElement('input'), {id: `mag${n}`, type: 'radio', name: 'mag'})),
    create: () => Object.assign(document.createElement('div'), {
        classList: 'part-mag',
        innerHTML: `<input type=range min=0.75 max=2 value step=0.05>` + [1,2,3].map(n => `<label for=mag${n}></label>`).join('')
    }),
    events: () => {
        Q('input[name=mag]', input => input.onchange = () => input.checked && Cookie.set('pref', {button: input.id}));
        Magnifier.range.oninput = ev => (Q('.catalog').style.fontSize = `${ev.target.value}em`) && Cookie.set('pref', {slider: ev.target.value});
        window.onresize = Magnifier.switch;
    },
    switch: () => Q('.catalog').style.fontSize = window.innerWidth > 630 ? (Magnifier.range.value = Cookie.pref?.slider || 1) + 'em' : ''
});

const Filter = function(type) {
    return this instanceof Filter ? this.create(type).events().dl : Q('nav a').after(...Object.keys(Filter.args()).map(f => new Filter(f)));
};
Object.assign(Filter.prototype, {
    create: function(type) {
        let [dtText, {showAll, checkAll}, inputs] = Filter.args()[this.type = type];
        this.dl = Object.assign(document.createElement('dl'), {
            title: type,
            classList: `part-filter ${type == 'group' ? Parts.comp : ''} ${checkAll || showAll ? '' : 'radio'}`,
            innerHTML: `<dt>${dtText}` + inputs.map(i => `<dd><input type=checkbox id=${i.id}><label for=${i.id}>${i.text}</label>`).join('')
        });
        this.inputs = [...this.dl.querySelectorAll('input')];
        checkAll && this.inputs.forEach(input => input.checked = true);
        return this;
    },
    events: function() {
        this.dl.Q('dt').onclick = async () => {
            !this.dl.matches('.radio') && this.inputs.forEach(input => input.checked = true);
            await Filter.filter(this.type == 'group' && 'all');
        }
        this.inputs.forEach(input => input.onchange = async (ev, check) => {
            check ? input.checked = true : this.inputs.forEach(i => i.checked = i == input);
            await Filter.filter(this.type == 'group' && input.id);
        });
        return this;
    }
});
Object.assign(Filter, {
    args: () => ({
        group: [Parts.category, {showAll: Parts.meta.all}, Parts.meta.groups.filter(g => g != 'extra').map(g => ({id: g, text: Parts.meta.label[g] || g.replace(Parts.comp, '')}) )],
        type: ['類型', {checkAll: true}, Object.values(Parts.types).map((t, i) => ({id: t.substring(0, 3).toLowerCase(), text: ['攻','平','防','持'][i]}) )],
        spin: ['迴轉', {checkAll: true}, ['left:not(.right)', 'right:not(.left)'].map((s, i) => ({id: s, text: ['',''][i]}) )],
        mode: ['對應', {checkAll: true}, ['low', ':not(.low)'].map((m, i) => ({id: m, text: ['',''][i]}) )]
    }),
    filter: async group => {
        group && await Parts.switch(group);
        let hide = Q('.part-filter input').reduce((arr, input) => !input.checked ? [...arr, input.id] : arr, []);
        Q('.catalog>a[class]', a => a.hidden = hide.length && (
            a.for ? !a.for.find(part => Q(`#${part}:not([hidden])`)) : a.matches(hide.map(c => c.replace(/^(?!:)/, '.')))
        ));
        group && (Filter.toggle(), Ruler.switch(group));
        Parts.count(group);
    },
    toggle: () => {
        Q('dl[title=group]').hidden = false;
        Q('dl[title=type]').hidden = Q('a.nil:not([id^="+"]):not([hidden])') || Q('a.disk2');
        Q('dl[title=spin]').hidden = !Q('a.left:not([hidden]),a.right:not([hidden])');
        Q('dl[title=mode]').hidden = !Q('a.disk2') || !Q('a.low');
    }
});

const Ruler = function() {
    return this instanceof Ruler ? Reflect.construct(HTMLElement, [], Ruler) : Q('#catalog').after(new Ruler());
}
Ruler.prototype = Object.assign(HTMLElement.prototype, {
    connectedCallback: function() {
        this.attachShadow({mode: 'open'}).innerHTML = '<style>:host {display:none;}</style>' + 
            ['/include/common.css', 'ruler.css'].map(c => `<link rel=stylesheet href=${c}>`).join('') + 
            '<input type=checkbox id=show><label for=show></label><div></div>';
        this.classList = Parts.comp;        
    },
    attributeChangedCallback: function(_, __, group) {
        let max = Math.max(...[Q(`a.${group} dl div:nth-child(4) dd`)].flat().map(dd => +(dd?.innerText)).filter(w => !isNaN(w)));
        if (max < 0) return this.remove();
        let min = Math.max(0, max - 10);
        this.scale = (w, adj = 0) => parseFloat(Ruler.scale.find(group, Parts.category, Parts.comp)(w) + adj).toFixed(1);
        this.shadowRoot.Q('div').replaceChildren(...[...Array(max - min + 1)].map((_, w) => this.cell(w + min, w + min == max, group)));
    },
    cell: function(w, last, group) {
        let data = Object.assign(document.createElement('data'), {
            value: w,
            innerHTML: last ? '' : `<span>${this.scale(w)}</span>`
        });
        let adjust = /^layer5[bc]$/.test(group) ? 10 : Q('a:not([hidden])>object[data*=fusion]') ? 30 : 0;
        adjust && !last && data.Q('span').setAttribute('data-fusion', this.scale(w, adjust));
        return data;
    }
});
Object.assign(Ruler, {
    scale: new Mapping(
        /^layer(5[bw]|6[rs])|DB|塑膠$/,  w => w + 7,
        ['金屬', 'disk', 'LB'],          w => w + 17,
        ['layer5c', 'layer6c', 'frame'], w => w * .3 + 2.3,
        'driver',                        w => w * .5 + 5.4
    ),
    observedAttributes: ['group'],
    switch: group => group != 'all' && Q('weight-scale')?.setAttribute('group', group)
});
customElements.define('weight-scale', Ruler);
