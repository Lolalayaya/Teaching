"""產生第十週（8年級）定位行動的起始專案與參考解答 .sb3。

用法（在 repo 根目錄執行）：
    python teacher-notes/scripts/generate-week10-8-search-sb3.py

會輸出：
    materials/week10-8-search-starter.sb3       學生起始專案
    teacher-notes/week10-8-search-solution.sb3  參考解答（Scratchy 建立作業時用這份）

起始專案：綠旗（目標設為703）、n 鍵（目標改成800）都寫好；a 鍵的循序搜尋只空著
「重複直到」的條件；b 鍵底下是空的，二分搜尋整段讓學生自己做。

Scratchy 的模擬順序是自動決定的：先綠旗，其餘按鍵依字母排序各按一次
（Scratchy 的 src/lib/detect-events.ts），也就是 綠旗 → a → b → n。
所以「找不到」的 800 只能放在排序最後的 n 鍵，評分只檢查目標703；
如果改成數字鍵（排在 a 前面），自動檢查就會變成在測 800。

不用 Scratch 編輯器，直接手寫 project.json 再用 zipfile 打包，跟第四、六、八週
同一套作法。造型 SVG 沿用第六週起始專案裡的那兩個檔案。
清單／變數名稱是 Scratchy 比對用的，改名的話講義、評分基準表要一起改。
"""

import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSET_SOURCE = ROOT / 'materials' / 'week6-8-scan-starter.sb3'

# 跟第九週講義、searchDemo.js 排好的榜單同一份
SCORES = [990, 965, 940, 912, 890, 868, 845, 820, 797, 775, 750, 726, 703, 680, 655]
TARGET = 703        # 綠旗設定的目標，講義檢查點和評分都用這個
MISSING = 800       # n 鍵：不在榜上的目標，只供上課自己試，不計分
SPRITE = '搜尋員'
LIST = ('排行榜分數', 'list-search-001')
VARS = {
    '目標': 'var-target-001',
    '名次': 'var-rank-001',
    '比較次數': 'var-count-001',
    'i': 'var-i-001',
    '左': 'var-left-001',
    '右': 'var-right-001',
    '中間': 'var-mid-001',
}


class Blocks:
    """小工具：依序加入積木並自動接好 parent/next，避免手寫 id 對錯。"""

    def __init__(self):
        self.blocks = {}
        self.n = 0

    def _id(self, prefix):
        self.n += 1
        return f'{prefix}_{self.n}'

    def add(self, opcode, inputs=None, fields=None, top=None, prefix='b'):
        bid = self._id(prefix)
        self.blocks[bid] = {
            'opcode': opcode,
            'next': None,
            'parent': None,
            'inputs': inputs or {},
            'fields': fields or {},
            'shadow': False,
            'topLevel': top is not None,
        }
        if top is not None:
            self.blocks[bid]['x'], self.blocks[bid]['y'] = top
        return bid

    def chain(self, parent, ids, under_hat=False):
        """把 ids 依序接成一串，第一個掛在 parent 底下。parent 是 C 積木時，
        回傳值要另外放進它的 SUBSTACK；parent 是帽子積木時傳 under_hat=True。"""
        if under_hat and ids:
            self.blocks[parent]['next'] = ids[0]
        prev = parent
        for k, bid in enumerate(ids):
            self.blocks[bid]['parent'] = prev
            if k > 0:
                self.blocks[prev]['next'] = bid
            prev = bid
        return ids[0] if ids else None

    def reporter(self, bid, parent):
        self.blocks[bid]['parent'] = parent
        return bid

    def substack(self, c_block, ids, key='SUBSTACK'):
        self.blocks[c_block]['inputs'][key] = [2, self.chain(c_block, ids)]

    def condition(self, c_block, bool_block):
        self.blocks[c_block]['inputs']['CONDITION'] = [2, bool_block]
        self.reporter(bool_block, c_block)

    # ---- 常用輸入 ----
    @staticmethod
    def num(v):
        return [1, [4, str(v)]]

    @staticmethod
    def text(v):
        return [1, [10, str(v)]]

    @staticmethod
    def var_in(name, shadow=(10, '')):
        return [3, [12, name, VARS[name]], list(shadow)]

    @staticmethod
    def rep_in(bid, shadow=(10, '')):
        return [3, bid, list(shadow)]

    # ---- 積木 ----
    def set_var(self, name, value_input):
        return self.add('data_setvariableto', {'VALUE': value_input}, {'VARIABLE': [name, VARS[name]]})

    def set_var_to(self, name, reporter_id):
        bid = self.set_var(name, self.rep_in(reporter_id))
        self.reporter(reporter_id, bid)
        return bid

    def change_var(self, name, by=1):
        return self.add('data_changevariableby', {'VALUE': self.num(by)}, {'VARIABLE': [name, VARS[name]]})

    def item_of(self, index_var):
        return self.add('data_itemoflist', {'INDEX': self.var_in(index_var, (7, '1'))}, {'LIST': list(LIST)})

    def length(self):
        return self.add('data_lengthoflist', {}, {'LIST': list(LIST)})

    def compare(self, opcode, left, right):
        """left/right 是 ('var', 名稱)、('rep', 積木id) 或 ('num', 數字)。"""
        def to_input(side):
            kind, v = side
            if kind == 'var':
                return self.var_in(v)
            if kind == 'rep':
                return self.rep_in(v)
            return self.text(v)
        bid = self.add(opcode, {'OPERAND1': to_input(left), 'OPERAND2': to_input(right)})
        for side in (left, right):
            if side[0] == 'rep':
                self.reporter(side[1], bid)
        return bid

    def bool_or(self, a, b_):
        bid = self.add('operator_or', {'OPERAND1': [2, a], 'OPERAND2': [2, b_]})
        self.reporter(a, bid)
        self.reporter(b_, bid)
        return bid

    def arith(self, opcode, left, right):
        """left 是變數名稱或積木id（('rep', id)），right 是數字或變數名稱。"""
        def to_input(side):
            if isinstance(side, tuple):
                return self.rep_in(side[1], (4, ''))
            if isinstance(side, str):
                return self.var_in(side, (4, ''))
            return self.num(side)
        bid = self.add(opcode, {'NUM1': to_input(left), 'NUM2': to_input(right)})
        for side in (left, right):
            if isinstance(side, tuple):
                self.reporter(side[1], bid)
        return bid


def green_flag(b):
    """綠旗：清單恢復成排好的15筆、目標設為703、其他結果歸零、清掉說話泡泡。"""
    hat = b.add('event_whenflagclicked', top=(50, 50), prefix='flag')
    steps = [b.add('data_deletealloflist', fields={'LIST': list(LIST)})]
    for s in SCORES:
        steps.append(b.add('data_addtolist', {'ITEM': b.text(s)}, {'LIST': list(LIST)}))
    steps += [
        b.set_var('目標', b.num(TARGET)),
        b.set_var('名次', b.num(0)),
        b.set_var('比較次數', b.num(0)),
        b.add('looks_say', {'MESSAGE': b.text('')}),
    ]
    b.chain(hat, steps, under_hat=True)


def missing_target(b):
    """n 鍵：目標改成不在榜上的800，再按 a、b 看找不到的情況。"""
    hat = b.add('event_whenkeypressed', fields={'KEY_OPTION': ['n', None]}, top=(50, 900), prefix='n')
    b.chain(hat, [
        b.set_var('目標', b.num(MISSING)),
        b.set_var('名次', b.num(0)),
        b.set_var('比較次數', b.num(0)),
        b.add('looks_say', {'MESSAGE': b.text(f'目標改成{MISSING}了')}),
    ], under_hat=True)


def sequential_search(b, with_condition):
    """a 鍵：循序搜尋（講義第三節）。起始專案只少「重複直到」的條件。"""
    hat = b.add('event_whenkeypressed', fields={'KEY_OPTION': ['a', None]}, top=(450, 50), prefix='a')
    loop = b.add('control_repeat_until')
    if with_condition:
        found = b.compare('operator_gt', ('var', '名次'), ('num', 0))
        end = b.compare('operator_equals', ('var', 'i'), ('rep', b.length()))
        b.condition(loop, b.bool_or(found, end))

    cond = b.add('control_if')
    b.condition(cond, b.compare('operator_equals', ('rep', b.item_of('i')), ('var', '目標')))
    b.substack(cond, [b.set_var('名次', b.var_in('i'))])
    b.substack(loop, [b.change_var('i', 1), b.change_var('比較次數', 1), cond])

    b.chain(hat, [
        b.set_var('i', b.num(0)),
        b.set_var('名次', b.num(0)),
        b.set_var('比較次數', b.num(0)),
        loop,
    ], under_hat=True)


def binary_search(b, with_solution):
    """b 鍵：二分搜尋（講義第四節）。起始專案只有帽子積木。"""
    hat = b.add('event_whenkeypressed', fields={'KEY_OPTION': ['b', None]}, top=(450, 500), prefix='bkey')
    if not with_solution:
        return

    loop = b.add('control_repeat_until')
    found = b.compare('operator_gt', ('var', '名次'), ('num', 0))
    empty = b.compare('operator_gt', ('var', '左'), ('var', '右'))
    b.condition(loop, b.bool_or(found, empty))

    # 中間 = 無條件捨去((左 + 右) / 2)
    total = b.arith('operator_add', '左', '右')
    half = b.arith('operator_divide', ('rep', total), 2)
    floor = b.add('operator_mathop', {'NUM': b.rep_in(half, (4, ''))}, {'OPERATOR': ['floor', None]})
    b.reporter(half, floor)
    set_mid = b.set_var_to('中間', floor)

    outer_if = b.add('control_if_else')
    b.condition(outer_if, b.compare('operator_equals', ('rep', b.item_of('中間')), ('var', '目標')))
    b.substack(outer_if, [b.set_var('名次', b.var_in('中間'))])

    # 排行榜由高到低：目標比較高 → 往前找（移動「右」）
    inner_if = b.add('control_if_else')
    b.condition(inner_if, b.compare('operator_gt', ('var', '目標'), ('rep', b.item_of('中間'))))
    b.substack(inner_if, [b.set_var_to('右', b.arith('operator_subtract', '中間', 1))])
    b.substack(inner_if, [b.set_var_to('左', b.arith('operator_add', '中間', 1))], key='SUBSTACK2')
    b.substack(outer_if, [inner_if], key='SUBSTACK2')

    b.substack(loop, [set_mid, b.change_var('比較次數', 1), outer_if])

    b.chain(hat, [
        b.set_var('左', b.num(1)),
        b.set_var_to('右', b.length()),
        b.set_var('名次', b.num(0)),
        b.set_var('比較次數', b.num(0)),
        loop,
    ], under_hat=True)


def build_project(with_solution):
    src = json.loads(zipfile.ZipFile(ASSET_SOURCE).read('project.json').decode('utf-8'))
    stage, sprite = src['targets'][0], src['targets'][1]

    b = Blocks()
    green_flag(b)
    missing_target(b)
    sequential_search(b, with_condition=with_solution)
    binary_search(b, with_solution)

    sprite = {
        **sprite,
        'name': SPRITE,
        'variables': {vid: [name, 0] for name, vid in VARS.items()},
        'lists': {LIST[1]: [LIST[0], list(SCORES)]},
        'blocks': b.blocks,
    }
    monitors = [
        {
            'id': LIST[1], 'mode': 'list', 'opcode': 'data_listcontents', 'params': {'LIST': LIST[0]},
            'spriteName': SPRITE, 'value': list(SCORES), 'width': 0, 'height': 0,
            'x': 5, 'y': 5, 'visible': True,
        }
    ]
    # 變數顯示在舞台右側，截圖時一眼看到名次和比較次數
    for k, (name, vid) in enumerate(VARS.items()):
        monitors.append({
            'id': vid, 'mode': 'default', 'opcode': 'data_variable', 'params': {'VARIABLE': name},
            'spriteName': SPRITE, 'value': 0, 'width': 0, 'height': 0,
            'x': 360, 'y': 5 + 30 * k, 'visible': True,
        })
    return {**src, 'targets': [stage, sprite], 'monitors': monitors}


def write_sb3(project, out):
    src = zipfile.ZipFile(ASSET_SOURCE)
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('project.json', json.dumps(project, ensure_ascii=False))
        for name in src.namelist():
            if name != 'project.json':
                z.writestr(name, src.read(name))
    print(f'寫出 {out}')


if __name__ == '__main__':
    write_sb3(build_project(False), ROOT / 'materials' / 'week10-8-search-starter.sb3')
    write_sb3(build_project(True), ROOT / 'teacher-notes' / 'week10-8-search-solution.sb3')
