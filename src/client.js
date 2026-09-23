// CET6 Tutor - Client code (function body returning a Cordis Plugin)
// Registers a settings section with full learning UI: Dashboard / Vocabulary / Reading / Listening / Help.

return {
  apply(ctx) {
    const h = React.createElement; // React is exposed as a Builtin global, NOT via ctx

    // ===== Stylesheet =====
    const css = `
      .cet6-app { font-family: inherit; padding: 0; }
      .cet6-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border, #e2e2e2); margin-bottom: 16px; padding-bottom: 0; flex-wrap: wrap; }
      .cet6-tab { padding: 10px 16px; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 14px; color: var(--fg-muted, #666); transition: all .15s; }
      .cet6-tab:hover { color: var(--fg, #1a1a1a); background: var(--bg-hover, rgba(0,0,0,0.03)); }
      .cet6-tab.active { color: var(--accent, #2563eb); border-bottom-color: var(--accent, #2563eb); font-weight: 600; }
      .cet6-card { background: var(--bg-elevated, #fafafa); border: 1px solid var(--border, #e2e2e2); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
      .cet6-card h3 { margin: 0 0 12px; font-size: 16px; color: var(--fg, #1a1a1a); }
      .cet6-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 12px; }
      .cet6-stat { background: var(--bg, white); border: 1px solid var(--border, #e2e2e2); border-radius: 8px; padding: 16px; text-align: center; }
      .cet6-stat .num { font-size: 28px; font-weight: 700; color: var(--accent, #2563eb); line-height: 1; }
      .cet6-stat .label { font-size: 12px; color: var(--fg-muted, #666); margin-top: 4px; }
      .cet6-stat.danger .num { color: #dc2626; }
      .cet6-stat.success .num { color: #16a34a; }
      .cet6-stat.warn .num { color: #ea580c; }
      .cet6-passage { background: var(--bg-elevated, #fafafa); border: 1px solid var(--border, #e2e2e2); border-radius: 12px; padding: 20px; max-height: 360px; overflow-y: auto; white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: var(--fg, #1a1a1a); margin-bottom: 16px; }
      .cet6-options { display: grid; gap: 8px; margin-bottom: 16px; }
      .cet6-opt { display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: var(--bg, white); border: 2px solid var(--border, #e2e2e2); border-radius: 8px; cursor: pointer; transition: all .15s; }
      .cet6-opt:hover { border-color: var(--accent, #2563eb); background: var(--bg-hover, rgba(37,99,235,0.04)); }
      .cet6-opt.selected { border-color: var(--accent, #2563eb); background: rgba(37,99,235,0.08); }
      .cet6-opt.correct { border-color: #16a34a; background: rgba(22,163,74,0.08); }
      .cet6-opt.wrong { border-color: #dc2626; background: rgba(220,38,38,0.06); }
      .cet6-opt .letter { font-weight: 700; min-width: 24px; }
      .cet6-opt .text { flex: 1; }
      .cet6-input { width: 100%; padding: 10px 12px; border: 1px solid var(--border, #e2e2e2); border-radius: 8px; font-size: 14px; background: var(--bg, white); color: var(--fg, #1a1a1a); margin-bottom: 8px; box-sizing: border-box; }
      .cet6-btn { padding: 10px 18px; border: none; border-radius: 8px; background: var(--accent, #2563eb); color: white; font-size: 14px; cursor: pointer; transition: opacity .15s; font-weight: 500; }
      .cet6-btn:hover:not(:disabled) { opacity: 0.85; }
      .cet6-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .cet6-btn.secondary { background: var(--bg-elevated, #fafafa); color: var(--fg, #1a1a1a); border: 1px solid var(--border, #e2e2e2); }
      .cet6-btn.danger { background: #dc2626; }
      .cet6-btn.success { background: #16a34a; }
      .cet6-btn-row { display: flex; gap: 8px; flex-wrap: wrap; }
      .cet6-flash { background: linear-gradient(135deg, var(--accent, #2563eb) 0%, #1d4ed8 100%); color: white; padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 16px; min-height: 200px; display: flex; flex-direction: column; justify-content: center; }
      .cet6-flash .word { font-size: 48px; font-weight: 700; margin-bottom: 12px; }
      .cet6-flash .meaning { font-size: 18px; opacity: 0.95; line-height: 1.5; }
      .cet6-flash .stage { font-size: 13px; opacity: 0.8; margin-top: 12px; }
      .cet6-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; background: var(--bg-elevated, #f0f0f0); color: var(--fg, #1a1a1a); margin-right: 4px; }
      .cet6-badge.accent { background: var(--accent, #2563eb); color: white; }
      .cet6-badge.success { background: #16a34a; color: white; }
      .cet6-badge.warn { background: #ea580c; color: white; }
      .cet6-list { max-height: 320px; overflow-y: auto; }
      .cet6-list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--border, #e2e2e2); }
      .cet6-list-item .word { font-weight: 600; }
      .cet6-list-item .meaning { color: var(--fg-muted, #666); font-size: 13px; }
      .cet6-list-item .meta { font-size: 12px; color: var(--fg-muted, #666); }
      .cet6-empty { text-align: center; padding: 40px; color: var(--fg-muted, #999); }
      .cet6-result { padding: 16px; border-radius: 12px; margin-bottom: 16px; }
      .cet6-result.good { background: rgba(22,163,74,0.08); border: 1px solid #16a34a; }
      .cet6-result.bad { background: rgba(220,38,38,0.08); border: 1px solid #dc2626; }
      .cet6-result .score { font-size: 32px; font-weight: 700; }
      .cet6-detail { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; margin-top: 12px; }
      .cet6-q { padding: 8px; border-radius: 6px; text-align: center; font-size: 13px; }
      .cet6-q.ok { background: rgba(22,163,74,0.15); color: #16a34a; }
      .cet6-q.no { background: rgba(220,38,38,0.15); color: #dc2626; }
      .cet6-audio { width: 100%; margin: 12px 0; }
      .cet6-section-header { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--bg-elevated, #f5f5f5); border-radius: 8px; margin-bottom: 8px; font-weight: 600; }
      .cet6-msg { padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; }
      .cet6-msg.info { background: rgba(37,99,235,0.08); color: #1d4ed8; }
      .cet6-msg.error { background: rgba(220,38,38,0.08); color: #b91c1c; }
      .cet6-msg.success { background: rgba(22,163,74,0.08); color: #15803d; }
      .cet6-countdown { display: inline-block; padding: 6px 14px; border-radius: 20px; background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; font-weight: 600; font-size: 14px; }
    `;
    styles.insert(css);

    // ===== Helpers =====
    function relTime(ts) {
      const diff = ts - Math.floor(Date.now() / 1000);
      if (diff < 0) return '已逾期';
      if (diff < 3600) return Math.floor(diff / 60) + ' 分钟后';
      if (diff < 86400) return Math.floor(diff / 3600) + ' 小时后';
      return Math.floor(diff / 86400) + ' 天后';
    }

    // ===== Vocabulary View =====
    function VocabView(props) {
      const [mode, setMode] = React.useState('review'); // review | new | list
      const [dueQueue, setDueQueue] = React.useState([]);
      const [idx, setIdx] = React.useState(0);
      const [showMeaning, setShowMeaning] = React.useState(false);
      const [customWord, setCustomWord] = React.useState('');
      const [customResult, setCustomResult] = React.useState(null);
      const [newCount, setNewCount] = React.useState(10);
      const [listMode, setListMode] = React.useState('reviewing');
      const [wordList, setWordList] = React.useState([]);
      const [busy, setBusy] = React.useState(false);
      const [msg, setMsg] = React.useState(null);

      const loadDue = async () => {
        const r = await host.call('cet6/vocab/review', { limit: 30 });
        setDueQueue(r || []);
        setIdx(0);
        setShowMeaning(false);
      };

      const loadList = async (m) => {
        const r = await host.call('cet6/vocab/list', { mode: m });
        if (m === 'reviewing') setWordList(r || []);
        else if (m === 'mastered') setWordList(r || []);
        setListMode(m);
      };

      React.useEffect(() => { loadDue(); loadList('reviewing'); }, []);

      const grade = async (known) => {
        if (!dueQueue[idx]) return;
        const w = dueQueue[idx].word;
        setBusy(true);
        const r = await host.call('cet6/vocab/grade', { word: w, known });
        setBusy(false);
        if (r && r.ok) {
          if (r.graduated) {
            setMsg({ kind: 'success', text: '🎉 ' + r.word + ' 已毕业！' });
            // Remove from queue
            setDueQueue(d => d.filter((_, i) => i !== idx));
          } else if (r.demoted) {
            setMsg({ kind: 'warn', text: '📉 ' + r.word + ' 降级至 ' + r.stage });
            setIdx(Math.min(idx, dueQueue.length - 2));
            setShowMeaning(false);
          } else {
            // Move to next
            setIdx((idx + 1) % Math.max(1, dueQueue.length - 1));
            setShowMeaning(false);
          }
          if (props.onChange) props.onChange();
        }
      };

      const kill = async () => {
        if (!dueQueue[idx]) return;
        const w = dueQueue[idx].word;
        setBusy(true);
        await host.call('cet6/vocab/kill', { word: w });
        setBusy(false);
        setMsg({ kind: 'success', text: '⚔️ ' + w + ' 一击必杀' });
        setDueQueue(d => d.filter((_, i) => i !== idx));
        if (props.onChange) props.onChange();
      };

      const lookup = async () => {
        if (!customWord.trim()) return;
        setBusy(true);
        const r = await host.call('cet6/vocab/lookup', { word: customWord });
        setBusy(false);
        if (r && r.ok) {
          setCustomResult(r);
          setMsg({ kind: 'info', text: '查询成功' });
        } else {
          setMsg({ kind: 'error', text: (r && r.msg) || '未找到' });
          setCustomResult(null);
        }
      };

      const addToPool = async () => {
        if (!customWord) return;
        setBusy(true);
        const r = await host.call('cet6/vocab/add', { word: customWord });
        setBusy(false);
        if (r && r.ok) {
          setMsg({ kind: 'success', text: '✓ 已加入：' + r.word });
          setCustomWord('');
          if (props.onChange) props.onChange();
          loadList('reviewing');
        } else {
          setMsg({ kind: 'error', text: (r && r.msg) || '加入失败' });
        }
      };

      const fetchNewWords = async () => {
        setBusy(true);
        const r = await host.call('cet6/vocab/new', { count: newCount });
        setBusy(false);
        if (r && r.length) {
          setMsg({ kind: 'success', text: '已添加 ' + r.length + ' 个新词' });
          if (props.onChange) props.onChange();
          loadList('reviewing');
        } else {
          setMsg({ kind: 'info', text: '没有更多新词可添加' });
        }
      };

      const removeWord = async (w) => {
        setBusy(true);
        await host.call('cet6/vocab/remove', { word: w });
        setBusy(false);
        loadList(listMode);
        if (props.onChange) props.onChange();
      };

      const current = dueQueue[idx];

      return h('div', { className: 'cet6-app' },
        h('div', { className: 'cet6-tabs' },
          h('button', { className: 'cet6-tab ' + (mode === 'review' ? 'active' : ''), onClick: () => setMode('review') }, '🎴 复习'),
          h('button', { className: 'cet6-tab ' + (mode === 'new' ? 'active' : ''), onClick: () => setMode('new') }, '📥 进货'),
          h('button', { className: 'cet6-tab ' + (mode === 'list' ? 'active' : ''), onClick: () => setMode('list') }, '📚 词库')
        ),
        msg && h('div', { className: 'cet6-msg ' + msg.kind }, msg.text),

        mode === 'review' && h('div', null,
          h('div', { className: 'cet6-btn-row', style: { marginBottom: 12 } },
            h('button', { className: 'cet6-btn secondary', onClick: loadDue, disabled: busy }, '🔄 重新拉取复习列表'),
            h('span', { className: 'cet6-badge accent' }, '待复习：' + dueQueue.length)
          ),
          current ? h('div', null,
            h('div', { className: 'cet6-flash' },
              h('div', { className: 'word' }, current.word),
              showMeaning ? h('div', { className: 'meaning' }, current.meaning) : h('button', { className: 'cet6-btn', style: { background: 'rgba(255,255,255,0.2)' }, onClick: () => setShowMeaning(true) }, '👁️ 显示释义'),
              h('div', { className: 'stage' }, '当前境界：' + RANKS_CLIENT[current.stage])
            ),
            h('div', { className: 'cet6-btn-row' },
              h('button', { className: 'cet6-btn success', onClick: () => grade(true), disabled: busy || !showMeaning }, '✓ 记住了'),
              h('button', { className: 'cet6-btn danger', onClick: () => grade(false), disabled: busy || !showMeaning }, '✗ 忘了'),
              h('button', { className: 'cet6-btn secondary', onClick: kill, disabled: busy }, '⚔️ 一击必杀')
            )
          ) : h('div', { className: 'cet6-empty' }, dueQueue.length === 0 ? '🎉 今天没有需要复习的单词！' : '请先拉取复习列表')
        ),

        mode === 'new' && h('div', { className: 'cet6-card' },
          h('h3', null, '🔍 查询 / 加入单词'),
          h('input', { className: 'cet6-input', placeholder: '输入英文单词...', value: customWord, onChange: e => setCustomWord(e.target.value), onKeyDown: e => { if (e.key === 'Enter') lookup(); } }),
          h('div', { className: 'cet6-btn-row' },
            h('button', { className: 'cet6-btn secondary', onClick: lookup, disabled: busy || !customWord }, '🔍 查询释义'),
            h('button', { className: 'cet6-btn', onClick: addToPool, disabled: busy || !customWord }, '➕ 加入复习')
          ),
          customResult && h('div', { className: 'cet6-msg info', style: { marginTop: 12 } }, '【' + customResult.word + '】 ' + customResult.meaning),
          h('hr', { style: { margin: '20px 0', border: 'none', borderTop: '1px solid var(--border, #e2e2e2)' } }),
          h('h3', null, '📥 批量拉取新词'),
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
            h('input', { type: 'number', className: 'cet6-input', style: { maxWidth: 120 }, value: newCount, onChange: e => setNewCount(Math.max(1, Math.min(100, Number(e.target.value) || 10))) }),
            h('button', { className: 'cet6-btn', onClick: fetchNewWords, disabled: busy }, '🎲 拉取 ' + newCount + ' 个新词')
          )
        ),

        mode === 'list' && h('div', null,
          h('div', { className: 'cet6-tabs' },
            h('button', { className: 'cet6-tab ' + (listMode === 'reviewing' ? 'active' : ''), onClick: () => loadList('reviewing') }, '复习中'),
            h('button', { className: 'cet6-tab ' + (listMode === 'mastered' ? 'active' : ''), onClick: () => loadList('mastered') }, '已掌握')
          ),
          wordList.length === 0 ? h('div', { className: 'cet6-empty' }, '暂无单词') :
            h('div', { className: 'cet6-list' },
              wordList.map((it, i) => h('div', { key: i, className: 'cet6-list-item' },
                h('div', null,
                  h('div', { className: 'word' }, it.word, ' ', h('span', { className: 'cet6-badge' }, it.rank || '')),
                  h('div', { className: 'meaning' }, it.meaning || it.rank)
              ),
                h('button', { className: 'cet6-btn secondary', style: { padding: '4px 10px', fontSize: 12 }, onClick: () => removeWord(it.word) }, '移除')
              ))
            )
        )
      );
    }

    // ===== Reading View =====
    function ReadingView(props) {
      const [current, setCurrent] = React.useState(null);
      const [selected, setSelected] = React.useState({});
      const [result, setResult] = React.useState(null);
      const [msg, setMsg] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [answeredKey, setAnsweredKey] = React.useState('');

      const draw = async () => {
        setBusy(true);
        setResult(null);
        setSelected({});
        setAnsweredKey('');
        const r = await host.call('cet6/reading/draw', {});
        setBusy(false);
        if (r && r.ok) {
          setCurrent(r);
          setMsg(null);
        } else {
          setCurrent(null);
          setMsg({ kind: 'info', text: (r && r.msg) || '出题失败' });
        }
      };

      React.useEffect(() => { draw(); }, []);

      const selectOpt = (qIdx, letter) => {
        if (result) return;
        setSelected(s => ({ ...s, [qIdx]: letter }));
      };

      const buildAnswer = () => {
        if (!current) return '';
        const qs = current.questionNumbers || [];
        return qs.map((_, i) => selected[i] || ' ').join('');
      };

      const submit = async () => {
        if (!current) return;
        const ans = buildAnswer();
        const filled = Object.keys(selected).length;
        if (filled < (current.questionNumbers || []).length) {
          setMsg({ kind: 'error', text: '请先完成所有题目（已答 ' + filled + '/' + current.questionNumbers.length + '）' });
          return;
        }
        setBusy(true);
        const r = await host.call('cet6/reading/grade', { qId: current.id, userAnswer: ans });
        setBusy(false);
        if (r && r.ok) {
          setResult(r);
          if (props.onChange) props.onChange();
        } else {
          setMsg({ kind: 'error', text: (r && r.msg) || '批改失败' });
        }
      };

      const checkAnswer = async () => {
        if (!current) return;
        setBusy(true);
        const r = await host.call('cet6/reading/check', { qId: current.id });
        setBusy(false);
        if (r && r.ok) {
          setAnsweredKey(r.correct);
          setResult({ ok: true, qId: r.qId, correct: r.correct, user: '', right: 0, total: r.correct.length, score: 0, detail: r.correct.split('').map((c, i) => ({ q: i + 1, user: '?', correct: c, ok: false })) });
          if (props.onChange) props.onChange();
        } else {
          setMsg({ kind: 'error', text: (r && r.msg) || '失败' });
        }
      };

      const getOptClass = (qIdx, letter) => {
        if (!result) return selected[qIdx] === letter ? 'cet6-opt selected' : 'cet6-opt';
        const c = result.correct[qIdx];
        const u = selected[qIdx];
        if (letter === c) return 'cet6-opt correct';
        if (letter === u && u !== c) return 'cet6-opt wrong';
        return 'cet6-opt';
      };

      return h('div', { className: 'cet6-app' },
        h('div', { className: 'cet6-btn-row', style: { marginBottom: 12 } },
          h('button', { className: 'cet6-btn', onClick: draw, disabled: busy }, '🎲 来篇阅读'),
          current && !result && h('button', { className: 'cet6-btn secondary', onClick: checkAnswer, disabled: busy }, '👀 直接查答案')
        ),
        msg && h('div', { className: 'cet6-msg ' + msg.kind }, msg.text),

        current && h('div', null,
          h('div', { className: 'cet6-card' },
            h('div', { style: { marginBottom: 8 } },
              h('span', { className: 'cet6-badge accent' }, (current.meta && current.meta.year || '') + '年' + (current.meta && current.meta.month || '') + '月 第' + (current.meta && current.meta.set_index || '?') + '套'),
              h('span', { className: 'cet6-badge' }, current.type)
            ),
            !current.hasAnswer && h('div', { className: 'cet6-msg warn' }, '⚠️ 此题暂无答案')
          ),
          h('div', { className: 'cet6-passage' }, current.passage),

          current.questionNumbers && current.questionNumbers.map((qn, qIdx) => {
            const opts = Object.keys(current.options || {});
            return h('div', { key: qIdx, style: { marginBottom: 16 } },
              h('div', { style: { fontWeight: 600, marginBottom: 8 } }, '第 ' + qn + ' 题'),
              h('div', { className: 'cet6-options' },
                opts.map(letter => h('div', {
                  key: letter,
                  className: getOptClass(qIdx, letter),
                  onClick: () => selectOpt(qIdx, letter)
                },
                  h('span', { className: 'letter' }, letter + '.'),
                  h('span', { className: 'text' }, (current.options || {})[letter] || '')
                ))
              )
            );
          }),

          result && h('div', { className: 'cet6-result ' + (result.score >= 60 ? 'good' : 'bad') },
            h('div', { className: 'score' }, result.score + ' 分'),
            h('div', { style: { fontSize: 14 } }, '答对 ' + result.right + ' / ' + result.total + ' 题'),
            h('div', { className: 'cet6-detail' },
              result.detail.map((d, i) => h('div', { key: i, className: 'cet6-q ' + (d.ok ? 'ok' : 'no') }, 'Q' + d.q + ': ' + (d.user === '?' ? '?' : (d.ok ? '✓' : (d.user || ' ') + '→' + d.correct))))
            )
          ),

          !result && current.hasAnswer && h('div', { className: 'cet6-btn-row' },
            h('button', { className: 'cet6-btn', onClick: submit, disabled: busy }, '📝 提交答案')
          )
        )
      );
    }

    // ===== Listening View =====
    function ListeningView(props) {
      const [current, setCurrent] = React.useState(null);
      const [selected, setSelected] = React.useState({});
      const [result, setResult] = React.useState(null);
      const [msg, setMsg] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [audioErr, setAudioErr] = React.useState(false);

      const draw = async () => {
        setBusy(true);
        setResult(null);
        setSelected({});
        setAudioErr(false);
        const r = await host.call('cet6/listening/draw', {});
        setBusy(false);
        if (r && r.ok) {
          setCurrent(r);
          setMsg(null);
        } else {
          setCurrent(null);
          setMsg({ kind: 'info', text: (r && r.msg) || '出题失败' });
        }
      };

      React.useEffect(() => { draw(); }, []);

      const sections = current && current.sections || {};
      const sectionTypes = { A: '长对话', B: '短文', C: '讲话/讲座' };

      const flatQuestions = (() => {
        if (!sections) return [];
        const list = [];
        for (const sk of Object.keys(sections)) {
          const sd = sections[sk];
          const qs = (sd && sd.questions) || [];
          for (const q of qs) list.push({ ...q, _section: sk });
        }
        return list.sort((a, b) => (a.q_num || 0) - (b.q_num || 0));
      })();

      const selectOpt = (qNum, letter) => {
        if (result) return;
        setSelected(s => ({ ...s, [qNum]: letter }));
      };

      const submit = async () => {
        if (!current) return;
        const ans = flatQuestions.map(q => selected[q.q_num] || ' ').join('');
        const filled = Object.keys(selected).length;
        if (filled < flatQuestions.length) {
          setMsg({ kind: 'error', text: '请完成所有题目（已答 ' + filled + '/' + flatQuestions.length + '）' });
          return;
        }
        setBusy(true);
        const r = await host.call('cet6/listening/grade', { key: current.key, userAnswer: ans });
        setBusy(false);
        if (r && r.ok) {
          setResult(r);
          if (props.onChange) props.onChange();
        } else {
          setMsg({ kind: 'error', text: (r && r.msg) || '批改失败' });
        }
      };

      const skip = async () => {
        if (!current) return;
        setBusy(true);
        await host.call('cet6/listening/skip', { key: current.key });
        setBusy(false);
        draw();
        if (props.onChange) props.onChange();
      };

      const getOptClass = (qNum, letter) => {
        if (!result) return selected[qNum] === letter ? 'cet6-opt selected' : 'cet6-opt';
        const d = (result.detail || []).find(x => x.q === qNum);
        if (!d) return 'cet6-opt';
        if (letter === d.correct) return 'cet6-opt correct';
        if (letter === d.user && d.user !== d.correct) return 'cet6-opt wrong';
        return 'cet6-opt';
      };

      return h('div', { className: 'cet6-app' },
        h('div', { className: 'cet6-btn-row', style: { marginBottom: 12 } },
          h('button', { className: 'cet6-btn', onClick: draw, disabled: busy }, '🎧 来个听力'),
          current && !result && h('button', { className: 'cet6-btn secondary', onClick: skip, disabled: busy }, '⏭️ 跳过')
        ),
        msg && h('div', { className: 'cet6-msg ' + msg.kind }, msg.text),

        current && h('div', null,
          h('div', { className: 'cet6-card' },
            h('div', { style: { marginBottom: 8 } },
              h('span', { className: 'cet6-badge accent' }, (current.meta && current.meta.year || '') + '年' + (current.meta && current.meta.month || '') + '月 第' + (current.meta && current.meta.set_num || current.meta && current.meta.set_index || '?') + '套'),
              h('span', { className: 'cet6-badge' }, '共 ' + flatQuestions.length + ' 题')
            ),
            current.audioUrl && !audioErr && h('audio', {
              className: 'cet6-audio',
              controls: true,
              src: current.audioUrl,
              onError: () => setAudioErr(true),
              preload: 'metadata'
            }, '您的浏览器不支持 audio 元素。'),
            audioErr && h('div', { className: 'cet6-msg warn' },
              '⚠️ 音频加载失败。你可以 ',
              h('a', { href: current.audioUrl, target: '_blank', rel: 'noreferrer' }, '点此下载'),
              ' 音频文件，或检查浏览器跨域访问设置。'
            ),
            !current.audioUrl && h('div', { className: 'cet6-msg warn' }, '⚠️ 此套题暂无音频文件')
          ),

          Object.keys(sections).map(sk => {
            const sd = sections[sk] || {};
            const qs = (sd.questions || []).filter(q => q.q_num && q.options);
            if (!qs.length) return null;
            return h('div', { key: sk, className: 'cet6-section-header' },
              h('span', null, 'Section ' + sk),
              h('span', { className: 'cet6-badge' }, sectionTypes[sk] || ''),
              h('span', { className: 'cet6-badge' }, qs.length + ' 题')
            );
          }),

          flatQuestions.map((q, i) => h('div', { key: i, style: { marginBottom: 12 } },
            h('div', { style: { fontWeight: 600, marginBottom: 6 } }, 'Q' + q.q_num),
            h('div', { className: 'cet6-options' },
              ['A', 'B', 'C', 'D'].map(letter => {
                const text = (q.options || {})[letter];
                if (!text) return null;
                return h('div', {
                  key: letter,
                  className: getOptClass(q.q_num, letter),
                  onClick: () => selectOpt(q.q_num, letter)
                },
                  h('span', { className: 'letter' }, letter + '.'),
                  h('span', { className: 'text' }, text)
                );
              })
            )
          )),

          result && h('div', { className: 'cet6-result ' + (result.score >= 60 ? 'good' : 'bad') },
            h('div', { className: 'score' }, result.score + ' 分'),
            h('div', { style: { fontSize: 14 } }, '答对 ' + result.right + ' / ' + result.total + ' 题')
          ),

          !result && h('div', { className: 'cet6-btn-row' },
            h('button', { className: 'cet6-btn', onClick: submit, disabled: busy }, '📝 提交答案')
          )
        )
      );
    }

    // ===== Dashboard View =====
    function DashboardView(props) {
      const [stats, setStats] = React.useState(null);
      const [reminderH, setReminderH] = React.useState('08');
      const [reminderM, setReminderM] = React.useState('00');
      const [busy, setBusy] = React.useState(false);

      const refresh = async () => {
        const r = await host.call('cet6/state', {});
        setStats(r);
        if (r && r.reminder) {
          setReminderH(String(r.reminder.hour).padStart(2, '0'));
          setReminderM(String(r.reminder.minute).padStart(2, '0'));
        }
      };

      React.useEffect(() => { refresh(); }, []);

      const setReminder = async () => {
        const h = parseInt(reminderH);
        const m = parseInt(reminderM);
        if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
          return;
        }
        setBusy(true);
        await host.call('cet6/set-reminder', { hour: h, minute: m });
        setBusy(false);
        refresh();
      };

      const reload = async () => {
        setBusy(true);
        await host.call('cet6/reload-data', {});
        setBusy(false);
        refresh();
      };

      if (!stats) return h('div', { className: 'cet6-empty' }, '加载中...');

      return h('div', { className: 'cet6-app' },
        h('div', { className: 'cet6-card' },
          h('h3', null, '📊 备考总览'),
          h('div', { className: 'cet6-grid' },
            h('div', { className: 'cet6-stat ' + (stats.dueNow > 0 ? 'warn' : '') },
              h('div', { className: 'num' }, stats.dueNow),
              h('div', { className: 'label' }, '今日待复习')
            ),
            h('div', { className: 'cet6-stat' },
              h('div', { className: 'num' }, stats.vocabReviewing),
              h('div', { className: 'label' }, '复习中')
            ),
            h('div', { className: 'cet6-stat success' },
              h('div', { className: 'num' }, stats.vocabMastered),
              h('div', { className: 'label' }, '已掌握')
            ),
            h('div', { className: 'cet6-stat' },
              h('div', { className: 'num' }, stats.vocabTotal),
              h('div', { className: 'label' }, '词库总量')
            )
          ),
          h('div', { className: 'cet6-grid' },
            h('div', { className: 'cet6-stat' },
              h('div', { className: 'num' }, stats.readings.done + ' / ' + stats.readings.total),
              h('div', { className: 'label' }, '阅读进度')
            ),
            h('div', { className: 'cet6-stat' },
              h('div', { className: 'num' }, stats.listenings.done + ' / ' + stats.listenings.total),
              h('div', { className: 'label' }, '听力进度')
            )
          ),
          stats.daysToExam != null && h('div', { style: { marginTop: 12 } },
            h('span', { className: 'cet6-countdown' }, '🎯 距离 ' + stats.nextExam + ' 考试还有 ' + stats.daysToExam + ' 天')
          )
        ),

        h('div', { className: 'cet6-card' },
          h('h3', null, '🔔 每日复习提醒'),
          h('p', { style: { fontSize: 13, color: 'var(--fg-muted, #666)', margin: '0 0 12px' } },
            stats.reminder ? '当前提醒时间：' + String(stats.reminder.hour).padStart(2, '0') + ':' + String(stats.reminder.minute).padStart(2, '0') : '尚未设置提醒'
          ),
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
            h('input', { className: 'cet6-input', style: { maxWidth: 80, marginBottom: 0 }, value: reminderH, onChange: e => setReminderH(e.target.value) }),
            h('span', null, ':'),
            h('input', { className: 'cet6-input', style: { maxWidth: 80, marginBottom: 0 }, value: reminderM, onChange: e => setReminderM(e.target.value) }),
            h('button', { className: 'cet6-btn', onClick: setReminder, disabled: busy }, '设置')
          )
        ),

        h('div', { className: 'cet6-card' },
          h('h3', null, '⚙️ 数据状态'),
          h('div', { style: { fontSize: 13, color: 'var(--fg-muted, #666)' } },
            '词库：' + (stats.dataStatus.vocabCount || 0) + ' 词 · 阅读：' + (stats.dataStatus.readingCount || 0) + ' 套 · 听力：' + (stats.dataStatus.listeningCount || 0) + ' 套'
          ),
          (stats.dataStatus.readingMatchedCount || stats.dataStatus.readingMissingCount) && h('div', { style: { fontSize: 12, color: 'var(--fg-muted, #888)', marginTop: 6 } },
            '📖 阅读：' + (stats.dataStatus.readingMatchedCount || 0) + ' 篇已匹配答案 · ' + (stats.dataStatus.readingMissingCount || 0) + ' 篇暂无答案（graceful）'
          ),
          (stats.dataStatus.listeningOverriddenCount || stats.dataStatus.listeningMp3RestoredCount || stats.dataStatus.listeningSanitizedCount) && h('div', { style: { fontSize: 12, color: 'var(--fg-muted, #888)', marginTop: 6 } },
            '🎧 听力自动修复：' + (stats.dataStatus.listeningOverriddenCount || 0) + ' 套应用 Drhm1224 权威覆盖 · ' + (stats.dataStatus.listeningMp3RestoredCount || 0) + ' 套补回 MP3 · ' + (stats.dataStatus.listeningSanitizedCount || 0) + ' 套过滤垃圾答案'
          ),
          stats.dataStatus.error && h('div', { className: 'cet6-msg error', style: { marginTop: 8 } }, '加载失败：' + stats.dataStatus.error),
          h('button', { className: 'cet6-btn secondary', style: { marginTop: 8 }, onClick: reload, disabled: busy }, '🔄 重新从 GitHub 拉取数据')
        ),

        h('div', { className: 'cet6-card' },
          h('h3', null, '📖 使用说明'),
          h('p', { style: { fontSize: 13, lineHeight: 1.7, color: 'var(--fg-muted, #666)' } },
            '本插件基于 ',
            h('a', { href: 'https://github.com/202704948-design/astrbot_plugin_cet6', target: '_blank', rel: 'noreferrer' }, 'astrbot_plugin_cet6'),
            ' 的设计理念，在 DSH 中重新实现。主要功能：',
            h('br'),
            '• 🎴 艾宾浩斯单词记忆（7 级境界，自动升降）',
            h('br'),
            '• 📖 阅读真题练习（96 套，自动批改）',
            h('br'),
            '• 🎧 听力真题练习（27 套，含音频）',
            h('br'),
            '• 📊 进度追踪 + 大考倒计时',
            h('br'),
            '• 🔔 每日定时复习提醒',
            h('br'),
            '• 🤖 通过 Chat 工具直接调用：cet6_lookup、cet6_review、cet6_stats'
          )
        )
      );
    }

    // ===== Help View =====
    function HelpView() {
      const cmds = [
        { cat: '单词', list: [
          { cmd: 'cet6_lookup', desc: '查单词释义' },
          { cmd: 'cet6_review', desc: '获取待复习单词' },
          { cmd: 'cet6_stats', desc: '查看整体进度' }
        ]},
        { cat: 'UI 操作', list: [
          { cmd: '【复习】标签', desc: '艾宾浩斯单词闪卡' },
          { cmd: '【进货】标签', desc: '查询 / 加入 / 批量拉取新词' },
          { cmd: '【词库】标签', desc: '浏览复习中 / 已掌握单词' },
          { cmd: '【阅读】标签', desc: '随机抽取阅读真题、答题、批改' },
          { cmd: '【听力】标签', desc: '随机抽取听力真题、答题、批改（音频流式播放）' },
          { cmd: '【总览】标签', desc: '数据状态、大考倒计时、提醒设置' }
        ]}
      ];
      return h('div', { className: 'cet6-app' },
        h('div', { className: 'cet6-card' },
          h('h3', null, '🚀 快速上手'),
          h('ol', { style: { paddingLeft: 20, lineHeight: 1.8, fontSize: 14 } },
            h('li', null, '点击 【进货】→ 输入数字（如 20）→ 点击 「拉取新词」'),
            h('li', null, '点击 【复习】→ 看到单词后点击「显示释义」→ 决定「记住」或「忘了」'),
            h('li', null, '到 【总览】设置每日提醒时间'),
            h('li', null, '去 【阅读】/【听力】做真题')
          )
        ),
        ...cmds.map(c => h('div', { key: c.cat, className: 'cet6-card' },
          h('h3', null, c.cat),
          h('div', null, c.list.map(it => h('div', { key: it.cmd, className: 'cet6-list-item' },
            h('div', null,
              h('div', { className: 'word' }, it.cmd),
              h('div', { className: 'meaning' }, it.desc)
            )
          )))
        ))
      );
    }

    // ===== Root Component =====
    function CET6Tutor() {
      const [tab, setTab] = React.useState('dashboard');
      const [statsTick, setStatsTick] = React.useState(0);

      const refreshStats = () => setStatsTick(t => t + 1);

      const tabs = [
        { id: 'dashboard', label: '📊 总览' },
        { id: 'vocab', label: '🎴 单词' },
        { id: 'reading', label: '📖 阅读' },
        { id: 'listening', label: '🎧 听力' },
        { id: 'help', label: '❓ 帮助' }
      ];

      return h('div', { className: 'cet6-app' },
        h('div', { className: 'cet6-tabs' },
          tabs.map(t => h('button', {
            key: t.id,
            className: 'cet6-tab ' + (tab === t.id ? 'active' : ''),
            onClick: () => setTab(t.id)
          }, t.label))
        ),
        tab === 'dashboard' && h(DashboardView, { onChange: refreshStats, key: 'd-' + statsTick }),
        tab === 'vocab' && h(VocabView, { onChange: refreshStats, key: 'v-' + statsTick }),
        tab === 'reading' && h(ReadingView, { onChange: refreshStats, key: 'r-' + statsTick }),
        tab === 'listening' && h(ListeningView, { onChange: refreshStats, key: 'l-' + statsTick }),
        tab === 'help' && h(HelpView)
      );
    }

    // ===== Constants used by VocabView (rank labels) =====
    const RANKS_CLIENT = ['待定 🥚', '模糊 📉', '清晰 📈', '记住 🧠', '牢固 🛡️', '掌握 🌟', '精通 👑'];

    // ===== Register slot =====
    const slots = ctx.get('slots');
    if (slots === undefined) {
      console.error('[cet6] slots service not available');
      return;
    }
    slots.inject('settings.section', () => slots.register(
      { name: 'settings.section', id: 'cet6-tutor', order: 200, label: '🎓 CET6 Tutor' },
      () => h(CET6Tutor, null)
    ));
  }
};