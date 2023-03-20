let Parts = {derived: ['dash', 'high', 'metal'], types: {A: 'Attack', B: 'Balance', D: 'Defense', S: 'Stamina'}};
const concat = (...objs) => objs.reduce((summed, o, i) => i === 0 ? summed : Object.fromEntries(Object.entries(summed).map(([k, v]) => [k, v += o[k] ?? ''])), objs[0]);
class Part {
    constructor(dict) {
        [dict.sym, dict.comp] = dict.key.split('.');
        Object.assign(this, (({key, type, ...others}) => ({...others, type: type ?? 'nil'}))(dict));
    }
    async revision() {
        if (this.comp == 'layer6s')
            this.names = {eng: this.sym[0] + '-' + Parts.types[this.sym[1]]};
        if (typeof this.names == 'string')
            this.names = (await DB.get('parts', this.names.replace(/^[^.]+$/, '$&.layer7c'))).names;
        if (this.comp != 'driver')
            return this;
        this.revise.has();
        if (!Parts.derived.includes(this.group)) 
            return this;

        let ref = await DB.get('parts', this.strip() + '.driver');
        this.revise.name(ref);
        this.revise.attr(ref);
        this.revise.type(ref);
        this.revise.desc(ref);
        this.sym == 'MBDr' ? this.sym = 'MBD' : null;
        return this;
    }
    revise = {
        name: ref => this.names = Part.revise.name(ref, this.group, this.sym),
        type: ref => this.type = ref.type,
        attr: ref => {
            this.deck ??= ref.deck;
            this.attr = [...this.attr ?? [], ...ref.attr ?? []].filter(a => a);
        },
        desc: ref => {
            let sym = ref.key.split('.')[0];
            this.desc = {
                dash: `內藏${this.sym == 'Br′' ? '<em>普通</em>': '強化'}彈簧的【${sym}】driver。`,
                high: this.sym == 'HXt′' ? `（把【HXt+′】driver 換上【Xt】的 Chip 後）` : `高度提升${/′/.test(this.sym) ? '、又內藏強化彈簧' : ''}的【${sym}】driver。`,
                metal: `搭載金屬 Lock 部件、又內藏強化彈簧的【${sym}】driver。`
            }[this.group];
        },
        has: () => this.has = [
            (this.has('dash') || /^H[A-Z].*′/.test(this.sym)) && 'dash',
            this.has('high') && 'high',
            this.has('metal') && !this.has('dash') && 'metal'
        ].filter(a => a)
    }
    static revise = {
        name: (ref, group, sym) => {
            let name = sym ? {...ref.names, can: ''} : names.driver[ref];
            ['high', 'H'].includes(group) ? name = concat({eng: 'High ', jap: 'ハイ', chi: '高位'}, name) : null;
            ['metal', 'M'].includes(group) ? name = concat({eng: 'Metal ', jap: 'メタル', chi: '金屬'}, name) : null;
            return sym ? concat({...name, chi: ''}, /′$/.test(sym) ? {eng: ' dash', jap: 'ダッシュ'} : {}) : name;
        }
    }
    has = derived => Parts[derived].includes(derived == 'metal' ? this.strip('dash') : this.sym);

    strip = what => Part.strip(this.sym, what);
    static strip = (sym, what) => sym.replace(what == 'dash' ? '′' : what == 'prefORdash' ? /[HM](?=[A-Z])|′/ : /[HM](?=[A-Z])|′/g, '');

    prepare() {
        this.a = Q('.catalog').appendChild(Object.assign(document.createElement('a'), {hidden: true}));
        return this;
    }
    async catalog(show) {
        let {sym, comp, group, type, attr, deck, fused, stat, for: For} = await this.revision();
        this.catalog.part = this.catalog.html.part = this;

        this.catalog.weight = function(joiner) {
            this.weight.heaviness ??= (typeof stat?.[3] == 'string' ? comp == 'driver' ? [14, 10] : [] : [18, 10, 8]).findIndex(w => parseInt(stat?.[3]) >= w);
            this.weight.classes ??= [(deck || fused) && 'fusion', typeof stat?.[3] == 'string' && 'grams', ['heavy-x', 'heavy-s', 'heavy'][this.weight.heaviness]];
            return this.weight.classes.filter(c => c).join(joiner);
        }
        this.catalog.background = () => {
            let hue = ({layer: /^\+/.test(sym) ? 80 : deck ? 190 : 135, disk: 225, frame: 225, driver: deck ? 270 : /^\+/.test(sym) ? 0 : 315})[comp.match(/^[^0-9]+/)];
            let params = [Q('html.day') ? 'day' : 'night', `hue=${hue}`, this.catalog.weight('&').replace(/-[xs]/, '')];
            return `/parts/bg.svg?${params.filter(p => p).join('&')}#${type}${stat?.length ?? 5}`;
        }      
        this.a ??= Q('.catalog').appendChild(document.createElement('a'));
        Object.assign(this.a, {
            id: comp == 'driver' && group != 'high' ? this.strip('dash') : sym,
            className: [group, group == 'layer7b' && /^.{3,}|[^+D]{2,}$/.test(sym) && 'BU', type, ...(attr ?? [])].filter(c => c).join(' '),
            hidden: !show,
            for: For,
            innerHTML: this.catalog.html(this)
        });
        location.pathname == '/parts/' && !/^pP|[lrd]αe$/.test(sym) ? this.a.href = `/products/?${comp}=${encodeURIComponent(sym)}` : null;
        location.pathname == '/products/' ? this.a.onclick = () => Find?.autofill(this.comp, this.sym) : null;
    }
    static textLength(text, sym = false) {
        let context = Part.canvas.getContext('2d');
        context.font = `1em ${sym ? 'FiraSansExtraCondensed-Regular' : 'Mincho'},sans-serif`;
        return context.measureText(text.replace('′', '')).width;
    }
    static firstly = async () => {
        Part.canvas = document.createElement('canvas');
        let lists = !Parts.comp || Parts.comp == 'driver' ? Parts.derived.map(g => DB.get.keys(g).then(syms => Parts[g] = syms.map(sym => Part.strip(sym.split('.')[0], 'prefORdash')))) : [];
        let fonts = ['Mincho', 'FiraSansExtraCondensed-Regular'].map(file => new FontFace(file, `url(/include/fonts/${file}.woff2)`).load().then(font => document.fonts.add(font)));
        await Promise.all([...lists, ...fonts]);
    }
}
Part.prototype.catalog.html = function() {
    return `
        <object data='${this.background()}'></object>
        <div class=info>${this.html.symbol() + (this.part.names ? this.html.names() : '')}</div>
        <div class=content>${this.html.image() + (this.part.stat ? this.html.stat() : '')}</div>
        <p class=desc>${this.part.desc ?? ''}</p>`;
}
Object.assign(Part.prototype.catalog.html, {
    symbol: function() {
        let {sym} = this.part;
        let code = sym
            .replace(/(.{3,})′$/, '$1<i>′</i>')
            .replace(/(\D+)3$/, '$1³')
            .replace(/(\D+)2$/, sym.length <= 2 || /D[CGRZ]/.test(sym) ? '$1₂' : '$1²')
            .replace(/^(D[CGRZ]|GD|∞)(.+)$/, '$1<sup>$2</sup>')
            .replace(/^([SK])MR$/, '$1<sub>MR</sub>')
            .replace(/^([dlr]α).$/, '$1');
        let main = code.match(/[^²³′<+]+/)[0];
        let length = Part.textLength(main, true) - 10;
        return Object.assign(document.createElement('div'), {
            className: 'symbol',
            innerHTML: `<h2 class=char-${/[一-龥]$/.test(main) ? 'k' : code.includes('sub') ? 's' : main.length}${length > 0 ? ` style='--space:${length}'` : ''}>${code}</h2>`
        }).outerHTML;
    },
    names: function() {
        let {sym, comp, group, names} = this.part;
        names = {
            eng: names.eng ?? '',
            jap: !names.jap && names.can ? sym : names.jap ?? '',
            chi: (names.chi ?? '').replace(/￨.+$/, ''),
            can: names.can ?? ''
        };
        let code, rows = comp == 'layer' || Parts.derived.includes(group) || /^\+/.test(sym) || /MR$/.test(sym) || /メタル|.{9,}/.test(names.jap) || /Gear|dash/.test(names.eng) && group != 'core';
        if (rows) {
            let upperL = Part.textLength(names.can + names.eng) - 155, lowerL = Part.textLength(names.jap + names.chi) - 150;
            code = `
            <div ${upperL > 0 ? ` style='--space:${upperL}'` : ''}>
                <h4 class=can>${names.can}</h4>
                <h3 class=eng>${names.eng.replace('dash', '<sup>dash</sup>')}</h3>
            </div>
            <div ${lowerL > 0 ? ` style='--space:${lowerL}'` : ''}>
                <h3 class=jap>${names.jap}</h3>
                <h3 class=chi>${names.chi}</h3>
            </div>`;
        } else {
            let space = Part.textLength(names.jap + names.eng + names.chi) - 115;
            code = `
            <div${space > 0 ? ` style='--space:${space}'` : ''}>
                <h4 class=can>${names.can}</h4>
                <h3 class=jap>${names.jap}</h3>
            </div>
            <div${space > 0 ? ` style='--space:${space}'` : ''}>
                <h3 class=eng>${names.eng.replace('dash', '<sup>dash</sup>')}</h3>
                <h3 class=chi>${names.chi}</h3>
            </div>`;
        }
        return Object.assign(document.createElement('div'), {
            className: `name${!names.chi && !names.can ? '' : rows ? '-row' : '-col'}`,
            innerHTML: code
        }).outerHTML;
    },
    image: function() {
        let {sym, comp, has} = this.part;
        return Object.assign(document.createElement('figure'), {
            className: comp == 'driver' ? has.join(' ') : '',
            innerHTML: `<img src=/img/${comp}/${sym}.png alt=${sym} onerror=replaceWith('稍後加上')>`
        }).outerHTML;
    },
    stat: function() {
        let {stat} = this.part;
        typeof stat[3] == 'string' ? stat[3] = stat[3].replace('克', '<small>克</small>') : null;
        let terms = ['攻擊力', '防禦力', '持久力', typeof stat[3] == 'string' && stat.length == 5 ? '重量' : '重　量', '機動力', '擊爆力'];
        return Object.assign(document.createElement('dl'), {
            className: `stat-${stat.length} ${this.part.catalog.weight(' ')}`,
            innerHTML: stat.reduce((html, s, i) => html += s === null ? '' : `<div><dt>${terms[i]}<dd>${s}</div>`, '')
        }).outerHTML;
    }
});
