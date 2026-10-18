"""產生第八週（8年級）列隊行動的起始專案與參考解答 .sb3。

用法（在 repo 根目錄執行）：
    python teacher-notes/scripts/generate-week8-8-sort-sb3.py

會輸出：
    materials/week8-8-sort-starter.sb3       學生起始專案（綠旗重設清單已寫好，s 鍵底下是空的）
    teacher-notes/week8-8-sort-solution.sb3  參考解答（Scratchy 建立作業時用這份）

不用 Scratch 編輯器，直接手寫 project.json 再用 zipfile 打包，跟第四、六週的
起始專案同一套作法。造型 SVG 沿用第六週起始專案裡的那兩個檔案。
清單／變數名稱是 Scratchy 比對用的，改名的話講義、評分基準表要一起改。
"""

import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSET_SOURCE = ROOT / 'materials' / 'week6-8-scan-starter.sb3'

SCORES = [790, 980, 650, 875, 860]  # 第七週第1組打亂後的順序，講義的檢查點都用這組
SPRITE = '排序員'
LIST = ('排行榜分數', 'list-sort-001')
VARS = {
    '輪次': 'var-round-001',
    'i': 'var-i-001',
    '最大值位置': 'var-maxpos-001',
    '暫存': 'var-temp-001',
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
        回傳值要另外放進它的 SUBSTACK；parent 是帽子積木時傳 under_hat=True，
        第一個積木會接在帽子的 next。"""
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

    def change_var(self, name, by=1):
        return self.add('data_changevariableby', {'VALUE': self.num(by)}, {'VARIABLE': [name, VARS[name]]})

    def item_of(self, index_var):
        return self.add('data_itemoflist', {'INDEX': self.var_in(index_var, (7, '1'))}, {'LIST': list(LIST)})

    def length(self):
        return self.add('data_lengthoflist', {}, {'LIST': list(LIST)})


def green_flag_reset(b):
    """綠旗：清單恢復成打亂的樣子、清掉說話泡泡。起始專案和解答都有。"""
    hat = b.add('event_whenflagclicked', top=(50, 50), prefix='flag')
    steps = [b.add('data_deletealloflist', fields={'LIST': list(LIST)})]
    for s in SCORES:
        steps.append(b.add('data_addtolist', {'ITEM': b.text(s)}, {'LIST': list(LIST)}))
    steps.append(b.add('looks_say', {'MESSAGE': b.text('')}))
    b.chain(hat, steps, under_hat=True)


def selection_sort(b, hat, outer_times=None):
    """選擇排序（講義第四、五節）。outer_times 給數字時外層改成固定次數，驗證檢查點1用。"""
    set_round = b.set_var('輪次', b.num(1))

    outer = b.add('control_repeat')
    if outer_times is None:
        length = b.length()
        sub = b.add('operator_subtract', {'NUM1': b.rep_in(length, (4, '')), 'NUM2': b.num(1)})
        b.reporter(length, sub)
        b.blocks[outer]['inputs']['TIMES'] = b.rep_in(sub, (6, '10'))
        b.reporter(sub, outer)
    else:
        b.blocks[outer]['inputs']['TIMES'] = [1, [6, str(outer_times)]]

    # 外層迴圈裡面
    set_maxpos = b.set_var('最大值位置', b.var_in('輪次'))
    set_i = b.set_var('i', b.var_in('輪次'))

    inner = b.add('control_repeat')
    length2 = b.length()
    sub2 = b.add('operator_subtract', {'NUM1': b.rep_in(length2, (4, '')), 'NUM2': b.var_in('輪次', (4, ''))})
    b.reporter(length2, sub2)
    b.blocks[inner]['inputs']['TIMES'] = b.rep_in(sub2, (6, '10'))
    b.reporter(sub2, inner)

    change_i = b.change_var('i', 1)
    cond_if = b.add('control_if')
    item_i = b.item_of('i')
    item_max = b.item_of('最大值位置')
    gt = b.add('operator_gt', {'OPERAND1': b.rep_in(item_i), 'OPERAND2': b.rep_in(item_max)})
    b.reporter(item_i, gt)
    b.reporter(item_max, gt)
    b.blocks[cond_if]['inputs']['CONDITION'] = [2, gt]
    b.reporter(gt, cond_if)
    update = b.set_var('最大值位置', b.var_in('i'))
    b.blocks[cond_if]['inputs']['SUBSTACK'] = [2, b.chain(cond_if, [update])]
    b.blocks[inner]['inputs']['SUBSTACK'] = [2, b.chain(inner, [change_i, cond_if])]

    # 交換三步
    item_round = b.item_of('輪次')
    set_temp = b.set_var('暫存', b.rep_in(item_round))
    b.reporter(item_round, set_temp)

    item_max2 = b.item_of('最大值位置')
    replace1 = b.add(
        'data_replaceitemoflist',
        {'INDEX': b.var_in('輪次', (7, '1')), 'ITEM': b.rep_in(item_max2)},
        {'LIST': list(LIST)},
    )
    b.reporter(item_max2, replace1)
    replace2 = b.add(
        'data_replaceitemoflist',
        {'INDEX': b.var_in('最大值位置', (7, '1')), 'ITEM': b.var_in('暫存')},
        {'LIST': list(LIST)},
    )
    change_round = b.change_var('輪次', 1)

    b.blocks[outer]['inputs']['SUBSTACK'] = [
        2,
        b.chain(outer, [set_maxpos, set_i, inner, set_temp, replace1, replace2, change_round]),
    ]

    contents = b.add('data_listcontents', {}, {'LIST': list(LIST)})
    say = b.add('looks_say', {'MESSAGE': b.rep_in(contents)})
    b.reporter(contents, say)

    b.chain(hat, [set_round, outer, say], under_hat=True)


def build_project(with_solution, outer_times=None):
    src = json.loads(zipfile.ZipFile(ASSET_SOURCE).read('project.json').decode('utf-8'))
    stage, sprite = src['targets'][0], src['targets'][1]

    b = Blocks()
    green_flag_reset(b)
    s_hat = b.add('event_whenkeypressed', fields={'KEY_OPTION': ['s', None]}, top=(450, 50), prefix='s')
    if with_solution:
        selection_sort(b, s_hat, outer_times)

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
    for k, (name, vid) in enumerate(VARS.items()):
        monitors.append({
            'id': vid, 'mode': 'default', 'opcode': 'data_variable', 'params': {'VARIABLE': name},
            'spriteName': SPRITE, 'value': 0, 'width': 0, 'height': 0,
            'x': 5, 'y': 160 + 40 * k, 'visible': True,
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
    write_sb3(build_project(False), ROOT / 'materials' / 'week8-8-sort-starter.sb3')
    write_sb3(build_project(True), ROOT / 'teacher-notes' / 'week8-8-sort-solution.sb3')
    # 只排一輪的版本，用來驗證講義的檢查點1；不放進 repo
    if len(sys.argv) > 1:
        write_sb3(build_project(True, outer_times=1), Path(sys.argv[1]))
