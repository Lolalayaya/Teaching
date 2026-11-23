"""產生第十二週（8年級）解碼行動的參考解答 .sb3（Scratchy 建立作業時用這份）。

用法（在 repo 根目錄執行）：
    python teacher-notes/scripts/generate-week12-8-guess-sb3.py [輸出路徑]

預設輸出：
    teacher-notes/week12-8-guess-solution.sb3

這週學生從空白專案開始，沒有起始專案。所以參考解答刻意做成「空白專案照講義做完」的樣子：
- 角色維持預設名稱 Sprite1（台灣學生實際交來的 Scratch 專案，預設名稱都是英文
  Sprite1／costume1／backdrop1），Scratchy 依角色名稱比對，學生改名會失分
- 答案、猜測、次數三個變數建在舞台（「適用於所有角色」，建立變數時的預設選項）
- 提示用「說『太大了』持續2秒」（只用「說」的話，下一次「詢問」會立刻把提示蓋掉）
- 最後用「說」（不是「說…秒」），讓「答對了！你猜了5次」留在畫面上

Scratchy 作業要設定的「模擬玩家輸入」（刻意跟講義讓學生自己測的40不同，
測試完忘了把答案改回隨機、或直接寫死40的作品，就會被比對出來）：
    「詢問」依序回答：50, 75, 62, 56, 59, 60（答案60的「猜中間」路線）
    「隨機取數」固定為：60
跑完應該是：答案 60、猜測 60、次數 6，角色說「答對了！你猜了6次」。

--say-only 會改成只用「說」的提示，用來確認沒修提示的學生最後狀態一樣、不會被扣分
（只給驗證用，不用交給學生）。
--fixed-answer N 會把「隨機取數」換成固定的 N，模擬測試完忘了改回來的學生（驗證用）。
"""

import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSET_SOURCE = ROOT / 'materials' / 'week6-8-scan-starter.sb3'

SPRITE = 'Sprite1'
VARS = {'答案': 'var-answer-012', '猜測': 'var-guess-012', '次數': 'var-count-012'}
QUESTION = '猜一個1～100的數字'


class Blocks:
    def __init__(self):
        self.blocks = {}
        self.n = 0

    def add(self, opcode, inputs=None, fields=None, top=None):
        self.n += 1
        bid = f'g12_{self.n}'
        self.blocks[bid] = {
            'opcode': opcode, 'next': None, 'parent': None,
            'inputs': inputs or {}, 'fields': fields or {},
            'shadow': False, 'topLevel': top is not None,
        }
        if top is not None:
            self.blocks[bid]['x'], self.blocks[bid]['y'] = top
        return bid

    def chain(self, parent, ids, under_hat=False):
        if under_hat:
            self.blocks[parent]['next'] = ids[0]
        prev = parent
        for k, bid in enumerate(ids):
            self.blocks[bid]['parent'] = prev
            if k > 0:
                self.blocks[prev]['next'] = bid
            prev = bid
        return ids[0]

    def own(self, child, parent):
        self.blocks[child]['parent'] = parent
        return child

    @staticmethod
    def text(v):
        return [1, [10, str(v)]]

    @staticmethod
    def var_in(name):
        return [3, [12, name, VARS[name]], [10, '']]

    def set_var(self, name, value_input, reporter=None):
        bid = self.add('data_setvariableto', {'VALUE': value_input}, {'VARIABLE': [name, VARS[name]]})
        if reporter:
            self.own(reporter, bid)
        return bid

    def compare(self, opcode, a, b_):
        return self.add(opcode, {'OPERAND1': self.var_in(a), 'OPERAND2': self.var_in(b_)})

    def hint(self, text, timed):
        if timed:
            return self.add('looks_sayforsecs', {'MESSAGE': self.text(text), 'SECS': [1, [4, '2']]})
        return self.add('looks_say', {'MESSAGE': self.text(text)})

    def if_then(self, cond, body):
        bid = self.add('control_if', {'CONDITION': [2, cond]})
        self.own(cond, bid)
        self.blocks[bid]['inputs']['SUBSTACK'] = [2, self.chain(bid, body)]
        return bid


def build_script(b, timed_hints, fixed_answer=None):
    hat = b.add('event_whenflagclicked', top=(50, 50))

    if fixed_answer is None:
        rand = b.add('operator_random', {'FROM': [1, [4, '1']], 'TO': [1, [4, '100']]})
        set_answer = b.set_var('答案', [3, rand, [10, '']], reporter=rand)
    else:
        set_answer = b.set_var('答案', b.text(fixed_answer))

    loop = b.add('control_repeat_until')
    cond = b.compare('operator_equals', '猜測', '答案')
    b.blocks[loop]['inputs']['CONDITION'] = [2, cond]
    b.own(cond, loop)

    ask = b.add('sensing_askandwait', {'QUESTION': b.text(QUESTION)})
    answer = b.add('sensing_answer')
    store = b.set_var('猜測', [3, answer, [10, '']], reporter=answer)
    count = b.add('data_changevariableby', {'VALUE': [1, [4, '1']]}, {'VARIABLE': ['次數', VARS['次數']]})
    too_big = b.if_then(b.compare('operator_gt', '猜測', '答案'), [b.hint('太大了', timed_hints)])
    too_small = b.if_then(b.compare('operator_lt', '猜測', '答案'), [b.hint('太小了', timed_hints)])
    b.blocks[loop]['inputs']['SUBSTACK'] = [2, b.chain(loop, [ask, store, count, too_big, too_small])]

    # 說（字串組合（字串組合「答對了！你猜了」（次數））「次」）
    inner = b.add('operator_join', {'STRING1': b.text('答對了！你猜了'), 'STRING2': b.var_in('次數')})
    outer = b.add('operator_join', {'STRING1': [3, inner, [10, '']], 'STRING2': b.text('次')})
    b.own(inner, outer)
    say_end = b.add('looks_say', {'MESSAGE': [3, outer, [10, '']]})
    b.own(outer, say_end)

    b.chain(hat, [
        set_answer,
        b.set_var('次數', b.text(0)),
        b.set_var('猜測', b.text(0)),
        loop,
        say_end,
    ], under_hat=True)


def build_project(timed_hints=True, fixed_answer=None):
    src = json.loads(zipfile.ZipFile(ASSET_SOURCE).read('project.json').decode('utf-8'))
    stage, sprite = src['targets'][0], src['targets'][1]
    b = Blocks()
    build_script(b, timed_hints, fixed_answer)
    stage = {**stage, 'variables': {vid: [name, 0] for name, vid in VARS.items()}, 'lists': {}}
    sprite = {**sprite, 'name': SPRITE, 'variables': {}, 'lists': {}, 'blocks': b.blocks, 'x': 0, 'y': 0}
    return {**src, 'targets': [stage, sprite], 'monitors': []}


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
    argv = sys.argv[1:]
    fixed = None
    if '--fixed-answer' in argv:
        i = argv.index('--fixed-answer')
        fixed = int(argv[i + 1])
        del argv[i:i + 2]
    args = [a for a in argv if not a.startswith('--')]
    say_only = '--say-only' in argv
    out = Path(args[0]) if args else ROOT / 'teacher-notes' / 'week12-8-guess-solution.sb3'
    write_sb3(build_project(timed_hints=not say_only, fixed_answer=fixed), out)
