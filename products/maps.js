Mapping.maps = {
    ...Mapping.maps,
    image: new Mapping(
        /^BG-0[123]/, '${}',
        /^BA-01/, 'FyFMeSOaAAAClw9', 'BA-02', 'FyFMfaSaMAEQbhY', /^BA-03/, 'FyFMfa3aAAUnljR', 'BA-04', 'FyFMfbhaAAEW-mC',

        'BBG-02', 'FyJl4FDaUAAAyjE', 'BBG-09', 'FyJl49XaIAItnPl', 'BBG-13', 'FyJl5c6acAEp7er',
        'BBG-15', 'FyGXqZUaQAE1hXc', 'BBG-20', 'FyGXrgEagAA5kq4', 'BBG-28', 'FyGXtdqaIAIU4BZ', 'BBG-33', 'FyGXuOzaYAARAO1',
        /^BBG-21/, 'FyFBif8aEAARU6k', /^BBG-31/, 'FyFBrltaUAEiTFW', /^BBG-35/, 'FyFBjNOaMAElrAA', /^BBG-36/, 'FyFBrmIaQAA2bR-', /^BBG-42/, 'FyFBj2gagAAEuds',
        
        'BBG-07', 'BB-00',  'BBG-18', 'B_00_emperorF',  'BBG-37', 'B-00_bbg37',  'BBG-40', 'b220701',
        /^BBG-(19|22|27)/, no => no.replace('BBG-', 'BBG'),
        /^BBG-(30|34)/,    no => no.replace('BBG-', 'bbg'),
        /^BBG-(06|32)/,    '${}',
        /^BBG-/,           no => no.replace('-', '_'),
        /^B-18[67]/,       no => no.replace('-', ''),
        no => (id => id >= 129 && id <= 132 || id >= 139 && id <= 154 || id >= 159)(no.substring(2, 5)), '${}',
        no => no.replace('-', '_')
    ),
    rare: new Mapping(
        [129,117,100],   'black',
        [179,172,159],   'rgb(210,190,0)',
        [177,160],       'dodgerblue',
        [187,163,161],   'red',
        [167],           'lightseagreen',
        [175,171.2,168], 'rgb(174,91,215)',
        [169],           'deeppink',
        [171.1],         'deepskyblue',
        [196.1,157,156.1,155,154,153.2,153.1,151.1,150,149.2,149.1,148,146.1,145.2,145.1,144,142,140.1,139], 'goldenrod'
    ),
    rate: new Mapping(
        202,       '04 機率 5/24 至 1/4；05 機率 7/24；02 機𠅋 1/8 至 1/6，其餘各 1/6',
        196,       '04、05 機率各 1/6；其餘每箱不同，介乎 1/6 至 1/4；金色版 01 機率小於 1/72',
        194,       '01、06、07 機率各 1/6；其餘各 1/8',
        [198,186,181], '01 機率 1/8；03 機率 5/24；其餘各 1/6',
        [176,173], '01、02 機率各 1/12；07、08 機率各 1/6；其餘各 1/8',
        170,       '01、02 機率各 1/12；03、04 機率各 1/6；其餘各 1/8',
        152, '三類部件每類四抽一，一箱提供 24 種組合；籤王組合機率 1/24，籤王任一部件各 1/8；其餘部件各 7/24',
        [129,117,100],             '1/72 機率購買到特別色版',
        187,                       '1/24 機率購買到特別色版',
        175,                       '1/24 機率購買到塗裝版 Disk',
        [179,177,171,169,168,167], '1/24 機率購買到塗裝版 Chassis',
        [172,163,161,160,159],     '1/72 機率購買到塗裝版 Chassis',
        [157,156,155,154,153,153,151,150,149,149,148,146,145,145,144,142,140,139], '1/72 機率購買到 Gold Turbo 版'
    ),
    oversize: {
        eng: new Mapping(
            /^layer(6c|7b)$/, 12,
            'driver',         14
        ),
        chi: new Mapping(
            /^layer(5[bc]|6[rc]|7[bc])$/, 6,
            'driver',                     4
        ),
        jap: new Mapping(
            /^layer(5[bc]|6[rc]|7[bc])$/, 7,
            'frame',                      6,
            'disk',                       7,
            'driver',                     8
        )
    }
}