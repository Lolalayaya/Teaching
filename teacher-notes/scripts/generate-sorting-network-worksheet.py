import sys
from itertools import permutations
OUT_WS = sys.argv[1]; OUT_ANS = sys.argv[2]

# 6條線網路（比較器A~L），同一欄代表畫在同一個x位置（線段不重疊才共用）
N6_COLS = [[('A',0,5)],[('B',1,3)],[('C',2,4)],[('D',1,2),('E',3,4)],[('F',0,3)],[('G',2,5)],[('H',0,1),('I',2,3),('J',4,5)],[('K',1,2),('L',3,4)]]
N4_COLS = [[('a',0,1),('b',2,3)],[('c',0,2)],[('d',1,3)],[('e',1,2)]]
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

PITCH=16; BW=12; BH=7; DY=11; TOP=9
def svg(cols, n, inputs=None, mode='blank', labels=False, removed=None, ranks=True, boxes=True, extra_w=0):
    """mode: blank=學生空白, example=範例全填(印刷色), answer=解答(紅字)"""
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
            if lab==removed:
                o.append(f'<line x1="{x}" y1="{y(a)}" x2="{x}" y2="{y(b)}" stroke="#bbb" stroke-width="0.5" stroke-dasharray="1.2 1"/>')
                for k in (a,b): o.append(f'<circle cx="{x}" cy="{y(k)}" r="1.4" fill="#fff" stroke="#bbb" stroke-width="0.4"/>')
                o.append(f'<text x="{x}" y="{y(a)-3.9}" font-size="3.2" fill="#999" text-anchor="middle">✂{lab}</text>')
                continue
            sw = mode=='answer' and vals and lab in vals[2]
            c = '#e67e22' if sw else '#111'
            o.append(f'<line x1="{x}" y1="{y(a)}" x2="{x}" y2="{y(b)}" stroke="{c}" stroke-width="{0.9 if sw else 0.6}"/>')
            for k in (a,b): o.append(f'<circle cx="{x}" cy="{y(k)}" r="1.4" fill="{c}"/>')
            if labels: o.append(f'<text x="{x}" y="{y(a)-3.9}" font-size="3.4" font-weight="bold" fill="#2f5fa8" text-anchor="middle">{lab}</text>')
            if boxes:
                va,vb = (vals[1][lab] if (vals and fill) else (None,None))
                box(x+9.5,y(a),va,tcol); box(x+9.5,y(b),vb,tcol)
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

CSS = '''
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing: border-box; }
body { font-family: "Microsoft JhengHei","PingFang TC",sans-serif; color:#222; margin:0; font-size:3.6mm; line-height:1.55; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
@media screen { body{background:#ddd;} .page{width:210mm;min-height:297mm;margin:8mm auto;padding:10mm;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);} .noprint{max-width:210mm;margin:6mm auto 0;font-size:14px;} }
@media print { .noprint{display:none;} }
h1 { font-size:5.4mm; margin:0 0 1mm; }
h2 { font-size:4.4mm; margin:4mm 0 1mm; border-left:1.6mm solid #2f5fa8; padding-left:2mm; }
.idrow { display:flex; gap:6mm; align-items:flex-end; border-bottom:0.4mm solid #333; padding-bottom:2mm; margin-bottom:2mm; }
.idrow span { white-space:nowrap; }
.idrow .line { display:inline-block; border-bottom:0.3mm solid #333; width:16mm; }
.idrow .line.long { width:30mm; }
.score { margin-left:auto; border:0.4mm solid #333; padding:1mm 3mm; }
.rules { border:0.3mm solid #999; border-radius:2mm; padding:2mm 3mm; background:#f6f8fc; }
.rules ol { margin:0; padding-left:5mm; }
.item { margin:1.5mm 0 1mm; break-inside:avoid; }
.item .cap { font-weight:bold; }
.net { display:block; margin:1mm 0 0 2mm; }
.q { margin:1.2mm 0; }
.blank { display:inline-block; border-bottom:0.3mm solid #333; min-width:14mm; text-align:center; }
.ans { color:#c0392b; font-weight:bold; }
table.rounds { border-collapse:collapse; margin:1mm 0; }
table.rounds td { border:0.3mm solid #888; padding:1mm 3mm; height:7mm; }
table.rounds td:first-child { width:24mm; background:#f3f3f3; }
table.rounds td:last-child { width:60mm; }
.perm { display:inline-block; margin:0 4mm 1mm 0; }
.drawbox { border:0.3mm dashed #aaa; border-radius:2mm; padding:1mm; }
.teacher p, .teacher li { font-size:3.5mm; }
table.plan { border-collapse:collapse; width:100%; }
table.plan td, table.plan th { border:0.3mm solid #999; padding:1mm 2mm; vertical-align:top; text-align:left; }
'''

def page(inner): return f'<div class="page">{inner}</div>'

def build(ans):
    A = (lambda s: f'<span class="ans">{s}</span>') if ans else (lambda s: '')
    B = lambda s: f'<span class="blank">{A(s)}</span>'
    m = 'answer' if ans else 'blank'
    def six(key, **kw): return svg(N6_COLS,6,D[key],m,**kw)
    def four(key): return svg(N4_COLS,4,D[key],m)
    sw = lambda key: len(run(N6_COLS,D[key])[2])

    p1 = f'''
<div class="idrow"><h1 style="margin:0">特別任務檔案・閘門行動｜排序網路學習單</h1></div>
<div class="idrow"><span>班級 <span class="line"></span></span><span>座號 <span class="line"></span></span><span>姓名 <span class="line long"></span></span><span class="score">得分：　　　　</span></div>
<div class="rules"><b>排序網路規則</b>
<ol>
<li>每條橫線上放一個分數，分數從左往右走。</li>
<li>遇到<b>兩個黑點用直線連起來</b>的地方（叫做「比較器」），把這兩條線上的分數比大小：<b>分數高的往上、分數低的往下</b>。本來就是高的在上面，就照原樣往右走。</li>
<li>直線經過、但沒有黑點的地方，不用比較，分數直接穿過。</li>
<li>每經過一個比較器，就把離開時的兩個分數寫進後面的方格。最右邊的粗框寫最後結果。</li>
</ol>
<b>自我檢查：</b>走完之後，最右邊從上到下應該由高到低排好（最上面是第1名）。如果沒有，代表中間有一格寫錯了，請回頭找出來。</div>
<h2>範例（老師會帶大家一起走一遍）</h2>
<div class="item">{svg(N4_COLS,4,D['ex'],'example')}</div>
<h2>一、暖身：4條線排序網路</h2>
<div class="item"><div class="cap">一-1</div>{four('w1')}</div>
<div class="item"><div class="cap">一-2</div>{four('w2')}</div>
'''
    p2 = f'''
<h2>二、6條線排序網路：手遊排行榜</h2>
<p class="q">這張網路不管輸入什麼分數，最後一定會排好。如果你的結果沒排好，一定是哪一格寫錯了。</p>
<div class="item"><div class="cap">二-1</div>{six('m1')}</div>
<div class="item"><div class="cap">二-2</div>{six('m2')}</div>
<h2>三、特殊的輸入</h2>
<div class="item"><div class="cap">三-1　這組分數本來就已經排好了</div>{six('s1')}</div>
<p class="q">這張圖裡，真正有把分數上下交換的比較器有 {B(sw('s1'))} 個。</p>
'''
    p3 = f'''
<div class="item"><div class="cap">三-2　這組分數剛好完全倒過來</div>{six('s2')}</div>
<p class="q">（1）這張圖裡，真正有把分數上下交換的比較器有 {B(sw('s2'))} 個。</p>
<p class="q">（2）不管輸入的分數本來排得好不好，都一定要經過全部 {B(12)} 個比較器，網路才算走完。</p>
<h2>四、哪些比較器可以同時做？</h2>
<p class="q">假設每個比較器由一位同學負責，比一次要1秒。兩個比較器只要<b>用到的線完全不同</b>、而且<b>需要的分數都已經準備好</b>，就可以同時進行。</p>
<div class="item">{svg(N6_COLS,6,None,'blank',labels=True,boxes=False,ranks=False)}</div>
<p class="q">（1）這張網路一共有 {B(12)} 個比較器。</p>
<p class="q">（2）把可以同時做的比較器寫在同一回合（填英文字母），回合數越少越好，用不到的格子留白：</p>
<table class="rounds">{''.join(f'<tr><td>第{i+1}回合</td><td>{A("、".join(STAGES[i])) if i<len(STAGES) else ""}</td></tr>' for i in range(6))}</table>
<p class="q">（3）最少 {B(5)} 回合，也就是 {B(5)} 秒就能排完。</p>
<p class="q">（4）如果只有一個人，用第五週的打擂台法來排：先從6個分數中找出第1名要比 {B(5)} 次，再從剩下5個找出第2名要比 {B(4)} 次……一直做到排完，總共要比 {B(15)} 次。</p>
'''
    p4 = f'''
<h2>五、故障題：拆掉一個比較器</h2>
<p class="q">老師把比較器 <b>F</b> 拆掉了（虛線）。請自己找一組輸入，讓這張網路<b>排不好</b>。可以只用1～6這六個數字。提示：想想看F原本負責比較哪兩條線。成功的那一張，請在旁邊打 ★。</p>
<div class="item"><div class="cap">嘗試1</div>{svg(N6_COLS,6,list(bad[0]) if ans else None,m,labels=True,removed='F')}</div>
<div class="item"><div class="cap">嘗試2</div>{svg(N6_COLS,6,None,'blank',labels=True,removed='F')}</div>
<h2>六、加分題：設計3條線的排序網路</h2>
<p class="q">在下面3條線上，自己畫出比較器（兩個黑點連一條直線），讓任何3個數字都能排好。</p>
<div class="item drawbox">{svg([],3,None,'blank',boxes=False,ranks=False,extra_w=80)}</div>
<p class="q">（1）我的網路用了 {B(3)} 個比較器。{A("（最少3個，例如：先比第1、2條，再比第2、3條，最後再比第1、2條）")}</p>
<p class="q">（2）用1、2、3的6種排法測試，排好的打 ✓：
{''.join(f'<span class="perm">☐ {a}、{b}、{c}</span>' for a,b,c in permutations((1,2,3)))}</p>
'''
    return [p1,p2,p3,p4]

def html(title, pages, pre=''):
    return f'<!DOCTYPE html>\n<html lang="zh-Hant">\n<head>\n<meta charset="UTF-8" />\n<title>{title}</title>\n<style>{CSS}</style>\n</head>\n<body>\n{pre}{"".join(page(p) for p in pages)}\n</body>\n</html>\n'

open(OUT_WS,'w',encoding='utf-8').write(html('特別任務檔案・閘門行動｜排序網路學習單', build(False),
  '<p class="noprint">學生用學習單，A4直式共4頁，建議雙面列印（2張）。用瀏覽器開啟後按 Ctrl+P 列印，勾選「背景圖形」。解答與教學流程在 teacher-notes/sorting-network-answers.html。</p>'))

flat = {lab:(a,b) for col in N6_COLS for lab,a,b in col}
teacher = f'''
<div class="teacher">
<h1>特別任務檔案・閘門行動｜排序網路　教師用（教學流程＋解答，不對學生公開）</h1>
<p>使用時機：805段考後原本第七週那一堂，在普通教室上的不插電課。這堂<b>不推進度</b>：805上完後跟802、806、808同一批，下一堂再上第七週選擇排序（電腦教室，含網站易用性測試）。對應課綱資A-IV-3基本演算法（排序）。</p>
<h2>課堂流程（45分鐘）</h2>
<table class="plan">
<tr><th style="width:22mm">時間</th><th>內容</th></tr>
<tr><td>0–5分</td><td>回顧第五週打擂台法：「6個分數找最大值要比幾次？找到第1名之後，第2名怎麼辦？」帶出今天的主題：排序。</td></tr>
<tr><td>5–13分</td><td>黑板畫出學習單第1頁的4條線範例（785、920、650、870），全班一起一格一格走。強調三件事：高的往上、沒有黑點直接穿過、最後一定由高到低。<br>宣布規則：一到五題個人作答、不討論，下課前收回並計入平時成績；寫完才可以做加分題。</td></tr>
<tr><td>13–40分</td><td>個人作答。有問題舉手，老師走過去，不離開座位。學生問「這樣對嗎」時，先請他看最右邊有沒有由高到低。</td></tr>
<tr><td>40–45分</td><td>收回學習單。預告下一堂：在電腦教室上「選擇排序法」，就是第四大題第（4）小題「一個人用打擂台法排」的做法。</td></tr>
</table>
<h2>評分建議（100分＋加分10分）</h2>
<ul>
<li>一、暖身：2題×10分＝20分（中間方格全對10分；結果對但中間有錯5分）</li>
<li>二、6條線：2題×15分＝30分（同上，中間有錯給7分）</li>
<li>三、特殊輸入：2張圖各7分＋3個填空共6分＝20分</li>
<li>四、同時進行：15分（比較器數3分、回合表6分、最少回合3分、打擂台次數3分）</li>
<li>五、故障題：15分（輸入真的排不好，而且追蹤過程正確）</li>
<li>六、加分題：最多10分（網路正確5分、6種排法都測試過5分）</li>
</ul>
<h2>補充說明</h2>
<ul>
<li>比較器編號與負責的線（由上往下第1～6條）：{"、".join(f"{k}：{a+1}和{b+1}" for k,(a,b) in flat.items())}。</li>
<li>四（2）的回合表：只要不違反先後順序（每個比較器都要等前面用到同一條線的比較器做完），而且總共5回合就算全對。</li>
<li>五：拆掉F之後，720種1～6的排法中有{len(bad)}種會排不好，大約試5次會成功1次。例子：{"；".join("、".join(map(str,p)) for p in bad[:4])}。學生的答案只要「追蹤過程每格正確，而且最右邊沒有由高到低」就算對，不用跟這裡的例子一樣。F原本負責比第1條和第4條線，關鍵是：走到F原本的位置時，第4條線上的分數比第1條線大，少了F就沒有機會換上去。</li>
<li>解答圖中，<span style="color:#e67e22;font-weight:bold">橘色</span>的比較器代表那一步真的有交換分數。</li>
</ul>
</div>
'''
open(OUT_ANS,'w',encoding='utf-8').write(html('閘門行動｜排序網路解答（教師用）', [teacher]+build(True)))
print('bad F', len(bad), bad[:4])
for k in ('s1','s2','m1','m2'): print(k, run(N6_COLS,D[k])[0], sorted(run(N6_COLS,D[k])[2]))
