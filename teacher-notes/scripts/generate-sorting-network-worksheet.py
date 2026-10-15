import sys
from itertools import permutations
OUT_WS = sys.argv[1]; OUT_ANS = sys.argv[2]

# 6條線網路（比較器A~L），同一欄代表畫在同一個x位置（線段不重疊才共用）
N6_COLS = [[('A',0,5)],[('B',1,3)],[('C',2,4)],[('D',1,2),('E',3,4)],[('F',0,3)],[('G',2,5)],[('H',0,1),('I',2,3),('J',4,5)],[('K',1,2),('L',3,4)]]
N4_COLS = [[('a',0,1),('b',2,3)],[('c',0,2)],[('d',1,3)],[('e',1,2)]]
N4_STEPS = {'a':'①','b':'②','c':'③','d':'④','e':'⑤'}
STAGES = [['A','B','C'],['D','E'],['F','G'],['H','I','J'],['K','L']]

def run(cols, v, removed=None):
    v=list(v); steps={}; swaps=set()
    for col in cols:
        for lab,a,b in col:
            if lab==removed: continue
            if v[a]<v[b]: v[a],v[b]=v[b],v[a]; swaps.add(lab)
            steps[lab]=(v[a],v[b])
    return v, steps, swaps

for cols,n in ((N6_COLS,6),(N4_COLS,4)):
    for p in permutations(range(n)):
        assert run(cols,p)[0]==sorted(p,reverse=True)

PITCH=16; BW=12; BH=7; DY=10; TOP=9
def svg(cols, n, inputs=None, mode='blank', labels=None, removed=None, ranks=True, boxes=True, extra_w=0, prefill=()):
    """mode: blank=學生空白, example=範例全填(印刷色), answer=解答(紅字)
    labels: None=不標, True=用比較器代號, dict=自訂標籤
    prefill: 學生版先幫忙填好的比較器（灰字）"""
    xs=[26+i*PITCH for i in range(len(cols))]
    xout = (xs[-1] if xs else 26) + 25 + extra_w
    W = xout+6+(16 if ranks else 2)
    H = TOP+(n-1)*DY+7
    y=lambda i: TOP+i*DY
    o=[f'<svg class="net" viewBox="0 0 {W} {H}" width="{W}mm" height="{H}mm" xmlns="http://www.w3.org/2000/svg">']
    vals=None
    if inputs and all(v is not None for v in inputs):
        vals=run(cols,inputs,removed)
    fill = mode in ('example','answer')
    tcol = '#c0392b' if mode=='answer' else '#333'
    for i in range(n):
        o.append(f'<line x1="17" y1="{y(i)}" x2="{xout-BW/2}" y2="{y(i)}" stroke="#555" stroke-width="0.4"/>')
    def box(cx,cy,txt=None,color='#333',bold=False,strong=False):
        st = 'stroke="#333" stroke-width="0.6"' if strong else 'stroke="#888" stroke-width="0.3"'
        o.append(f'<rect x="{cx-BW/2}" y="{cy-BH/2}" width="{BW}" height="{BH}" rx="1" fill="#fff" {st}/>')
        if txt is not None:
            o.append(f'<text x="{cx}" y="{cy+1.3}" font-size="3.7" text-anchor="middle" fill="{color}" font-weight="{"bold" if bold else "normal"}">{txt}</text>')
    for i in range(n):
        box(10,y(i), inputs[i] if inputs and inputs[i] is not None else None, '#111', True)
    for x,col in zip(xs,cols):
        for lab,a,b in col:
            text = (labels.get(lab, lab) if isinstance(labels, dict) else lab) if labels else None
            if lab==removed:
                o.append(f'<line x1="{x}" y1="{y(a)}" x2="{x}" y2="{y(b)}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="1.2 1"/>')
                for k in (a,b): o.append(f'<circle cx="{x}" cy="{y(k)}" r="1.4" fill="#fff" stroke="#bbb" stroke-width="0.4"/>')
                o.append(f'<text x="{x}" y="{y(a)-3.9}" font-size="3.2" fill="#999" text-anchor="middle">✂{text or lab}</text>')
                continue
            sw = mode=='answer' and vals and lab in vals[2]
            c = '#e67e22' if sw else '#111'
            o.append(f'<line x1="{x}" y1="{y(a)}" x2="{x}" y2="{y(b)}" stroke="{c}" stroke-width="{0.9 if sw else 0.6}"/>')
            for k in (a,b): o.append(f'<circle cx="{x}" cy="{y(k)}" r="1.4" fill="{c}"/>')
            if text: o.append(f'<text x="{x}" y="{y(a)-3.9}" font-size="3.4" font-weight="bold" fill="#2f5fa8" text-anchor="middle">{text}</text>')
            if boxes:
                if vals and fill: va,vb = vals[1][lab]; col_ = tcol
                elif vals and lab in prefill: va,vb = vals[1][lab]; col_ = '#888'
                else: va,vb = None,None; col_ = tcol
                box(x+9.5,y(a),va,col_); box(x+9.5,y(b),vb,col_)
    if boxes:
        for i in range(n):
            box(xout,y(i), vals[0][i] if (vals and fill) else None, tcol, True, strong=True)
    if ranks:
        for i in range(n):
            o.append(f'<text x="{xout+BW/2+2}" y="{y(i)+1.2}" font-size="3.4" fill="#666">第{i+1}名</text>')
    o.append('</svg>')
    return ''.join(o)

D = {
 'ex':[785,920,650,870],
 'w1':[860,790,980,875], 'w2':[705,760,845,920],
 'm1':[870,650,785,990,920,800], 'm2':[930,690,888,770,990,845],
 's1':[990,920,870,800,785,650], 's2':[650,785,800,870,920,990],
}
bad=[p for p in permutations(range(1,7)) if run(N6_COLS,p,'F')[0]!=sorted(p,reverse=True)]

# 第五大題的示範：4條線網路拆掉⑤（e）
FX1=[785,920,650,870]; FX2=[705,760,845,920]
FO1=run(N4_COLS,FX1,'e')[0]; FO2=run(N4_COLS,FX2,'e')[0]
assert FO1!=sorted(FO1,reverse=True) and FO2==sorted(FO2,reverse=True)
FB1=next((FO1[i],FO1[i+1]) for i in range(3) if FO1[i]<FO1[i+1])
fx1,fx2,fo1,fo2=('、'.join(map(str,v)) for v in (FX1,FX2,FO1,FO2))

# 範例逐步說明用的數值（由程式算，避免手寫出錯）
EX = run(N4_COLS, D['ex'])[1]

CSS = '''
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing: border-box; }
body { font-family: "Microsoft JhengHei","PingFang TC",sans-serif; color:#222; margin:0; font-size:3.6mm; line-height:1.55; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
.pb { break-before: page; }
@media screen { body{background:#ddd;} .page{width:210mm;min-height:297mm;margin:8mm auto;padding:10mm;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);} .noprint{max-width:210mm;margin:6mm auto 0;font-size:14px;} .pb{border-top:1px dashed #aaa;margin-top:6mm;padding-top:4mm;} }
@media print { .noprint{display:none;} }
h1 { font-size:5.4mm; margin:0 0 1mm; }
h2 { font-size:4.4mm; margin:4mm 0 1mm; border-left:1.6mm solid #2f5fa8; padding-left:2mm; }
h3 { font-size:3.9mm; margin:2mm 0 1mm; }
.idrow { display:flex; gap:6mm; align-items:flex-end; border-bottom:0.4mm solid #333; padding-bottom:2mm; margin-bottom:2mm; }
.idrow span { white-space:nowrap; }
.idrow .line { display:inline-block; border-bottom:0.3mm solid #333; width:16mm; }
.idrow .line.long { width:30mm; }
.score { margin-left:auto; border:0.4mm solid #333; padding:1mm 3mm; }
.box { border:0.3mm solid #999; border-radius:2mm; padding:2mm 3mm; margin:2mm 0; break-inside:avoid; }
.box ol, .box ul { margin:0.5mm 0; padding-left:5mm; }
.rules { background:#f6f8fc; }
.tip { background:#f2f9f2; border-color:#8bc48b; }
.warn { background:#fff6ec; border-color:#e0a96d; }
.how { background:#f7f7f7; border-color:#bbb; }
.blk { break-inside:avoid; }
.item { margin:1.5mm 0 1mm; break-inside:avoid; }
.item .cap { font-weight:bold; }
.net { display:block; margin:1mm 0 0 2mm; }
.q { margin:1.2mm 0; }
.blank { display:inline-block; border-bottom:0.3mm solid #333; min-width:14mm; text-align:center; }
.ans { color:#c0392b; font-weight:bold; }
.check { color:#444; margin:1mm 0 2mm; }
table { border-collapse:collapse; break-inside:avoid; }
table.rounds { margin:1mm 0; }
table.rounds td { border:0.3mm solid #888; padding:1mm 3mm; height:7mm; }
table.rounds td:first-child { width:24mm; background:#f3f3f3; }
table.rounds td:last-child { width:60mm; }
table.grid { width:100%; margin:1mm 0; }
table.grid td, table.grid th { border:0.3mm solid #999; padding:1mm 2mm; vertical-align:top; text-align:left; }
table.grid th { background:#f0f0f0; }
.perm { display:inline-block; margin:0 4mm 1mm 0; }
.drawbox { border:0.3mm dashed #aaa; border-radius:2mm; padding:1mm; }
.teacher p, .teacher li { font-size:3.5mm; }
'''

def page(inner): return f'<div class="page">{inner}</div>'

def build(ans):
    A = (lambda s: f'<span class="ans">{s}</span>') if ans else (lambda s: '')
    B = lambda s: f'<span class="blank">{A(s)}</span>'
    m = 'answer' if ans else 'blank'
    def six(key, **kw): return svg(N6_COLS,6,D[key],m,labels=True,**kw)
    def four(key, **kw): return svg(N4_COLS,4,D[key],m,labels=N4_STEPS,**kw)
    sw = lambda key: len(run(N6_COLS,D[key])[2])
    done = lambda *items: '<p class="check">完成後檢查：' + '　'.join(f'☐ {t}' for t in items) + '</p>'

    # ── 第1頁：導覽 ──
    intro = f'''
<div class="idrow"><h1 style="margin:0">特別任務檔案・閘門行動｜排序網路學習單</h1></div>
<div class="idrow"><span>班級 <span class="line"></span></span><span>座號 <span class="line"></span></span><span>姓名 <span class="line long"></span></span><span class="score">得分：　　　　</span></div>

<div class="box how"><b>今天的任務</b><br>
第五週我們用「打擂台法」找出最大值。今天要學另一種排序的方法：<b>排序網路</b>。它是一張固定的圖，只要照著圖一步一步比大小，不管一開始的分數怎麼排，最後都會自動排好。<br>
這份學習單可以自己讀懂、自己完成。請<b>從這一頁開始照順序往下做</b>，每一大題前面都有說明和提示，先讀完再動筆。</div>

<h3>作答規則</h3>
<ul>
<li>一個人自己寫，不和旁邊的同學討論。這張學習單下課前交回，會算進平時成績。</li>
<li>建議用鉛筆寫，寫錯比較好擦。</li>
<li>第一～五大題都寫完，才做第六大題（加分題）。</li>
<li><b>怎麼算分：</b>每一題只要<b>每一格都有寫</b>就有基本分（全部加起來60分），寫對再加分（40分），加分題最多再加10分，總分可以超過100分。寫錯也比空白好，所以<b>每一題都要寫完</b>，不會的也要試試看。</li>
</ul>

<h3>進度表（做完一題就在右邊打勾）</h3>
<table class="grid">
<tr><th>內容</th><th style="width:22mm">配分</th><th style="width:24mm">建議時間</th><th style="width:14mm">完成</th></tr>
<tr><td>寫上班級、座號、姓名</td><td>4分</td><td>—</td><td>☐</td></tr>
<tr><td>讀規則和範例（第1～2頁）</td><td>—</td><td>5分鐘</td><td>☐</td></tr>
<tr><td>一、暖身：4條線</td><td>14分</td><td>5分鐘</td><td>☐</td></tr>
<tr><td>二、6條線：手遊排行榜</td><td>22分</td><td>8分鐘</td><td>☐</td></tr>
<tr><td>三、特殊的輸入</td><td>19分</td><td>6分鐘</td><td>☐</td></tr>
<tr><td>四、哪些比較器可以同時做？</td><td>19分</td><td>6分鐘</td><td>☐</td></tr>
<tr><td>五、故障題</td><td>22分</td><td>6分鐘</td><td>☐</td></tr>
<tr><td>六、加分題（有時間再做）</td><td>加10分</td><td>—</td><td>☐</td></tr>
</table>

<div class="box tip"><b>卡關怎麼辦？照這個順序來：</b>
<ol>
<li>回去重讀「排序網路規則」和「範例」。</li>
<li>看看「常見錯誤」，檢查自己有沒有犯。</li>
<li>還是不會，先跳到下一題，最後再回來。</li>
<li>以上都試過了，再安靜舉手，老師會走到你旁邊。請不要離開座位。</li>
</ol></div>

<div class="box rules"><b>排序網路規則</b>
<ol>
<li>每條橫線上放一個分數，分數從左往右走。</li>
<li>遇到<b>兩個黑點用直線連起來</b>的地方，叫做「比較器」。把這兩條線上的分數比大小：<b>分數高的往上、分數低的往下</b>。如果本來就是高的在上面，就照原樣往右走。</li>
<li>直線經過、但沒有黑點的線，不參加比較，分數直接穿過。</li>
<li>每經過一個比較器，就把離開時的兩個分數寫進它後面的兩個方格。</li>
<li>全部做完後，把每條線上最後的分數抄到最右邊的粗框。最上面是第1名。</li>
</ol></div>
'''

    # ── 第2頁：範例逐步講解 ──
    a,b,c,d,e = (EX[k] for k in 'abcde')
    example = f'''
<div class="pb"></div>
<h2>範例：一步一步看懂排序網路</h2>
<p class="q">下面這張圖已經幫你做完了。請對照下面的步驟說明，<b>用手指沿著線一步一步跟著走</b>。圖上的①～⑤是做的順序。</p>
<div class="item">{svg(N4_COLS,4,D['ex'],'example',labels=N4_STEPS)}</div>
<table class="grid">
<tr><th style="width:12mm">步驟</th><th>說明</th></tr>
<tr><td>①</td><td>連接第1條和第2條線。785和920比，<b>920比較大，往上</b>；785往下。所以①後面的方格，上面寫{a[0]}，下面寫{a[1]}。</td></tr>
<tr><td>②</td><td>連接第3條和第4條線。650和870比，870比較大往上，650往下。上面寫{b[0]}，下面寫{b[1]}。<br>（①和②畫在同一個位置，但它們用的線不一樣，先做哪一個都可以。）</td></tr>
<tr><td>③</td><td>連接第1條和第3條線。這條直線會經過第2條線，但第2條線上<b>沒有黑點</b>，所以第2條線不參加。<br>第1條線現在的分數要看①後面的方格：920；第3條線現在的分數看②後面的方格：870。920比較大，本來就在上面，<b>不用交換</b>，照原樣寫{c[0]}和{c[1]}。</td></tr>
<tr><td>④</td><td>連接第2條和第4條線（經過第3條線，一樣不參加）。第2條線現在是785，第4條線現在是650。785本來就在上面，不用交換：{d[0]}和{d[1]}。</td></tr>
<tr><td>⑤</td><td>連接第2條和第3條線。第2條線現在是785（看④後面），第3條線現在是870（看③後面）。<b>870比較大，要往上</b>，兩個分數交換：上面寫{e[0]}，下面寫{e[1]}。</td></tr>
<tr><td>完成</td><td>把每條線最後一個方格的分數抄到粗框：920、870、785、650。從上到下由高到低，排好了！</td></tr>
</table>

<div class="box tip"><b>小技巧：怎麼知道一條線「現在」的分數？</b><br>
沿著那條線<b>往左看，離你最近的那一格</b>，就是這條線現在的分數。如果往左一直沒有方格，就是最左邊一開始的分數。</div>

<div class="box warn"><b>常見錯誤</b>
<ul>
<li>把「直線經過、但沒有黑點」的線也拿來比較。只有<b>兩端有黑點</b>的兩條線才要比。</li>
<li>用到太舊的分數。一定要用往左看「最近的那一格」。</li>
<li>比完之後兩格寫成一樣的數字，或是有分數不見了。</li>
</ul>
<b>兩個自我檢查方法：</b>
<ol>
<li><b>分數不會變多也不會變少：</b>不管做到哪一步，所有線上的分數一定還是一開始那幾個數字，只是位置換了。</li>
<li><b>結果一定排好：</b>最右邊的粗框從上到下一定由高到低。如果沒有，代表中間有一格寫錯了，請往回找。</li>
</ol></div>
'''

    # ── 一、暖身 ──
    sec1 = f'''
<div class="pb"></div>
<h2>一、暖身：4條線排序網路（14分）</h2>
<p class="q">這兩張圖跟範例是<b>一模一樣的網路</b>，只是換了分數。照範例的①～⑤順序做。一-1的第①步已經先幫你填好了（灰色的字），從第②步開始。</p>
<div class="item"><div class="cap">一-1</div>{four('w1', prefill={'a'})}</div>
<div class="item"><div class="cap">一-2（這題全部自己來）</div>{four('w2')}</div>
{done('最右邊由高到低','每一步的分數都還是一開始那4個')}
'''

    # ── 二、6條線 ──
    sec2 = f'''
<div class="blk">
<h2>二、6條線排序網路：手遊排行榜（22分）</h2>
<p class="q">現在網路變大了：6條線、12個比較器（A～L）。做法跟剛剛完全一樣，下面是幾個要注意的地方：</p>
<div class="box how"><ol>
<li><b>照英文字母的順序做</b>：A → B → C → …… → L。同一個位置上下有好幾個比較器的（例如D和E），用的線不一樣，先做哪一個都可以。</li>
<li><b>A的直線很長</b>，從第1條一直連到第6條，但只有頭尾兩端有黑點，所以<b>只比第1條和第6條</b>，中間第2～5條線直接穿過。F和G也是一樣的情況。</li>
<li>有些線會連續好幾段都沒有方格，代表分數一直沒變。要用的時候，往左找最近的那一格。</li>
</ol></div>
<p class="q">這張網路不管輸入什麼分數，最後一定會排好。如果你的結果沒排好，一定是中間哪一格寫錯了。</p>
<div class="item"><div class="cap">二-1</div>{six('m1')}</div>
</div>
<div class="item"><div class="cap">二-2</div>{six('m2')}</div>
{done('兩張圖最右邊都由高到低','每一步的分數都還是一開始那6個')}
'''

    # ── 三、特殊輸入 ──
    sec3 = f'''
<div class="blk">
<h2>三、特殊的輸入（19分）</h2>
<p class="q">這一題要觀察：如果分數本來就排好了，或剛好完全倒過來，排序網路會怎麼做？</p>
<div class="box how"><b>什麼叫做「交換」？</b>經過一個比較器時，如果<b>上面的分數比下面小</b>，兩個分數就要上下對調，這就是一次「交換」。如果上面本來就比較大，分數照原樣往右走，就是<b>沒有交換</b>。<br>
<b>怎麼數：</b>每做完一個比較器，看看後面方格裡的分數跟進來時比，有沒有上下對調。有交換的，就在那個比較器的英文字母旁邊打 ✓。整張圖做完，數一數有幾個 ✓。</div>
<div class="item"><div class="cap">三-1　這組分數本來就已經排好了</div>{six('s1')}</div>
<p class="q">這張圖裡，有交換的比較器有 {B(sw('s1'))} 個。</p>
</div>
<div class="item"><div class="cap">三-2　這組分數剛好完全倒過來</div>{six('s2')}</div>
<p class="q">（1）這張圖裡，有交換的比較器有 {B(sw('s2'))} 個。</p>
<p class="q">（2）不管輸入的分數本來排得好不好，都一定要經過全部 {B(12)} 個比較器，網路才算走完。</p>
'''

    # ── 四、同時進行 ──
    sec4 = f'''
<div class="blk">
<h2>四、哪些比較器可以同時做？（19分）</h2>
<p class="q">想像全班一起用這張網路排序：<b>每個比較器由一位同學負責，比一次要1秒</b>。如果大家一個一個輪流比，12個比較器要12秒。但有些比較器其實可以<b>同時進行</b>，這樣就能更快排完。</p>
<div class="box how"><b>兩個比較器什麼時候可以同時做？</b>要同時符合兩個條件：
<ol>
<li>它們用到的線<b>完全不同</b>，沒有共用任何一條線。</li>
<li>它們需要的分數<b>都已經準備好</b>了，也就是前面用到同一條線的比較器都已經做完。</li>
</ol>
<b>例子：</b>A用第1、6條線，B用第2、4條線，沒有共用的線，而且都只需要一開始的分數，所以<b>A和B可以在第1回合同時做</b>。<br>
D用第2、3條線，但第2條線要等B比完才有分數，所以<b>D一定要排在B後面的回合</b>。<br>
<b>做法：</b>先找出所有「一開始就能做」的比較器，寫進第1回合。接著假設它們都做完了，再找下一批可以做的，寫進第2回合……一直到12個都排進去。</div>
<div class="item">{svg(N6_COLS,6,None,'blank',labels=True,boxes=False,ranks=False)}</div>
</div>
<p class="q">（1）這張網路一共有 {B(12)} 個比較器。</p>
<p class="q">（2）把可以同時做的比較器寫在同一回合（填英文字母），回合數越少越好，用不到的格子留白：</p>
<table class="rounds">{''.join(f'<tr><td>第{i+1}回合</td><td>{A("、".join(STAGES[i])) if i<len(STAGES) else ""}</td></tr>' for i in range(6))}</table>
<p class="q">（3）最少 {B(5)} 回合，也就是 {B(5)} 秒就能排完。</p>
<p class="q">（4）如果只有一個人，用第五週的打擂台法來排（複習：n個分數找最大值，要比n-1次）：先從6個分數中找出第1名要比 {B(5)} 次，再從剩下5個找出第2名要比 {B(4)} 次……一直做到排完，總共要比 {B(15)} 次。</p>
'''

    # ── 五、故障題 ──
    sec5 = f'''
<div class="blk">
<h2>五、故障題：拆掉一個比較器（22分）</h2>
<p class="q">老師把比較器 <b>F</b> 拆掉了（圖上的虛線），這張網路現在<b>壞掉了</b>：有些輸入它還是排得好，有些會排錯。</p>
<p class="q">你的任務是當<b>測試員</b>：找出一組輸入，讓這張壞掉的網路<b>排錯</b>。</p>
<div class="box warn">⚠️ 注意：你自己的每一步都要照規則<b>算對</b>，網路排錯才算數。如果是你自己算錯才排不好，就不算找到。</div>
<div class="box tip"><b>先看一個範例：</b>把第2頁範例的4條線網路，第⑤個比較器拆掉（虛線）。
<div class="item"><div class="cap">例子1：輸入 {fx1}</div>{svg(N4_COLS,4,FX1,'example',labels=N4_STEPS,removed='e')}</div>
每一格都照規則算對，最後是 {fo1}：<b>{FB1[0]}排在{FB1[1]}上面，順序錯了</b>，代表找到了 ★。<br>
原因：⑤原本負責比第2條和第3條線，把{FB1[1]}換到{FB1[0]}上面。⑤不見了，就沒有比較器幫它們換。
<div class="item"><div class="cap">例子2：輸入 {fx2}</div>{svg(N4_COLS,4,FX2,'example',labels=N4_STEPS,removed='e')}</div>
一樣每一格都算對，最後是 {fo2}，<b>還是排好了</b>，代表這組沒找到，要換一組再試。<br>
所以：拆掉一個比較器後，<b>不是每一組輸入都會出錯</b>。你要想辦法找出會出錯的那一組。</div>
</div>
<div class="blk">
<div class="box how"><b>做法建議：</b>
<ol>
<li>輸入可以只用1～6這六個數字，每個數字用一次，寫在最左邊的6格。</li>
<li>先看F原本連的是第幾條線和第幾條線。F原本的工作，是把這兩條線上比較大的分數換到上面。</li>
<li>想想看：F不見了，如果走到F原本的位置時，<b>下面那條線的分數剛好比較大</b>，會發生什麼事？後面還有沒有其他比較器能補救？</li>
<li>照規則把整張圖算完（每一格都要算對），看最右邊有沒有排好。<b>沒排好就代表你找到了</b>，在那張圖的旁邊打 ★。</li>
<li>如果嘗試1排好了，代表這組沒成功，換一組在嘗試2再試一次。</li>
</ol></div>
<div class="item"><div class="cap">嘗試1</div>{svg(N6_COLS,6,list(bad[0]) if ans else None,m,labels=True,removed='F')}</div>
</div>
<div class="item"><div class="cap">嘗試2</div>{svg(N6_COLS,6,None,'blank',labels=True,removed='F')}</div>
'''

    # ── 六、加分題＋交卷檢查 ──
    sec6 = f'''
<div class="blk">
<h2>六、加分題：設計3條線的排序網路（加10分）</h2>
<p class="q">換你當設計師！在下面3條線上，自己畫出比較器，讓<b>任何3個數字</b>都能排好（最上面最大）。</p>
<div class="box how"><b>怎麼畫比較器：</b>在兩條線上各點一個黑點，再用一條直線把兩個黑點連起來。<br>
<b>提示：</b>先想辦法讓最大的數字一定會跑到第1條線，再讓第2條和第3條線排好。比較器越少越厲害。</div>
<div class="item drawbox">{svg([],3,None,'blank',boxes=False,ranks=False,extra_w=80)}</div>
<p class="q">（1）我的網路用了 {B(3)} 個比較器。{A("（最少3個，例如：先比第1、2條，再比第2、3條，最後再比第1、2條）")}</p>
<p class="q">（2）用1、2、3的6種排法，在你的網路上測試看看，排好的打 ✓：<br>
{''.join(f'<span class="perm">☐ {a}、{b}、{c}</span>' for a,b,c in permutations((1,2,3)))}</p>
</div>
<div class="box tip"><b>交卷前檢查</b>
<ul style="list-style:none;padding-left:1mm">
<li>☐ 第1頁的班級、座號、姓名都寫了</li>
<li>☐ 第一～五大題每一題都寫了，進度表也打勾了</li>
<li>☐ 一、二、三的每張圖，最右邊都由高到低排好</li>
</ul></div>
'''
    return intro + example + sec1 + sec2 + sec3 + sec4 + sec5 + sec6

def html(title, body, pre=''):
    return f'<!DOCTYPE html>\n<html lang="zh-Hant">\n<head>\n<meta charset="UTF-8" />\n<title>{title}</title>\n<style>{CSS}</style>\n</head>\n<body>\n{pre}{body}\n</body>\n</html>\n'

open(OUT_WS,'w',encoding='utf-8').write(html('特別任務檔案・閘門行動｜排序網路學習單', page(build(False)),
  '<p class="noprint">排序網路學習單，A4直式，建議雙面列印。按 Ctrl+P（手機請用瀏覽器的「分享→列印」）就可以印出來，記得勾選「背景圖形」。</p>'))

flat = {lab:(a,b) for col in N6_COLS for lab,a,b in col}
teacher = f'''
<div class="teacher">
<h1>特別任務檔案・閘門行動｜排序網路　教師用（教學流程＋解答，不對學生公開）</h1>
<p>使用時機：805段考後原本第七週那一堂，在普通教室上的不插電課。這堂<b>不推進度</b>：805上完後跟802、806、808同一批，下一堂再上第七週選擇排序（電腦教室，含網站易用性測試）。對應課綱資A-IV-3基本演算法（排序）。</p>
<p>學習單是<b>自學版</b>：規則、逐步範例、常見錯誤、每一大題的做法提示都寫在紙上，老師不需要上台講解，可以專心巡堂、管秩序、處理個別學生。</p>
<h2>課堂流程（45分鐘）</h2>
<table class="grid">
<tr><th style="width:22mm">時間</th><th>內容</th></tr>
<tr><td>0–3分</td><td>發學習單，只講三件事：①從第1頁開始照順序自己讀、自己做；②卡關照第1頁「卡關怎麼辦」的四個步驟，最後才舉手，不離開座位；③下課前收回，算平時成績。</td></tr>
<tr><td>3–42分</td><td>學生自學作答，老師巡堂。看學生第1頁「進度表」打勾到哪裡，就能很快知道每個人的進度。<br>學生問「這樣對嗎」時，請他用範例頁的兩個自我檢查方法自己確認（分數有沒有變多變少、最右邊有沒有由高到低）。<br>如果很多人卡在同一個地方（最可能是三的「交換」怎麼數，或四的回合），再花1～2分鐘在黑板統一說明。</td></tr>
<tr><td>42–45分</td><td>收回學習單。預告下一堂：在電腦教室上「選擇排序法」，就是第四大題第（4）小題「一個人用打擂台法排」的做法。</td></tr>
</table>
<h2>評分標準（完成度60分＋正確度40分＝100分，加分題另加10分）</h2>
<p><b>完成度</b>：該題<b>每一格都有寫</b>就給滿分，寫錯也算；寫了一半以上給一半（無條件捨去）；寫不到一半給0分。<br>
<b>正確度</b>：照下表的標準給分。改的時候建議分兩輪：第一輪只翻頁看有沒有寫（完成度），第二輪拿解答對答案（正確度）。</p>
<table class="grid" style="break-inside:auto">
<tr><th style="width:30mm">題目</th><th style="width:28mm">完成度</th><th>正確度</th><th style="width:14mm">小計</th></tr>
<tr><td>班級座號姓名</td><td>4（三項都寫）</td><td>—</td><td>4</td></tr>
<tr><td>一、暖身</td><td>一-1、一-2各4，共8</td><td>每題3：方格全對3；最右邊結果對、但中間有1～2格錯給1；其他0。共6</td><td>14</td></tr>
<tr><td>二、6條線</td><td>二-1、二-2各6，共12</td><td>每題5：方格全對5；最右邊結果對、但中間有1～3格錯給2；其他0。共10</td><td>22</td></tr>
<tr><td>三、特殊輸入</td><td>三-1、三-2各6（圖＋填空），共12</td><td>三-1：圖全對2、交換0個1。三-2：圖全對2、交換5個1、全部12個1。共7（圖有錯給0）</td><td>19</td></tr>
<tr><td>四、同時進行</td><td>（1）～（4）全部有寫12</td><td>（1）12個：1；（2）回合表：3（只要不違反先後順序都算對，排成5回合3分、6回合以上但順序都對1分）；（3）5回合5秒：1；（4）5、4、15：2（全對才給）。共7</td><td>19</td></tr>
<tr><td>五、故障題</td><td>至少一次嘗試整張寫完12</td><td>有一張「最右邊沒有由高到低」而且追蹤過程正確：10；最右邊沒排好、但追蹤過程有錯：4；兩張都排好了（沒找到）：0。共10</td><td>22</td></tr>
<tr><td>六、加分題</td><td colspan="2">網路正確（任何3個數字都能排好）5分＋6種排法都有測試並打勾5分。用了4個以上比較器但正確，一樣給5分。</td><td>＋10</td></tr>
<tr><th colspan="3">合計</th><th>100＋10</th></tr>
</table>
<p>一-1的第①步是印好的，完成度和正確度都只看第②步之後。加分題的分數直接加在總分上，可以超過100分（最高110分）。</p>
<h2>補充說明</h2>
<ul>
<li>比較器編號與負責的線（由上往下第1～6條）：{"、".join(f"{k}：{a+1}和{b+1}" for k,(a,b) in flat.items())}。</li>
<li>四（2）的回合表：只要不違反先後順序（每個比較器都要等前面用到同一條線的比較器做完），而且總共5回合就算全對。學習單的例子已經提示A、B在第1回合，學生還要自己找出C也在第1回合。</li>
<li>五：拆掉F之後，720種1～6的排法中有{len(bad)}種會排不好，大約試5次會成功1次。例子：{"；".join("、".join(map(str,p)) for p in bad[:4])}。學生的答案只要「追蹤過程每格正確，而且最右邊沒有由高到低」就算對，不用跟這裡的例子一樣。F原本負責比第1條和第4條線，關鍵是：走到F原本的位置時，第4條線上的分數比第1條線大，少了F就沒有機會換上去。</li>
<li>解答圖中，<span style="color:#e67e22;font-weight:bold">橘色</span>的比較器代表那一步真的有交換分數。</li>
</ul>
</div>
'''
open(OUT_ANS,'w',encoding='utf-8').write(html('閘門行動｜排序網路解答（教師用）', page(teacher) + page(build(True))))
print('bad F', len(bad), bad[:4])
print('example steps', EX)
