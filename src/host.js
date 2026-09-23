// CET6 Tutor - Host code (function body returning a Cordis Plugin)
// All side effects (data fetch, RPC, tools, timer) must live inside apply(ctx).

return {
  inject: ['timer', 'web', 'fs', 'shell'],
  apply(ctx) {
    const DATA_REPO = 'https://raw.githubusercontent.com/202704948-design/astrbot_plugin_cet6/master';
    const EBBING = [12 * 3600, 24 * 3600, 2 * 86400, 4 * 86400, 7 * 86400, 15 * 86400];
    const RANKS = ['待定 🥚', '模糊 📉', '清晰 📈', '记住 🧠', '牢固 🛡️', '掌握 🌟', '精通 👑'];
    const USER_ID = 'self';

    // ===== Shared state =====
    const dataStatus = { loaded: false, loading: false, error: null, vocabCount: 0, readingCount: 0, listeningCount: 0 };
    let loadingPromise = null;
    const vocab = Object.create(null);
    const vocabList = [];
    const readings = [];
    const answers = Object.create(null);
    const listenings = Object.create(null);
    const U = {
      vocab: Object.create(null),
      mastered: Object.create(null),
      doneReadings: Object.create(null),
      doneListening: Object.create(null),
      reminder: null
    };

    // ===== Pure helpers =====
    function nowSec() { return Math.floor(Date.now() / 1000); }

    function normReading(item) {
      const content = item.content || '';
      const numRegex = /\b(\d{1,2})\b(?=\s)/g;
      const numbers = [...new Set([...content.matchAll(numRegex)].map(m => parseInt(m[1])).filter(n => 20 < n && n < 70))];
      numbers.sort((a, b) => a - b);
      const optRegex = /^([A-O])[\.\)、]\s*(.+)$/gm;
      const opts = {};
      let m;
      while ((m = optRegex.exec(content)) !== null) opts[m[1]] = m[2].trim();
      const optStart = content.search(/^A[\.\)、]/m);
      const passage = optStart > 0 ? content.slice(0, optStart).trim() : content;
      const m2 = item.meta || {};
      const id = (m2.year || 'x') + '_' + (m2.month || 'x') + '_' + (m2.set_index || m2.set || 'x') + '_' + (item.type || 'x').replace(/\s+/g, '_');
      return { id, meta: m2, type: item.type, passage, questionNumbers: numbers, options: opts };
    }

    function normListening(info, key) {
      const mp3 = info.meta && info.meta.mp3_file;
      return {
        key, meta: info.meta, answers: info.answers, total: info.total,
        sections: info.sections,
        audioUrl: mp3 ? (DATA_REPO + '/CET-6%E5%90%AC%E5%8A%9B/' + mp3) : null
      };
    }

    function getStats() {
      const today = new Date();
      const year = today.getFullYear();
      let exam;
      const june = new Date(year, 5, 13);
      const dec = new Date(year, 11, 13);
      if (today > dec) exam = new Date(year + 1, 5, 13);
      else if (today > june) exam = dec;
      else exam = june;
      const daysToExam = Math.ceil((exam - today) / (24 * 3600 * 1000));
      return {
        vocabTotal: vocabList.length,
        vocabReviewing: Object.keys(U.vocab).length,
        vocabMastered: Object.keys(U.mastered).length,
        dueNow: vocabReview(20).length,
        readings: {
          total: readings.length,
          done: Object.keys(U.doneReadings).length,
          remaining: readings.length - Object.keys(U.doneReadings).length
        },
        listenings: {
          total: Object.keys(listenings).length,
          done: Object.keys(U.doneListening).length,
          remaining: Object.keys(listenings).length - Object.keys(U.doneListening).length
        },
        nextExam: exam.toISOString().slice(0, 10),
        daysToExam,
        dataStatus,
        reminder: U.reminder
      };
    }

    // ===== Vocab engine =====
    function vocabLookup(word) {
      if (!word) return null;
      const w = String(word).toLowerCase().trim();
      return vocab[w] || null;
    }
    function vocabAdd(word) {
      if (!word) return { ok: false, msg: '请提供单词' };
      const w = String(word).toLowerCase().trim();
      if (!vocab[w]) return { ok: false, msg: '词库中没有此单词：' + word };
      if (U.vocab[w]) return { ok: false, msg: '已经在复习中：' + w };
      if (U.mastered[w]) return { ok: false, msg: '已掌握：' + w };
      const t = nowSec();
      U.vocab[w] = { stage: 0, addTime: t, nextReview: t + EBBING[0] };
      saveUserState();
      return { ok: true, word: w, meaning: vocab[w], stage: RANKS[0], nextReview: U.vocab[w].nextReview };
    }
    function vocabGrade(word, known) {
      const lw = word.toLowerCase().trim();
      if (!U.vocab[lw]) return { ok: false, msg: '不在复习列表：' + word };
      const t = nowSec();
      const cur = U.vocab[lw].stage;
      if (known) {
        if (cur + 1 >= EBBING.length) {
          U.mastered[lw] = { graduatedTime: t, meaning: vocab[lw] || '', rank: RANKS[RANKS.length - 1] };
          delete U.vocab[lw];
          saveUserState();
          return { ok: true, graduated: true, word: lw, rank: RANKS[RANKS.length - 1] };
        } else {
          const ns = cur + 1;
          U.vocab[lw].stage = ns;
          U.vocab[lw].nextReview = t + EBBING[ns];
          saveUserState();
          return { ok: true, graduated: false, word: lw, stage: RANKS[ns], nextReview: U.vocab[lw].nextReview };
        }
      } else {
        const ns = Math.max(0, cur - 2);
        U.vocab[lw].stage = ns;
        U.vocab[lw].nextReview = t + EBBING[ns];
        saveUserState();
        return { ok: true, graduated: false, word: lw, stage: RANKS[ns], nextReview: U.vocab[lw].nextReview, demoted: true };
      }
    }
    function vocabForget(word) {
      const lw = word.toLowerCase().trim();
      if (!U.vocab[lw]) return { ok: false, msg: '不在复习列表：' + word };
      const t = nowSec();
      const cur = U.vocab[lw].stage;
      const ns = Math.max(0, cur - 2);
      U.vocab[lw].stage = ns;
      U.vocab[lw].nextReview = t + EBBING[ns];
      saveUserState();
      return { ok: true, word: lw, stage: RANKS[ns], nextReview: U.vocab[lw].nextReview };
    }
    function vocabKill(word) {
      const lw = word.toLowerCase().trim();
      const t = nowSec();
      U.mastered[lw] = { graduatedTime: t, meaning: vocab[lw] || '释义丢失', rank: RANKS[RANKS.length - 1] };
      delete U.vocab[lw];
      saveUserState();
      return { ok: true, word: lw, rank: RANKS[RANKS.length - 1] };
    }
    function vocabRemove(word) {
      const lw = word.toLowerCase().trim();
      let from = null;
      if (U.vocab[lw]) { delete U.vocab[lw]; from = 'review'; }
      if (U.mastered[lw]) { delete U.mastered[lw]; from = from || 'mastered'; }
      if (from) saveUserState();
      return from ? { ok: true, from } : { ok: false };
    }
    function vocabReview(limit) {
      const t = nowSec();
      const due = [];
      const words = Object.keys(U.vocab);
      // Sort by overdue amount (most overdue first)
      words.sort((a, b) => U.vocab[a].nextReview - U.vocab[b].nextReview);
      for (const word of words) {
        if (U.vocab[word].nextReview <= t) {
          due.push({ word, stage: U.vocab[word].stage, meaning: vocab[word] || '' });
          if (due.length >= limit) break;
        }
      }
      return due;
    }
    function vocabNew(count) {
      const t = nowSec();
      const picked = [];
      const seen = new Set();
      while (picked.length < count && seen.size < vocabList.length) {
        const idx = Math.floor(Math.random() * vocabList.length);
        const w = vocabList[idx];
        seen.add(idx);
        if (U.vocab[w] || U.mastered[w]) continue;
        U.vocab[w] = { stage: 0, addTime: t, nextReview: t + EBBING[0] };
        picked.push({ word: w, meaning: vocab[w] });
      }
      if (picked.length) saveUserState();
      return picked;
    }
    function vocabGetList(mode) {
      if (mode === 'reviewing') {
        return Object.keys(U.vocab).map(w => ({ word: w, ...U.vocab[w], meaning: vocab[w] || '', rank: RANKS[U.vocab[w].stage] }));
      }
      if (mode === 'mastered') {
        return Object.keys(U.mastered).map(w => ({ word: w, ...U.mastered[w] }));
      }
      return {
        reviewing: Object.keys(U.vocab).map(w => ({ word: w, ...U.vocab[w], meaning: vocab[w] || '', rank: RANKS[U.vocab[w].stage] })),
        mastered: Object.keys(U.mastered).map(w => ({ word: w, ...U.mastered[w] }))
      };
    }

    // ===== Reading engine =====
    function readingDraw() {
      const undone = readings.filter(r => !U.doneReadings[r.id]);
      if (!undone.length) return { ok: false, msg: '已做完所有阅读真题！🎉' };
      const r = undone[Math.floor(Math.random() * undone.length)];
      return {
        ok: true, id: r.id, meta: r.meta, type: r.type,
        passage: r.passage, questionNumbers: r.questionNumbers,
        options: r.options, hasAnswer: !!answers[r.id]
      };
    }
    function readingGrade(qId, userAnswer) {
      const correct = answers[qId];
      if (!correct) return { ok: false, msg: '找不到答案：' + qId };
      const ua = String(userAnswer || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (ua.length !== correct.length) {
        return { ok: false, msg: '答案数量不匹配（需要 ' + correct.length + ' 个，实际 ' + ua.length + ' 个）', correct };
      }
      let right = 0;
      const detail = [];
      for (let i = 0; i < correct.length; i++) {
        const c = correct[i];
        const u = ua[i];
        const hit = c === u;
        if (hit) right++;
        detail.push({ q: i + 1, user: u, correct: c, ok: hit });
      }
      U.doneReadings[qId] = nowSec();
      saveUserState();
      return {
        ok: true, qId, right, total: correct.length,
        score: Math.round((right / correct.length) * 100),
        correct, user: ua, detail
      };
    }
    function readingCheck(qId) {
      const correct = answers[qId];
      if (!correct) return { ok: false, msg: '找不到答案：' + qId };
      U.doneReadings[qId] = nowSec();
      saveUserState();
      return { ok: true, qId, correct };
    }

    // ===== Listening engine =====
    function listeningDraw() {
      const keys = Object.keys(listenings).filter(k => !U.doneListening[k]);
      if (!keys.length) return { ok: false, msg: '已做完所有听力真题！🎉' };
      const k = keys[Math.floor(Math.random() * keys.length)];
      const l = listenings[k];
      return { ok: true, key: k, meta: l.meta, total: l.total, sections: l.sections, audioUrl: l.audioUrl, hasAnswers: !!l.answers };
    }
    function listeningGrade(key, userAnswer) {
      const l = listenings[key];
      if (!l) return { ok: false, msg: '找不到听力：' + key };
      const ua = String(userAnswer || '').toUpperCase().replace(/[^A-Z]/g, '');
      const correct = l.answers;
      let right = 0, total = 0;
      const detail = [];
      for (const qNum of Object.keys(correct)) {
        total++;
        const c = correct[qNum];
        const idx = parseInt(qNum) - 1;
        const u = idx < ua.length ? ua[idx] : '';
        const hit = c === u;
        if (hit) right++;
        detail.push({ q: parseInt(qNum), user: u, correct: c, ok: hit });
      }
      U.doneListening[key] = nowSec();
      saveUserState();
      return { ok: true, key, right, total, score: Math.round((right / total) * 100), detail };
    }
    function listeningSkip(key) {
      U.doneListening[key] = nowSec();
      saveUserState();
      return { ok: true, key };
    }

    // ===== Reminder =====
    function setReminder(hour, minute) {
      U.reminder = { hour: Number(hour), minute: Number(minute), lastDate: null };
      saveUserState();
      return { ok: true, hour: U.reminder.hour, minute: U.reminder.minute };
    }

    // ===== Persistence =====
    async function saveUserState() {
      if (!ctx.fs) return;
      try {
        const target = await ctx.fs.resolve('/cet6_tutor_user.json');
        await ctx.fs.writeText(target, JSON.stringify(U));
      } catch (e) { console.error('[cet6] save user state:', e); }
    }
    async function loadUserState() {
      if (!ctx.fs) return;
      try {
        const target = await ctx.fs.resolve('/cet6_tutor_user.json');
        const info = await ctx.fs.stat(target);
        if (!info) return;
        const text = await ctx.fs.readText(target);
        const obj = JSON.parse(text);
        if (obj.vocab) Object.assign(U.vocab, obj.vocab);
        if (obj.mastered) Object.assign(U.mastered, obj.mastered);
        if (obj.doneReadings) Object.assign(U.doneReadings, obj.doneReadings);
        if (obj.doneListening) Object.assign(U.doneListening, obj.doneListening);
        if (obj.reminder) U.reminder = obj.reminder;
      } catch (e) {}
    }
    async function saveDataCache() {
      if (!ctx.fs) return;
      try {
        const target = await ctx.fs.resolve('/cet6_tutor_cache.json');
        await ctx.fs.writeText(target, JSON.stringify({
          vocab, vocabList,
          readings, answers, listenings
        }));
      } catch (e) {}
    }
    async function loadDataCache() {
      if (!ctx.fs) return false;
      try {
        const target = await ctx.fs.resolve('/cet6_tutor_cache.json');
        const info = await ctx.fs.stat(target);
        if (!info) return false;
        const text = await ctx.fs.readText(target);
        const obj = JSON.parse(text);
        if (obj.vocab && obj.vocabList) {
          Object.assign(vocab, obj.vocab);
          vocabList.push(...obj.vocabList);
          for (const r of (obj.readings || [])) readings.push(r);
          Object.assign(answers, obj.answers || {});
          Object.assign(listenings, obj.listenings || {});
          dataStatus.vocabCount = vocabList.length;
          dataStatus.readingCount = readings.length;
          dataStatus.listeningCount = Object.keys(listenings).length;
          dataStatus.loaded = true;
          return true;
        }
      } catch (e) {}
      return false;
    }

    // ===== Data loading =====
    async function fetchJSON(url) {
      // ctx.web.fetch silently truncates large responses (~100KB cap), which breaks
      // JSON parsing for the 3 MB vocab/reading files. Strategy:
      //   1. Try web.fetch (fast, fine for small files like answers/listening).
      //   2. If body is truncated or kind != text/html, fall back to shell.exec + curl
      //      via ctx.shell, streaming the file to a workspace temp path. Then read it.
      const filename = url.split('/').pop();
      const tmpPath = '/cet6_tutor_dl_' + encodeURIComponent(filename) + '.json';
      try {
        const r = await ctx.web.fetch({ url });
        if (r.statusCode === 200 && !r.truncated && (r.body.kind === 'text' || r.body.kind === 'html')) {
          const text = r.body.content;
          if (text && text.length > 1024) return JSON.parse(text);
        }
      } catch (e) { /* fall through to shell */ }
      // Fallback: curl via shell
      if (!ctx.shell) throw new Error('web.fetch truncated and shell unavailable');
      const sh = ctx.shell;
      const spec = sh.resolve({
        command: 'curl',
        args: ['-fsSL', '--max-time', '60', url, '-o', tmpPath]
      });
      const res = await sh.run(spec);
      if (res.exitCode !== 0) throw new Error('curl failed (' + res.exitCode + '): ' + (res.stderr || ''));
      const target = await ctx.fs.resolve(tmpPath);
      const text = await ctx.fs.readText(target);
      if (!text || text.length < 10) throw new Error('downloaded file is empty');
      try { return JSON.parse(text); }
      finally {
        try { /* leave file in workspace for debug */ } catch (e) {}
      }
    }
    async function loadAllData() {
      if (dataStatus.loaded) return;
      if (dataStatus.loading) return loadingPromise;
      dataStatus.loading = true;
      loadingPromise = (async () => {
        try {
          console.log('[cet6] Loading data from GitHub...');
          const [vocabArr, rawReading, answerRaw, listeningRaw] = await Promise.all([
            fetchJSON(DATA_REPO + '/4-CET6-%E9%A1%BA%E5%BA%8F.json'),
            fetchJSON(DATA_REPO + '/CET6_Perfect_Verified.json'),
            fetchJSON(DATA_REPO + '/CET6_Answer.json'),
            fetchJSON(DATA_REPO + '/listening_questions_v3.json')
          ]);
          // Process vocab
          for (const item of vocabArr) {
            if (item.word) {
              const w = String(item.word).toLowerCase().trim();
              const trans = (item.translations || []).map(t => {
                const tt = (t.translation || '').trim();
                return t.type ? (t.type + '. ' + tt) : tt;
              }).filter(Boolean);
              if (trans.length && !vocab[w]) {
                vocab[w] = trans.join('；');
                vocabList.push(w);
              }
            }
          }
          // Process reading + answers
          for (const item of rawReading) {
            const r = normReading(item);
            readings.push(r);
            const m2 = item.meta || {};
            const setKey = m2.year + '_' + String(m2.month).padStart(2, '0') + '_' + m2.set_index;
            const ans = answerRaw[setKey];
            if (ans && ans.answers) {
              const secAns = ans.answers[item.type] || '';
              const cleaned = secAns.replace(/[^A-Z]/g, '');
              if (cleaned) answers[r.id] = cleaned;
            }
          }
          // Process listening
          for (const k of Object.keys(listeningRaw)) {
            listenings[k] = normListening(listeningRaw[k], k);
          }
          dataStatus.vocabCount = vocabList.length;
          dataStatus.readingCount = readings.length;
          dataStatus.listeningCount = Object.keys(listenings).length;
          dataStatus.loaded = true;
          console.log('[cet6] Data ready: ' + dataStatus.vocabCount + ' words, ' + dataStatus.readingCount + ' readings, ' + dataStatus.listeningCount + ' listenings');
          try { await saveDataCache(); } catch (e) { console.error('[cet6] cache save:', e); }
        } catch (e) {
          dataStatus.error = String(e && e.message || e);
          console.error('[cet6] data load failed:', e);
        } finally {
          dataStatus.loading = false;
        }
      })();
      return loadingPromise;
    }

    // ===== RPC handlers =====
    const rpcDisposers = [];
    function rpc(method, handler) {
      const dispose = harness.handle(method, handler);
      rpcDisposers.push(dispose);
      return dispose;
    }
    rpc('cet6/state', async () => getStats());
    rpc('cet6/data-status', async () => dataStatus);
    rpc('cet6/reload-data', async () => { dataStatus.loaded = false; dataStatus.vocabCount = 0; readings.length = 0; Object.keys(vocab).forEach(k => delete vocab[k]); vocabList.length = 0; Object.keys(answers).forEach(k => delete answers[k]); Object.keys(listenings).forEach(k => delete listenings[k]); await loadAllData(); return dataStatus; });
    rpc('cet6/vocab/lookup', async (args) => {
      const m = vocabLookup(args.word);
      return m ? { ok: true, word: String(args.word).toLowerCase(), meaning: m } : { ok: false, msg: '词库中无此单词' };
    });
    rpc('cet6/vocab/add', async (args) => vocabAdd(args.word));
    rpc('cet6/vocab/grade', async (args) => vocabGrade(args.word, !!args.known));
    rpc('cet6/vocab/forget', async (args) => vocabForget(args.word));
    rpc('cet6/vocab/kill', async (args) => vocabKill(args.word));
    rpc('cet6/vocab/remove', async (args) => vocabRemove(args.word));
    rpc('cet6/vocab/review', async (args) => vocabReview(args.limit || 20));
    rpc('cet6/vocab/new', async (args) => vocabNew(args.count || 10));
    rpc('cet6/vocab/list', async (args) => vocabGetList(args.mode || 'all'));
    rpc('cet6/reading/draw', async () => readingDraw());
    rpc('cet6/reading/grade', async (args) => readingGrade(args.qId, args.userAnswer));
    rpc('cet6/reading/check', async (args) => readingCheck(args.qId));
    rpc('cet6/listening/draw', async () => listeningDraw());
    rpc('cet6/listening/grade', async (args) => listeningGrade(args.key, args.userAnswer));
    rpc('cet6/listening/skip', async (args) => listeningSkip(args.key));
    rpc('cet6/set-reminder', async (args) => setReminder(args.hour, args.minute));

    // Cleanup RPC disposers when plugin stops
    ctx.effect(() => () => { for (const d of rpcDisposers) try { d(); } catch (e) {} });

    // ===== Daily reminder timer =====
    ctx.timer.interval(() => {
      if (!U.reminder) return;
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      if (U.reminder.lastDate === today) return;
      if (now.getHours() === U.reminder.hour && now.getMinutes() === U.reminder.minute) {
        const due = vocabReview(50);
        if (due.length) {
          U.reminder.lastDate = today;
          saveUserState();
          console.log('[cet6] 🔔 复习提醒: ' + due.length + ' 个单词待复习');
        }
      }
    }, 60 * 1000);

    // ===== Dynamic Tools =====
    const tools = [
      {
        name: 'cet6_lookup',
        description: '查单词释义。查询一个 CET-6 词汇的中文释义、词性。仅支持词库内单词。',
        parameters: {
          type: 'object',
          properties: { word: { type: 'string', description: '要查询的英文单词' } },
          required: ['word']
        },
        execute: async (args) => {
          const m = vocabLookup(args.word);
          return m ? { ok: true, word: args.word, meaning: m } : { ok: false, msg: '词库未收录：' + args.word };
        }
      },
      {
        name: 'cet6_review',
        description: '获取用户今天需要复习的 CET-6 单词列表（艾宾浩斯到期）。',
        parameters: {
          type: 'object',
          properties: { limit: { type: 'number', description: '最多返回多少个（默认 20）' } }
        },
        execute: async (args) => {
          const due = vocabReview(args.limit || 20);
          return { count: due.length, items: due };
        }
      },
      {
        name: 'cet6_stats',
        description: '查看当前用户的单词、阅读、听力进度以及距离下次 CET-6 考试的倒计时。',
        parameters: { type: 'object', properties: {} },
        execute: async () => getStats()
      }
    ];
    for (const t of tools) {
      try {
        const defined = harness.defineTool(t);
        const dispose = harness.registerTool(ctx, defined);
        ctx.effect(() => dispose);
      } catch (e) { console.error('[cet6] tool register failed:', e); }
    }

    // ===== Boot =====
    (async () => {
      await loadUserState();
      const cached = await loadDataCache();
      if (cached) {
        console.log('[cet6] Loaded from cache');
      } else {
        await loadAllData();
      }
    })();

    console.log('[cet6] Host plugin ready');
  }
};