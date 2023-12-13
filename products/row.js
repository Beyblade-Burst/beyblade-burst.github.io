class AbsPart {
    constructor(sym, fusion = false) {
        [this.sym, this.fusion] = [sym, fusion];
    }
    code(part = `${this.sym}.${this.constructor.name.toLowerCase()}`, symCode = this.symCode, fusion = this.fusion) {
        if (this.sym == '/') return this.none();
        let mode = part.match(/\+[^.′ ]+/)?.[0];
        mode ? symCode = symCode.replace(mode, '') + `<sub>${mode.replace(/\+(?=[sh])/, '')}</sub>` : null;
        return `<td data-part='${part}'>${symCode}<td class=left><td class='right${fusion ? ' fusion' : ''}'>`;
    }
    none = hidden => `<td><s>${hidden ? this.sym : 'ꕕ'}</s><td><td class=right>`;
    static number = (place, no) => '<td>' + no.replace(/^B-(?=\d\d)$/, 'B-<s>0</s>&nbsp;').replace(/BBG-.+/, place == '#BBG tbody' ? '$&' : 'wbba');
}
class Layer extends AbsPart {
    constructor(sym, upperFusion) {
        super(sym, upperFusion);
        this.symCode = sym == 'Sr' ? '<s>s</s>&nbsp;Sr' : sym.replace(/^[A-ZαβΩ][^αγ]?$/, '&nbsp;$&');
    }
    main(sym) {
        if (sym == '/')
            return this.none();
        if (this.system == 'layer7')
            return super.code(`${sym}.layer7b`, `<s>&lt;</s>${sym.length > 2 ? '' : '&nbsp;'}${sym.replace(/^([SK])(MR)$/, '$1<sub>$2</sub>')}`, false);
        if (this.system == 'layer6')
            return super.code(`${sym}.layer6r`, `<s>=</s>${sym}`, false);
        if (this.system == 'layer5')
            return super.code(`${sym}.layer5b`, `<s>&gt;</s>&nbsp;&nbsp;${sym}`, false);
    }
    motif(sym) {
        if (sym == '/')
            return this.none();
        if (this.system == 'layer7')
            return super.code(`${sym}.layer7c`, `<s>&lt;</s>${sym.replace(/[23]/, '<sup>$&</sup>')}`, false);
        if (this.system == 'layer6')
            return super.code(`${sym}.layer6c`, `<s>=</s>${sym.replace('2', '<sup>2</sup>')}`, false);
        if (this.system == 'layer5')
            return super.code(`${sym}.layer5c`, `<s>&gt;</s>${sym}`, sym == 'Ｄ');
    }
    metal(sym) {
        if (this.system == 'layer7')
            return `<td data-part='${sym}.layer7a'><s>.${/^\d$/.test(sym) ? '0' : ''}</s>${sym}`;
        if (this.system == 'layer6') {
            let code = {'!': '🚫'}[sym];
            return `<td${this.fusion ? ' class=fusion' : ''}${code ? '' : ` data-part='${sym}.layer6s'`}>${code ?? sym}`;
        }
        if (this.system == 'layer5') {
            let code = {'/': '<s>¬龘</s>', '!': '<s>¬</s>🚫'}[sym];
            return `<td${code ? '' : ` data-part='${sym}.layer5w'`}>${code ?? `<s>¬</s>${sym}`}`;
        }
    }
    async code() {
        let [main, motif, metal] = this.sym.split('-');
        if (metal) {
            this.system = /^[HL\d]+$/.test(metal) ? 'layer7' : /^\d[A-Z]$/.test(metal) || /2$/.test(motif) ? 'layer6' : 'layer5';
            return this.main(main) + this.motif(motif) + this.metal(metal); 
        }
        this.system = /^[A-Zα]$/.test(this.sym) ? 'layer1' : /^([A-Z]2|β)$/.test(this.sym) ? 'layer2' : (await DB.get('parts', `${this.sym}.layer`))?.group;
        return super.code();
    }
}
class Disk extends AbsPart {
    constructor(sym) {
        super(sym);                           // sort 0                       alphabet disk
        this.symCode = sym.replace(/^[0α]′?.$/, '<s>-</s>$&').replace(/^[^_\dα]+$/, '$&&nbsp;').replace('′', '<i>′</i>');
    }
}
class Driver extends AbsPart {
    constructor(sym, lowerFusion) {
        super(sym, lowerFusion);
        this.symCode = (lowerFusion ? '&nbsp;' : '') + sym.replace('+′', '<sub>+</sub>′').replace('′', '<s>#</s><i>′</i>') + (sym == '∞' ? '&nbsp;' : '');
    }
}

class Row {
    constructor(hidden = false) {
        this.tr = Object.assign(document.createElement('tr'), {hidden});
    }
    static connectedCallback(tr) {
        Row.fill(['eng', 'chi'], tr);
        ['no', 'abbr', 'more'].forEach(a => tr[a] = tr.getAttribute(`data-${a}`));
        tr.Q('td', td => td.onclick = () => new Cell(td).preview());
    }
    static fill(lang, tr) {
        tr.Q(`td[data-part]` + ['5w', '6s', '7a'].map(c => `:not([data-part$=layer${c}])`).join(''), td =>
            new Cell(td).next2((td, i) => lang[i] && td.code(lang[i]))
        );
    }
    async create([no, type, abbr, video, extra], place) {
        let [layer, disk, driver] = abbr.split(' ');
        if (disk && !driver) // lower fusion
            [layer, disk, driver] = [new Layer(layer), new Disk('/'), new Driver(disk, true)];
        else if (disk == '/' && driver != '/') // upper fusion
            [layer, disk, driver] = [new Layer(layer, true), new Disk(layer == 'nL' ? '_' : '/'), new Driver(driver)];
        else
            [layer, disk, driver] = [new Layer(layer), new Disk(disk), new Driver(driver)];

        this.tr.innerHTML = AbsPart.number(place, no.split('.')[0]) + await layer.code() + (driver.fusion ? driver.code() + driver.none(true) : disk.code() + driver.code());
        this.tr.classList = [type, layer.system ?? ''].join(' ');
        this.tr.setAttribute('data-no', no.split('.')[0]);
        this.tr.setAttribute('data-abbr', abbr);
        video && this.tr.setAttribute('data-video', video);

        this.extra(extra ?? {}).rare(parseFloat(no.split('-')[1]));
        return Q(place).appendChild(this.tr);
    }
    extra({chip, more}) {
        chip && this.any('layer6c', 'layer').append(Object.assign(document.createElement('img'), {src: `chips.svg#${chip}`}));
        more && this.tr.setAttribute('data-more', Object.keys(more));
        more && Object.entries(more).forEach(([part, column], i) => {
            if (part == '9.disk') return;
            this.tr.Q(`td:nth-child(${column})`).setAttribute('data-more', i);
            this.tr.style.setProperty(`--more${i}`, `'${part.split('.')[0]}'`);
        });
        return this;
    }
    rare(no) {
        let color = no >= 100 && Mapping.maps.rare.find(no);
        color && this.tr.style.setProperty('--rare', color);
    }
    any = (...tds) => this.tr.querySelector(tds.map(td => `td[data-part$=${td}]`));
}

class Cell {
    constructor(td) {this.td = td;}
    next2 = action => [new Cell(this.td.nextElementSibling), new Cell(this.td.nextElementSibling.nextElementSibling)].forEach(action);
    preview = () => Preview(this.td.matches('td:first-child') ? 'image' : 'part')(this.td);
    code = lang => {
        let {sym, comp, pref, dash, core, mode} = Dissect(this.td);
        let name = (comp == 'driver' && (pref || dash) ? Part.revise.name(sym, `${pref}`) : names[comp][sym])?.[lang] ?? '';
        this.td.innerHTML = this[lang](name, comp, core) + this.add(name, dash, mode);
        this.td.classList.toggle('small', name.length >= (Mapping.maps.oversize[lang].find(sym == 'Ig' ? 'disk' : comp) || 99));
    }
    eng = (name, comp, core) => (core ? `${core} ` : '') + (comp == 'driver' && name.length > 16 ? name.replace(' ', '<br>') : name);
    jap = (name, comp, core) => (core ? `${core} ` : '') + (comp == 'driver' && name.length > 8 ? name.replace(/アルティメット/, '$&<br>') : name);
    chi = (name, comp, core) => (core ? `<u>${core} </u>` : '') + name.replace(/金屬(?=.{3,})/, '金屬<br>').replace('￨', '<s>￨</s>').replace(/＋$/, '<sub>+</sub>').replace('無限Ⅼ', '無限<sup>Ｌ</sup>');
    add = (name, dash, mode) => (name && dash ? '<i>′</i>' : '') + (name && /^\+(?!s[hw])/.test(mode) ? `<sub>${mode}</sub>` : '');
}
const Dissect = (td, preview) => {
    td = td.matches('[data-part]') ? td : $(td).prevAll('td[data-part]')[0];
    let [sym, comp] = td.getAttribute('data-part').split('.'), items = Dissect.items(comp, preview), prop;
    ({prop, sym} = Dissect.yield(sym, items));
    prop.core ? comp = 'frame' : null;

    return !preview ? {...prop, sym, comp} : [
        prop.core && `${prop.core}.disk`, 
        `${sym}${comp == 'disk' && prop.dash ? '′' : ''}.${comp}`, 
        prop.mode && `${prop.mode}.${comp}`.replace('+S.disk', '+S.driver'),
        td.parentNode.more?.split(',').find(p => p.includes(comp.replace(/\d.$/, '')))
    ].filter(p => p && p[0] != '_');
};
Object.assign(Dissect, {
    yield: (sym, items) => ({
        prop: items.reduce((prop, item) => ({...prop, [item]: sym.match(Dissect.regex[item])}), {}),
        sym: items.reduce((sym, item) => sym.replace(Dissect.regex[item], ''), sym)
    }),
    items: (comp, preview) => ['mode', ...comp == 'driver' && !preview ? ['pref', 'dash'] : comp == 'disk' ? ['core', 'dash'] : []],
    regex: {
        pref: /^[HM](?=[^′a-z])/,
        dash: /′(?:\+.)?$/,
        core: /[\dα′_]+(?=\D)/,
        mode: /\+[^.′ ]+/
    }
});
const Preview = type => {
    Preview.popup.innerHTML = '';
    Preview.popup.removeAttribute('title');
    Q('#popup').checked = true;
    return Preview[type];
};
Object.assign(Preview, {
    popup: Q('label[for=popup]'),
    src: href => /^https|\/img\//.test(href) ? href : href.length >= 15 ? `https://pbs.twimg.com/media/${href}?format=png&name=large` : `https://beyblade.takaratomy.co.jp/burst/public_html/category/img/products/${href}.png`,
    image: ({parentNode: tr}) => {
        Preview.popup.classList.remove('catalog');
        Preview.popup.title = Mapping.maps.rate.find(tr.no.match(/\d+/));
        let image = Preview.src(Mapping.maps.image.find(tr.no, true));
        let video = tr.getAttribute('data-video') || $(tr).prevAll(`tr[data-video][data-no=${tr.no}]`)[0]?.getAttribute('data-video');
        Preview.popup.innerHTML = (video ? video.split(',').map(vid => `<a href=//youtu.be/${vid}></a>`).join('') : '') + `<img src=${image}>` + (tr.matches('.RB') ? `<img src=/img/RB/${tr.no}.jpg>` : '');
    },
    part: async td => {
        Preview.popup.classList.add('catalog');
        Preview.awaited ||= await Part.firstly().then(() => true);
        for (const p of Dissect(td, true))
            p != '9.disk' && new Part(await DB.get('parts', p)).catalog(true);
    }
});
